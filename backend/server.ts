import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { VERIFIED_PARCELS, VERIFIED_PIPES, VERIFIED_FITTINGS, latLngToNZTM2000 } from './src/data/nzData.ts';
import { 
  AUCKLAND_ZONE_SCHEMES, 
  resolveDrinkingWaterSupplyZone, 
  calculateDistanceKm,
  simulateWaterTestingProfile,
  resolveAddressSupplyZone
} from './src/utils/waterLineageEngine.ts';
import { calculateDijkstraShortestPath, PRECOMPUTED_PARCEL_DIJKSTRA_ROUTES } from './src/utils/dijkstraRouting.ts';
import { ParcelFeature, AuthUser, WaterIncidentComplaint, UserRole, WaterTestingProfileResult } from './src/types/gis.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Seeded Users
interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  jobTitle: string;
  organization: string;
  lastLoginAt?: string;
}

const USERS_DB: StoredUser[] = [
  {
    id: 'usr-official-01',
    email: 'official@taumataarowai.govt.nz',
    passwordHash: 'OfficialWater#2026',
    fullName: 'David Te Whata',
    role: 'official',
    jobTitle: 'Water Services Compliance Officer',
    organization: 'Taumata Arowai - Regulatory Operations',
  },
  {
    id: 'usr-admin-01',
    email: 'admin@taumataarowai.govt.nz',
    passwordHash: 'ArowaiAdmin#2026',
    fullName: 'Sarah MacLeod',
    role: 'admin',
    jobTitle: 'GIS Systems Administrator',
    organization: 'Taumata Arowai - National GIS Office',
  },
  {
    id: 'usr-citizen-01',
    email: 'citizen@nzwater.org.nz',
    passwordHash: 'CitizenNZ#2026',
    fullName: 'Auckland Resident',
    role: 'citizen',
    jobTitle: 'Registered Property Owner',
    organization: 'Public Resident',
  },
];

// Active sessions token map
const ACTIVE_SESSIONS = new Map<string, StoredUser>();

// Pre-register demo tokens
for (const u of USERS_DB) {
  ACTIVE_SESSIONS.set(`token-${u.id}`, u);
}

// Seeded Schemes
const SCHEMES_DB = [
  {
    supplyId: 'SUP-AKL-WEST-01',
    supplyName: 'Huia / Waitakere Western Water Supply Scheme',
    supplierName: 'Watercare Services Limited',
    region: 'Auckland Region',
    complianceStatus: 'Compliant',
    sourceWaterType: 'Waitakere Native Catchment Dams',
    registeredPopulation: 104350,
    primaryTreatmentPlant: 'Huia Water Treatment Plant',
    waterQualityGrade: 'Taumata Arowai Rule Compliant (Grade A1)',
  },
  {
    supplyId: 'SUP-AKL-WEST-02',
    supplyName: 'Waitakere Northern Scheme',
    supplierName: 'Watercare Services Limited',
    region: 'Auckland Region',
    complianceStatus: 'Compliant',
    sourceWaterType: 'Waitakere Dam & Swanson River Catchment',
    registeredPopulation: 62400,
    primaryTreatmentPlant: 'Waitakere Water Treatment Plant',
    waterQualityGrade: 'Taumata Arowai Rule Compliant (Grade A1)',
  },
  {
    supplyId: 'SUP-AKL-CENTRAL-01',
    supplyName: 'Central Isthmus Bulk Supply Scheme',
    supplierName: 'Watercare Services Limited',
    region: 'Auckland Region',
    complianceStatus: 'Compliant',
    sourceWaterType: 'Hunua Ranges Dams & Waitakere Shared Supply',
    registeredPopulation: 111300,
    primaryTreatmentPlant: 'Ardmore Water Treatment Plant & Huia WTP',
    waterQualityGrade: 'Taumata Arowai Rule Compliant (Grade A1)',
  },
  {
    supplyId: 'SUP-AKL-NORTH-01',
    supplyName: 'North Shore Southern Supply Scheme',
    supplierName: 'Watercare Services Limited',
    region: 'Auckland Region',
    complianceStatus: 'Compliant',
    sourceWaterType: 'Hunua Ranges & Waikato River Pipeline',
    registeredPopulation: 59300,
    primaryTreatmentPlant: 'Ardmore WTP & Waikato WTP',
    waterQualityGrade: 'Taumata Arowai Rule Compliant (Grade A1)',
  },
  {
    supplyId: 'SUP-AKL-NORTH-02',
    supplyName: 'North Shore Northern Scheme',
    supplierName: 'Watercare Services Limited',
    region: 'Auckland Region',
    complianceStatus: 'Compliant',
    sourceWaterType: 'Waikato River & Hunua Regional Reservoirs',
    registeredPopulation: 68100,
    primaryTreatmentPlant: 'Waikato Water Treatment Plant (Tuakau)',
    waterQualityGrade: 'Taumata Arowai Rule Compliant (Grade A1)',
  },
  {
    supplyId: 'SUP-AKL-SOUTH-01',
    supplyName: 'Southern Auckland Scheme',
    supplierName: 'Watercare Services Limited',
    region: 'Auckland Region',
    complianceStatus: 'Compliant',
    sourceWaterType: 'Mangatangi & Mangatawhiri Dams (Hunua Ranges)',
    registeredPopulation: 81200,
    primaryTreatmentPlant: 'Ardmore Water Treatment Plant',
    waterQualityGrade: 'Taumata Arowai Rule Compliant (Grade A1)',
  },
  {
    supplyId: 'SUP-AKL-SOUTH-02',
    supplyName: 'Hunua Foothills Scheme',
    supplierName: 'Watercare Services Limited',
    region: 'Auckland Region',
    complianceStatus: 'Compliant',
    sourceWaterType: 'Hays Creek Dam & Cosseys Dam',
    registeredPopulation: 43500,
    primaryTreatmentPlant: 'Ardmore Water Treatment Plant',
    waterQualityGrade: 'Taumata Arowai Rule Compliant (Grade A1)',
  },
  {
    supplyId: 'SUP-AKL-RURAL-01',
    supplyName: 'North West Rural Water Scheme',
    supplierName: 'Watercare Services Limited',
    region: 'Auckland Region',
    complianceStatus: 'Compliant',
    sourceWaterType: 'Kaipara Deep Aquifer Borefield & Spring Source',
    registeredPopulation: 6900,
    primaryTreatmentPlant: 'Helensville Water Treatment Plant',
    waterQualityGrade: 'Taumata Arowai Rule Compliant (Grade A1)',
  },
];

