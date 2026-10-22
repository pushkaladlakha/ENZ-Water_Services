import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Layers } from 'lucide-react';
import { 
  AccessLevel, 
  BaseMapStyle, 
  LayerVisibility, 
  ParcelFeature, 
  PipeAsset, 
  FittingAsset,
  ActiveSelection,
  AucklandSupplyZone,
  PathwayResolutionResult
} from '../types/gis';
import { 
  VERIFIED_PARCELS, 
  VERIFIED_PIPES, 
  VERIFIED_FITTINGS, 
  latLngToNZTM2000, 
  isCoordinateInNewZealand, 
  NZ_DEFAULT_CENTER, 
  NZ_DEFAULT_ZOOM 
} from '../data/nzData';
import { 
  findNearestVerifiedParcel, 
  resolveDrinkingWaterSupplyZone,
  resolveSupplyBufferTier,
  AucklandZoneScheme,
  AUCKLAND_ZONE_SCHEMES
} from '../utils/waterLineageEngine';
import { 
  getAuthoritativeDam, 
  getAuthoritativeTreatmentPlant 
} from '../data/authoritativeWaterInfrastructure';
import { MAP_PROVIDERS } from '../config/apiConfig';
import { fetchSupplyZonesGeoJson, fetchSupplyBuffersGeoJson } from '../services/apiClient';

interface GisMapProps {
  accessLevel: AccessLevel;
  baseMapStyle: BaseMapStyle;
  layerVisibility: LayerVisibility;
  selectedFeature: ActiveSelection | null;
  onSelectFeature: (selection: ActiveSelection | null) => void;
  flyToLocation: { center: [number, number]; zoom?: number } | null;
  customGeoJsonData?: any | null;
  onToggleLayerPanel?: () => void;
  isLayerPanelOpen?: boolean;
  pathway?: PathwayResolutionResult | null;
  focusZoneBounds?: [number, number][] | null;
  focusRouteBounds?: [number, number][] | null;
}

interface WaterTileIndex {
  gridDegrees: number;
  tiles: string[];
}

