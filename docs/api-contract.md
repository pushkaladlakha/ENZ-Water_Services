# Taumata Arowai GIS Platform - API Contract Specification

## Base URLs
- Local Development: `http://127.0.0.1:8000/api` (or `/api/v1`)
- Interactive Docs: `http://127.0.0.1:8000/docs`

---

## 1. Health & Diagnostics

### `GET /api/health`
Verifies backend service availability.
- **Response `200 OK`**:
```json
{
  "status": "healthy",
  "service": "Taumata Arowai GIS Platform API",
  "timestamp": "2026-10-13T01:46:00.000000+00:00",
  "version": "1.0.0"
}
```

### `GET /api/ready`
Verifies database and spatial engine readiness.
- **Response `200 OK`**:
```json
{
  "status": "ready",
  "database": "connected",
  "spatial_engine": "shapely_geos",
  "timestamp": "2026-10-13T01:46:00.000000+00:00"
}
```

---

## 2. Address Search & Parcel Lookup

### `GET /api/v1/addresses/search?q={query}&limit=10`
Searches verified cadastral parcels by address, street name, lot, DP number, or suburb.
- **Query Parameters**:
  - `q` (string, required): Search term.
  - `limit` (integer, optional, default: 10): Max items.
- **Response `200 OK`**:
```json
{
  "query": "Great North Road",
  "count": 2,
  "results": [
    {
      "id": "PARCEL-4015-GNR",
      "streetNumber": "4015",
      "streetName": "Great North Road",
      "suburb": "Kelston",
      "city": "Auckland",
      "fullAddress": "4015 Great North Road, Kelston, Auckland 0602",
      "coordinates": [[-36.909, 174.68], [-36.909, 174.6812], [-36.9098, 174.6812], [-36.9098, 174.68]],
      "center": [-36.9094, 174.6806],
      "lotNumber": "Lot 14",
      "dpNumber": "DP 48291",
      "titleReference": "NA192/441",
      "areaM2": 812.0,
      "zoneCode": "THAB",
      "zoneName": "Terrace Housing and Apartment Buildings Zone",
      "zoneColor": "#e11d48",
      "zoneDescription": "High-density residential enabling multi-storey dwellings.",
      "dataSource": "LINZ Cadastral & Auckland Council GIS",
      "services": {
        "waterConnected": true,
        "wastewaterConnected": true,
        "stormwaterConnected": true,
        "rubbishCollectionDay": "Tuesday",
        "meterLocationDescription": "Front boundary Toby box on left berm",
        "outageStatus": "Normal"
      },
      "planning": {
        "maxBuildingCoveragePct": 50.0,
        "maxHeightM": 16.0,
        "minLandscapedAreaPct": 30.0,
        "imperviousAreaLimitPct": 70.0,
        "floodRisk": "None",
        "overlandFlowPath": false,
        "heritageOverlay": false,
        "catchmentZone": "Whau River Catchment"
      },
      "engineerData": {
        "supplyZoneId": "AKL-SZ-14",
        "sewerSubcatchmentId": "SEW-WHAU-44",
        "pipeConnectionCompkey": 2017826,
        "meterSerialNumber": "WTR-2021-99482",
        "meterSizeMm": 20,
        "meterLastReadM3": 482.4,
        "backflowHazardLevel": "Low",
        "staticPressureKPa": 540.0,
        "cathodicProtectionStatus": "N/A",
        "scadaZoneId": "SCADA-AKL-W-04"
      },
      "waterLineage": {
        "sourceDam": {
          "name": "Waitakere Dam & Lower Nihotupu Dam",
          "catchment": "Waitakere Ranges Native Catchment",
          "capacityML": 29800.0,
          "distanceKm": 14.6
        },
        "treatmentPlant": {
          "name": "Huia Water Treatment Plant",
          "process": "Dissolved Air Flotation (DAF), Sand Filtration & Disinfection",
          "waterQualityGrade": "Taumata Arowai Rule Compliant (Grade A1)"
        },
        "reservoir": {
          "name": "Titirangi High-Level Water Reservoir",
          "capacityM3": 45000.0,
          "headLevelM": 132.0
        },
        "streetMain": {
          "compkey": 2017820,
          "name": "Great North Road Reticulation Main",
          "nominalDiaMm": 150,
          "material": "Ductile Iron"
        },
        "servicePipe": {
          "compkey": 2017826,
          "nominalDiaMm": 20,
          "material": "Polyethylene PE100",
          "pressureBar": 4.8
        },
        "upstreamValve": {
          "compkey": 2017899,
          "code": "VLV-10029",
          "type": "150mm Sluice Isolation Valve"
        },
        "wastewaterDestination": {
          "treatmentPlant": "Mangere Wastewater Treatment Plant",
          "outfallCatchment": "Manukau Harbour deep ocean discharge with UV disinfection"
        }
      }
    }
  ]
}
```