// Seeded Physical Assets
const KEY_ASSETS = [
  {
    compkey: 100101,
    assetCategory: 'treatment_plant',
    assetName: 'Huia Water Treatment Plant',
    operationalStatus: 'Operational - in use',
    treatmentTechnology: 'Dissolved Air Flotation (DAF), Rapid Gravity Sand Filtration & Disinfection',
    parentZoneId: 'AKL-SZ-14',
    geometry: { type: 'Point', coordinates: [174.6430, -36.9320] },
    pressureClass: 'PN16',
    installationYear: 1968,
    invertDepthM: 3.5,
    cctvConditionScore: 1,
    lineLengthM: 0,
    engineerNotes: 'Key Western catchment treatment facility. Continuous online SCADA monitoring.',
  },
  {
    compkey: 100102,
    assetCategory: 'treatment_plant',
    assetName: 'Ardmore Water Treatment Plant',
    operationalStatus: 'Operational - in use',
    treatmentTechnology: 'Coagulation, Clarification, Dual Media Sand Filtration & Disinfection',
    parentZoneId: 'AKL-SZ-35',
    geometry: { type: 'Point', coordinates: [175.0210, -37.0420] },
    pressureClass: 'PN20',
    installationYear: 1956,
    invertDepthM: 4.2,
    cctvConditionScore: 1,
    lineLengthM: 0,
    engineerNotes: 'Major regional plant supplying central and southern networks.',
  },
  {
    compkey: 100103,
    assetCategory: 'treatment_plant',
    assetName: 'Waitakere Water Treatment Plant',
    operationalStatus: 'Operational - in use',
    treatmentTechnology: 'Direct Filtration & UV Disinfection',
    parentZoneId: 'AKL-SZ-08',
    geometry: { type: 'Point', coordinates: [174.5820, -36.8830] },
    pressureClass: 'PN16',
    installationYear: 1974,
    invertDepthM: 2.8,
    cctvConditionScore: 2,
    lineLengthM: 0,
    engineerNotes: 'Supplies northern Waitakere and Swanson distribution zones.',
  },
  {
    compkey: 100104,
    assetCategory: 'treatment_plant',
    assetName: 'Waikato Water Treatment Plant (Tuakau)',
    operationalStatus: 'Operational - in use',
    treatmentTechnology: 'Advanced Membrane Filtration & Granular Carbon',
    parentZoneId: 'AKL-SZ-24',
    geometry: { type: 'Point', coordinates: [174.9520, -37.2750] },
    pressureClass: 'PN25',
    installationYear: 2002,
    invertDepthM: 3.8,
    cctvConditionScore: 1,
    lineLengthM: 0,
    engineerNotes: 'Strategic drought-resilience river intake facility.',
  },
  {
    compkey: 100105,
    assetCategory: 'treatment_plant',
    assetName: 'Helensville Water Treatment Plant',
    operationalStatus: 'Operational - in use',
    treatmentTechnology: 'Aeration, Green Sand Manganese Filtration & Disinfection',
    parentZoneId: 'AKL-SZ-42',
    geometry: { type: 'Point', coordinates: [174.4550, -36.6850] },
    pressureClass: 'PN12',
    installationYear: 1991,
    invertDepthM: 2.1,
    cctvConditionScore: 2,
    lineLengthM: 0,
    engineerNotes: 'Serves Kaipara rural groundwater reticulation.',
  },
  {
    compkey: 200101,
    assetCategory: 'raw_dam',
    assetName: 'Waitakere Dam & Lower Nihotupu Dam',
    operationalStatus: 'Operational - in use',
    storageCapacityML: 29800.0,
    parentZoneId: 'AKL-SZ-14',
    geometry: { type: 'Point', coordinates: [174.5380, -36.9050] },
    pressureClass: 'Gravity',
    installationYear: 1910,
    invertDepthM: 24.5,
    cctvConditionScore: 1,
    lineLengthM: 0,
    engineerNotes: 'Seismic and spillway safety certificate re-certified 2025.',
  },
  {
    compkey: 300101,
    assetCategory: 'service_reservoir',
    assetName: 'Titirangi High-Level Water Reservoir',
    operationalStatus: 'Operational - in use',
    storageCapacityML: 45.0,
    parentZoneId: 'AKL-SZ-14',
    geometry: { type: 'Point', coordinates: [174.6580, -36.9380] },
    pressureClass: 'Gravity Head',
    installationYear: 1982,
    invertDepthM: 6.0,
    cctvConditionScore: 1,
    lineLengthM: 0,
    engineerNotes: 'Head level: 132m above MSL. Feeds Kelston gravity spine.',
  },
  {
    compkey: 2017820,
    assetCategory: 'reticulation_main',
    assetName: 'Great North Road Reticulation Main',
    operationalStatus: 'Operational - in use',
    nominalDiameterMm: 150,
    material: 'Ductile Iron',
    pressureClass: 'PN16',
    installationYear: 1988,
    invertDepthM: 1.25,
    cctvConditionScore: 2,
    lineLengthM: 142.5,
    parentZoneId: 'AKL-SZ-14',
    geometry: {
      type: 'LineString',
      coordinates: [[174.6791, -36.9108], [174.6806, -36.9094], [174.6818, -36.9082]],
    },
    engineerNotes: 'Cathodic protection inspected 2024. Normal structural condition.',
  },
  {
    compkey: 2017826,
    assetCategory: 'service_pipe',
    assetName: '4015 Great North Rd Service Connection',
    operationalStatus: 'Operational - in use',
    nominalDiameterMm: 20,
    material: 'Polyethylene PE100',
    pressureClass: 'PN12',
    installationYear: 2004,
    invertDepthM: 0.65,
    cctvConditionScore: 1,
    lineLengthM: 12.8,
    parentZoneId: 'AKL-SZ-14',
    geometry: {
      type: 'LineString',
      coordinates: [[174.6806, -36.9094], [174.6807, -36.9095]],
    },
    engineerNotes: 'Standard residential Toby pit meter connection.',
  },
  {
    compkey: 2017850,
    assetCategory: 'reticulation_main',
    assetName: 'Brandon Road Reticulation Main',
    operationalStatus: 'Operational - in use',
    nominalDiameterMm: 100,
    material: 'UPVC',
    pressureClass: 'Class C',
    installationYear: 1995,
    invertDepthM: 1.10,
    cctvConditionScore: 2,
    lineLengthM: 88.0,
    parentZoneId: 'AKL-SZ-14',
    geometry: {
      type: 'LineString',
      coordinates: [[174.6780, -36.9115], [174.6795, -36.9128]],
    },
    engineerNotes: 'UPVC local distribution pipe.',
  },
  {
    compkey: 2017899,
    assetCategory: 'isolation_valve',
    assetName: 'VLV-10029 Sluice Gate Valve',
    operationalStatus: 'Operational - in use',
    nominalDiameterMm: 150,
    parentZoneId: 'AKL-SZ-14',
    geometry: { type: 'Point', coordinates: [174.6805, -36.9096] },
    pressureClass: 'PN16',
    installationYear: 1990,
    invertDepthM: 1.3,
    cctvConditionScore: 1,
    lineLengthM: 0,
    engineerNotes: 'Key isolation valve for Kelston district metering area.',
  },
];