export const GisMap: React.FC<GisMapProps> = ({
  accessLevel,
  baseMapStyle,
  layerVisibility,
  selectedFeature,
  onSelectFeature,
  flyToLocation,
  customGeoJsonData,
  onToggleLayerPanel,
  isLayerPanelOpen = false,
  pathway = null,
  focusZoneBounds = null,
  focusRouteBounds = null,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Layer Groups
  const supplyZonesLayerGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const buffersLayerGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const parcelsLayerGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const zonesLayerGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const pipesLayerGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const fittingsLayerGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const waterPipeTilesLayerGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const waterValveTilesLayerGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const floodLayerGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const customLayerGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const highlightLayerGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const waterPipeTileCacheRef = useRef(new Map<string, Promise<L.GeoJSON>>());
  const waterValveTileCacheRef = useRef(new Map<string, Promise<L.GeoJSON>>());
  const waterTileIndexCacheRef = useRef(new Map<string, Promise<WaterTileIndex>>());
  const waterTileLoadVersionRef = useRef(0);

  // Cursor coordinates in NZTM2000
  const [cursorCoords, setCursorCoords] = useState<{ easting: string; northing: string; lat: number; lng: number }>({
    easting: '1,748,058.948',
    northing: '5,914,203.457',
    lat: NZ_DEFAULT_CENTER[0],
    lng: NZ_DEFAULT_CENTER[1],
  });
  const [zoomLevel, setZoomLevel] = useState(NZ_DEFAULT_ZOOM);
  const [waterTileLoadError, setWaterTileLoadError] = useState<string | null>(null);
  const [supplyZonesGeoJson, setSupplyZonesGeoJson] = useState<any | null>(null);
  const [supplyBuffersGeoJson, setSupplyBuffersGeoJson] = useState<any | null>(null);

  // Load authoritative Auckland Supply Areas & Risk Buffers GeoJSON from dataset
  useEffect(() => {
    fetchSupplyZonesGeoJson().then(data => {
      if (data) setSupplyZonesGeoJson(data);
    });
    fetchSupplyBuffersGeoJson().then(data => {
      if (data) setSupplyBuffersGeoJson(data);
    });
  }, []);

  const onSelectFeatureRef = useRef(onSelectFeature);
  onSelectFeatureRef.current = onSelectFeature;
  const accessLevelRef = useRef(accessLevel);
  accessLevelRef.current = accessLevel;

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: NZ_DEFAULT_CENTER,
      zoom: NZ_DEFAULT_ZOOM,
      zoomControl: false,
      attributionControl: false,
    });
    mapInstanceRef.current = map;

    // Zoom control at top-left
    L.control.zoom({ position: 'topleft' }).addTo(map);

    // Track mouse coordinates for NZTM2000 status bar
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      const nztm = latLngToNZTM2000(lat, lng);
      setCursorCoords({
        easting: nztm.easting,
        northing: nztm.northing,
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
      });
    });

    map.on('zoomend', () => {
      setZoomLevel(map.getZoom());
    });

    // Map click handler: resolve actual feature or supply zone
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;

      // 1. Check if clicked near an authoritative verified property parcel
      const nearestParcel = findNearestVerifiedParcel(lat, lng);
      if (nearestParcel) {
        const related = VERIFIED_PIPES.filter(
          p => p.assetType !== 'water' && p.compkey === nearestParcel.engineerData.pipeConnectionCompkey
        );
        onSelectFeatureRef.current({
          type: 'parcel',
          data: nearestParcel,
          relatedAssets: related,
        });

        const popupHtml = createParcelPopupHtml(nearestParcel, accessLevelRef.current);
        L.popup({
          className: 'watercare-popup',
          maxWidth: 350,
        })
          .setLatLng(e.latlng)
          .setContent(popupHtml)
          .openOn(map);
        return;
      }

      // 2. Otherwise check if coordinates fall within an official drinking water supply zone
      const matchedZone = resolveDrinkingWaterSupplyZone(lat, lng);
      if (matchedZone) {
        onSelectFeatureRef.current({
          type: 'supply_zone',
          data: matchedZone,
        });

        const popupHtml = createSupplyZonePopupHtml(matchedZone, lat, lng, accessLevelRef.current);
        L.popup({
          className: 'watercare-popup',
          maxWidth: 350,
        })
          .setLatLng(e.latlng)
          .setContent(popupHtml)
          .openOn(map);
        return;
      }

      // 3. Unmapped location: Clear and notify truthfully
      onSelectFeatureRef.current({
        type: 'supply_zone',
        data: { lat, lng },
        unmapped: true,
      });

      const isOutsideNZ = !isCoordinateInNewZealand(lat, lng);
      const title = isOutsideNZ ? 'Outside New Zealand Territorial Jurisdiction' : 'No Municipal Reticulation Recorded';
      const description = isOutsideNZ
        ? 'This location sits outside Aotearoa New Zealand. Under the Water Services Act 2021, statutory drinking water registers and municipal reticulation only apply within New Zealand territory.'
        : 'This location sits outside the active municipal reticulation boundaries. It may be serviced by rainwater tank harvesting, private bore, or rural unreticulated supplies.';

      const popupHtml = `
        <div style="font-family: inherit; max-width: 300px;">
          <div style="background: #072e54; color: white; padding: 7px 12px; font-weight: 700; font-size: 12px;">
            Taumata Arowai Spatial Query
          </div>
          <div style="padding: 10px 12px; font-size: 12px; color: #1e293b;">
            <div style="font-weight: 600; color: #072e54; margin-bottom: 4px;">
              ${title}
            </div>
            <p style="color: #64748b; font-size: 11px; line-height: 1.4; margin: 0;">
              Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}<br/>
              ${description}
            </p>
          </div>
        </div>
      `;
      L.popup({
        className: 'watercare-popup',
        maxWidth: 320,
      })
        .setLatLng(e.latlng)
        .setContent(popupHtml)
        .openOn(map);
    });

    // Add layer groups to map
    zonesLayerGroupRef.current.addTo(map);
    buffersLayerGroupRef.current.addTo(map);
    supplyZonesLayerGroupRef.current.addTo(map);
    floodLayerGroupRef.current.addTo(map);
    parcelsLayerGroupRef.current.addTo(map);
    pipesLayerGroupRef.current.addTo(map);
    fittingsLayerGroupRef.current.addTo(map);
    waterPipeTilesLayerGroupRef.current.addTo(map);
    waterValveTilesLayerGroupRef.current.addTo(map);
    customLayerGroupRef.current.addTo(map);
    highlightLayerGroupRef.current.addTo(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Base Map Style using permanent configuration
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const provider = MAP_PROVIDERS[baseMapStyle] || MAP_PROVIDERS['google-maps'] || MAP_PROVIDERS['osm'];
    const tileLayer = L.tileLayer(provider.url, {
      maxZoom: provider.maxZoom,
      subdomains: provider.subdomains || ['a', 'b', 'c', 'd'],
      crossOrigin: true,
      attribution: provider.attribution,
    }).addTo(map);

    tileLayerRef.current = tileLayer;
  }, [baseMapStyle]);

  // Handle fly-to requests
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !flyToLocation) return;

    map.flyTo(flyToLocation.center, flyToLocation.zoom || 18, {
      duration: 1.2,
      easeLinearity: 0.25,
    });
  }, [flyToLocation]);

  // Render Drinking Water Supply Zones (AklDizzy) & Buffer Corridors
  useEffect(() => {
    const supplyGroup = supplyZonesLayerGroupRef.current;
    const buffersGroup = buffersLayerGroupRef.current;
    supplyGroup.clearLayers();
    buffersGroup.clearLayers();

    if (!mapInstanceRef.current) return;

    // 1. Supply Buffer Corridors Layer
    if (layerVisibility.supplyBuffers) {
      if (supplyBuffersGeoJson && supplyBuffersGeoJson.features) {
        const buffersLayer = L.geoJSON(supplyBuffersGeoJson, {
          style: (feature) => {
            const dist = feature?.properties?.buffer_distance || '50m';
            switch (dist) {
              case '50m':
                return { color: '#0284c7', weight: 1.5, dashArray: '2, 3', fillColor: '#0284c7', fillOpacity: 0.12, interactive: false };
              case '100m':
                return { color: '#0ea5e9', weight: 1.2, dashArray: '3, 4', fillColor: '#0ea5e9', fillOpacity: 0.08, interactive: false };
              case '200m':
                return { color: '#38bdf8', weight: 1.0, dashArray: '4, 4', fillColor: '#38bdf8', fillOpacity: 0.06, interactive: false };
              case '500m':
                return { color: '#60a5fa', weight: 0.8, dashArray: '5, 5', fillColor: '#60a5fa', fillOpacity: 0.04, interactive: false };
              case '1500m':
              default:
                return { color: '#93c5fd', weight: 0.8, dashArray: '6, 6', fillColor: '#93c5fd', fillOpacity: 0.02, interactive: false };
            }
          },
        });
        buffersGroup.addLayer(buffersLayer);
      } else {
        // Fallback circle buffers
        AUCKLAND_ZONE_SCHEMES.forEach((zone) => {
          if (zone.polygon) {
            const bufferOuter = L.circle([zone.lat, zone.lng], {
              radius: zone.radiusKm * 1000,
              color: '#38bdf8',
              weight: 1,
              dashArray: '3, 4',
              fillColor: '#38bdf8',
              fillOpacity: 0.04,
              interactive: false,
            });
            buffersGroup.addLayer(bufferOuter);
          }
        });
      }
    }

    // 2. Official Spatial Supply Zones (AklDizzy) Layer
    if (layerVisibility.supplyZones) {
      if (supplyZonesGeoJson && supplyZonesGeoJson.features) {
        const zonesLayer = L.geoJSON(supplyZonesGeoJson, {
          style: (feature) => {
            const isAssignedZone = pathway?.supplyZone?.zoneId === feature?.properties?.zoneId;
            const hasActivePathway = !!pathway?.supplyZone;
            return {
              color: isAssignedZone ? '#0284c7' : (hasActivePathway ? '#64748b' : '#072e54'),
              weight: isAssignedZone ? 3.5 : (hasActivePathway ? 1 : 2),
              opacity: isAssignedZone ? 1 : (hasActivePathway ? 0.35 : 0.8),
              fillColor: isAssignedZone ? '#38bdf8' : (hasActivePathway ? '#94a3b8' : '#0284c7'),
              fillOpacity: isAssignedZone ? 0.28 : (hasActivePathway ? 0.03 : 0.14),
              dashArray: isAssignedZone ? undefined : '3, 3',
            };
          },
          onEachFeature: (feature, layer) => {
            const props = feature.properties;
            const isAssignedZone = pathway?.supplyZone?.zoneId === props?.zoneId;
            const hasActivePathway = !!pathway?.supplyZone;

            layer.on({
              mouseover: () => {
                if (!isAssignedZone && 'setStyle' in layer) {
                  (layer as any).setStyle({
                    weight: 2.5,
                    fillOpacity: hasActivePathway ? 0.16 : 0.25,
                    color: '#0284c7',
                  });
                }
              },
              mouseout: () => {
                if (!isAssignedZone && 'setStyle' in layer) {
                  (layer as any).setStyle({
                    weight: hasActivePathway ? 1 : 2,
                    fillOpacity: hasActivePathway ? 0.03 : 0.14,
                    color: hasActivePathway ? '#64748b' : '#072e54',
                  });
                }
              },
              click: (e: L.LeafletMouseEvent) => {
                L.DomEvent.stopPropagation(e);
                onSelectFeature({
                  type: 'supply_zone',
                  data: props,
                });

                const popupHtml = createSupplyZonePopupHtml(props, e.latlng.lat, e.latlng.lng, accessLevel);
                L.popup({
                  className: 'watercare-popup',
                  maxWidth: 360,
                })
                  .setLatLng(e.latlng)
                  .setContent(popupHtml)
                  .openOn(mapInstanceRef.current!);
              },
            });

            // Centroid label badge when zoomed in
            if (zoomLevel >= 12 && props?.lat && props?.lng) {
              const badgeBg = isAssignedZone ? '#0284c7' : (hasActivePathway ? 'rgba(7, 26, 53, 0.6)' : 'rgba(7, 26, 53, 0.9)');
              const zoneBadge = L.divIcon({
                className: 'zone-label-badge',
                html: `
                  <div style="background: ${badgeBg}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: 700; white-space: nowrap; border: 1px solid ${isAssignedZone ? '#38bdf8' : '#38bdf8'}; box-shadow: 0 1px 4px rgba(0,0,0,0.3); pointer-events: none; text-align: center;">
                    <div>${props.zoneName}</div>
                    <div style="font-size: 9px; color: #7dd3fc; font-weight: 500;">Pop: ${(props.popRegist || 0).toLocaleString()}</div>
                  </div>
                `,
                iconSize: [120, 26],
                iconAnchor: [60, 13],
              });
              const marker = L.marker([props.lat, props.lng], { icon: zoneBadge, interactive: false });
              supplyGroup.addLayer(marker);
            }
          },
        });
        supplyGroup.addLayer(zonesLayer);
      } else {
        // Fallback scheme loop
        AUCKLAND_ZONE_SCHEMES.forEach((zone) => {
          if (zone.polygon) {
            const isAssignedZone = pathway?.supplyZone?.zoneId === zone.zoneId;
            const hasActivePathway = !!pathway?.supplyZone;

            const zonePoly = L.polygon(zone.polygon, {
              color: isAssignedZone ? '#0284c7' : (hasActivePathway ? '#64748b' : '#072e54'),
              weight: isAssignedZone ? 3.5 : (hasActivePathway ? 1 : 2),
              opacity: isAssignedZone ? 1 : (hasActivePathway ? 0.35 : 0.8),
              fillColor: isAssignedZone ? '#38bdf8' : (hasActivePathway ? '#94a3b8' : '#0284c7'),
              fillOpacity: isAssignedZone ? 0.28 : (hasActivePathway ? 0.03 : 0.12),
              dashArray: isAssignedZone ? undefined : '4, 4',
            });

            if (isAssignedZone) {
              zonePoly.bringToFront();
            }

            zonePoly.on('mouseover', () => {
              if (!isAssignedZone) {
                zonePoly.setStyle({
                  weight: 2.5,
                  fillOpacity: hasActivePathway ? 0.14 : 0.22,
                  color: '#0284c7',
                });
              }
            });

            zonePoly.on('mouseout', () => {
              if (!isAssignedZone) {
                zonePoly.setStyle({
                  weight: hasActivePathway ? 1 : 2,
                  fillOpacity: hasActivePathway ? 0.03 : 0.12,
                  color: hasActivePathway ? '#64748b' : '#072e54',
                });
              }
            });

            zonePoly.on('click', (e: L.LeafletMouseEvent) => {
              L.DomEvent.stopPropagation(e);
              onSelectFeature({
                type: 'supply_zone',
                data: zone,
              });

              const popupHtml = createSupplyZonePopupHtml(zone, zone.lat, zone.lng, accessLevel);
              L.popup({
                className: 'watercare-popup',
                maxWidth: 350,
              })
                .setLatLng(e.latlng)
                .setContent(popupHtml)
                .openOn(mapInstanceRef.current!);
            });

            supplyGroup.addLayer(zonePoly);

            if (zoomLevel >= 12) {
              const badgeBg = isAssignedZone ? '#0284c7' : (hasActivePathway ? 'rgba(7, 26, 53, 0.6)' : 'rgba(7, 26, 53, 0.9)');
              const zoneBadge = L.divIcon({
                className: 'zone-label-badge',
                html: `
                  <div style="background: ${badgeBg}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: 700; white-space: nowrap; border: 1px solid ${isAssignedZone ? '#38bdf8' : '#38bdf8'}; box-shadow: 0 1px 4px rgba(0,0,0,0.3); pointer-events: none; text-align: center;">
                    <div>${zone.zoneName}</div>
                    <div style="font-size: 9px; color: #7dd3fc; font-weight: 500;">Pop: ${(zone.popRegist ?? 0).toLocaleString()}</div>
                  </div>
                `,
                iconSize: [120, 26],
                iconAnchor: [60, 13],
              });
              const marker = L.marker([zone.lat, zone.lng], { icon: zoneBadge, interactive: false });
              supplyGroup.addLayer(marker);
            }
          }
        });
      }
    }
  }, [layerVisibility.supplyZones, layerVisibility.supplyBuffers, zoomLevel, accessLevel, pathway, supplyZonesGeoJson, supplyBuffersGeoJson]);

  // Render Parcels & Residential Zones
  useEffect(() => {
    const parcelsGroup = parcelsLayerGroupRef.current;
    const zonesGroup = zonesLayerGroupRef.current;
    parcelsGroup.clearLayers();
    zonesGroup.clearLayers();

    if (!mapInstanceRef.current) return;

    VERIFIED_PARCELS.forEach((parcel) => {
      // 1. Planning Zone Fill
      if (layerVisibility.residentialZones) {
        const zonePolygon = L.polygon(parcel.coordinates, {
          color: parcel.zoneColor,
          weight: 1,
          opacity: 0.4,
          fillColor: parcel.zoneColor,
          fillOpacity: 0.16,
          interactive: false,
        });
        zonesGroup.addLayer(zonePolygon);
      }

      // 2. Cadastral Boundary Lines
      if (layerVisibility.parcels) {
        const parcelPolygon = L.polygon(parcel.coordinates, {
          color: '#475569',
          weight: 1.5,
          opacity: 0.85,
          fillColor: '#ffffff',
          fillOpacity: 0.05,
          dashArray: '3, 2',
        });

        // Hover effect
        parcelPolygon.on('mouseover', () => {
          parcelPolygon.setStyle({
            color: '#0284c7',
            weight: 2.5,
            fillOpacity: 0.2,
          });
        });
        parcelPolygon.on('mouseout', () => {
          parcelPolygon.setStyle({
            color: '#475569',
            weight: 1.5,
            fillOpacity: 0.05,
          });
        });

        // Click handler
        parcelPolygon.on('click', (e: L.LeafletMouseEvent) => {
          L.DomEvent.stopPropagation(e);
          onSelectFeature({
            type: 'parcel',
            data: parcel,
            relatedAssets: VERIFIED_PIPES.filter(
              p => p.assetType !== 'water' && p.compkey === parcel.engineerData.pipeConnectionCompkey
            ),
          });

          const popupContent = createParcelPopupHtml(parcel, accessLevel);
          L.popup({
            className: 'watercare-popup',
            maxWidth: 340,
          })
            .setLatLng(e.latlng)
            .setContent(popupContent)
            .openOn(mapInstanceRef.current!);
        });

        parcelsGroup.addLayer(parcelPolygon);

        // Street Number label at centroid
        if (layerVisibility.streetNumbers && zoomLevel >= 16) {
          const numberIcon = L.divIcon({
            className: 'parcel-number-label',
            html: `<div style="font-size: 10px; font-weight: 700; color: #334155; text-shadow: 0 0 3px #ffffff; text-align: center; pointer-events: none;">${parcel.streetNumber}</div>`,
            iconSize: [28, 14],
            iconAnchor: [14, 7],
          });
          const marker = L.marker(parcel.center, { icon: numberIcon, interactive: false });
          parcelsGroup.addLayer(marker);
        }
      }
    });
  }, [layerVisibility.parcels, layerVisibility.residentialZones, layerVisibility.streetNumbers, zoomLevel, accessLevel]);

  // Render Pipe Networks
  useEffect(() => {
    const pipesGroup = pipesLayerGroupRef.current;
    pipesGroup.clearLayers();

    if (!mapInstanceRef.current) return;

    VERIFIED_PIPES.forEach((pipe) => {
      if (pipe.assetType === 'water') return;

      let isVisible = false;
      let strokeColor = '#0284c7';
      let weight = pipe.process === 'Service Conn' ? 2 : 3.5;
      let dashArray = pipe.process === 'Service Conn' ? '4, 4' : undefined;

      if (pipe.assetType === 'wastewater' && layerVisibility.wastewaterPipes) {
        isVisible = true;
        strokeColor = '#dc2626';
        weight = 3.5;
      } else if (pipe.assetType === 'stormwater' && layerVisibility.stormwaterPipes) {
        isVisible = true;
        strokeColor = '#0891b2';
        weight = 3.5;
      }

      if (!isVisible) return;

      const polyline = L.polyline(pipe.coordinates, {
        color: strokeColor,
        weight,
        opacity: 0.9,
        dashArray,
      });

      polyline.on('mouseover', () => {
        polyline.setStyle({
          weight: weight + 2,
          opacity: 1,
        });
      });
      polyline.on('mouseout', () => {
        polyline.setStyle({
          weight,
          opacity: 0.9,
        });
      });

      polyline.on('click', (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e);
        onSelectFeature({
          type: 'pipe',
          data: pipe,
        });

        const popupContent = createPipePopupHtml(pipe, accessLevel);
        L.popup({
          className: 'watercare-popup',
          maxWidth: 320,
        })
          .setLatLng(e.latlng)
          .setContent(popupContent)
          .openOn(mapInstanceRef.current!);
      });

      pipesGroup.addLayer(polyline);
    });
  }, [layerVisibility.waterPipes, layerVisibility.wastewaterPipes, layerVisibility.stormwaterPipes, accessLevel]);

  // Render Fittings & Structures
  useEffect(() => {
    const fittingsGroup = fittingsLayerGroupRef.current;
    fittingsGroup.clearLayers();

    if (!mapInstanceRef.current || !layerVisibility.fittings) return;

    VERIFIED_FITTINGS.forEach((fitting) => {
      if (fitting.type === 'valve') {
        return;
      }

      let iconHtml = '';
      if (fitting.type === 'hydrant') {
        iconHtml = `<div style="background: #e11d48; width: 13px; height: 13px; border-radius: 2px; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: 900; color: white;">H</div>`;
      } else if (fitting.type === 'manhole') {
        iconHtml = `<div style="background: #dc2626; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>`;
      } else if (fitting.type === 'water_meter') {
        iconHtml = `<div style="background: #10b981; width: 11px; height: 11px; border-radius: 2px; border: 2px solid white;"></div>`;
      }

      const fittingIcon = L.divIcon({
        className: 'fitting-icon',
        html: iconHtml,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      const marker = L.marker(fitting.position, { icon: fittingIcon });
      marker.on('click', (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e);
        onSelectFeature({
          type: 'fitting',
          data: fitting,
        });

        const popupContent = createFittingPopupHtml(fitting, accessLevel);
        L.popup({
          className: 'watercare-popup',
          maxWidth: 300,
        })
          .setLatLng(e.latlng)
          .setContent(popupContent)
          .openOn(mapInstanceRef.current!);
      });

      fittingsGroup.addLayer(marker);
    });
  }, [layerVisibility.fittings, accessLevel]);

  // Load compressed GeoJSON tiles only for the visible Auckland map area.
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const version = ++waterTileLoadVersionRef.current;
    const pipeGroup = waterPipeTilesLayerGroupRef.current;
    const valveGroup = waterValveTilesLayerGroupRef.current;

    const loadTileIndex = (layer: 'pipes' | 'valves'): Promise<WaterTileIndex> => {
      const cached = waterTileIndexCacheRef.current.get(layer);
      if (cached) return cached;

      const indexRequest = fetch(`/data/water-network/${layer}-tiles.json`)
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`Could not load the ${layer} tile index (${response.status}).`);
          }
          return response.json() as Promise<WaterTileIndex>;
        });
      waterTileIndexCacheRef.current.set(layer, indexRequest);
      indexRequest.catch(() => waterTileIndexCacheRef.current.delete(layer));
      return indexRequest;
    };

    const loadTile = (
      layer: 'pipes' | 'valves',
      tileId: string,
    ): Promise<L.GeoJSON> => {
      const tileCache = layer === 'pipes'
        ? waterPipeTileCacheRef.current
        : waterValveTileCacheRef.current;
      const cacheKey = `${layer}/${tileId}`;
      const cached = tileCache.get(cacheKey);
      if (cached) return cached;

      const tileRequest = fetch(`/data/water-network/${layer}/${tileId}.geojsonl.gz`)
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`Could not load ${layer} tile ${tileId} (${response.status}).`);
          }
          const bytes = await response.arrayBuffer();
          const byteView = new Uint8Array(bytes);
          const isGzip = byteView[0] === 0x1f && byteView[1] === 0x8b;
          if (isGzip && typeof DecompressionStream === 'undefined') {
            throw new Error('This browser cannot decompress the water network map tiles.');
          }
          const tileStream = new Blob([bytes]).stream();
          const text = isGzip
            ? await new Response(tileStream.pipeThrough(new DecompressionStream('gzip'))).text()
            : await new Response(tileStream).text();
          const features: GeoJSON.Feature[] = text
            .split(/\r?\n/)
            .filter((line) => line.length > 0)
            .map((line) => JSON.parse(line) as GeoJSON.Feature);

          const canvasRenderer = L.canvas({ padding: 0.5 });
          const isPipeLayer = layer === 'pipes';
          const featureCollection: GeoJSON.FeatureCollection = {
            type: 'FeatureCollection',
            features,
          };
          return L.geoJSON(
            featureCollection,
            {
              style: (feature) => ({
                color: '#0284c7',
                weight: Number(feature?.properties?.NOM_DIA_MM) >= 200 ? 3 : 2,
                opacity: 0.85,
                renderer: canvasRenderer,
              }),
              pointToLayer: (feature, latlng) => {
                const group = String(feature.properties?.GRP || '').toLowerCase();
                const isHydrant = group.includes('hydrant');
                return L.circleMarker(latlng, {
                  renderer: canvasRenderer,
                  radius: isHydrant ? 4 : 3,
                  color: '#ffffff',
                  weight: 1,
                  fillColor: isHydrant ? '#e11d48' : '#0ea5e9',
                  fillOpacity: 0.9,
                });
              },
              onEachFeature: (feature, featureLayer) => {
                featureLayer.on('click', (event: L.LeafletMouseEvent) => {
                  L.DomEvent.stopPropagation(event);
                  L.popup({ className: 'watercare-popup', maxWidth: 340 })
                    .setLatLng(event.latlng)
                    .setContent(createWaterAssetPopupHtml(feature, isPipeLayer ? 'Water Pipe' : 'Water Network Fitting'))
                    .openOn(map);
                });
              },
            },
          );
        });

      tileCache.set(cacheKey, tileRequest);
      tileRequest.catch(() => tileCache.delete(cacheKey));
      return tileRequest;
    };

    const updateVisibleTiles = async () => {
      pipeGroup.clearLayers();
      valveGroup.clearLayers();
      setWaterTileLoadError(null);

      const canViewValves = accessLevel !== 'citizen' && layerVisibility.fittings;
      if (map.getZoom() < 14 || (!layerVisibility.waterPipes && !canViewValves)) {
        return;
      }

      try {
        const bounds = map.getBounds();
        const enabledLayers = [
          ...(layerVisibility.waterPipes ? ['pipes' as const] : []),
          ...(canViewValves ? ['valves' as const] : []),
        ];
        const tileIndexes = await Promise.all(enabledLayers.map(loadTileIndex));
        if (waterTileLoadVersionRef.current !== version) return;

        const visibleTilesByLayer = new Map<string, string[]>();
        const allTileIds = new Set<string>();
        tileIndexes.forEach((index, indexPosition) => {
          const layer = enabledLayers[indexPosition];
          const minX = Math.floor(bounds.getWest() / index.gridDegrees);
          const maxX = Math.floor(bounds.getEast() / index.gridDegrees);
          const minY = Math.floor(bounds.getSouth() / index.gridDegrees);
          const maxY = Math.floor(bounds.getNorth() / index.gridDegrees);
          const availableTiles = new Set(index.tiles);
          const visibleTiles: string[] = [];

          for (let x = minX; x <= maxX; x += 1) {
            for (let y = minY; y <= maxY; y += 1) {
              const tileId = `${x}_${y}`;
              if (availableTiles.has(tileId)) {
                visibleTiles.push(tileId);
                allTileIds.add(`${layer}/${tileId}`);
              }
            }
          }
          visibleTilesByLayer.set(layer, visibleTiles);
        });

        const loadedTiles = await Promise.all(
          Array.from(allTileIds, (key) => {
            const [layer, tileId] = key.split('/');
            return loadTile(layer as 'pipes' | 'valves', tileId).then((tile) => ({ key, tile }));
          }),
        );
        if (waterTileLoadVersionRef.current !== version) return;

        const loadedTilesByKey = new Map(loadedTiles.map(({ key, tile }) => [key, tile]));
        visibleTilesByLayer.get('pipes')?.forEach((tileId) => {
          const tile = loadedTilesByKey.get(`pipes/${tileId}`);
          if (tile) pipeGroup.addLayer(tile);
        });
        visibleTilesByLayer.get('valves')?.forEach((tileId) => {
          const tile = loadedTilesByKey.get(`valves/${tileId}`);
          if (tile) valveGroup.addLayer(tile);
        });
      } catch (error) {
        if (waterTileLoadVersionRef.current !== version) return;
        const message = error instanceof Error ? error.message : 'Unknown water network data error.';
        console.error('Water network GeoJSON tiles failed to load:', error);
        setWaterTileLoadError(message);
      }
    };

    map.on('moveend', updateVisibleTiles);
    void updateVisibleTiles();
    return () => {
      map.off('moveend', updateVisibleTiles);
      waterTileLoadVersionRef.current += 1;
    };
  }, [layerVisibility.waterPipes, layerVisibility.fittings, accessLevel]);

  // Render Flood Hazard Corridor
  useEffect(() => {
    const floodGroup = floodLayerGroupRef.current;
    floodGroup.clearLayers();

    if (!mapInstanceRef.current || !layerVisibility.floodHazard) return;

    const floodPolygon = L.polygon([
      [-36.9075, 174.6820],
      [-36.9082, 174.6835],
      [-36.9098, 174.6842],
      [-36.9105, 174.6838],
      [-36.9090, 174.6828],
    ], {
      color: '#0284c7',
      weight: 1,
      dashArray: '4, 4',
      fillColor: '#38bdf8',
      fillOpacity: 0.22,
      interactive: false,
    });
    floodGroup.addLayer(floodPolygon);
  }, [layerVisibility.floodHazard]);

  // Render Custom Ingested GeoJSON Data
  useEffect(() => {
    const customGroup = customLayerGroupRef.current;
    customGroup.clearLayers();

    if (!mapInstanceRef.current || !customGeoJsonData) return;

    try {
      const geojsonLayer = L.geoJSON(customGeoJsonData, {
        pointToLayer: (feature: any, latlng: L.LatLng) => {
          return L.circleMarker(latlng, {
            radius: 6,
            fillColor: '#072e54',
            color: '#38BDF8',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.85,
          });
        },
        style: (feature: any) => {
          const isLine = feature?.geometry?.type === 'LineString' || feature?.geometry?.type === 'MultiLineString';
          return {
            color: isLine ? '#0284c7' : '#072e54',
            weight: isLine ? 3 : 1.5,
            fillColor: '#38BDF8',
            fillOpacity: 0.2,
          };
        },
        onEachFeature: (feature: any, layer: L.Layer) => {
          layer.on('click', (e: L.LeafletMouseEvent) => {
            L.DomEvent.stopPropagation(e);
            const props = feature.properties || {};
            const keys = Object.keys(props);
            
            const tableRows = keys.slice(0, 10).map((k) => `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="color: #64748b; font-weight: 600; padding: 3px 6px; font-size: 11px;">${k}</td>
                <td style="color: #0f172a; padding: 3px 6px; font-size: 11px; word-break: break-all;">${String(props[k])}</td>
              </tr>
            `).join('');

            const content = `
              <div style="font-family: inherit; max-width: 320px;">
                <div style="background: #072e54; color: white; padding: 7px 12px; font-weight: 700; font-size: 12px; display: flex; justify-content: space-between;">
                  <span>Ingested Feature</span>
                  <span style="font-size: 10px; opacity: 0.8;">${feature.geometry?.type || ''}</span>
                </div>
                <div style="padding: 8px 10px; max-height: 220px; overflow-y: auto;">
                  <table style="width: 100%; border-collapse: collapse;">
                    <tbody>${tableRows || '<tr><td style="font-size: 11px; color: #94a3b8;">No attributes</td></tr>'}</tbody>
                  </table>
                </div>
              </div>
            `;
            L.popup({ className: 'watercare-popup', maxWidth: 320 })
              .setLatLng(e.latlng)
              .setContent(content)
              .openOn(mapInstanceRef.current!);
          });
        },
      });

      customGroup.addLayer(geojsonLayer);
      if (geojsonLayer.getLayers().length > 0) {
        mapInstanceRef.current.fitBounds(geojsonLayer.getBounds(), { padding: [40, 40] });
      }
    } catch (err) {
      console.error('Error rendering custom GeoJSON:', err);
    }
  }, [customGeoJsonData]);

  // Highlight Active Selection & Address-to-Supply-Zone Pathway
  useEffect(() => {
    const highlightGroup = highlightLayerGroupRef.current;
    highlightGroup.clearLayers();

    if (!mapInstanceRef.current) return;

    // 1. If pathway is active, render only the searched location marker (no route lines or path overlays)
    if (pathway) {
      // 1.1 Distinct Selected Address Red Pin Marker with Pulsing Halo
      const addressPinIcon = L.divIcon({
        className: 'selected-address-pin',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 34px; height: 44px;">
            <div style="position: absolute; bottom: 2px; width: 22px; height: 22px; border-radius: 50%; background: rgba(220, 38, 38, 0.45); animation: ping 1.6s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <svg width="30" height="38" viewBox="0 0 24 32" fill="none" style="filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5)); z-index: 2;">
              <path d="M12 0C5.37258 0 0 5.37258 0 12C0 20.2 12 32 12 32C12 32 24 20.2 24 12C24 5.37258 18.6274 0 12 0Z" fill="#dc2626" stroke="#ffffff" stroke-width="2"/>
              <circle cx="12" cy="11.5" r="4.5" fill="#ffffff"/>
            </svg>
          </div>
        `,
        iconSize: [34, 44],
        iconAnchor: [17, 38],
      });

      const addressMarker = L.marker(pathway.coordinates, {
        icon: addressPinIcon,
        zIndexOffset: 1200,
      });

      if (selectedFeature?.type === 'parcel') {
        const popupHtml = createParcelPopupHtml(selectedFeature.data as ParcelFeature, accessLevel);
        addressMarker.bindPopup(popupHtml, {
          className: 'watercare-popup',
          maxWidth: 350,
        });
      } else {
        addressMarker.bindTooltip(
          `<div style="font-size:11px;font-weight:700;color:#072e54;">${pathway.queriedAddress}</div>` +
          `<div style="font-size:10px;color:#dc2626;font-weight:600;">Selected Residential Property</div>`,
          {
            direction: 'top',
            offset: [0, -38],
            className: 'watercare-tooltip',
          }
        );
      }
      highlightGroup.addLayer(addressMarker);

      // 1.2 Single Connectivity Path (Dam -> Treatment Plant -> Property Address)
      const connectivityPath = pathway.singleConnectivityPath;
      if (
        connectivityPath && 
        connectivityPath.coordinates && 
        connectivityPath.coordinates.length >= 2 &&
        connectivityPath.coordinates.every(coord => isCoordinateInNewZealand(coord[0], coord[1])) &&
        connectivityPath.totalDistanceKm < 200
      ) {
        // High-contrast clean casing for readability across basemaps
        const pathCasing = L.polyline(connectivityPath.coordinates, {
          color: '#ffffff',
          weight: 6,
          opacity: 0.85,
          lineCap: 'round',
          lineJoin: 'round',
          interactive: false,
        });
        highlightGroup.addLayer(pathCasing);

        // Single, consistently colored solid path using #072e54 design system (no traffic overlays, no road route simulation)
        const connectLine = L.polyline(connectivityPath.coordinates, {
          color: '#072e54',
          weight: 4,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round',
          interactive: true,
        });

        const tooltipHtml = `
          <div style="min-width: 210px; font-family: system-ui, sans-serif; padding: 2px;">
            <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
              <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#072e54;"></span>
              <strong style="color: #072e54; font-size: 11px;">Water Supply Lineage Path</strong>
            </div>
            <div style="font-size: 10px; color: #334155; line-height: 1.4;">
              <div><strong>Dam:</strong> ${connectivityPath.damName}</div>
              <div><strong>Plant:</strong> ${connectivityPath.plantName}</div>
              <div><strong>Total Lineage Distance:</strong> ~${connectivityPath.totalDistanceKm} km</div>
            </div>
            <div style="font-size: 9px; color: #64748b; font-style: italic; margin-top: 5px; border-top: 1px solid #e2e8f0; padding-top: 3px;">
              Schematic lineage connectivity. Distinguish from underground reticulation pipes.
            </div>
          </div>
        `;
        connectLine.bindTooltip(tooltipHtml, { sticky: true, className: 'watercare-tooltip' });
        highlightGroup.addLayer(connectLine);

        // Source Dam Marker (Only when verified coordinates are available)
        if (connectivityPath.hasVerifiedDamCoords && connectivityPath.damCoordinates) {
          const damIcon = L.divIcon({
            className: 'facility-marker-dam',
            html: `
              <div style="position: relative; display: flex; align-items: center; justify-content: center;" title="Verified Source Dam: ${connectivityPath.damName}">
                <div style="width: 24px; height: 24px; border-radius: 4px; background: #072e54; border: 2.5px solid #38bdf8; box-shadow: 0 3px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: 900;">
                  D
                </div>
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });

          const damMarker = L.marker(connectivityPath.damCoordinates, {
            icon: damIcon,
            zIndexOffset: 1100,
          });

          const damPopupHtml = `
            <div style="min-width: 200px; font-family: system-ui, sans-serif; padding: 4px;">
              <div style="font-size: 9px; font-weight: 700; text-transform: uppercase; color: #0284c7; letter-spacing: 0.5px;">Verified Source Dam</div>
              <h4 style="font-size: 13px; font-weight: 700; color: #072e54; margin: 2px 0 6px 0;">${connectivityPath.damName}</h4>
              <div style="font-size: 11px; color: #475569; space-y: 2px;">
                ${connectivityPath.damAddress ? `<div><strong>Location:</strong> ${connectivityPath.damAddress}</div>` : ''}
                <div><strong>Coordinates:</strong> ${connectivityPath.damCoordinates[0].toFixed(4)}, ${connectivityPath.damCoordinates[1].toFixed(4)} (WGS84)</div>
                <div style="margin-top: 4px; font-size: 10px; color: #059669; font-weight: 600;">Authoritative Facility Coordinates Verified</div>
              </div>
            </div>
          `;
          damMarker.bindPopup(damPopupHtml, { className: 'watercare-popup', maxWidth: 300 });
          highlightGroup.addLayer(damMarker);
        }

        // Treatment Plant Marker (Only when verified coordinates are available)
        if (connectivityPath.hasVerifiedPlantCoords && connectivityPath.plantCoordinates) {
          const plantIcon = L.divIcon({
            className: 'facility-marker-plant',
            html: `
              <div style="position: relative; display: flex; align-items: center; justify-content: center;" title="Verified Treatment Facility: ${connectivityPath.plantName}">
                <div style="width: 24px; height: 24px; border-radius: 50%; background: #072e54; border: 2.5px solid #38bdf8; box-shadow: 0 3px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: #38bdf8; font-size: 10px; font-weight: 900;">
                  TP
                </div>
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });

          const plantMarker = L.marker(connectivityPath.plantCoordinates, {
            icon: plantIcon,
            zIndexOffset: 1150,
          });

          const plantPopupHtml = `
            <div style="min-width: 200px; font-family: system-ui, sans-serif; padding: 4px;">
              <div style="font-size: 9px; font-weight: 700; text-transform: uppercase; color: #0284c7; letter-spacing: 0.5px;">Verified Treatment Facility</div>
              <h4 style="font-size: 13px; font-weight: 700; color: #072e54; margin: 2px 0 6px 0;">${connectivityPath.plantName}</h4>
              <div style="font-size: 11px; color: #475569; space-y: 2px;">
                ${connectivityPath.plantAddress ? `<div><strong>Location:</strong> ${connectivityPath.plantAddress}</div>` : ''}
                <div><strong>Coordinates:</strong> ${connectivityPath.plantCoordinates[0].toFixed(4)}, ${connectivityPath.plantCoordinates[1].toFixed(4)} (WGS84)</div>
                <div style="margin-top: 4px; font-size: 10px; color: #059669; font-weight: 600;">Authoritative Facility Coordinates Verified</div>
              </div>
            </div>
          `;
          plantMarker.bindPopup(plantPopupHtml, { className: 'watercare-popup', maxWidth: 300 });
          highlightGroup.addLayer(plantMarker);
        }
      }
    }

    if (!selectedFeature) return;

    if (selectedFeature.type === 'parcel') {
      const parcel = selectedFeature.data as ParcelFeature;
      if (parcel.coordinates && parcel.coordinates.length > 0) {
        const highlightPolygon = L.polygon(parcel.coordinates, {
          color: '#0284c7',
          weight: 3.5,
          opacity: 1,
          fillColor: '#0284c7',
          fillOpacity: 0.15,
          interactive: false,
        });
        highlightGroup.addLayer(highlightPolygon);
      }

      const pinIcon = L.divIcon({
        className: 'selected-address-pin',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 34px; height: 44px;">
            <div style="position: absolute; bottom: 2px; width: 22px; height: 22px; border-radius: 50%; background: rgba(220, 38, 38, 0.45); animation: ping 1.6s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <svg width="30" height="38" viewBox="0 0 24 32" fill="none" style="filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5)); z-index: 2;">
              <path d="M12 0C5.37258 0 0 5.37258 0 12C0 20.2 12 32 12 32C12 32 24 20.2 24 12C24 5.37258 18.6274 0 12 0Z" fill="#dc2626" stroke="#ffffff" stroke-width="2"/>
              <circle cx="12" cy="11.5" r="4.5" fill="#ffffff"/>
            </svg>
          </div>
        `,
        iconSize: [34, 44],
        iconAnchor: [17, 38],
      });

      const parcelMarker = L.marker(parcel.center, {
        icon: pinIcon,
        zIndexOffset: 1200,
      });

      // Open the location's Google Maps / Info Window popup
      const popupHtml = createParcelPopupHtml(parcel, accessLevel);
      parcelMarker.bindPopup(popupHtml, {
        className: 'watercare-popup',
        maxWidth: 350,
      });
      highlightGroup.addLayer(parcelMarker);

      L.popup({
        className: 'watercare-popup',
        maxWidth: 350,
      })
        .setLatLng(parcel.center)
        .setContent(popupHtml)
        .openOn(mapInstanceRef.current!);
    } else if (selectedFeature.type === 'pipe') {
      const pipe = selectedFeature.data as PipeAsset;
      const highlightLine = L.polyline(pipe.coordinates, {
        color: '#eab308',
        weight: 6,
        opacity: 0.85,
        interactive: false,
      });
      highlightGroup.addLayer(highlightLine);
    } else if (selectedFeature.type === 'fitting') {
      const fitting = selectedFeature.data as FittingAsset;
      const pulseCircle = L.circleMarker(fitting.position, {
        radius: 12,
        color: '#0284c7',
        weight: 3,
        fillColor: '#38bdf8',
        fillOpacity: 0.4,
        interactive: false,
      });
      highlightGroup.addLayer(pulseCircle);
    } else if (selectedFeature.type === 'supply_zone' && selectedFeature.data) {
      const zone = selectedFeature.data;
      if (zone.polygon) {
        const zoneHighlight = L.polygon(zone.polygon, {
          color: '#38bdf8',
          weight: 3.5,
          opacity: 1,
          fillColor: '#38bdf8',
          fillOpacity: 0.22,
          interactive: false,
        });
        highlightGroup.addLayer(zoneHighlight);
      }
      if (zone.lat && zone.lng) {
        const zonePinIcon = L.divIcon({
          className: 'selected-address-pin',
          html: `
            <div style="position: relative; display: flex; align-items: center; justify-content: center;">
              <div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: rgba(7, 46, 84, 0.35); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="width: 22px; height: 22px; border-radius: 50%; background: #072e54; border: 3px solid #38bdf8; box-shadow: 0 4px 12px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;">
                <div style="width: 7px; height: 7px; border-radius: 50%; background: #38bdf8;"></div>
              </div>
            </div>
          `,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });

        const zoneMarker = L.marker([zone.lat, zone.lng], {
          icon: zonePinIcon,
          zIndexOffset: 1200,
        });

        const popupHtml = createSupplyZonePopupHtml(zone, zone.lat, zone.lng, accessLevel);
        zoneMarker.bindPopup(popupHtml, {
          className: 'watercare-popup',
          maxWidth: 360,
        });
        highlightGroup.addLayer(zoneMarker);

        L.popup({
          className: 'watercare-popup',
          maxWidth: 360,
        })
          .setLatLng([zone.lat, zone.lng])
          .setContent(popupHtml)
          .openOn(mapInstanceRef.current!);
      }
    }
  }, [selectedFeature, pathway, accessLevel]);

  // Focus Zone Bounds Navigation
  useEffect(() => {
    if (!mapInstanceRef.current || !focusZoneBounds || focusZoneBounds.length === 0) return;
    try {
      const bounds = L.polygon(focusZoneBounds).getBounds();
      mapInstanceRef.current.fitBounds(bounds, {
        padding: [60, 60],
        maxZoom: 15,
        animate: true,
      });
    } catch (err) {
      console.warn('Error focusing zone bounds:', err);
    }
  }, [focusZoneBounds]);

  // Focus Route / Connectivity Path Bounds Navigation
  useEffect(() => {
    if (!mapInstanceRef.current || !focusRouteBounds || focusRouteBounds.length === 0) return;
    try {
      const bounds = L.latLngBounds(focusRouteBounds);
      mapInstanceRef.current.fitBounds(bounds, {
        padding: [80, 80],
        maxZoom: 14,
        animate: true,
      });
    } catch (err) {
      console.warn('Error focusing route bounds:', err);
    }
  }, [focusRouteBounds]);

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="flex-1 w-full h-full z-0" />

      {waterTileLoadError ? (
        <div
          role="alert"
          className="absolute top-4 right-4 z-20 max-w-sm rounded border border-rose-200 bg-white px-3 py-2 text-xs text-rose-800 shadow-lg"
        >
          Water network data could not be loaded: {waterTileLoadError}
        </div>
      ) : zoomLevel < 14 && (layerVisibility.waterPipes || layerVisibility.fittings) ? (
        <div className="absolute top-4 right-4 z-10 rounded border border-slate-200 bg-white/95 px-3 py-2 text-xs text-slate-700 shadow-md">
          Zoom in to level 14 or closer to view water network GeoJSON.
        </div>
      ) : null}

      {/* Regional Quick Navigation Bar */}
      <div className="absolute top-4 left-14 z-10 hidden sm:flex items-center gap-1 bg-white/95 backdrop-blur-xs rounded shadow-md border border-slate-300 p-1 text-slate-700 text-xs">
        <button 
          type="button"
          onClick={() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.setView([-36.88, 174.75], 11);
            }
          }}
          className="px-2 py-1 hover:bg-slate-100 rounded text-slate-800 flex items-center gap-1 font-semibold"
          title="Overview of all Auckland Drinking Water Zones"
        >
          <svg className="w-3.5 h-3.5 text-[#072e54]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          </svg>
          <span>All Auckland Zones</span>
        </button>

        <span className="text-slate-300">|</span>

        <button 
          type="button"
          onClick={() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.setView([-36.9103, 174.6795], 17);
            }
          }}
          className="px-2 py-1 hover:bg-slate-100 rounded text-slate-700 font-medium hover:text-[#072e54]"
        >
          Kelston Reticulation
        </button>

        <button 
          type="button"
          onClick={() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.setView([-36.8485, 174.7633], 15);
            }
          }}
          className="px-2 py-1 hover:bg-slate-100 rounded text-slate-700 font-medium hover:text-[#072e54]"
        >
          Auckland CBD
        </button>

        <button 
          type="button"
          onClick={() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.setView([-36.7880, 174.7720], 14);
            }
          }}
          className="px-2 py-1 hover:bg-slate-100 rounded text-slate-700 font-medium hover:text-[#072e54]"
        >
          North Shore
        </button>

        <button 
          type="button"
          onClick={() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.setView([-36.9920, 174.8760], 14);
            }
          }}
          className="px-2 py-1 hover:bg-slate-100 rounded text-slate-700 font-medium hover:text-[#072e54]"
        >
          Manukau
        </button>
      </div>

      {/* Bottom Right Floating Layer Button */}
      {onToggleLayerPanel && (
        <button
          type="button"
          onClick={onToggleLayerPanel}
          title="Toggle Map Layers & Basemap Styles"
          className={`absolute bottom-9 right-4 z-10 flex items-center gap-2 px-3 py-2 rounded shadow-lg border text-xs font-semibold transition-all ${
            isLayerPanelOpen
              ? 'bg-[#072e54] text-white border-[#052340] ring-2 ring-sky-400'
              : 'bg-white/95 hover:bg-white text-slate-800 hover:text-[#072e54] border-slate-300 backdrop-blur-xs'
          }`}
        >
          <Layers className={`w-4 h-4 ${isLayerPanelOpen ? 'text-sky-300' : 'text-[#072e54]'}`} />
          <span>Layers</span>
        </button>
      )}

      {/* Bottom Status Bar matching LINZ standard */}
      <div className="h-6 bg-[#072e54] text-slate-300 text-[11px] px-3 flex items-center justify-between z-10 border-t border-[#052340] font-mono select-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-8 border-b border-white inline-block"></span>
            <span className="text-slate-200 text-[10px]">
              {zoomLevel >= 18 ? '50m' : zoomLevel >= 16 ? '100m' : '1 km'}
            </span>
          </div>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300 text-[10px]">Zoom: {zoomLevel}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-slate-300">
            <span className="text-slate-400 text-[10px]">NZTM2000: </span>
            <span className="font-semibold text-sky-300">{cursorCoords.easting}</span>
            <span className="text-slate-400 mx-1">E</span>
            <span className="font-semibold text-sky-300">{cursorCoords.northing}</span>
            <span className="text-slate-400 ml-1">N</span>
          </div>
          <span className="text-slate-500 hidden sm:inline">|</span>
          <div className="text-slate-300 text-[10px] hidden sm:block">
            Sources: LINZ Cadastre &bull; Watercare Services Ltd &bull; Taumata Arowai
          </div>
        </div>
      </div>
    </div>
  );
};

