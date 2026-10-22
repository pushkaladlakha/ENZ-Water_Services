import math
from typing import Dict, Any, Optional, Tuple, List
from shapely.geometry import Point, shape, Polygon, MultiPolygon
from backend.app.schemas.gis import NZTMCoordinate, BufferTierSchema

# NZTM2000 Projection Constants (EPSG:2193)
# Reference: Land Information New Zealand (LINZ) NZTM2000 specification
A = 6378137.0          # GRS80 semi-major axis
F = 1.0 / 298.257222101 # GRS80 flattening
B = A * (1.0 - F)      # semi-minor axis
E2 = 2.0 * F - F * F   # first eccentricity squared
E_PRIME_2 = E2 / (1.0 - E2) # second eccentricity squared
CM_RAD = 173.0 * math.pi / 180.0 # Central Meridian 173° E
FALSE_EASTING = 1600000.0
FALSE_NORTHING = 10000000.0
KO = 0.9996            # Central scale factor

def is_coordinate_in_new_zealand(lat: float, lng: float) -> bool:
    """Check if coordinates fall within New Zealand territorial bounds."""
    return -48.0 <= lat <= -33.0 and 164.0 <= lng <= 180.0

def wgs84_to_nztm2000(lat: float, lng: float) -> Optional[NZTMCoordinate]:
    """
    Project WGS84 (EPSG:4326) latitude and longitude to
    New Zealand Transverse Mercator 2000 (NZTM2000 / EPSG:2193) metric coordinates.
    Returns None if coordinates fall outside the New Zealand territorial projection domain.
    """
    if not is_coordinate_in_new_zealand(lat, lng):
        return None
    phi = lat * math.pi / 180.0
    lam = lng * math.pi / 180.0
    
    sin_phi = math.sin(phi)
    cos_phi = math.cos(phi)
    tan_phi = math.tan(phi)
    
    # Meridian distance M
    n_val = (A - B) / (A + B)
    n2 = n_val * n_val
    n3 = n2 * n_val
    
    m_term1 = 1.0 + n_val + (5.0 / 4.0) * n2 + (5.0 / 4.0) * n3
    m_term2 = 3.0 * n_val + 3.0 * n2 + (21.0 / 8.0) * n3
    m_term3 = (15.0 / 8.0) * n2 + (15.0 / 8.0) * n3
    m_term4 = (35.0 / 24.0) * n3
    
    m = B * (
        m_term1 * phi -
        m_term2 * math.sin(2.0 * phi) +
        m_term3 * math.sin(4.0 * phi) -
        m_term4 * math.sin(6.0 * phi)
    )
    
    nu = A / math.sqrt(1.0 - E2 * sin_phi * sin_phi)
    psi = nu / (A * (1.0 - E2) / math.pow(1.0 - E2 * sin_phi * sin_phi, 1.5))
    
    omega = lam - CM_RAD
    omega2 = omega * omega
    
    t = tan_phi * tan_phi
    
    # Northing
    term_n1 = (omega2 / 2.0) * nu * sin_phi * cos_phi
    term_n2 = (omega2 * omega2 / 24.0) * nu * sin_phi * math.pow(cos_phi, 3.0) * (4.0 * psi * psi + psi - t)
    northing = KO * (m + term_n1 + term_n2) + FALSE_NORTHING
    
    # Easting
    term_e1 = (omega2 / 6.0) * math.pow(cos_phi, 2.0) * (psi - t)
    term_e2 = (omega2 * omega2 / 120.0) * math.pow(cos_phi, 4.0) * (
        4.0 * math.pow(psi, 3.0) * (1.0 - 6.0 * t) +
        psi * psi * (1.0 + 8.0 * t) -
        2.0 * psi * t +
        t * t
    )
    easting = KO * nu * omega * cos_phi * (1.0 + term_e1 + term_e2) + FALSE_EASTING
    
    return NZTMCoordinate(
        easting=round(easting, 2),
        northing=round(northing, 2)
    )

def haversine_distance_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate Great Circle distance in meters between two coordinates."""
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

def point_in_geojson_geometry(lat: float, lng: float, geojson_geom: Dict[str, Any]) -> bool:
    """
    Test whether coordinate (lat, lng) lies strictly inside a GeoJSON Polygon or MultiPolygon
    using Shapely geometry containment.
    """
    try:
        # GeoJSON is [longitude, latitude]
        pt = Point(lng, lat)
        geom = shape(geojson_geom)
        return geom.contains(pt) or geom.touches(pt)
    except Exception:
        return False

def distance_to_geojson_geometry_m(lat: float, lng: float, geojson_geom: Dict[str, Any]) -> float:
    """Approximate distance in meters from coordinate to GeoJSON boundary."""
    try:
        geom = shape(geojson_geom)
        pt = Point(lng, lat)
        if geom.contains(pt):
            return 0.0
        # Nearest point distance in degrees converted to meters
        deg_dist = geom.distance(pt)
        # At latitude ~37° S, 1 deg lat ~ 111km, 1 deg lng ~ 89km
        return deg_dist * 100000.0
    except Exception:
        return 999999.0

def resolve_buffer_tier(distance_meters: float) -> BufferTierSchema:
    """Resolve concentric distance buffer corridor tier (50m, 100m, 200m, 500m, 1500m)."""
    if distance_meters <= 50.0:
        return BufferTierSchema(
            tier="50m",
            tierName="Within 50m (Immediate Reticulation Spine)",
            bufferLayer="AklDizzy_Buffers50m",
            description="Property directly abuts or sits within 50m of primary municipal reticulation main.",
            distanceMeters=round(distance_meters, 1)
        )
    elif distance_meters <= 100.0:
        return BufferTierSchema(
            tier="100m",
            tierName="Within 100m (Secondary Buffer)",
            bufferLayer="AklDizzy_Buffers100m",
            description="Property is within 100m of local reticulated water scheme main.",
            distanceMeters=round(distance_meters, 1)
        )
    elif distance_meters <= 200.0:
        return BufferTierSchema(
            tier="200m",
            tierName="Within 200m (Catchment Buffer)",
            bufferLayer="AklDizzy_Buffers200m",
            description="Property is within 200m service envelope of potable water main.",
            distanceMeters=round(distance_meters, 1)
        )
    elif distance_meters <= 500.0:
        return BufferTierSchema(
            tier="500m",
            tierName="Within 500m (Collector Corridor)",
            bufferLayer="AklDizzy_Buffers500m",
            description="Property is within 500m of bulk distribution network.",
            distanceMeters=round(distance_meters, 1)
        )
    else:
        return BufferTierSchema(
            tier="1500m",
            tierName="Within 1500m (Outer Service Envelope)",
            bufferLayer="AklDizzy_Buffers1500m",
            description="Property is within 1500m outer service envelope of municipal water supply scheme.",
            distanceMeters=round(distance_meters, 1)
        )