---

## 3. Water Supply Resolution

### `POST /api/v1/water-supply/resolve`
Resolves an address, cadastral parcel ID, or coordinate pair to its authoritative drinking water supply zone and infrastructure lineage.
- **Request Body**:
```json
{
  "address": "4015 Great North Road, Kelston, Auckland",
  "coordinates": [-36.9094, 174.6806],
  "address_id": "PARCEL-4015-GNR"
}
```
- **Response `200 OK`**:
```json
{
  "status": "VERIFIED",
  "queriedAddress": "4015 Great North Road, Kelston, Auckland 0602",
  "coordinates": [-36.9094, 174.6806],
  "nztm2000": {
    "easting": 1748058.95,
    "northing": 5914203.46
  },
  "supplyZone": {
    "zoneId": "AKL-SZ-14",
    "zoneName": "Titirangi & Kelston Supply Zone",
    "supplyId": "SUP-AKL-WEST-01",
    "supplyName": "Huia / Waitakere Western Water Supply Scheme",
    "zonePopulation": 48250,
    "urbanRural": "Urban",
    "lat": -36.9125,
    "lng": 174.6780,
    "popRegist": 48250,
    "popLowDe": 14200,
    "popModDe": 22100,
    "popHighDe": 11950,
    "popMaori": 6180,
    "dataSource": "Taumata Arowai Drinking Water Register & Watercare Services Ltd"
  },
  "supplyScheme": {
    "supplyId": "SUP-AKL-WEST-01",
    "supplyName": "Huia / Waitakere Western Water Supply Scheme",
    "supplierName": "Watercare Services Limited",
    "region": "Auckland Region",
    "complianceStatus": "Compliant",
    "sourceWaterType": "Waitakere Native Catchment Dams",
    "registeredPopulation": 104350,
    "primaryTreatmentPlant": "Huia Water Treatment Plant",
    "waterQualityGrade": "Taumata Arowai Rule Compliant (Grade A1)"
  },
  "bufferTier": {
    "tier": "50m",
    "tierName": "Within 50m (Immediate Reticulation Spine)",
    "bufferLayer": "AklDizzy_Buffers50m",
    "description": "Property directly abuts or sits within 50m of primary municipal reticulation main.",
    "distanceMeters": 15.0
  },
  "lineage": {
    "sourceDam": { "name": "Waitakere Dam & Lower Nihotupu Dam", "capacityML": 29800.0, "distanceKm": 14.6 },
    "treatmentPlant": { "name": "Huia Water Treatment Plant", "process": "DAF & Sand Filtration" },
    "reservoir": { "name": "Titirangi High-Level Water Reservoir", "capacityM3": 45000.0, "headLevelM": 132.0 },
    "streetMain": { "compkey": 2017820, "name": "Great North Road Reticulation Main", "nominalDiaMm": 150, "material": "Ductile Iron" },
    "servicePipe": { "compkey": 2017826, "nominalDiaMm": 20, "material": "Polyethylene PE100", "pressureBar": 4.8 },
    "upstreamValve": { "compkey": 2017899, "code": "VLV-10029", "type": "150mm Sluice Isolation Valve" },
    "wastewaterDestination": { "treatmentPlant": "Mangere Wastewater Treatment Plant" }
  },
  "matchedPipeCompkey": 2017826,
  "distanceToMainMeters": 15.0,
  "warnings": [],
  "confidenceScore": 0.98
}
```

---

## 4. Supply Zones & Schemes

### `GET /api/v1/zones?limit=50&offset=0`
Returns paginated list of all 43 Auckland drinking water supply zones with demographics.

### `GET /api/v1/zones/{zone_id}`
Returns specific zone by ID (e.g. `AKL-SZ-14`).

### `GET /api/v1/zones/{zone_id}/buffers`
Returns concentric buffer tiers (`50m`, `100m`, `200m`, `500m`, `1500m`).

### `GET /api/v1/networks`
Returns all 8 registered Auckland water supply schemes.

### `GET /api/v1/networks/{network_id}`
Returns detailed scheme information, operator, and compliance status.

---

## 5. Network Assets (RBAC Gated)