// Popup HTML for Cadastral Parcel
function createParcelPopupHtml(parcel: ParcelFeature, accessLevel: AccessLevel): string {
  const lineage = parcel.waterLineage;
  const plantName = lineage?.treatmentPlant.name || 'Huia Water Treatment Plant';
  const damName = lineage?.sourceDam.name || 'Waitakere Dam & Lower Nihotupu Dam';
  const verifiedPlant = getAuthoritativeTreatmentPlant(plantName);
  const verifiedDam = getAuthoritativeDam(damName);

  return `
    <div style="font-family: inherit; max-width: 340px;">
      <div style="background: #072e54; color: white; padding: 7px 12px; font-weight: 700; font-size: 12px; display: flex; justify-content: space-between; align-items: center;">
        <span>Taumata Arowai Queried Property</span>
      </div>
      <div style="padding: 10px 12px; font-size: 12px; color: #1e293b; max-height: 340px; overflow-y: auto;">
        <div style="font-weight: 700; font-size: 13px; color: #072e54; margin-bottom: 2px;">
          ${parcel.fullAddress}
        </div>
        <div style="font-size: 10px; color: #64748b; margin-bottom: 8px;">
          ${parcel.lotNumber} ${parcel.dpNumber} &bull; ${parcel.areaM2} m² &bull; Title: ${parcel.titleReference}
        </div>
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 4px; padding: 8px; margin-bottom: 8px; font-size: 11px; line-height: 1.5;">
          <div style="font-weight: 700; color: #072e54; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
            Supplying Water Infrastructure Lineage
          </div>
          <div><strong>Treatment Plant:</strong> ${plantName}</div>
          ${verifiedPlant ? `
            <div style="font-size: 10px; font-family: monospace; color: #059669; font-weight: 600; margin-bottom: 2px;">
              WGS84: ${verifiedPlant.coordinates[0].toFixed(4)}, ${verifiedPlant.coordinates[1].toFixed(4)} (Verified)
            </div>
          ` : `
            <div style="font-size: 10px; color: #64748b; font-style: italic;">Coordinates: Unavailable in authoritative dataset</div>
          `}
          <div style="margin-top: 4px;"><strong>Associated Dam:</strong> ${damName}</div>
          ${verifiedDam ? `
            <div style="font-size: 10px; font-family: monospace; color: #059669; font-weight: 600; margin-bottom: 2px;">
              WGS84: ${verifiedDam.coordinates[0].toFixed(4)}, ${verifiedDam.coordinates[1].toFixed(4)} (Verified)
            </div>
          ` : `
            <div style="font-size: 10px; color: #64748b; font-style: italic;">Coordinates: Unavailable in authoritative dataset</div>
          `}
          <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
            Catchment: ${lineage?.sourceDam.catchment || 'Auckland Native Catchment'}
          </div>
          ${lineage?.reservoir ? `<div><strong>Reservoir:</strong> ${lineage.reservoir.name}</div>` : ''}
          <div style="font-size: 9px; color: #072e54; background: #e0f2fe; padding: 4px; border-radius: 3px; margin-top: 6px; font-weight: 600;">
            Solid #072e54 in-app connectivity path connects this property to its serving facilities.
          </div>
        </div>
        <div style="font-size: 10px; color: #64748b; font-style: italic; margin-top: 4px;">
          Source: ${parcel.dataSource}
        </div>
      </div>
    </div>
  `;
}

