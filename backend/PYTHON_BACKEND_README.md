# Taumata Arowai GIS Platform - Backend Service

High-precision spatial drinking water register, supply zone management, Watercare reticulation asset inspection, and compliance portal REST API for New Zealand (*Te Mana o te Wai*).

Built with **Python 3.13**, **FastAPI**, **Shapely 2.0**, **SQLAlchemy 2.0**, and **Pydantic v2**.

---

## 1. Quick Start Guide

### Step 1: Environment & Virtual Environment
If you haven't already activated the Python virtual environment:

```powershell
# Windows PowerShell
.\.venv\Scripts\Activate.ps1

# Or run directly using the venv python executable:
.\.venv\Scripts\python -m uvicorn backend.app.main:app --port 8000 --reload
```

### Step 2: Running the Automated Test Suite

Execute the full 34-test suite verifying the resolution engine, spatial algorithms, RBAC, and API contracts:

```powershell
$env:PYTHONPATH="."
.\.venv\Scripts\python -m pytest -v backend/tests
```

### Step 3: Starting the Development Server

```powershell
$env:PYTHONPATH="."
.\.venv\Scripts\python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

Once running:
- **Interactive Swagger Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc Technical Specification**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- **Health Check**: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)
- **Readiness Probe**: [http://127.0.0.1:8000/api/ready](http://127.0.0.1:8000/api/ready)

---

## 2. Standalone Database File & Zero-Config Operation

To avoid requiring an immediate PostgreSQL server installation during local development, the backend operates out of the box with an embedded, pre-seeded SQLite spatial database:

- **Database File Location**: `backend/app/db/data/water_services.db` (3.0 MB)
- **Pre-populated Datasets**:
  - All 43 Auckland Drinking Water Supply Zones (`AklDizzy`) with polygon boundaries
  - 8 Primary Drinking Water Schemes (`SUP-AKL-*`)
  - Census demographic metrics (registered population, Māori population, deprivation indices)
  - Key Watercare assets (Huia WTP, Ardmore WTP, Waitakere Dam, Titirangi Reservoir, reticulation mains, valves)
  - Preconfigured RBAC test accounts (`official`, `admin`, `citizen`)

To re-seed or reset the database at any time:
```powershell
$env:PYTHONPATH="."
.\.venv\Scripts\python -m backend.app.db.seed
```

---

## 3. Production PostgreSQL / PostGIS Deployment

To switch to a production PostgreSQL database:

1. Create target database:
   ```bash
   createdb -U postgres taumata_arowai_gis
   psql -U postgres -d taumata_arowai_gis -f database/schema.sql
   ```
2. Set the `DATABASE_URL` environment variable in your `.env` file:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/taumata_arowai_gis"
   ```
3. Run the application as normal; the backend automatically utilizes PostgreSQL via SQLAlchemy.

---

## 4. Key API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Uptime health check |
| `GET` | `/api/ready` | Database & spatial engine readiness |
| `GET` | `/api/v1/addresses/search?q={query}` | Search cadastral parcels & addresses |
| `GET` | `/api/v1/addresses/{id}` | Detailed cadastral parcel attributes |
| `GET` | `/api/v1/addresses/{id}/water-supply` | Verified water supply for known address |
| `POST` | `/api/v1/water-supply/resolve` | 7-step authoritative address resolution |
| `GET` | `/api/v1/zones` | List all 43 Auckland supply zones |
| `GET` | `/api/v1/zones/{zone_id}` | Detailed zone geometry and demographics |
| `GET` | `/api/v1/zones/{zone_id}/buffers` | Concentric buffer protection tiers |
| `GET` | `/api/v1/networks` | List drinking water supply schemes |
| `GET` | `/api/v1/networks/{id}` | Retrieve specific supply scheme |
| `GET` | `/api/v1/assets` | Filterable network assets (RBAC telemetry filtering) |
| `GET` | `/api/v1/assets/{compkey}` | Retrieve asset by Watercare COMPKEY |
| `POST` | `/api/v1/incidents` | Citizen water contamination/incident intake |
| `GET` | `/api/v1/incidents` | List registered incident complaints |
| `PATCH` | `/api/v1/incidents/{id}` | Official update investigation status & notes |
| `POST` | `/api/v1/auth/login` | Authenticate user & issue JWT bearer token |
| `GET` | `/api/v1/auth/me` | Retrieve current authenticated user profile |

---

## 5. Security & RBAC Roles

- **Citizen Role** (`citizen@nzwater.org.nz` / `CitizenNZ#2026`):
  Public water compliance grades, boil-water notices, and supply scheme names. Sensitive pipe telemetry (`cctvConditionScore`, `invertDepthM`, `engineerNotes`) is redacted from responses.
- **Authorized Official** (`official@taumataarowai.govt.nz` / `OfficialWater#2026`):
  Full access to CCTV defect scores, pipe invert depths, engineering notes, buffer corridor assessments, and incident investigation dispatch.
- **Administrator** (`admin@taumataarowai.govt.nz` / `ArowaiAdmin#2026`):
  Full system governance, audit log queries, and administrative operations.
