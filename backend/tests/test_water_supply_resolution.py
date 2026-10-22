def test_resolve_water_supply_by_address(client):
    payload = {"address": "4015 Great North Road, Kelston, Auckland"}
    response = client.post("/api/v1/water-supply/resolve", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["VERIFIED", "NEAR_ZONE"]
    assert "Kelston" in data["queriedAddress"]
    assert data["supplyZone"] is not None
    assert data["supplyScheme"] is not None
    assert data["bufferTier"] is not None
    assert data["lineage"] is not None
    assert data["nztm2000"]["easting"] > 1000000
    assert data["nztm2000"]["northing"] > 5000000

def test_resolve_water_supply_by_coordinates(client):
    payload = {"coordinates": [-36.9094, 174.6806]}
    response = client.post("/api/v1/water-supply/resolve", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["VERIFIED", "NEAR_ZONE"]
    assert data["supplyZone"] is not None
    assert data["nztm2000"]["easting"] > 1000000

def test_resolve_water_supply_outside_network(client):
    # Remote offshore coordinates in the Tasman Sea
    payload = {"coordinates": [-36.5000, 173.5000]}
    response = client.post("/api/v1/water-supply/resolve", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "UNMAPPED_OUTSIDE_RETICULATION"
    assert len(data["warnings"]) >= 1
    assert any("reticulation" in w.lower() for w in data["warnings"])

def test_resolve_water_supply_by_parcel_id(client):
    payload = {"address_id": "PARCEL-88-QUEEN"}
    response = client.post("/api/v1/water-supply/resolve", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "Queen Street" in data["queriedAddress"]
    assert data["lineage"]["streetMain"]["name"] == "Queen Street Bulk Reticulation Spine"
    assert data["lineage"]["servicePipe"]["pressureBar"] == 6.2