// Popup HTML for Drinking Water Supply Zone
function createSupplyZonePopupHtml(zone: AucklandZoneScheme | AucklandSupplyZone, lat: number, lng: number, accessLevel: AccessLevel): string {
  const dam = zone.primaryDam?.name || 'Hunua Ranges & Waitakere Storage Dams';
  const plant = zone.treatmentPlant?.name || 'Watercare Regional Treatment Plant';
  const process = zone.treatmentPlant?.process || '';
  const catchment = zone.primaryDam?.catchment ? `${zone.primaryDam.catchment}${zone.primaryDam.distanceKm ? ` (${zone.primaryDam.distanceKm} km from zone)` : ''}` : '';
  const verifiedPlant = getAuthoritativeTreatmentPlant(plant);
  const verifiedDam = getAuthoritativeDam(dam);

  return `
    <div style="font-family: inherit; max-width: 340px;">
      <div style="background: #072e54; color: white; padding: 7px 12px; font-weight: 700; font-size: 12px; display: flex; justify-content: space-between; align-items: center;">
        <span>Auckland Water Supply Zone</span>
        <span style="font-size: 10px; opacity: 0.9; font-family: monospace;">${zone.zoneId}</span>
      </div>
      <div style="padding: 10px 12px; font-size: 12px; color: #1e293b;">
        <div style="font-weight: 700; font-size: 13px; color: #072e54; margin-bottom: 2px;">
          ${zone.zoneName}
        </div>
        <div style="font-size: 11px; color: #475569; margin-bottom: 6px;">
          Scheme: <strong>${zone.supplyName}</strong> &bull; Operator: <strong>${zone.supplierName || 'Watercare Services Ltd'}</strong>
        </div>
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 4px; padding: 4px 8px; margin-bottom: 8px; font-size: 10px; color: #166534; font-weight: 600; display: flex; align-items: center; justify-content: space-between;">
          <span>Statutory Status:</span>
          <span>${zone.complianceStatus || 'Rule Compliant (Grade A1)'}</span>
        </div>
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 4px; padding: 8px; margin-bottom: 8px; font-size: 11px; line-height: 1.5;">
          <div style="font-weight: 700; color: #072e54; margin-bottom: 3px; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px;">Supplying Water Infrastructure</div>
          <div><strong>Treatment Plant:</strong> ${plant}</div>
          ${verifiedPlant ? `
            <div style="font-size: 10px; font-family: monospace; color: #059669; font-weight: 600;">
              WGS84: ${verifiedPlant.coordinates[0].toFixed(4)}, ${verifiedPlant.coordinates[1].toFixed(4)} (Verified)
            </div>
          ` : `
            <div style="font-size: 10px; color: #64748b; font-style: italic;">Coordinates: Unavailable in authoritative dataset</div>
          `}
          ${process ? `<div style="font-size: 10px; color: #475569; margin-top: 2px;">Process: ${process}</div>` : ''}
          <div style="margin-top: 4px;"><strong>Associated Dam:</strong> ${dam}</div>
          ${verifiedDam ? `
            <div style="font-size: 10px; font-family: monospace; color: #059669; font-weight: 600;">
              WGS84: ${verifiedDam.coordinates[0].toFixed(4)}, ${verifiedDam.coordinates[1].toFixed(4)} (Verified)
            </div>
          ` : `
            <div style="font-size: 10px; color: #64748b; font-style: italic;">Coordinates: Unavailable in authoritative dataset</div>
          `}
          ${catchment ? `<div style="font-size: 10px; color: #475569;">${catchment}</div>` : ''}
          ${zone.reservoir?.name ? `<div><strong>Reservoir:</strong> ${zone.reservoir.name}</div>` : ''}
        </div>
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 4px; padding: 6px 8px; margin-bottom: 6px; font-size: 11px; color: #334155;">
          <div><strong>Location Centroid:</strong> ${lat.toFixed(5)}, ${lng.toFixed(5)}</div>
          <div><strong>Population:</strong> ${(zone.popRegist ?? 0).toLocaleString()} &bull; <strong>Type:</strong> ${zone.urbanRural || 'Urban'}</div>
        </div>
        <div style="font-size: 10px; color: #64748b; font-style: italic;">
          Source: ${zone.dataSource || 'Taumata Arowai'}
        </div>
      </div>
    </div>
  `;
}

