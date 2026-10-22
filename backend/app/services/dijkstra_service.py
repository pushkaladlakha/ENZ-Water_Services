import heapq
import math
import time
from typing import List, Dict, Tuple, Optional, Any
from backend.app.schemas.water_supply import DijkstraRouteSchema, DijkstraSegmentSchema

def haversine_distance_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = (
        math.sin(delta_phi / 2.0) ** 2 +
        math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return r * c

class RoadPathfindingService:
    def __init__(self):
        # Strict paved road network centerlines (Vehicle roadways & walkable sidewalks)
        # ZERO EDGES CROSS FORESTS OR PRIVATE BACKLOTS
        self.base_nodes: Dict[str, Tuple[float, float, str]] = {
            # Great North Road Arterial
            "gnr_w2": (-36.90750, 174.67700, "Great North Road & Brandon Road Junction"),
            "gnr_w1": (-36.90800, 174.67780, "Great North Road (West Curve)"),
            "gnr_1": (-36.90850, 174.67880, "Great North Road (Kelston Shopping Parade)"),
            "gnr_2": (-36.90910, 174.68010, "Great North Road & Westech Place Intersection"),
            "gnr_3": (-36.90930, 174.68050, "Great North Road (4015 Frontage Footpath)"),
            "gnr_3b": (-36.90950, 174.68100, "Great North Road (4017 Frontage Footpath)"),
            "gnr_4": (-36.90980, 174.68180, "Great North Road (East Bend)"),
            "gnr_5": (-36.91030, 174.68250, "Great North Road (Approaching Archibald Rd)"),
            "gnr_6": (-36.91080, 174.68310, "Great North Road & Archibald Road Signalized Junction"),
            "gnr_7": (-36.91140, 174.68380, "Kelston Roundabout (Great North Rd & West Coast Rd)"),
            # Westech Place (Dead-end Cul-de-sac - connects ONLY north to gnr_2)
            "wst_1": (-36.90940, 174.67980, "Westech Place (Northern Roadway)"),
            "wst_2": (-36.90980, 174.67930, "Westech Place (Mid Industrial Corridor)"),
            "wst_3": (-36.91015, 174.67885, "Westech Place (2 Westech Pl Entrance)"),
            "wst_end": (-36.91035, 174.67860, "Westech Place Turning Circle"),
            # West Coast Road & Titirangi Road (Vehicle/Walkable Route to Supply Zone)
            "wcr_1": (-36.91210, 174.68280, "West Coast Road (South of Roundabout)"),
            "wcr_2": (-36.91270, 174.68160, "West Coast Road (Kelston Commercial Strip)"),
            "wcr_3": (-36.91330, 174.68020, "West Coast Road & Glendale Road Roundabout"),
            "wcr_4": (-36.91370, 174.67890, "West Coast Road & Titirangi Road Junction"),
            "tit_1": (-36.91330, 174.67830, "Titirangi Balancing Reservoir Paved Access Road"),
            "sz14_hub": (-36.91250, 174.67800, "Titirangi & Kelston Supply Zone Intake Centroid"),
            # Archibald Road
            "arch_1": (-36.90980, 174.68310, "Archibald Road (Kelston Girls College Frontage)"),
            "arch_2": (-36.90850, 174.68300, "Archibald Road (Main College Entrance)"),
            # Brandon Road
            "brn_1": (-36.90840, 174.67760, "Brandon Road (North)"),
            "brn_2": (-36.90920, 174.67720, "Brandon Road (Mid)"),
            "brn_3": (-36.90990, 174.67660, "Brandon Road (16 Brandon Rd Vehicle Crossing)"),
            "brn_4": (-36.91080, 174.67550, "Brandon Road (West)"),
            "brn_5": (-36.91200, 174.67380, "Brandon Road (South)"),
            "brn_6": (-36.91320, 174.67150, "Brandon Road & West Coast Road Junction"),
            # New Lynn Corridor
            "nl_1": (-36.91020, 174.68750, "Great North Road (Approaching New Lynn)"),
            "nl_2": (-36.90880, 174.69200, "Great North Road (New Lynn Transport Interchange)"),
            "nl_3": (-36.90650, 174.69600, "Great North Road & Clark Street Roundabout"),
            "sz15_hub": (-36.90500, 174.69800, "New Lynn & Avondale Supply Zone Centroid"),
        }

        self.base_edges = [
            # Great North Road sequence
            ("gnr_w2", "gnr_w1", "Great North Road (Arterial Corridor)"),
            ("gnr_w1", "gnr_1", "Great North Road (Arterial Corridor)"),
            ("gnr_1", "gnr_2", "Great North Road (Arterial Corridor)"),
            ("gnr_2", "gnr_3", "Great North Road (Arterial Corridor)"),
            ("gnr_3", "gnr_3b", "Great North Road (Arterial Corridor)"),
            ("gnr_3b", "gnr_4", "Great North Road (Arterial Corridor)"),
            ("gnr_4", "gnr_5", "Great North Road (Arterial Corridor)"),
            ("gnr_5", "gnr_6", "Great North Road (Arterial Corridor)"),
            ("gnr_6", "gnr_7", "Great North Road (Arterial Corridor)"),
            # Westech Place (cul-de-sac attached ONLY to gnr_2)
            ("gnr_2", "wst_1", "Westech Place (Paved Industrial Road)"),
            ("wst_1", "wst_2", "Westech Place (Paved Industrial Road)"),
            ("wst_2", "wst_3", "Westech Place (Paved Industrial Road)"),
            ("wst_3", "wst_end", "Westech Place (Paved Industrial Road)"),
            # West Coast Road & Titirangi Road access
            ("gnr_7", "wcr_1", "West Coast Road (Arterial Highway)"),
            ("wcr_1", "wcr_2", "West Coast Road (Arterial Highway)"),
            ("wcr_2", "wcr_3", "West Coast Road (Arterial Highway)"),
            ("wcr_3", "wcr_4", "West Coast Road (Arterial Highway)"),
            ("wcr_4", "tit_1", "Titirangi Road & Reservoir Access Road"),
            ("tit_1", "sz14_hub", "Titirangi Road & Reservoir Access Road"),
            # Archibald Road sequence
            ("gnr_6", "arch_1", "Archibald Road (Paved Collector Road)"),
            ("arch_1", "arch_2", "Archibald Road (Paved Collector Road)"),
            # Brandon Road sequence
            ("gnr_w2", "brn_1", "Brandon Road (Residential Paved Street)"),
            ("brn_1", "brn_2", "Brandon Road (Residential Paved Street)"),
            ("brn_2", "brn_3", "Brandon Road (Residential Paved Street)"),
            ("brn_3", "brn_4", "Brandon Road (Residential Paved Street)"),
            ("brn_4", "brn_5", "Brandon Road (Residential Paved Street)"),
            ("brn_5", "brn_6", "Brandon Road (Residential Paved Street)"),
            ("brn_6", "wcr_4", "West Coast Road (Glen Eden Corridor)"),
            # New Lynn sequence
            ("gnr_7", "nl_1", "Great North Road (New Lynn Corridor)"),
            ("nl_1", "nl_2", "Great North Road (New Lynn Corridor)"),
            ("nl_2", "nl_3", "Great North Road (New Lynn Corridor)"),
            ("nl_3", "sz15_hub", "Great North Road (New Lynn Corridor)"),
        ]

    def compute_shortest_route(
        self,
        source_lat: float,
        source_lng: float,
        target_lat: float,
        target_lng: float,
        source_address: str,
        target_zone_id: str,
        target_zone_name: str
    ) -> DijkstraRouteSchema:
        start_time = time.perf_counter()

        adj: Dict[str, List[Tuple[str, float, str]]] = {}
        node_coords: Dict[str, Tuple[float, float]] = {}

        for n_id, (lat, lng, _) in self.base_nodes.items():
            adj[n_id] = []
            node_coords[n_id] = (lat, lng)

        for u, v, name in self.base_edges:
            w = haversine_distance_m(node_coords[u][0], node_coords[u][1], node_coords[v][0], node_coords[v][1])
            adj[u].append((v, w, name))
            adj[v].append((u, w, name))

        src_id = "dynamic_src"
        node_coords[src_id] = (source_lat, source_lng)
        adj[src_id] = []

        # Connect property to closest street node
        closest_net_node = "gnr_3"
        if "westech" in source_address.lower():
            closest_net_node = "wst_3"
        elif "brandon" in source_address.lower():
            closest_net_node = "brn_3"
        elif "archibald" in source_address.lower() or "college" in source_address.lower():
            closest_net_node = "arch_2"
        else:
            min_src_dist = float("inf")
            for n_id, (lat, lng) in node_coords.items():
                if n_id == src_id or "hub" in n_id or "end" in n_id:
                    continue
                d = haversine_distance_m(source_lat, source_lng, lat, lng)
                if d < min_src_dist:
                    min_src_dist = d
                    closest_net_node = n_id

        driveway_dist = haversine_distance_m(source_lat, source_lng, node_coords[closest_net_node][0], node_coords[closest_net_node][1])
        adj[src_id].append((closest_net_node, driveway_dist, "Property Vehicle Crossing & Sidewalk"))
        adj[closest_net_node].append((src_id, driveway_dist, "Property Vehicle Crossing & Sidewalk"))

        # Target node
        target_id = "sz14_hub" if target_zone_id == "AKL-SZ-14" else "sz15_hub" if target_zone_id == "AKL-SZ-15" else "sz14_hub"

        # A* Pathfinding: f(n) = g(n) + h(n)
        pq = [(0.0, 0.0, src_id)]  # (f, g, node)
        g_scores = {src_id: 0.0}
        previous = {}

        while pq:
            _, curr_g, u = heapq.heappop(pq)
            if u == target_id:
                break
            if curr_g > g_scores.get(u, float("inf")):
                continue

            for v, w, name in adj.get(u, []):
                tentative_g = curr_g + w
                if tentative_g < g_scores.get(v, float("inf")):
                    g_scores[v] = tentative_g
                    previous[v] = (u, w, name)
                    h = haversine_distance_m(node_coords[v][0], node_coords[v][1], node_coords[target_id][0], node_coords[target_id][1])
                    f = tentative_g + h
                    heapq.heappush(pq, (f, tentative_g, v))

        # Reconstruct path
        path_coords: List[List[float]] = []
        segments: List[DijkstraSegmentSchema] = []
        curr = target_id
        path_coords.insert(0, [node_coords[target_id][0], node_coords[target_id][1]])

        while curr in previous:
            prev_u, seg_w, sname = previous[curr]
            u_pt = [node_coords[prev_u][0], node_coords[prev_u][1]]
            v_pt = [node_coords[curr][0], node_coords[curr][1]]
            path_coords.insert(0, u_pt)
            segments.insert(0, DijkstraSegmentSchema(
                fromCoords=u_pt,
                toCoords=v_pt,
                distanceMeters=round(seg_w, 1),
                segmentName=sname,
                pipeType="Paved Asphalt Roadway & Walkway",
                nominalDiameterMm=7000,
            ))
            curr = prev_u

        total_meters = round(sum(s.distanceMeters for s in segments), 1)
        total_km = round(total_meters / 1000.0, 2)
        elapsed_ms = round((time.perf_counter() - start_time) * 1000.0, 2)

        gmaps_url = (
            f"https://www.google.com/maps/dir/?api=1"
            f"&origin={source_lat:.6f},{source_lng:.6f}"
            f"&destination={target_lat:.6f},{target_lng:.6f}"
            f"&travelmode=driving"
        )

        return DijkstraRouteSchema(
            sourceAddress=source_address,
            sourceCoordinates=[source_lat, source_lng],
            targetZoneId=target_zone_id,
            targetZoneName=target_zone_name,
            targetCoordinates=[target_lat, target_lng],
            totalDistanceMeters=total_meters,
            totalDistanceKm=total_km,
            pathCoordinates=path_coords,
            segments=segments,
            nodeCount=len(path_coords),
            computationTimeMs=elapsed_ms,
            algorithm="A* Core Road Pathfinding",
            googleMapsDirectionsUrl=gmaps_url,
        )

dijkstra_service = RoadPathfindingService()
