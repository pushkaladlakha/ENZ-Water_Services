def test_list_zones(client):
    response = client.get("/api/v1/zones?limit=50")
    assert response.status_code == 200
    zones = response.json()
    assert len(zones) >= 10
    first_zone = zones[0]
    assert "zoneId" in first_zone
    assert "zoneName" in first_zone
    assert "popRegist" in first_zone

def test_get_zone_by_id(client):
    response = client.get("/api/v1/zones/AKL-SZ-14")
    assert response.status_code == 200
    zone = response.json()
    assert zone["zoneId"] == "AKL-SZ-14"
    assert "Titirangi" in zone["zoneName"] or "Zone" in zone["zoneName"]

def test_get_zone_buffers(client):
    response = client.get("/api/v1/zones/AKL-SZ-14/buffers")
    assert response.status_code == 200
    buffers = response.json()
    assert len(buffers) == 5
    tiers = [b["tier"] for b in buffers]
    assert "50m" in tiers
    assert "1500m" in tiers

def test_list_schemes(client):
    response = client.get("/api/v1/networks")
    assert response.status_code == 200
    schemes = response.json()
    assert len(schemes) >= 5
    assert any(s["supplierName"] == "Watercare Services Limited" for s in schemes)

def test_get_scheme_by_id(client):
    response = client.get("/api/v1/networks/SUP-AKL-WEST-01")
    assert response.status_code == 200
    scheme = response.json()
    assert scheme["supplyId"] == "SUP-AKL-WEST-01"
    assert scheme["complianceStatus"] == "Compliant"

def test_assets_redaction_for_citizen(client):
    response = client.get("/api/v1/assets?category=reticulation_main")
    assert response.status_code == 200
    assets = response.json()
    assert len(assets) >= 1
    # Check that technical telemetry is redacted
    for a in assets:
        assert a.get("cctvConditionScore") is None
        assert a.get("invertDepthM") is None
        assert a.get("engineerNotes") is None

def test_assets_unredacted_for_official(client, official_headers):
    response = client.get("/api/v1/assets?category=reticulation_main", headers=official_headers)
    assert response.status_code == 200
    assets = response.json()
    assert len(assets) >= 1
    # Check that official sees unredacted CCTV condition scores and engineering notes
    pipe = next(a for a in assets if a["compkey"] == 2017820)
    assert pipe["cctvConditionScore"] == 2
    assert pipe["invertDepthM"] == 1.25
    assert "Cathodic protection" in pipe["engineerNotes"]