// Popup HTML for Pipe Asset
function createPipePopupHtml(pipe: PipeAsset, accessLevel: AccessLevel): string {
  if (accessLevel === 'citizen') {
    const typeLabel = pipe.assetType === 'water' ? 'Potable Drinking Water Main' : pipe.assetType === 'wastewater' ? 'Public Wastewater Sewer' : 'Stormwater Drain';
    return `
      <div style="font-family: inherit;">
        <div style="background: #072e54; color: white; padding: 7px 12px; font-weight: 600; font-size: 12px;">
          Public Utility Network Pipe
        </div>
        <div style="padding: 10px 12px; font-size: 12px; color: #1e293b;">
          <div><strong>Network Role:</strong> ${typeLabel}</div>
          <div><strong>Operational Status:</strong> ${pipe.status}</div>
          <div style="font-size: 10px; color: #64748b; margin-top: 6px;">Source: ${pipe.dataSource}</div>
        </div>
      </div>
    `;
  }

  return `
    <div style="font-family: inherit;">
      <div style="background: #072e54; color: white; padding: 7px 12px; font-weight: 600; font-size: 12px; display: flex; justify-content: space-between;">
        <span>${pipe.assetType === 'water' ? 'Water Pipe' : pipe.assetType === 'wastewater' ? 'Wastewater Pipe' : 'Stormwater Culvert'}</span>
        <span style="font-family: monospace;">COMPKEY #${pipe.compkey}</span>
      </div>
      <div style="padding: 10px 12px; font-size: 12px; color: #1e293b;">
        <table style="width: 100%; border-collapse: collapse; font-size: 11px; line-height: 1.5;">
          <tr><td style="color: #64748b; padding: 2px 0;">STATUS</td><td><strong>${pipe.status}</strong></td></tr>
          <tr><td style="color: #64748b; padding: 2px 0;">MATERIAL</td><td>${pipe.material}</td></tr>
          <tr><td style="color: #64748b; padding: 2px 0;">NOM DIA (MM)</td><td><strong>${pipe.nomDiaMm}</strong></td></tr>
          <tr><td style="color: #64748b; padding: 2px 0;">PROCESS</td><td>${pipe.process}</td></tr>
          <tr><td style="color: #64748b; padding: 2px 0;">PRESSURE RATING</td><td>${pipe.pressureRating}</td></tr>
          <tr><td style="color: #64748b; padding: 2px 0;">INSTALL YEAR</td><td>${pipe.installYear}</td></tr>
        </table>
        <div style="font-size: 10px; color: #64748b; margin-top: 6px; border-top: 1px solid #f1f5f9; padding-top: 4px;">
          Source: ${pipe.dataSource}
        </div>
      </div>
    </div>
  `;
}

