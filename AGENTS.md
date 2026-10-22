# ENZ-Water_Services - Agent Instructions & Architecture Guidelines

## Repository Overview
**AquaConnect GIS — Taumata Arowai Water Services Platform**
An enterprise spatial information system and regulatory compliance hub engineered to fulfill the statutory mandates of the **Water Services Act 2021** across Aotearoa New Zealand (*Te Mana o te Wai*).

The repository is organized as an **npm workspaces monorepo** with a decoupled frontend and backend:
- `frontend/` - React 19, TypeScript, Vite, Tailwind CSS v4, Leaflet GIS map canvas.
- `backend/` - Python 3.12/3.13, FastAPI, SQLAlchemy 2.0 ORM, Shapely 2.0 (GEOS), Pydantic v2.
- `database/` - PostgreSQL 16+ / PostGIS 3.2+ schema (`schema.sql`) and spatial database docs.
- `scripts/` - Utility and automation scripts including the cross-platform Python runner.

---

## Workspace Structure & Key Directories

```text
c:\ENZ-Water_Services\
├── backend/
│   ├── app/
│   │   ├── api/routes/          # FastAPI REST endpoints (addresses, zones, assets, incidents, auth)
│   │   ├── core/                # Configuration, JWT security, error handling
│   │   ├── db/                  # Session engine, models, seed logic, embedded SQLite DB
│   │   ├── repositories/        # SQLAlchemy data access repositories
│   │   ├── schemas/             # Pydantic v2 request/response DTO contracts
│   │   └── services/            # Domain services (7-step water supply resolution, spatial LINZ)
│   ├── tests/                   # 36 pytest unit/integration tests
│   ├── requirements.txt         # Pinned backend Python dependencies
│   └── tsconfig.json            # Backend TypeScript configuration
├── frontend/
│   ├── src/
│   │   ├── components/          # React components (GisMap, Header, ComplaintModal, ProfileDashboard)
│   │   ├── data/                # Authoritative NZ water and parcel dataset caches
│   │   ├── services/            # API client with token management and proxy routing
│   │   ├── types/               # TypeScript interfaces for GIS layers, lineage, auth, incidents
│   │   └── utils/               # Geocoding, waterLineageEngine, CSV export
│   ├── public/data/             # Preprocessed spatial tile assets
│   ├── package.json             # Frontend dependencies
│   ├── vite.config.ts           # Vite dev server with reverse-proxy (/api -> http://127.0.0.1:8000)
│   └── tsconfig.json            # Frontend TypeScript configuration
├── scripts/
│   ├── run-python.js            # Cross-platform venv runner (auto-detects .venv, sets PYTHONPATH)
│   ├── generate_developer_pdf.py# Architecture documentation export generator
│   ├── process_mentor_data.py   # Mentor GIS dataset ingestion
│   └── tile_water_network.py    # Spatial network tile pre-processing
├── package.json                 # Monorepo root scripts & shared dependencies
└── README.md                    # Comprehensive platform documentation & interview guide
```

---

## Development & Test Commands

Always use the project's established npm scripts from the repository root:

- **Start Full Stack**: `npm run dev`
  Concurrently launches Python FastAPI on `http://127.0.0.1:8000` and Vite frontend on `http://localhost:3000`.
- **Start Frontend Only**: `npm run dev:frontend`
- **Start Backend Only**: `npm run dev:backend`
  Executes `node scripts/run-python.js -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload`.
- **Run Tests**: `npm test` or `npm run test:backend`
  Executes the 36 automated pytest test suite (`node scripts/run-python.js -m pytest -v backend/tests`).
- **Type Check / Lint**: `npm run lint`
  Runs `tsc --noEmit` across both `frontend/tsconfig.json` and `backend/tsconfig.json`.
- **Production Build**: `npm run build`
  Builds the production Vite bundle in `frontend/dist`.
- **Database Management**:
  - `npm run db:info`: Displays table counts and database statistics.
  - `npm run db:reseed`: Reseeds the SQLite spatial database.

---

## Virtual Environment Conventions

- The dedicated virtual environment is located at `.venv/`.
- **Never install packages globally.** Always execute Python scripts through `node scripts/run-python.js <args>` or directly via `.venv/Scripts/python.exe` (Windows) / `.venv/bin/python` (Unix).
- `scripts/run-python.js` ensures `PYTHONPATH` points to the workspace root so module imports like `from backend.app.main import app` resolve without path errors.

---

## Reverse Proxy & API Routing Conventions

- Frontend makes all API requests to relative path `/api/...` (e.g. `/api/v1/incidents`).
- In development, `frontend/vite.config.ts` proxies `/api` requests to `http://127.0.0.1:8000`.
- Backend endpoints:
  - Base routes: `/api/health`, `/api/ready`
  - V1 routes: `/api/v1/auth`, `/api/v1/addresses`, `/api/v1/water-supply`, `/api/v1/zones`, `/api/v1/networks`, `/api/v1/assets`, `/api/v1/incidents`, `/api/v1/incidents/export`

---

## UI/UX & Design Guidelines

1. **Enterprise Government Aesthetic (No "AI-Generated" Look)**:
   - Use clean, dignified public-sector styling aligned with New Zealand regulatory portals (Taumata Arowai, LINZ, Watercare).
   - Primary brand color is deep navy `#072e54` with subtle teal `#008080` accents and crisp neutral borders.
   - Do NOT use flashy neon badges, loud gradients, artificial AI sparkles, fake lock dialogs, or over-decorated novelty modals.
2. **Role-Based Access Control (RBAC)**:
   - **Citizen / Public User**: Public GIS map, address search, 7-step water supply lineage, incident complaint filing. Sensitive pipe telemetry (`cctvConditionScore`, `invertDepthM`, `engineerNotes`) is dynamically redacted.
   - **Authorized Official (`official`) & Admin (`admin`)**: Unredacted CCTV scores, pipe invert depths, asset inspection notes, and the **Statutory Incident Register Export (CSV)**.
3. **Data Export Placement**:
   - The CSV Export button is **strictly restricted** to logged-in authorized officials (`official` or `admin`).
   - It is **never placed in the top navigation bar** to avoid UI clutter.
   - It is located in the **Active Incident Register** tab (`CitizenComplaintModal.tsx`) and in the **Official Profile Workspace** (`ProfileDashboard.tsx`).
   - Unauthenticated visitors and citizens do NOT see export controls or artificial prompt barriers.
4. **Data Integrity & Zero Fabrications**:
   - Ground coordinates, treatment plants, and catchment dams strictly in verified Watercare and LINZ registers.
   - If an asset's data is unverified, display `Unavailable in authoritative dataset` rather than inventing coordinates or defaulting to (0,0).
