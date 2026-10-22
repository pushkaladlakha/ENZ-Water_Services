def test_login_official_success(client):
    payload = {
        "email": "official@taumataarowai.govt.nz",
        "password": "OfficialWater#2026"
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "official"
    assert data["user"]["name"] == "David Te Whata"

def test_login_citizen_success(client):
    payload = {
        "email": "citizen@nzwater.org.nz",
        "password": "CitizenNZ#2026"
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["role"] == "citizen"

def test_login_invalid_credentials(client):
    payload = {
        "email": "official@taumataarowai.govt.nz",
        "password": "WrongPassword123"
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401

def test_get_current_user_profile(client, official_headers):
    response = client.get("/api/v1/auth/me", headers=official_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "official"
    assert data["name"] == "David Te Whata"

def test_get_current_user_unauthorized(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