// Popup HTML for Fitting
function createFittingPopupHtml(fitting: FittingAsset, accessLevel: AccessLevel): string {
  return `
    <div style="font-family: inherit;">
      <div style="background: #072e54; color: white; padding: 6px 10px; font-weight: 600; font-size: 12px;">
        <span>${fitting.label}</span>
      </div>
      <div style="padding: 8px 10px; font-size: 11px; color: #1e293b;">
        <div><strong>Network:</strong> ${fitting.network}</div>
        <div><strong>Status:</strong> ${fitting.status}</div>
        ${fitting.nomDiaMm ? `<div><strong>Nominal Diameter:</strong> ${fitting.nomDiaMm} mm</div>` : ''}
        ${accessLevel !== 'citizen' ? `<div style="margin-top: 4px; font-family: monospace; color: #072e54;">COMPKEY: #${fitting.compkey}</div>` : ''}
        <div style="font-size: 10px; color: #64748b; margin-top: 4px;">Source: ${fitting.dataSource}</div>
      </div>
    </div>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function createWaterAssetPopupHtml(feature: GeoJSON.Feature, title: string): string {
  const properties = feature.properties || {};
  const rows = Object.entries(properties).slice(0, 12).map(([key, value]) => {
    const displayValue = value === null || value === undefined
      ? ''
      : typeof value === 'object'
        ? JSON.stringify(value)
        : String(value);
    return `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="color: #64748b; font-weight: 600; padding: 3px 6px; font-size: 11px;">${escapeHtml(key)}</td>
        <td style="color: #0f172a; padding: 3px 6px; font-size: 11px; word-break: break-all;">${escapeHtml(displayValue)}</td>
      </tr>
    `;
  }).join('');

  return `
    <div style="font-family: inherit; max-width: 340px;">
      <div style="background: #072e54; color: white; padding: 7px 12px; font-weight: 700; font-size: 12px; display: flex; justify-content: space-between;">
        <span>${escapeHtml(title)}</span>
        <span style="font-size: 10px; opacity: 0.8;">${escapeHtml(feature.geometry?.type || '')}</span>
      </div>
      <div style="padding: 8px 10px; max-height: 240px; overflow-y: auto;">
        <table style="width: 100%; border-collapse: collapse;">
          <tbody>${rows || '<tr><td style="font-size: 11px; color: #94a3b8;">No attributes</td></tr>'}</tbody>
        </table>
      </div>
    </div>
  `;
}
