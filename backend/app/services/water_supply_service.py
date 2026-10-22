import time
from typing import Optional, List
from sqlalchemy.orm import Session
from backend.app.schemas.water_supply import (
    WaterSupplyResolveRequest,
    WaterSupplyResolutionResponse,
    ResolutionStatus,
)
from backend.app.schemas.gis import AucklandSupplyZoneSchema, WaterSupplySchemeSchema
from backend.app.repositories.address_repository import address_repository
from backend.app.repositories.zone_repository import zone_repository
from backend.app.repositories.network_repository import network_repository
from backend.app.services.spatial_service import (
    wgs84_to_nztm2000,
    resolve_buffer_tier,
    haversine_distance_m
)
from backend.app.services.dijkstra_service import dijkstra_service
from backend.app.db.models.query_log import SpatialPropertyQuery

class WaterSupplyService:
    def resolve_water_supply(
        self,
        db: Session,
        req: WaterSupplyResolveRequest,
        user_id: Optional[str] = None
    ) -> WaterSupplyResolutionResponse:
        start_time = time.time()
        warnings: List[str] = []
        matched_parcel = None
        lat: Optional[float] = None
        lng: Optional[float] = None
        queried_address_str = ""

        # Step 1: Input Resolution & Cadastral Matching
        if req.address_id:
            matched_parcel = address_repository.get_parcel_by_id(req.address_id)
            if matched_parcel:
                lat, lng = matched_parcel.center[0], matched_parcel.center[1]
                queried_address_str = matched_parcel.fullAddress
            else:
                warnings.append(f"Parcel ID '{req.address_id}' not found in cadastral registry.")

        if not matched_parcel and req.address:
            queried_address_str = req.address.strip()
            matches = address_repository.search_parcels(req.address, limit=1)
            if matches:
                matched_parcel = matches[0]
                lat, lng = matched_parcel.center[0], matched_parcel.center[1]
                queried_address_str = matched_parcel.fullAddress

        if not matched_parcel and req.coordinates and len(req.coordinates) >= 2:
            lat = float(req.coordinates[0])
            lng = float(req.coordinates[1])
            if not queried_address_str:
                queried_address_str = f"Coordinates ({lat:.5f}, {lng:.5f})"
            # Check if near an existing parcel
            nearby = address_repository.find_nearest_parcel(lat, lng, max_dist_m=60.0)
            if nearby:
                matched_parcel = nearby
                queried_address_str = nearby.fullAddress

        # Coordinate Validation Fallback
        if lat is None or lng is None:
            # Default to Central Kelston coordinates if completely blank
            lat, lng = -36.9094, 174.6806
            queried_address_str = "Default Query Point (Kelston, Auckland)"
            warnings.append("No valid address or coordinates provided; defaulted to Auckland survey datum.")

        # Coordinate Reference System Projection
        nztm = wgs84_to_nztm2000(lat, lng)

        # Step 2: Spatial Point-in-Polygon Zone Containment
        containing_zones = zone_repository.find_zones_containing_point(db, lat, lng)

        status: ResolutionStatus = "UNMAPPED_OUTSIDE_RETICULATION"
        matched_zone_schema: Optional[AucklandSupplyZoneSchema] = None
        matched_scheme_schema: Optional[WaterSupplySchemeSchema] = None
        buffer_tier = None
        distance_to_main = 15.0

        if len(containing_zones) == 1:
            zone_obj = containing_zones[0]
            status = "VERIFIED"
            matched_zone_schema = zone_repository.get_zone_by_id(db, zone_obj.zone_id)
            if zone_obj.scheme:
                matched_scheme_schema = network_repository.get_scheme_by_id(db, zone_obj.scheme.supply_id)
            buffer_tier = resolve_buffer_tier(15.0)

        elif len(containing_zones) > 1:
            # Boundary conflict / overlap
            status = "AMBIGUOUS"
            primary_zone = containing_zones[0]
            matched_zone_schema = zone_repository.get_zone_by_id(db, primary_zone.zone_id)
            if primary_zone.scheme:
                matched_scheme_schema = network_repository.get_scheme_by_id(db, primary_zone.scheme.supply_id)
            zone_ids = [z.zone_id for z in containing_zones]
            warnings.append(f"Coordinates fall within multiple intersecting zone boundaries: {', '.join(zone_ids)}. Administrative boundary review required.")
            buffer_tier = resolve_buffer_tier(25.0)

        else:
            # Point is outside all zones -> check buffer distance to closest zone
            closest_zone, dist_m = zone_repository.find_nearest_zone(db, lat, lng)
            if closest_zone and dist_m <= 1500.0:
                status = "NEAR_ZONE"
                matched_zone_schema = zone_repository.get_zone_by_id(db, closest_zone.zone_id)
                if closest_zone.scheme:
                    matched_scheme_schema = network_repository.get_scheme_by_id(db, closest_zone.scheme.supply_id)
                buffer_tier = resolve_buffer_tier(dist_m)
                distance_to_main = dist_m
                warnings.append(f"Property is outside the official municipal supply zone polygon but within {buffer_tier.tierName} ({int(dist_m)}m).")
            else:
                status = "UNMAPPED_OUTSIDE_RETICULATION"
                buffer_tier = resolve_buffer_tier(dist_m if closest_zone else 2500.0)
                distance_to_main = dist_m if closest_zone else 2500.0
                warnings.append("Location is beyond municipal reticulation boundary envelope (>1500m). Service is likely private bore or rainwater tank harvesting.")

        # Step 3: Infrastructure Lineage Attachment
        lineage = matched_parcel.waterLineage if matched_parcel else None
        pipe_compkey = matched_parcel.engineerData.pipeConnectionCompkey if matched_parcel else None

        # Step 4: Audit Logging
        elapsed_ms = int((time.time() - start_time) * 1000)
        try:
            audit_entry = SpatialPropertyQuery(
                user_id=user_id,
                queried_address=queried_address_str,
                latitude=lat,
                longitude=lng,
                matched_zone_id=matched_zone_schema.zoneId if matched_zone_schema else None,
                matched_pipe_compkey=pipe_compkey,
                distance_to_main_meters=distance_to_main,
                buffer_tier_detected=buffer_tier.tier if buffer_tier else None,
                response_time_ms=elapsed_ms
            )
            db.add(audit_entry)
            db.commit()
        except Exception:
            db.rollback()

        # Step 3.5: Dijkstra Shortest Route Calculation
        dijkstra_route = None
        target_lat = matched_zone_schema.lat if matched_zone_schema else -36.9125
        target_lng = matched_zone_schema.lng if matched_zone_schema else 174.6780
        target_zone_id = matched_zone_schema.zoneId if matched_zone_schema else "AKL-SZ-14"
        target_zone_name = matched_zone_schema.zoneName if matched_zone_schema else "Titirangi & Kelston Supply Zone"

        try:
            dijkstra_route = dijkstra_service.compute_shortest_route(
                source_lat=lat,
                source_lng=lng,
                target_lat=target_lat,
                target_lng=target_lng,
                source_address=queried_address_str,
                target_zone_id=target_zone_id,
                target_zone_name=target_zone_name
            )
        except Exception:
            pass

        return WaterSupplyResolutionResponse(
            status=status,
            queriedAddress=queried_address_str,
            coordinates=[lat, lng],
            nztm2000=nztm,
            supplyZone=matched_zone_schema,
            supplyScheme=matched_scheme_schema,
            bufferTier=buffer_tier,
            lineage=lineage,
            matchedPipeCompkey=pipe_compkey,
            distanceToMainMeters=distance_to_main,
            warnings=warnings,
            confidenceScore=0.98 if status == "VERIFIED" else 0.65 if status == "NEAR_ZONE" else 0.40,
            dijkstraRoute=dijkstra_route
        )

water_supply_service = WaterSupplyService()
