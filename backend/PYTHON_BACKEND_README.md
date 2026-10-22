# Taumata Arowai GIS Platform - Backend Service

High-precision spatial drinking water register, supply zone management, Watercare reticulation asset inspection, and compliance portal REST API for New Zealand (*Te Mana o te Wai*).

Built with **Python 3.12 / 3.13**, **FastAPI**, **Shapely 2.0 (GEOS)**, **SQLAlchemy 2.0**, and **Pydantic v2**.

---

## 1. Quick Start Guide

### Option A: Standard npm Commands (Recommended)
From the repository root (`c:\ENZ-Water_Services`):

```bash
# Start both FastAPI backend (:8000) and Vite frontend (:3000) concurrently:
npm run dev

# Start backend service only:
npm run dev:backend

# Run the full 36-test automated suite:
npm test
```

### Option B: Using the Cross-Platform Python Runner
The workspace includes `scripts/run-python.js`, which automatically locates `.venv\Scripts\python.exe` (Windows) or `.venv/bin/python` (Unix) and ensures `PYTHONPATH=.`:

```bash
# Run FastAPI with live reload
node scripts/run-python.js -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload

# Run pytest suite
node scripts/run-python.js -m pytest -v backend/tests
```

### Option C: Direct Virtual Environment Execution
```powershell
# Windows PowerShell
.\.venv\Scripts\python -m uvicorn backend.app.main:app --port 8000 --reload
```

Once running:
- **Interactive Swagger Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc Technical Specification**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- **Health Check**: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)
- **Readiness Probe**: [http://127.0.0.1:8000/api/ready](http://127.0.0.1:8000/api/ready)

---

## 2. Automated Test Suite (36 Tests)

Execute the full 36-test suite verifying the 7-step resolution engine, spatial algorithms, RBAC, incident export, and API contracts:

```bash
npm test
```

Test modules covered in `backend/tests/`:
- `test_health.py`: Uptime, diagnostic probes, and readiness.
- `test_auth.py`: JWT login, password hashing, and token validation.
- `test_spatial.py`: NZTM2000 projections, Haversine geodesics, PIP containment, buffer tiers.
- `test_water_supply_resolution.py`: 7-step authoritative water supply lineage pipeline.
- `test_address_search.py`: Cadastral parcel matching and address resolution.
- `test_zones_and_assets.py`: Supply zones, schemes, and field-level telemetry redaction.
- `test_incidents.py`: Incident intake, dispatch patching, and statutory CSV export RBAC enforcement.

---

## 3. Standalone Database File & Zero-Config Operation

To avoid requiring an immediate PostgreSQL server installation during local development, the backend operates out of the box with an embedded, pre-seeded SQLite spatial database:

- **Database File Location**: `backend/app/db/data/water_services.db` (3.0 MB)
- **Pre-populated Datasets**:
  - All 43 Auckland Drinking Water Supply Zones (`AklDizzy`) with polygon boundaries
  - 8 Primary Drinking Water Schemes (`SUP-AKL-*`)
  - Census demographic metrics (registered population, Māori population, deprivation indices)
  - Key Watercare assets (Huia WTP, Ardmore WTP, Waitakere Dam, Titirangi Reservoir, reticulation mains, valves)
  - Preconfigured RBAC test accounts (`official`, `admin`, `citizen`)

To re-seed or inspect the database at any time:
```bash
npm run db:info
npm run db:reseed
```

---

## 4. Production PostgreSQL / PostGIS Deployment

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

## 5. Key API Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | Uptime health check |
| `GET` | `/api/ready` | Public | Database & spatial engine readiness |
| `GET` | `/api/v1/addresses/search?q={query}` | Public | Search cadastral parcels & addresses |
| `GET` | `/api/v1/addresses/{id}` | Public | Detailed cadastral parcel attributes |
| `GET` | `/api/v1/addresses/{id}/water-supply` | Public | Verified water supply for known address |
| `POST` | `/api/v1/water-supply/resolve` | Public | 7-step authoritative address resolution |
| `GET` | `/api/v1/zones` | Public | List all 43 Auckland supply zones |
| `GET` | `/api/v1/zones/{zone_id}` | Public | Detailed zone geometry and demographics |
| `GET` | `/api/v1/zones/{zone_id}/buffers` | Public | Concentric buffer protection tiers |
| `GET` | `/api/v1/networks` | Public | List drinking water supply schemes |
| `GET` | `/api/v1/networks/{id}` | Public | Retrieve specific supply scheme |
| `GET` | `/api/v1/assets` | Public / Role-Based | Network assets (redacts CCTV & depth for citizens) |
| `GET` | `/api/v1/assets/{compkey}` | Public / Role-Based | Retrieve asset by Watercare COMPKEY |
| `POST` | `/api/v1/incidents` | Public | Citizen water contamination/incident intake |
| `GET` | `/api/v1/incidents` | Public | List registered incident complaints |
| `GET` | `/api/v1/incidents/export` | **Official / Admin Only** | Download statutory incident register CSV |
| `PATCH` | `/api/v1/incidents/{id}` | **Official / Admin Only** | Update investigation status & notes |
| `POST` | `/api/v1/auth/login` | Public | Authenticate user & issue JWT bearer token |
| `GET` | `/api/v1/auth/me` | Authenticated | Retrieve current user profile |

---

## 6. Security & RBAC Roles

- **Citizen Role** (`citizen@nzwater.org.nz` / `CitizenNZ#2026`):
  Public water compliance grades, boil-water notices, and supply scheme names. Sensitive pipe telemetry (`cctvConditionScore`, `invertDepthM`, `engineerNotes`) is redacted from responses. Cannot download unredacted citizen incident registers.
- **Authorized Official** (`official@taumataarowai.govt.nz` / `OfficialWater#2026`):
  Full access to CCTV defect scores, pipe invert depths, engineering notes, buffer corridor assessments, and incident investigation dispatch. Authorized to export the full incident register (`/api/v1/incidents/export`) with citizen residential addresses, water supply zones, associated treatment plants/dams, and contact details under the *Water Services Act 2021*.
- **Administrator** (`admin@taumataarowai.govt.nz` / `ArowaiAdmin#2026`):
  Full system governance, audit log queries, and administrative operations.
