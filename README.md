# Taumata Arowai - New Zealand Water Services GIS Platform

Official spatial drinking water register, supply zone management, Watercare reticulation network asset inspection, and compliance portal for New Zealand (*Te Mana o te Wai*).

![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)
![React](https://img.shields.io/badge/React-19.0+-61DAFB.svg)
![Vite](https://img.shields.io/badge/Vite-8.0+-646CFF.svg)
![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-199900.svg)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38BDF8.svg)
![PostGIS](https://img.shields.io/badge/PostGIS-3.2+-336791.svg)

---

## 1. System Overview

The **Taumata Arowai GIS Platform** provides an interactive, high-precision spatial portal for monitoring, querying, and managing New Zealand's drinking water supplies and three-waters reticulation networks under the *Water Services Act 2021*.

### Core Capabilities:
- **Interactive Multi-Basemap Leaflet GIS**: Fast spatial navigation with LINZ Cadastral Light, Esri World Imagery Satellite, Topographic, and OpenStreetMap basemaps.
- **Drinking Water Supply Zones (`AklDizzy`)**: Real-time rendering of all 43 Auckland MultiPolygon supply zones and 45 drinking water schemes.
- **Concentric Distance Buffer Corridors**: 50m, 100m, 200m, 500m, and 1500m protection corridors for water security monitoring.
- **Cadastral Parcel & Lineage Tracing**: Sub-meter parcel queries matching land titles to upstream source dams, treatment plants, balancing reservoirs, and municipal reticulation pipelines.
- **Physical Pipe Network Inspection**: Verified pipe diameters (mm), materials (Cast Iron, Ductile Iron, MDPE, Concrete), CCTV condition scores, and authoritative Watercare COMPKEY identifiers.
- **Dual Coordinate Systems**: Real-time conversion and status display in **NZTM2000 (EPSG:2193)** metric coordinates alongside **WGS84 (EPSG:4326)** decimal degrees.
- **Citizen Water Contamination & Service Incident Portal**: Secure citizen complaint logging with geolocation capture and official investigation workflow.
- **Role-Based Access Control (RBAC)**: Role switching between **Citizen**, **Authorized Official**, and **System Administrator**.

---

## 2. Quick Start & Safe Execution

> **Quick Reference**: For a standalone plain-text cheat sheet, see **[`SAFE_RUN_GUIDE.txt`](./SAFE_RUN_GUIDE.txt)** or **[`RUN_GUIDE.txt`](./RUN_GUIDE.txt)**.

### Common Question: *Do I need to run `npm install` every time I open CMD?*
**No!** Once you run `npm install` during initial setup, all packages are safely preserved in `node_modules/`. When you open a new terminal session, simply start the server:

```bash
npm run dev
```

### First-Time Local Setup

```bash
# 1. Clone or navigate to the project directory
cd taumata-arowai-gis

# 2. Copy the environment configuration file
cp .env.example .env

# 3. Install dependencies (RUN ONCE ONLY)
npm install

# 4. Start the Vite development server on port 3000
npm run dev
```

Open your browser at:  
👉 **`http://localhost:3000`**

To stop the server at any time, press **`Ctrl + C`** in your terminal.

---

## 3. Remote Access & VS Code Dev Tunnels

If you are developing inside VS Code or need to share the running application across a secure remote tunnel:

### Setting up VS Code Port Forwarding:
1. Start the application: `npm run dev`
2. Open the **PORTS** tab in the bottom dock of VS Code (`View` &rarr; `Open View` &rarr; `Ports`).
3. Click **Forward a Port** and enter `3000`.
4. Right-click port 3000:
   - Select **Port Visibility** &rarr; **Public** (to share with colleagues) or **Private** (authenticated).
5. Click the forwarded HTTPS URL (e.g., `https://xxxx-3000.devtunnels.ms`).

### Tunneled Map Tile Rendering:
- **Why raw OSM failed over dev tunnels**: Standard `tile.openstreetmap.org` blocks reverse proxies and dev tunnel referrers with HTTP 403 Forbidden.
- **Built-in Solution**: The application automatically routes basemap layers to high-availability, CORS-unrestricted Carto Voyager and Esri World Imagery CDN endpoints. All tiles are served over secure HTTPS to eliminate Mixed Content blocking.

---

## 4. Safe Python Geospatial Pipeline (Optional)

The script in `scripts/process_mentor_data.py` converts raw Esri Layer Packages (`.lpkx` / `default.gdb`) and joins Excel metadata (`Auckland_zone_list.xlsx`) into web-ready GeoJSON.

> ⚠️ **Safety Notice**: Never install GIS libraries directly into your global system Python. Always use a virtual environment (`.venv`) to prevent version conflicts with system libraries.

## Custom Dataset Upload

A staff-only custom dataset upload feature is available from the application header for testing. It supports GeoJSON/ArcGIS JSON and zone-list CSV input, applies data as a temporary client-side map layer, and does not persist uploads to a backend. Static data under `public/data/` is separate from files added through the upload modal.

## Water Network GeoJSON

The full `Water_Pipe.geojson` and `Water_Valve.geojson` source files are kept in `source-data/`, outside the web-served `public/` directory. Their Auckland-region features are preprocessed into compressed spatial tiles under `public/data/water-network/`; the map requests tiles for the visible area when zoomed to level 14 or closer. Pipe and valve layers use these GeoJSON features instead of the small built-in water pipe and valve samples.

To rebuild the map tiles after replacing either source file, put the updated files in `source-data/` and run:

```powershell
python scripts/tile_water_network.py
```

The script uses Python's standard library only. Keep the full source GeoJSON out of `public/`: Vite copies that directory into production output, and the source files are hundreds of megabytes.

### Windows (PowerShell / CMD):
```powershell
# Create isolated virtual environment
python -m venv .venv

# Activate environment
.\.venv\Scripts\Activate.ps1

# Install only needed GIS libraries
pip install geopandas pyogrio shapely fiona openpyxl pandas

# Run the batch conversion
python scripts/process_mentor_data.py --gdb path/to/default.gdb --excel path/to/Auckland_zone_list.xlsx

# Deactivate when finished
deactivate
```

### macOS / Linux:
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install geopandas pyogrio shapely fiona openpyxl pandas
python scripts/process_mentor_data.py --gdb path/to/default.gdb --excel path/to/Auckland_zone_list.xlsx
deactivate
```

---

## 5. PostGIS Relational Database Schema

The production spatial database schema is located in **[`database/schema.sql`](./database/schema.sql)**.

### Key Schema Characteristics:
- **Idempotent**: All tables, enum types, and indexes use `IF NOT EXISTS` guards. Existing data is never destroyed or wiped.
- **Dual Geometries**:
  - `geom_wgs84` (`GEOMETRY(..., 4326)`): Optimized for web GeoJSON serialization and client mapping.
  - `geom_nztm` (`GEOMETRY(..., 2193)`): Millimeter-accurate metric projection for spatial buffer calculations and proximity checks without Mercator distortion.
- **GiST Spatial Indexing**: Sub-millisecond point-in-polygon queries for parcel resolution.

### Executing the Database Migration:
```bash
# 1. Create target database
createdb -U postgres taumata_arowai_gis

# 2. Execute idempotent schema
psql -U postgres -d taumata_arowai_gis -f database/schema.sql
```

For full database documentation, see **[`database/README.md`](./database/README.md)**.

---

## 6. Project Directory Structure

```text
├── .env.example             # Environment variables template
├── database/
│   ├── README.md            # Detailed spatial schema documentation
│   └── schema.sql           # PostGIS DDL with tables, indexes, and triggers
├── public/
│   ├── favicon.svg          # Official vector favicon
│   └── data/                # Static GeoJSON datasets (separate from UI uploads)
├── requirements.txt         # Runtime & geospatial requirements specification
├── requirement.txt          # Alias specification file
├── RUN_GUIDE.txt            # Quick plain-text run cheatsheet
├── SAFE_RUN_GUIDE.txt       # Full comprehensive safe execution & troubleshooting guide
├── scripts/
│   └── process_mentor_data.py  # GeoPandas ETL script for Esri .gdb & Excel
├── src/
│   ├── App.tsx              # Main application orchestrator
│   ├── components/
│   │   ├── Header.tsx               # Navigation, search, and user authentication
│   │   ├── GisMap.tsx               # Leaflet GIS canvas with vector layers & popups
│   │   ├── LayerPanel.tsx           # Multi-basemap & layer visibility controls
│   │   ├── InspectionDrawer.tsx     # Asset inspector & lineage telemetry
│   │   ├── CitizenComplaintModal.tsx # Water incident reporting workflow
│   │   ├── DataRequestModal.tsx     # Custom GeoJSON file ingestion
│   │   ├── DocumentationModal.tsx   # Built-in technical documentation viewer
│   │   └── LoginModal.tsx           # Multi-role authentication (Citizen, Official, Admin)
│   ├── config/
│   │   └── apiConfig.ts     # Map tile endpoints and API configuration
│   ├── data/
│   │   └── nzData.ts        # Authoritative verified parcels, pipes, and fittings
│   ├── types/
│   │   └── gis.ts           # Strict TypeScript interfaces for GIS data models
│   └── utils/
│       └── waterLineageEngine.ts # Spatial geometry resolution & NZTM2000 projections
├── index.html               # Entry HTML with Taumata Arowai metadata
├── package.json             # Node dependencies and build scripts
├── tsconfig.json            # Strict TypeScript compilation rules
└── vite.config.ts           # Vite bundler configuration
```

---

## 7. Build & Verification Commands

```bash
# Verify TypeScript types and syntax
npm run lint

# Build optimized production bundle
npm run build

# Preview production build locally on port 4173
npm run preview
```

---

## 8. Regulatory Context & Compliance

This platform models the regulatory compliance framework of **Taumata Arowai (Water Services Authority of New Zealand - Te Mana o te Wai)** under:
- **Water Services Act 2021**
- **Drinking Water Quality Assurance Rules (DWQAR)**
- **New Zealand Drinking Water Standards (NZDWS)**

---

## 9. License & Attribution

- **Spatial Data Custodians**: Taumata Arowai, Watercare Services Limited, Land Information New Zealand (LINZ).
- **Basemap Providers**: CARTO (OpenStreetMap contributors), Esri World Imagery, LINZ Data Service.