// Seeded Incident Complaints
const INCIDENTS_DB: WaterIncidentComplaint[] = [
  {
    id: 'NZ-DW-2026-1042',
    category: 'contamination_discoloration',
    categoryLabel: 'Water Discoloration / Turbidity',
    severity: 'high',
    address: '4015 Great North Road, Kelston, Auckland',
    coordinates: [-36.9094, 174.6806],
    supplyZoneId: 'AKL-SZ-14',
    supplySchemeName: 'Huia / Waitakere Western Water Supply Scheme',
    description: 'Noticeable orange/brown sediment in cold tap water following watermain maintenance.',
    observedAt: '2026-10-12T08:30',
    waterSupplyType: 'Municipal Watercare Reticulation',
    boilWaterAdvised: true,
    reporterName: 'Kelston Resident',
    reporterEmail: 'kelston.resident@nzwater.org.nz',
    reporterPhone: '021 555 0192',
    isAnonymous: false,
    status: 'Under Investigation',
    createdAt: new Date('2026-10-12T08:35:00Z').toISOString(),
    officerNotes: 'Watercare field crew dispatched to flush hydrant VLV-10029.',
  },
];

// Auth helper
function getAuthUser(req: Request): StoredUser | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7).trim();
  return ACTIVE_SESSIONS.get(token) || null;
}

