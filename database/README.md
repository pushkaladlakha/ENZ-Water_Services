# Taumata Arowai GIS Platform - Relational Spatial Database Architecture

This directory contains the normalized PostgreSQL and PostGIS relational database schema for the **New Zealand Water Services Authority – Taumata Arowai GIS Platform**.

---

## 1. Architecture Overview

The database design models the hierarchical relationships between drinking water schemes, spatial supply zones, demographic indicators, concentric buffer corridors, and physical reticulation assets:

```text
Water Supply Scheme (e.g. AKL-SUP-01 Metro Scheme)
  └── Water Supply Zones (e.g. AKL-SZ-14 Titirangi / Kelston)
        ├── Geometry: EPSG:4326 (Web tiles) & EPSG:2193 (NZTM meters)
        ├── Demographics: Registered Pop, Deprivation Indices, Māori Pop
        ├── Buffer Tiers: 50m, 100m, 200m, 500m, 1500m
        └── Water Infrastructure Assets
              ├── Source Dams (Waitakere, Nihotupu, Huia, Cosseys, Mangatangi)
              ├── Water Treatment Plants (Huia WTP, Ardmore WTP, Waikato WTP)
              ├── Service Balancing Reservoirs (Titirangi Reservoir, etc.)
              └── Reticulation Watermains, Isolation Valves & Hydrants (COMPKEYs)
```

---

## 2. Prerequisites

- **PostgreSQL**: Version 14 or higher
- **PostGIS Extension**: Version 3.2 or higher
- **UUID Extension**: `uuid-ossp` (bundled with PostgreSQL contrib)

---

## 3. Execution Order

To provision and initialize the spatial database in a local or cloud environment:

```bash
# 1. Create target database
createdb -U postgres taumata_arowai_gis

# 2. Apply extensions, schema, indexes, and triggers
psql -U postgres -d taumata_arowai_gis -f database/schema.sql
```

The script is idempotent and protected with `IF NOT EXISTS` guards.

---

## 4. Coordinate Reference System (CRS) Strategy

The schema maintains dual spatial geometry representations for optimal performance and engineering accuracy:

1. **`geom_wgs84` (`GEOMETRY(..., 4326)`)**:
   - Standard geographic coordinates (decimal degrees).
   - Used for GeoJSON serialization, Leaflet/Mapbox vector tile rendering, and direct web client display.

2. **`geom_nztm` (`GEOMETRY(..., 2193)`)**:
   - Official New Zealand Transverse Mercator 2000 (meters).
   - Used for millimeter-accurate distance calculations, area assessments, and spatial buffer generation (50m, 100m, 200m, 500m, 1500m) without projection distortion.

Spatial queries utilize **GiST indexes** (`CREATE INDEX ... USING GIST`) on both geometry columns to guarantee sub-millisecond point-in-polygon queries for address searches.

---

## 5. Domain Table Mapping

| Table Name | Source Dataset / Entity | Description |
|---|---|---|
| `app_users` | Security System | Authenticated users with roles: `citizen`, `official`, `admin`. |
| `user_sessions` | Security System | JWT/Bearer session state with expiry and IP tracking. |
| `audit_logs` | Governance | Immutable log of dataset ingestion, exports, and administrative actions. |
| `data_sources` | Provenance | Custodians (Taumata Arowai, Watercare, LINZ) and license metadata. |
| `uploaded_datasets` | Ingestion Pipeline | Upload tracking with SHA-256 checksums and validation reports. |
| `water_supply_schemes` | `Auckland_zone_list.xlsx` | 45 supply schemes with operator and Taumata Arowai compliance status. |
| `water_supply_zones` | `AklDizzy` Layer (`.gdb`) | 43 MultiPolygon supply zones linked to scheme identifiers. |
| `zone_demographics` | `AklDizzy` Attributes | Registered pop (`pop_regist`), deprivation indices, and Māori population. |
| `supply_zone_buffers` | `AklDizzy_Buffers*` | Concentric buffer polygons (50m, 100m, 200m, 500m, 1500m). |
| `water_network_assets` | Watercare GIS Registry | Pipes (diameter, material, COMPKEY), dams, treatment plants, reservoirs. |
| `spatial_property_queries` | Query Service | Audit log of user parcel lookups and matched infrastructure lineage. |

---

## 6. Security and Role Isolation (RBAC)

- **Citizen Role**: Permitted read-only access to `water_supply_schemes` public attributes and `water_supply_zones` boundary summaries. Technical pipe telemetry (`invert_depth_m`, `cctv_condition_score`, engineering notes) is encapsulated and excluded from public responses.
- **Authorized Official Role**: Permitted read access to `water_network_assets`, compliance records, buffer corridors, and operational asset specifications.
- **Admin Role**: Permitted write access to `uploaded_datasets`, table publishing, and governance audit records.

---

## 7. Operational Status Notice

*Note: This SQL deliverable defines the database contract. The database is prepared for deployment. Live database connections will become active once the backend service is configured and connected using `DATABASE_URL`.*
