def test_submit_incident_success(client):
    payload = {
        "category": "contamination_discoloration",
        "categoryLabel": "Water Discoloration / Turbidity",
        "severity": "high",
        "address": "4015 Great North Road, Kelston, Auckland",
        "coordinates": [-36.9094, 174.6806],
        "supplyZoneId": "AKL-SZ-14",
        "description": "Rusty tap water observed this morning with small sediment particles.",
        "reporterName": "Auckland Citizen",
        "reporterEmail": "citizen@test.nz",
        "isAnonymous": False
    }
    response = client.post("/api/v1/incidents", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["id"].startswith("NZ-DW-")
    assert data["status"] == "Submitted"
    assert data["reporterName"] == "Auckland Citizen"

def test_submit_incident_validation_error(client):
    payload = {
        "category": "contamination_discoloration",
        "address": "4015 Great North Road",
        "description": "Short"  # Less than 10 characters
    }
    response = client.post("/api/v1/incidents", json=payload)
    assert response.status_code == 422

def test_list_incidents(client):
    response = client.get("/api/v1/incidents")
    assert response.status_code == 200
    incidents = response.json()
    assert len(incidents) >= 1

def test_patch_incident_by_official(client, official_headers):
    # First create an incident
    payload = {
        "category": "pipe_burst_leak",
        "severity": "critical",
        "address": "12 Brandon Road, Glen Eden",
        "description": "Major main rupture bubbling through pavement on Brandon Rd.",
        "reporterName": "Field Reporter",
        "reporterEmail": "field@test.nz",
        "isAnonymous": False
    }
    create_res = client.post("/api/v1/incidents", json=payload)
    incident_id = create_res.json()["id"]

    # Official updates status
    patch_payload = {
        "status": "Sampling Dispatched",
        "officerNotes": "Watercare Emergency Response Crew en route with vacuum truck."
    }
    patch_res = client.patch(f"/api/v1/incidents/{incident_id}", json=patch_payload, headers=official_headers)
    assert patch_res.status_code == 200
    updated = patch_res.json()
    assert updated["status"] == "Sampling Dispatched"
    assert "vacuum truck" in updated["officerNotes"]

def test_patch_incident_unauthorized_for_citizen(client, citizen_headers):
    patch_res = client.patch("/api/v1/incidents/NZ-DW-2026-1042", json={"status": "Resolved"}, headers=citizen_headers)
    assert patch_res.status_code == 403

def test_export_incidents_unauthorized(client):
    response = client.get("/api/v1/incidents/export")
    assert response.status_code in [401, 403]

def test_export_incidents_by_official(client, official_headers):
    response = client.get("/api/v1/incidents/export", headers=official_headers)
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    assert "Incident ID" in response.text
    assert "Citizen's Residential Address" in response.text
    assert "Treatment Plant / Dam Associated" in response.text
    assert "Problem / Category" in response.text
    assert "Citizen Contact Name" in response.text
