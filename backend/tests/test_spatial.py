import math
from backend.app.services.spatial_service import (
    wgs84_to_nztm2000,
    haversine_distance_m,
    point_in_geojson_geometry,
    resolve_buffer_tier,
    is_coordinate_in_new_zealand
)

def test_wgs84_to_nztm2000_projection():
    # Central Kelston coordinates
    lat, lng = -36.9094, 174.6806
    nztm = wgs84_to_nztm2000(lat, lng)
    # Expected NZTM coordinates in Auckland range:
    # Easting ~ 1,748,000 m
    # Northing ~ 5,914,000 m
    assert nztm is not None
    assert 1740000.0 < nztm.easting < 1760000.0
    assert 5900000.0 < nztm.northing < 5930000.0

def test_wgs84_to_nztm2000_international_boundary():
    # Jaipur, India
    assert is_coordinate_in_new_zealand(26.8454, 75.8055) is False
    assert wgs84_to_nztm2000(26.8454, 75.8055) is None
    # Auckland, NZ
    assert is_coordinate_in_new_zealand(-36.8485, 174.7633) is True

def test_haversine_distance():
    # Distance between Great North Rd and Brandon Rd (~ 280-350m)
    d = haversine_distance_m(-36.9094, 174.6806, -36.9114, 174.6786)
    assert 200.0 < d < 400.0

def test_point_in_polygon_containment():
    polygon_geom = {
        "type": "Polygon",
        "coordinates": [[
            [174.6700, -36.9000],
            [174.6900, -36.9000],
            [174.6900, -36.9200],
            [174.6700, -36.9200],
            [174.6700, -36.9000]
        ]]
    }
    # Point inside
    assert point_in_geojson_geometry(-36.9100, 174.6800, polygon_geom) is True
    # Point outside
    assert point_in_geojson_geometry(-36.9500, 174.6800, polygon_geom) is False

def test_buffer_tier_resolution():
    assert resolve_buffer_tier(35.0).tier == "50m"
    assert resolve_buffer_tier(80.0).tier == "100m"
    assert resolve_buffer_tier(150.0).tier == "200m"
    assert resolve_buffer_tier(450.0).tier == "500m"
    assert resolve_buffer_tier(1200.0).tier == "1500m"