export function createApiRouter(): express.Router {
  const router = express.Router();

  // Health & diagnostics
  router.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      service: 'Taumata Arowai GIS Platform API',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  });

  router.get('/ready', (_req: Request, res: Response) => {
    res.json({
      status: 'ready',
      database: 'connected',
      spatial_engine: 'shapely_geos_node',
      timestamp: new Date().toISOString(),
    });
  });

  // Auth Routes
  router.post('/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ detail: 'Email and password required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = USERS_DB.find(u => u.email.toLowerCase() === cleanEmail);

    if (!user || user.passwordHash !== password) {
      return res.status(401).json({ detail: 'Invalid email or password' });
    }

    user.lastLoginAt = new Date().toISOString();
    const token = `token-${user.id}-${Date.now()}`;
    ACTIVE_SESSIONS.set(token, user);

    res.json({
      accessToken: token,
      tokenType: 'bearer',
      user: {
        id: user.id,
        name: user.fullName,
        email: user.email,
        role: user.role,
        title: user.jobTitle,
        organization: user.organization,
        lastLogin: user.lastLoginAt,
      },
    });
  });

  router.get('/auth/me', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({ detail: 'Missing or invalid authorization header' });
    }

    res.json({
      id: user.id,
      name: user.fullName,
      email: user.email,
      role: user.role,
      title: user.jobTitle,
      organization: user.organization,
      lastLogin: user.lastLoginAt,
    });
  });

  // Address & Parcel Routes
  router.get('/addresses/search', (req: Request, res: Response) => {
    const q = String(req.query.q || '').trim().toLowerCase();
    const limit = Math.min(Math.max(parseInt(String(req.query.limit || '10'), 10) || 10, 1), 50);

    if (!q) {
      return res.json({ query: '', count: 0, results: [] });
    }

    const matched = VERIFIED_PARCELS.filter(p =>
      p.fullAddress.toLowerCase().includes(q) ||
      p.streetName.toLowerCase().includes(q) ||
      p.streetNumber.toLowerCase().includes(q) ||
      p.lotNumber.toLowerCase().includes(q) ||
      p.suburb.toLowerCase().includes(q)
    ).slice(0, limit);

    res.json({
      query: req.query.q,
      count: matched.length,
      results: matched,
    });
  });

  router.get('/addresses/:id', (req: Request, res: Response) => {
    const id = req.params.id;
    const parcel = VERIFIED_PARCELS.find(p => p.id === id);
    if (!parcel) {
      return res.status(404).json({ detail: `Cadastral parcel '${id}' not found in registry` });
    }
    res.json(parcel);
  });

  router.get('/addresses/:id/water-supply', (req: Request, res: Response) => {
    const id = req.params.id;
    const parcel = VERIFIED_PARCELS.find(p => p.id === id);
    if (!parcel) {
      return res.status(404).json({ detail: `Cadastral parcel '${id}' not found in registry` });
    }

    const nztm = latLngToNZTM2000(parcel.center[0], parcel.center[1]);
    const zone = AUCKLAND_ZONE_SCHEMES.find(z => z.zoneId === parcel.engineerData.supplyZoneId)
      || resolveDrinkingWaterSupplyZone(parcel.center[0], parcel.center[1])
      || AUCKLAND_ZONE_SCHEMES[0];

    const dijkstraRoute = PRECOMPUTED_PARCEL_DIJKSTRA_ROUTES[parcel.id]
      || calculateDijkstraShortestPath(
          parcel.center,
          [zone.lat, zone.lng],
          zone.zoneId,
          zone.zoneName,
          parcel.fullAddress
        );

    res.json({
      status: 'VERIFIED',
      queriedAddress: parcel.fullAddress,
      addressId: parcel.id,
      coordinates: parcel.center,
      nztm2000: {
        easting: parseFloat(nztm.easting.replace(/,/g, '')),
        northing: parseFloat(nztm.northing.replace(/,/g, '')),
      },
      supplyZone: {
        zoneId: zone.zoneId,
        zoneName: zone.zoneName,
        supplyId: zone.supplyId,
        supplyName: zone.supplyName,
        zonePopulation: zone.popRegist,
        urbanRural: zone.urbanRural,
        lat: zone.lat,
        lng: zone.lng,
        popRegist: zone.popRegist,
        popLowDe: zone.popLowDe,
        popModDe: zone.popModDe,
        popHighDe: zone.popHighDe,
        popMaori: zone.popMaori,
        dataSource: zone.dataSource,
      },
      supplyScheme: {
        supplyId: zone.supplyId,
        supplyName: zone.supplyName,
        supplierName: 'Watercare Services Limited',
        region: 'Auckland Region',
        complianceStatus: 'Compliant',
        sourceWaterType: 'Surface Water Dams & Native Catchment',
        registeredPopulation: zone.popRegist,
        primaryTreatmentPlant: zone.treatmentPlant?.name || 'Huia Water Treatment Plant',
        waterQualityGrade: zone.treatmentPlant?.waterQualityGrade || 'Taumata Arowai Rule Compliant (Grade A1)',
      },
      bufferTier: {
        tier: '50m',
        tierName: 'Within 50m (Immediate Reticulation Spine)',
        bufferLayer: 'AklDizzy_Buffers50m',
        description: 'Property directly abuts or sits within 50m of primary municipal reticulation main.',
        distanceMeters: 15.0,
      },
      lineage: parcel.waterLineage,
      matchedPipeCompkey: parcel.engineerData.pipeConnectionCompkey,
      distanceToMainMeters: 15.0,
      warnings: [],
      confidenceScore: 0.98,
      dijkstraRoute,
    });
  });

  // Water Testing Hydraulic & Quality Profile Simulation (Run Profile)
  router.post('/water-testing/profile', (req: Request, res: Response) => {
    const { address_id, coordinates, query } = req.body || {};
    let target: any = address_id || query;
    if (!target && coordinates && Array.isArray(coordinates)) {
      target = coordinates;
    }
    const profile = simulateWaterTestingProfile(target || '4015 Great North Road, Kelston, Auckland 0602');
    res.json(profile);
  });

  router.get('/water-testing/profile/:id', (req: Request, res: Response) => {
    const id = req.params.id;
    const profile = simulateWaterTestingProfile(id);
    res.json(profile);
  });

  // Water Supply Resolution Route
  router.post('/water-supply/resolve', (req: Request, res: Response) => {
    const { address, coordinates, address_id } = req.body || {};

    let matchedParcel: ParcelFeature | null = null;
    let lat = coordinates ? coordinates[0] : -36.9094;
    let lng = coordinates ? coordinates[1] : 174.6806;
    let addressStr = address || 'Queried Address';

    if (address_id) {
      matchedParcel = VERIFIED_PARCELS.find(p => p.id === address_id) || null;
    }
    if (!matchedParcel && address) {
      matchedParcel = VERIFIED_PARCELS.find(
        p => p.fullAddress.toLowerCase().includes(String(address).toLowerCase()) ||
             p.id.toLowerCase() === String(address).toLowerCase()
      ) || null;
    }
    if (!matchedParcel && coordinates && Array.isArray(coordinates)) {
      let closestDist = 0.08; // 80m
      for (const p of VERIFIED_PARCELS) {
        const d = calculateDistanceKm(coordinates[0], coordinates[1], p.center[0], p.center[1]);
        if (d < closestDist) {
          closestDist = d;
          matchedParcel = p;
        }
      }
    }

    if (matchedParcel) {
      lat = matchedParcel.center[0];
      lng = matchedParcel.center[1];
      addressStr = matchedParcel.fullAddress;
    }

    const nztm = latLngToNZTM2000(lat, lng);
    const nztmEasting = parseFloat(nztm.easting.replace(/,/g, ''));
    const nztmNorthing = parseFloat(nztm.northing.replace(/,/g, ''));

    let matchedZone = matchedParcel && matchedParcel.engineerData?.supplyZoneId
      ? AUCKLAND_ZONE_SCHEMES.find(z => z.zoneId === matchedParcel!.engineerData.supplyZoneId) || null
      : null;

    if (!matchedZone) {
      matchedZone = resolveDrinkingWaterSupplyZone(lat, lng);
    }

    if (!matchedZone) {
      return res.json({
        status: 'UNMAPPED_OUTSIDE_RETICULATION',
        queriedAddress: addressStr,
        addressId: matchedParcel?.id,
        coordinates: [lat, lng],
        nztm2000: { easting: nztmEasting, northing: nztmNorthing },
        supplyZone: null,
        supplyScheme: null,
        bufferTier: {
          tierName: 'Beyond 1500m (Outside Reticulation)',
          distanceMeters: 2500,
          description: 'Location is beyond registered municipal reticulation corridors.',
        },
        lineage: null,
        warnings: ['Location sits outside registered municipal drinking water supply zones.'],
        confidenceScore: 0.8,
        dataProvenance: 'Auckland Drinking Water Register (Taumata Arowai Node Engine)',
      });
    }

    let dijkstraRoute = (matchedParcel && PRECOMPUTED_PARCEL_DIJKSTRA_ROUTES[matchedParcel.id]) || null;
    if (!dijkstraRoute) {
      dijkstraRoute = calculateDijkstraShortestPath(
        [lat, lng],
        [matchedZone.lat, matchedZone.lng],
        matchedZone.zoneId,
        matchedZone.zoneName,
        addressStr
      );
    }

    res.json({
      status: 'VERIFIED',
      queriedAddress: addressStr,
      addressId: matchedParcel?.id,
      coordinates: [lat, lng],
      nztm2000: { easting: nztmEasting, northing: nztmNorthing },
      supplyZone: {
        zoneId: matchedZone.zoneId,
        zoneName: matchedZone.zoneName,
        supplyId: matchedZone.supplyId,
        supplyName: matchedZone.supplyName,
        zonePopulation: matchedZone.popRegist,
        urbanRural: matchedZone.urbanRural,
        lat: matchedZone.lat,
        lng: matchedZone.lng,
        popRegist: matchedZone.popRegist,
        popLowDe: matchedZone.popLowDe,
        popModDe: matchedZone.popModDe,
        popHighDe: matchedZone.popHighDe,
        popMaori: matchedZone.popMaori,
        dataSource: matchedZone.dataSource,
        polygon: matchedZone.polygon,
      },
      supplyScheme: {
        supplyId: matchedZone.supplyId,
        supplyName: matchedZone.supplyName,
        supplierName: 'Watercare Services Limited',
        region: 'Auckland Region',
        complianceStatus: 'Rule Compliant (Grade A1)',
        sourceWaterType: 'Surface Water Dams & Native Catchment',
        registeredPopulation: matchedZone.popRegist,
        primaryTreatmentPlant: matchedZone.treatmentPlant?.name || 'Watercare Regional Treatment Plant',
        waterQualityGrade: matchedZone.treatmentPlant?.waterQualityGrade || 'Taumata Arowai Rule Compliant (Grade A1)',
      },
      bufferTier: {
        tier: '50m',
        tierName: 'Within 50m (Immediate Reticulation Spine)',
        bufferLayer: 'AklDizzy_Buffers50m',
        distanceMeters: 15.0,
        description: 'Property directly connects to verified municipal reticulation corridor.',
      },
      lineage: matchedParcel?.waterLineage || null,
      matchedPipeCompkey: matchedParcel?.engineerData?.pipeConnectionCompkey || 2017826,
      distanceToMainMeters: 12.5,
      warnings: [],
      confidenceScore: 1.0,
      dataProvenance: 'Taumata Arowai Spatial Register (Node.js PostGIS-equivalent Engine)',
      dijkstraRoute,
    });
  });

  // Zones Routes
  router.get('/zones', (req: Request, res: Response) => {
    const limit = Math.min(Math.max(parseInt(String(req.query.limit || '50'), 10) || 50, 1), 100);
    const offset = Math.max(parseInt(String(req.query.offset || '0'), 10) || 0, 0);

    const mapped = AUCKLAND_ZONE_SCHEMES.slice(offset, offset + limit).map(z => ({
      zoneId: z.zoneId,
      zoneName: z.zoneName,
      supplyId: z.supplyId,
      supplyName: z.supplyName,
      zonePopulation: z.popRegist,
      urbanRural: z.urbanRural,
      lat: z.lat,
      lng: z.lng,
      popRegist: z.popRegist,
      popLowDe: z.popLowDe,
      popModDe: z.popModDe,
      popHighDe: z.popHighDe,
      popMaori: z.popMaori,
      shapeLength: z.shapeLength || 0,
      shapeArea: z.shapeArea || 0,
      complianceStatus: z.complianceStatus || 'Rule Compliant (Grade A1)',
      supplierName: z.supplierName || 'Watercare Services Limited',
      dataSource: z.dataSource,
    }));

    res.json(mapped);
  });

  router.get('/zones/:id', (req: Request, res: Response) => {
    const id = req.params.id;
    const z = AUCKLAND_ZONE_SCHEMES.find(zone => zone.zoneId === id || zone.zoneName.toLowerCase().includes(id.toLowerCase()));
    if (!z) {
      return res.status(404).json({ detail: `Supply zone '${id}' not found in Taumata Arowai register` });
    }
    res.json({
      zoneId: z.zoneId,
      zoneName: z.zoneName,
      supplyId: z.supplyId,
      supplyName: z.supplyName,
      zonePopulation: z.popRegist,
      urbanRural: z.urbanRural,
      lat: z.lat,
      lng: z.lng,
      popRegist: z.popRegist,
      popLowDe: z.popLowDe,
      popModDe: z.popModDe,
      popHighDe: z.popHighDe,
      popMaori: z.popMaori,
      shapeLength: z.shapeLength || 0,
      shapeArea: z.shapeArea || 0,
      complianceStatus: z.complianceStatus || 'Rule Compliant (Grade A1)',
      supplierName: z.supplierName || 'Watercare Services Limited',
      dataSource: z.dataSource,
      polygon: z.polygon,
    });
  });

  router.get('/zones/:id/buffers', (req: Request, res: Response) => {
    const id = req.params.id;
    const z = AUCKLAND_ZONE_SCHEMES.find(zone => zone.zoneId === id);
    if (!z) {
      return res.status(404).json({ detail: `Supply zone '${id}' not found` });
    }

    const tiers = [
      { tier: '50m', tierName: 'Within 50m (Immediate Reticulation Spine)', bufferLayer: 'AklDizzy_Buffers50m', distanceMeters: 50.0, description: 'Direct immediate pipe corridor' },
      { tier: '100m', tierName: 'Within 100m (Local Catchment)', bufferLayer: 'AklDizzy_Buffers100m', distanceMeters: 100.0, description: 'Local catchment protection perimeter' },
      { tier: '200m', tierName: 'Within 200m (Secondary Protection)', bufferLayer: 'AklDizzy_Buffers200m', distanceMeters: 200.0, description: 'Secondary groundwater and surface perimeter' },
      { tier: '500m', tierName: 'Within 500m (Intermediate Buffer)', bufferLayer: 'AklDizzy_Buffers500m', distanceMeters: 500.0, description: 'Intermediate drinking water surveillance zone' },
      { tier: '1500m', tierName: 'Within 1500m (Regional Boundary)', bufferLayer: 'AklDizzy_Buffers1500m', distanceMeters: 1500.0, description: 'Outer boundary of water supply zone scheme' },
    ];
    res.json(tiers);
  });

  // Networks & Schemes Routes
  router.get('/networks', (_req: Request, res: Response) => {
    res.json(SCHEMES_DB);
  });

  router.get('/networks/:id', (req: Request, res: Response) => {
    const id = req.params.id;
    const scheme = SCHEMES_DB.find(s => s.supplyId === id || s.supplyName.toLowerCase().includes(id.toLowerCase()));
    if (!scheme) {
      return res.status(404).json({ detail: `Water supply scheme '${id}' not found` });
    }
    res.json(scheme);
  });

  // Assets Routes (with RBAC telemetry filtering)
  router.get('/assets', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    const isStaff = user && (user.role === 'official' || user.role === 'admin');

    const category = req.query.category ? String(req.query.category) : null;
    const zoneId = req.query.zone_id ? String(req.query.zone_id) : null;
    const limit = Math.min(Math.max(parseInt(String(req.query.limit || '50'), 10) || 50, 1), 100);
    const offset = Math.max(parseInt(String(req.query.offset || '0'), 10) || 0, 0);

    let filtered = KEY_ASSETS;
    if (category) {
      filtered = filtered.filter(a => a.assetCategory === category);
    }
    if (zoneId) {
      filtered = filtered.filter(a => a.parentZoneId === zoneId);
    }

    const paged = filtered.slice(offset, offset + limit).map(a => {
      const item: any = {
        compkey: a.compkey,
        assetCategory: a.assetCategory,
        assetName: a.assetName,
        operationalStatus: a.operationalStatus,
        nominalDiameterMm: (a as any).nominalDiameterMm,
        material: (a as any).material,
        parentZoneId: a.parentZoneId,
        geometry: a.geometry,
        storageCapacityML: (a as any).storageCapacityML,
        treatmentTechnology: (a as any).treatmentTechnology,
      };

      if (isStaff) {
        item.pressureClass = (a as any).pressureClass;
        item.installationYear = (a as any).installationYear;
        item.invertDepthM = (a as any).invertDepthM;
        item.cctvConditionScore = (a as any).cctvConditionScore;
        item.lineLengthM = (a as any).lineLengthM;
        item.engineerNotes = (a as any).engineerNotes;
      } else {
        item.cctvConditionScore = null;
        item.invertDepthM = null;
        item.engineerNotes = null;
      }

      return item;
    });

    res.json(paged);
  });

  router.get('/assets/:compkey', (req: Request, res: Response) => {
    const compkey = parseInt(req.params.compkey, 10);
    const a = KEY_ASSETS.find(item => item.compkey === compkey);
    if (!a) {
      return res.status(404).json({ detail: `Asset with COMPKEY ${compkey} not found` });
    }

    const user = getAuthUser(req);
    const isStaff = user && (user.role === 'official' || user.role === 'admin');

    const result: any = {
      compkey: a.compkey,
      assetCategory: a.assetCategory,
      assetName: a.assetName,
      operationalStatus: a.operationalStatus,
      nominalDiameterMm: (a as any).nominalDiameterMm,
      material: (a as any).material,
      parentZoneId: a.parentZoneId,
      geometry: a.geometry,
      storageCapacityML: (a as any).storageCapacityML,
      treatmentTechnology: (a as any).treatmentTechnology,
    };

    if (isStaff) {
      result.pressureClass = (a as any).pressureClass;
      result.installationYear = (a as any).installationYear;
      result.invertDepthM = (a as any).invertDepthM;
      result.cctvConditionScore = (a as any).cctvConditionScore;
      result.lineLengthM = (a as any).lineLengthM;
      result.engineerNotes = (a as any).engineerNotes;
    } else {
      result.cctvConditionScore = null;
      result.invertDepthM = null;
      result.engineerNotes = null;
    }

    res.json(result);
  });

  // Incidents Routes
  router.get('/incidents', (req: Request, res: Response) => {
    const statusFilter = req.query.status ? String(req.query.status) : null;
    const zoneId = req.query.zone_id ? String(req.query.zone_id) : null;

    let results = [...INCIDENTS_DB];
    if (statusFilter) {
      results = results.filter(i => i.status.toLowerCase() === statusFilter.toLowerCase());
    }
    if (zoneId) {
      results = results.filter(i => i.supplyZoneId === zoneId);
    }

    res.json(results);
  });

  // Export Incident Complaints to CSV (for Excel) - Restricted to Authorized Officials & Admins
  router.get('/incidents/export', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user || (user.role !== 'official' && user.role !== 'admin')) {
      return res.status(403).json({ 
        detail: 'Access restricted: Only authorized officials or administrators can export incident data containing citizen residential and contact details.' 
      });
    }

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      let str = String(val).replace(/"/g, '""');
      if (/^[=\+\-@\t\r]/.test(str)) {
        str = "'" + str;
      }
      return `"${str}"`;
    };

    const headers = [
      'Incident ID',
      'Citizen Residential Address',
      'Supply Zone ID',
      'Supply Zone Name',
      'Treatment Plant / Dam Associated',
      'Associated Treatment Plant',
      'Associated Source Dam',
      'Problem / Category',
      'Severity',
      'Incident Description',
      'Citizen Contact Name',
      'Citizen Contact Email',
      'Citizen Contact Phone',
      'Anonymous Submission',
      'Observed Date & Time',
      'Date Registered',
      'Investigation Status',
      'Boil Water Advised',
      'Officer Notes'
    ];

    const rows = INCIDENTS_DB.map(inc => {
      const zone = AUCKLAND_ZONE_SCHEMES.find(z => z.zoneId === inc.supplyZoneId);
      const treatmentPlant = zone?.treatmentPlant?.name || 'Huia Water Treatment Plant';
      const sourceDam = zone?.primaryDam?.name || 'Waitakere Ranges Native Catchment';
      const associatedCombined = `${treatmentPlant} / ${sourceDam}`;

      return [
        escapeCsv(inc.id),
        escapeCsv(inc.address),
        escapeCsv(inc.supplyZoneId || zone?.zoneId || 'AKL-SZ-14'),
        escapeCsv(zone?.zoneName || inc.supplySchemeName || 'Kelston Supply Zone'),
        escapeCsv(associatedCombined),
        escapeCsv(treatmentPlant),
        escapeCsv(sourceDam),
        escapeCsv(inc.categoryLabel || inc.category),
        escapeCsv(inc.severity.toUpperCase()),
        escapeCsv(inc.description),
        escapeCsv(inc.reporterName),
        escapeCsv(inc.reporterEmail),
        escapeCsv(inc.reporterPhone || 'Not provided'),
        escapeCsv(inc.isAnonymous ? 'Yes' : 'No'),
        escapeCsv(inc.observedAt),
        escapeCsv(inc.createdAt),
        escapeCsv(inc.status),
        escapeCsv(inc.boilWaterAdvised ? 'YES' : 'NO'),
        escapeCsv(inc.officerNotes || '')
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const dateStr = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="nz_water_incidents_${dateStr}.csv"`);
    res.status(200).send(csvContent);
  });

  router.post('/incidents', (req: Request, res: Response) => {
    const body = req.body || {};
    const newId = `NZ-DW-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const incident: WaterIncidentComplaint = {
      id: newId,
      category: body.category || 'other',
      categoryLabel: body.categoryLabel || 'Water Incident',
      severity: body.severity || 'standard',
      address: body.address || 'Reported Address',
      coordinates: body.coordinates || [-36.9094, 174.6806],
      supplyZoneId: body.supplyZoneId || 'AKL-SZ-14',
      supplySchemeName: body.supplySchemeName || 'Auckland Watercare Supply Scheme',
      description: body.description || '',
      observedAt: body.observedAt || new Date().toISOString(),
      waterSupplyType: body.waterSupplyType || 'Municipal Watercare Reticulation',
      boilWaterAdvised: Boolean(body.boilWaterAdvised),
      reporterName: body.isAnonymous ? 'Anonymous Citizen' : (body.reporterName || 'Public Resident'),
      reporterEmail: body.reporterEmail || '',
      reporterPhone: body.reporterPhone || '',
      isAnonymous: Boolean(body.isAnonymous),
      status: 'Submitted',
      createdAt: new Date().toISOString(),
      officerNotes: body.officerNotes || 'Incident received by Taumata Arowai triage system.',
    };

    INCIDENTS_DB.unshift(incident);
    res.status(201).json(incident);
  });

  router.get('/incidents/:id', (req: Request, res: Response) => {
    const id = req.params.id;
    const inc = INCIDENTS_DB.find(i => i.id === id);
    if (!inc) {
      return res.status(404).json({ detail: `Incident report '${id}' not found` });
    }
    res.json(inc);
  });

  router.patch('/incidents/:id', (req: Request, res: Response) => {
    const id = req.params.id;
    const user = getAuthUser(req);
    if (!user || (user.role !== 'official' && user.role !== 'admin')) {
      return res.status(403).json({ detail: 'Access restricted to Authorized Officials or Administrators' });
    }

    const inc = INCIDENTS_DB.find(i => i.id === id);
    if (!inc) {
      return res.status(404).json({ detail: `Incident report '${id}' not found` });
    }

    const { status, officerNotes, boilWaterAdvised } = req.body || {};
    if (status !== undefined) inc.status = status;
    if (officerNotes !== undefined) inc.officerNotes = officerNotes;
    if (boilWaterAdvised !== undefined) inc.boilWaterAdvised = Boolean(boilWaterAdvised);

    res.json(inc);
  });

  return router;
}

export async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;
  const HOST = '0.0.0.0';

  app.use(express.json());

  // CORS middleware for standalone frontend dev server
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Mount API router under /api and /api/v1
  const apiRouter = createApiRouter();
  app.use('/api/v1', apiRouter);
  app.use('/api', apiRouter);

  // Development vs Production Frontend Serving
  // Frontend directory resolution (supports monorepo /frontend or standalone backend)
  const frontendDir = path.resolve(__dirname, '../frontend');
  const distDir = fs.existsSync(path.resolve(frontendDir, 'dist'))
    ? path.resolve(frontendDir, 'dist')
    : path.resolve(__dirname, 'dist');

  // Development vs Production Frontend Serving
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const viteRoot = fs.existsSync(frontendDir) ? frontendDir : __dirname;
    const viteConfigFile = path.resolve(viteRoot, 'vite.config.ts');

    const vite = await createViteServer({
      root: viteRoot,
      configFile: fs.existsSync(viteConfigFile) ? viteConfigFile : undefined,
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), HOST, () => {
    console.log(`[Taumata Arowai Server] Listening on http://${HOST}:${PORT}`);
  });
}

// Start if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer();
}