### `GET /api/v1/assets?category={category}&zone_id={zone_id}&limit=50`
- **Headers**:
  - `Authorization: Bearer <token>` (Optional)
- **Role Redaction**:
  - If unauthenticated or role is `citizen`: `cctvConditionScore`, `invertDepthM`, and `engineerNotes` are returned as `null`.
  - If role is `official` or `admin`: Technical telemetry is fully populated.

---

## 6. Citizen Water Incidents

### `POST /api/v1/incidents`
Submits a citizen water contamination, quality, or network incident.
- **Request Body**:
```json
{
  "category": "contamination_discoloration",
  "categoryLabel": "Water Discoloration / Turbidity",
  "severity": "high",
  "address": "4015 Great North Road, Kelston, Auckland",
  "coordinates": [-36.9094, 174.6806],
  "supplyZoneId": "AKL-SZ-14",
  "description": "Rusty tap water observed following mains maintenance.",
  "reporterName": "Auckland Citizen",
  "reporterEmail": "citizen@test.nz",
  "isAnonymous": false
}
```
- **Response `201 Created`**:
```json
{
  "id": "NZ-DW-2026-4819",
  "category": "contamination_discoloration",
  "status": "Submitted",
  "createdAt": "2026-10-13T01:46:00.000000+00:00"
}
```

### `GET /api/v1/incidents`
Lists registered incident complaints with optional filtering by status or severity.
- **Query Parameters**:
  - `status` (string, optional): Filter by status (`Submitted`, `Under Investigation`, `Resolved`)
  - `severity` (string, optional): Filter by severity (`low`, `medium`, `high`, `critical`)
  - `limit` (integer, optional, default: 50): Max records to retrieve
- **Response `200 OK`**:
```json
[
  {
    "id": "NZ-DW-2026-1042",
    "category": "contamination_discoloration",
    "categoryLabel": "Water Discoloration / Turbidity",
    "severity": "high",
    "address": "4015 Great North Road, Kelston, Auckland",
    "supplyZoneId": "AKL-SZ-14",
    "supplySchemeName": "Kelston Municipal Zone",
    "description": "Rust brown water with sediment coming from kitchen tap.",
    "status": "Under Investigation",
    "observedAt": "2026-10-22T08:30:00",
    "createdAt": "2026-10-22T08:35:00",
    "reporterName": "David Resident",
    "isAnonymous": false
  }
]
```

### `GET /api/v1/incidents/export`
Exports the complete statutory incident register to an RFC 4180-compliant CSV file (UTF-8 BOM encoded for Microsoft Excel compatibility).
- **Access Control**: **Restricted to `official` or `admin` roles only.**
- **Headers Required**:
  - `Authorization: Bearer <token>`
- **Response `200 OK`**:
  - `Content-Type: text/csv; charset=utf-8`
  - `Content-Disposition: attachment; filename="taumata_arowai_incident_register_YYYY-MM-DD.csv"`
- **Export Columns**:
  ```csv
  Incident ID,Citizen's Residential Address,Supply Zone ID,Supply Zone Name,Treatment Plant / Dam Associated,Associated Treatment Plant,Associated Source Dam,Problem / Category,Severity,Incident Description,Citizen Contact Name,Citizen Contact Email,Citizen Contact Phone,Anonymous Submission,Observed Date & Time,Date Registered,Investigation Status,Boil Water Advised,Officer Compliance Notes
  ```
- **Error Responses**:
  - `401 Unauthorized`: Missing or invalid JWT bearer token.
  - `403 Forbidden`: Authenticated user does not possess `official` or `admin` authority permissions (*Water Services Act 2021* & *Privacy Act 2020*).

### `PATCH /api/v1/incidents/{incident_id}`
Updates incident status and adds compliance officer notes.
- **Restricted to**: `official` or `admin`
- **Request Body**:
```json
{
  "status": "Sampling Dispatched",
  "officerNotes": "Watercare crew dispatched for sampling."
}
```

---

## 7. Authentication

### `POST /api/v1/auth/login`
- **Request Body**:
```json
{
  "email": "official@taumataarowai.govt.nz",
  "password": "OfficialWater#2026"
}
```
- **Response `200 OK`**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1Ni...",
  "token_type": "bearer",
  "user": {
    "id": "usr-official-01",
    "name": "David Te Whata",
    "email": "official@taumataarowai.govt.nz",
    "role": "official",
    "title": "Water Services Compliance Officer",
    "organization": "Taumata Arowai - Regulatory Operations"
  }
}
```
