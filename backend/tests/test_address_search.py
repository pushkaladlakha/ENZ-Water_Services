def test_search_address_success(client):
    response = client.get("/api/v1/addresses/search?q=Great North Road")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] >= 1
    assert any("Great North Road" in p["fullAddress"] for p in data["results"])

def test_search_address_by_lot(client):
    response = client.get("/api/v1/addresses/search?q=Lot 14")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] >= 1
    assert data["results"][0]["lotNumber"] == "Lot 14"

def test_search_address_empty_query(client):
    response = client.get("/api/v1/addresses/search?q=")
    assert response.status_code == 422  # validation error

def test_get_address_by_id_success(client):
    response = client.get("/api/v1/addresses/PARCEL-4015-GNR")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "PARCEL-4015-GNR"
    assert data["streetNumber"] == "4015"
    assert data["services"]["waterConnected"] is True
    assert data["waterLineage"]["sourceDam"]["name"] == "Waitakere Dam & Lower Nihotupu Dam"

def test_get_address_by_id_not_found(client):
    response = client.get("/api/v1/addresses/PARCEL-NONEXISTENT")
    assert response.status_code == 404
    assert "not found" in response.json()["error"]["message"].lower()

def test_get_address_water_supply(client):
    response = client.get("/api/v1/addresses/PARCEL-4015-GNR/water-supply")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["VERIFIED", "NEAR_ZONE"]
    assert data["supplyZone"] is not None
    assert data["lineage"] is not None
    assert data["lineage"]["treatmentPlant"]["name"] == "Huia Water Treatment Plant"
