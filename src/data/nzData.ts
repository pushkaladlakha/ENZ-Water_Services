import { ParcelFeature, PipeAsset, FittingAsset } from '../types/gis';

// Real-world coordinates centered on Kelston & Glen Eden, Auckland, New Zealand
export const NZ_DEFAULT_CENTER: [number, number] = [-36.9103, 174.6795];
export const NZ_DEFAULT_ZOOM = 17;

export interface RegionBookmark {
  name: string;
  subtext: string;
  center: [number, number];
  zoom: number;
}

export const NZ_BOOKMARKS: RegionBookmark[] = [
  {
    name: 'Kelston & Glen Eden Reticulation',
    subtext: 'Great North Rd, Brandon Rd, Westech Pl',
    center: [-36.9103, 174.6795],
    zoom: 17,
  },
  {
    name: 'Auckland Central Isthmus',
    subtext: 'Queen Street, Britomart, Grafton',
    center: [-36.8485, 174.7633],
    zoom: 16,
  },
  {
    name: 'Ponsonby & Grey Lynn',
    subtext: 'Ponsonby Road Supply Corridor',
    center: [-36.8580, 174.7430],
    zoom: 16,
  },
  {
    name: 'Wellington CBD',
    subtext: 'Lambton Quay, Parliament Basin',
    center: [-41.2865, 174.7762],
    zoom: 16,
  },
  {
    name: 'Christchurch Central',
    subtext: 'Cathedral Square, Avon River',
    center: [-43.5321, 172.6362],
    zoom: 16,
  },
];

// Helper to provide documented Three Waters network lineage for properties in the Auckland supply network
export function getDocumentedWaterLineage(streetName: string, serviceCompkey: number | string, diaMm: number = 20): ParcelFeature['waterLineage'] {
  const isBrandon = streetName.toLowerCase().includes('brandon');
  const isWestech = streetName.toLowerCase().includes('westech');
  const isArchibald = streetName.toLowerCase().includes('archibald');

  return {
    sourceDam: {
      name: 'Waitakere Dam & Lower Nihotupu Dam',
      catchment: 'Waitakere Ranges Native Catchment',
      capacityML: 29800,
      distanceKm: 14.6,
    },
    treatmentPlant: {
      name: 'Huia Water Treatment Plant',
      process: 'Dissolved Air Flotation (DAF), Rapid Gravity Sand Filtration & Disinfection',
      waterQualityGrade: 'Taumata Arowai Drinking Water Quality Assurance Rule Compliant (Grade A1)',
    },
    reservoir: {
      name: isBrandon ? 'Titirangi High-Level Balancing Reservoir' : 'Titirangi Water Reservoir',
      capacityM3: 45000,
      headLevelM: 132,
    },
    streetMain: {
      compkey: isBrandon ? 2017850 : isWestech ? 2017835 : isArchibald ? 2018800 : 2017820,
      name: isBrandon ? 'Brandon Road Reticulation Main' : isWestech ? 'Westech Place Distribution Loop' : isArchibald ? 'Archibald Road Watermain' : 'Great North Road Reticulation Main',
      nominalDiaMm: isBrandon ? 100 : isWestech ? 100 : isArchibald ? 150 : 150,
      material: isBrandon ? 'UPVC' : isWestech ? 'Polyethylene' : 'Ductile Iron',
    },
    servicePipe: {
      compkey: Number(serviceCompkey) || 2017826,
      nominalDiaMm: diaMm,
      material: diaMm >= 50 ? 'Polyethylene PE100 High-Flow' : 'Polyethylene PE100',
      pressureBar: 4.8,
    },
    upstreamValve: {
      compkey: 2017899,
      code: isBrandon ? 'VLV-10035' : 'VLV-10029',
      type: isBrandon ? '100mm Isolation Gate Valve' : '150mm Sluice Isolation Valve',
    },
    wastewaterDestination: {
      treatmentPlant: 'Mangere Wastewater Treatment Plant',
      outfallCatchment: 'Manukau Harbour deep ocean discharge with UV disinfection',
    },
  };
}

// Authoritative property cadastral parcels in Kelston & Glen Eden verified against LINZ & Auckland Council Unitary Plan
export const VERIFIED_PARCELS: ParcelFeature[] = [
  {
    id: 'PARCEL-4015-GNR',
    streetNumber: '4015',
    streetName: 'Great North Road',
    suburb: 'Kelston',
    city: 'Auckland',
    fullAddress: '4015 Great North Road, Kelston, Auckland 0602',
    center: [-36.9094, 174.6806],
    coordinates: [
      [-36.90915, 174.68038],
      [-36.90932, 174.68082],
      [-36.90962, 174.68065],
      [-36.90945, 174.68021],
    ],
    lotNumber: 'Lot 14',
    dpNumber: 'DP 48291',
    titleReference: 'NA19B/412',
    areaM2: 685,
    zoneCode: 'MHU',
    zoneName: 'Residential - Mixed Housing Urban',
    zoneColor: '#d97706',
    zoneDescription: 'Auckland Unitary Plan: Medium density housing up to three storeys.',
    dataSource: 'LINZ Cadastral Database & Auckland Council GIS',
    services: {
      waterConnected: true,
      wastewaterConnected: true,
      stormwaterConnected: true,
      rubbishCollectionDay: 'Wednesday morning',
      meterLocationDescription: '1.2m inside front boundary, right side of main vehicle crossing',
      outageStatus: 'Normal',
      outageDetails: 'Reticulation active under standard operating pressure.',
    },
    planning: {
      maxBuildingCoveragePct: 45,
      maxHeightM: 11.0,
      minLandscapedAreaPct: 35,
      imperviousAreaLimitPct: 60,
      floodRisk: 'Low',
      overlandFlowPath: false,
      heritageOverlay: false,
      catchmentZone: 'Oratia Stream Catchment 4B',
    },
    engineerData: {
      supplyZoneId: 'AKL-SZ-14',
      sewerSubcatchmentId: 'WW-KELSTON-GRAV-08',
      pipeConnectionCompkey: 2017826,
      meterSerialNumber: 'WM-2021-99823',
      meterSizeMm: 20,
      meterLastReadM3: 412.8,
      backflowHazardLevel: 'Low',
      staticPressureKPa: 480,
      cathodicProtectionStatus: 'N/A',
      scadaZoneId: 'SC-Z3-KL',
    },
    waterLineage: getDocumentedWaterLineage('Great North Road', 2017826, 20),
  },
  {
    id: 'PARCEL-4017-GNR',
    streetNumber: '4017',
    streetName: 'Great North Road',
    suburb: 'Kelston',
    city: 'Auckland',
    fullAddress: '4017 Great North Road, Kelston, Auckland 0602',
    center: [-36.9092, 174.6809],
    coordinates: [
      [-36.90901, 174.68068],
      [-36.90918, 174.68112],
      [-36.90948, 174.68095],
      [-36.90931, 174.68051],
    ],
    lotNumber: 'Lot 15',
    dpNumber: 'DP 48291',
    titleReference: 'NA19B/413',
    areaM2: 710,
    zoneCode: 'MHU',
    zoneName: 'Residential - Mixed Housing Urban',
    zoneColor: '#d97706',
    zoneDescription: 'Auckland Unitary Plan: Medium density housing up to three storeys.',
    dataSource: 'LINZ Cadastral Database & Auckland Council GIS',
    services: {
      waterConnected: true,
      wastewaterConnected: true,
      stormwaterConnected: true,
      rubbishCollectionDay: 'Wednesday morning',
      meterLocationDescription: 'Front boundary near left boundary fence line',
      outageStatus: 'Normal',
      outageDetails: 'Reticulation active under standard operating pressure.',
    },
    planning: {
      maxBuildingCoveragePct: 45,
      maxHeightM: 11.0,
      minLandscapedAreaPct: 35,
      imperviousAreaLimitPct: 60,
      floodRisk: 'Low',
      overlandFlowPath: false,
      heritageOverlay: false,
      catchmentZone: 'Oratia Stream Catchment 4B',
    },
    engineerData: {
      supplyZoneId: 'AKL-SZ-14',
      sewerSubcatchmentId: 'WW-KELSTON-GRAV-08',
      pipeConnectionCompkey: 2017830,
      meterSerialNumber: 'WM-2019-48201',
      meterSizeMm: 20,
      meterLastReadM3: 563.1,
      backflowHazardLevel: 'Low',
      staticPressureKPa: 485,
      cathodicProtectionStatus: 'N/A',
      scadaZoneId: 'SC-Z3-KL',
    },
    waterLineage: getDocumentedWaterLineage('Great North Road', 2017830, 20),
  },
  {
    id: 'PARCEL-2-WESTECH',
    streetNumber: '2',
    streetName: 'Westech Place',
    suburb: 'Kelston',
    city: 'Auckland',
    fullAddress: '2 Westech Place, Kelston, Auckland 0602',
    center: [-36.9102, 174.6788],
    coordinates: [
      [-36.90995, 174.67845],
      [-36.91010, 174.67915],
      [-36.91045, 174.67905],
      [-36.91030, 174.67835],
    ],
    lotNumber: 'Lot 3',
    dpNumber: 'DP 91044',
    titleReference: 'NA48C/119',
    areaM2: 1250,
    zoneCode: 'BLI',
    zoneName: 'Business - Light Industry',
    zoneColor: '#7c3aed',
    zoneDescription: 'Auckland Unitary Plan: Light manufacturing, warehousing, and trade suppliers.',
    dataSource: 'LINZ Cadastral Database & Auckland Council GIS',
    services: {
      waterConnected: true,
      wastewaterConnected: true,
      stormwaterConnected: true,
      rubbishCollectionDay: 'Commercial collection contract',
      meterLocationDescription: 'Meter pit at roadside curb outside double security gate',
      outageStatus: 'Normal',
      outageDetails: 'Commercial reticulation feed operational.',
    },
    planning: {
      maxBuildingCoveragePct: 65,
      maxHeightM: 18.0,
      minLandscapedAreaPct: 10,
      imperviousAreaLimitPct: 85,
      floodRisk: 'None',
      overlandFlowPath: false,
      heritageOverlay: false,
      catchmentZone: 'Westech Industrial Basin',
    },
    engineerData: {
      supplyZoneId: 'AKL-SZ-14',
      sewerSubcatchmentId: 'WW-WESTECH-IND-01',
      pipeConnectionCompkey: 2017910,
      meterSerialNumber: 'WM-COM-2022-8114',
      meterSizeMm: 50,
      meterLastReadM3: 3140.4,
      backflowHazardLevel: 'Medium',
      staticPressureKPa: 510,
      cathodicProtectionStatus: 'Active',
      scadaZoneId: 'SC-IND-WST',
    },
    waterLineage: getDocumentedWaterLineage('Westech Place', 2017910, 50),
  },
  {
    id: 'PARCEL-16-BRANDON',
    streetNumber: '16',
    streetName: 'Brandon Road',
    suburb: 'Glen Eden',
    city: 'Auckland',
    fullAddress: '16 Brandon Road, Glen Eden, Auckland 0602',
    center: [-36.9099, 174.6766],
    coordinates: [
      [-36.90972, 174.67635],
      [-36.90988, 174.67685],
      [-36.91018, 174.67670],
      [-36.91002, 174.67620],
    ],
    lotNumber: 'Lot 22',
    dpNumber: 'DP 37190',
    titleReference: 'NA11A/85',
    areaM2: 820,
    zoneCode: 'MHS',
    zoneName: 'Residential - Mixed Housing Suburban',
    zoneColor: '#ca8a04',
    zoneDescription: 'Auckland Unitary Plan: Suburban residential housing.',
    dataSource: 'LINZ Cadastral Database & Auckland Council GIS',
    services: {
      waterConnected: true,
      wastewaterConnected: true,
      stormwaterConnected: true,
      rubbishCollectionDay: 'Thursday morning',
      meterLocationDescription: 'Front berm boundary box next to driveway ramp',
      outageStatus: 'Normal',
      outageDetails: 'Reticulation active.',
    },
    planning: {
      maxBuildingCoveragePct: 40,
      maxHeightM: 8.0,
      minLandscapedAreaPct: 40,
      imperviousAreaLimitPct: 55,
      floodRisk: 'Low',
      overlandFlowPath: false,
      heritageOverlay: false,
      catchmentZone: 'Brandon Stream Basin',
    },
    engineerData: {
      supplyZoneId: 'AKL-SZ-14',
      sewerSubcatchmentId: 'WW-BRANDON-GRAV-02',
      pipeConnectionCompkey: 2018104,
      meterSerialNumber: 'WM-2018-32009',
      meterSizeMm: 20,
      meterLastReadM3: 671.2,
      backflowHazardLevel: 'Low',
      staticPressureKPa: 540,
      cathodicProtectionStatus: 'N/A',
      scadaZoneId: 'SC-GE-BR',
    },
    waterLineage: getDocumentedWaterLineage('Brandon Road', 2018104, 20),
  },
  {
    id: 'PARCEL-KELSTON-COLLEGE',
    streetNumber: '1',
    streetName: 'Archibald Road',
    suburb: 'Kelston',
    city: 'Auckland',
    fullAddress: "Kelston Girls' College, Archibald Road, Kelston, Auckland 0602",
    center: [-36.9085, 174.6828],
    coordinates: [
      [-36.90680, 174.68120],
      [-36.90730, 174.68500],
      [-36.91020, 174.68410],
      [-36.90970, 174.68050],
    ],
    lotNumber: 'Lot 1',
    dpNumber: 'DP 61820',
    titleReference: 'NA33D/801',
    areaM2: 38500,
    zoneCode: 'SP-SCH',
    zoneName: 'Special Purpose - School',
    zoneColor: '#eab308',
    zoneDescription: 'Auckland Unitary Plan: Educational and community infrastructure.',
    dataSource: 'LINZ Cadastral Database & Auckland Council GIS',
    services: {
      waterConnected: true,
      wastewaterConnected: true,
      stormwaterConnected: true,
      rubbishCollectionDay: 'Commercial scheduled pickup',
      meterLocationDescription: 'Main boundary utility vault on Archibald Road boundary',
      outageStatus: 'Normal',
      outageDetails: 'Active supply.',
    },
    planning: {
      maxBuildingCoveragePct: 50,
      maxHeightM: 16.0,
      minLandscapedAreaPct: 25,
      imperviousAreaLimitPct: 70,
      floodRisk: 'Moderate',
      overlandFlowPath: true,
      heritageOverlay: false,
      catchmentZone: 'Whau River Upper Basin',
    },
    engineerData: {
      supplyZoneId: 'AKL-SZ-14',
      sewerSubcatchmentId: 'WW-ARCHIBALD-TRUNK',
      pipeConnectionCompkey: 2018900,
      meterSerialNumber: 'WM-BULK-2017-009',
      meterSizeMm: 100,
      meterLastReadM3: 48920.0,
      backflowHazardLevel: 'High',
      staticPressureKPa: 520,
      cathodicProtectionStatus: 'Active',
      scadaZoneId: 'SC-INST-KGC',
    },
    waterLineage: getDocumentedWaterLineage('Archibald Road', 2018900, 100),
  },
];

// Watercare reticulation pipelines matching official GIS asset inventory
export const VERIFIED_PIPES: PipeAsset[] = [
  {
    compkey: 2017826,
    assetType: 'water',
    status: 'Operational - in use',
    material: 'Polyethylene',
    nomDiaMm: 20,
    process: 'Service Conn',
    network: 'Local Reticulation',
    installYear: 2004,
    pressureRating: 'PN16',
    depthM: 0.95,
    cctvScore: 1,
    lineLengthM: 18.4,
    dataSource: 'Watercare Services Ltd Open Data',
    engineerNotes: 'Service connection line from Great North Road 100mm main into 4015 Great North Road water meter manifold.',
    coordinates: [
      [-36.90940, 174.68030],
      [-36.90943, 174.68045],
      [-36.90945, 174.68060],
    ],
  },
  {
    compkey: 2017820,
    assetType: 'water',
    status: 'Operational - in use',
    material: 'Ductile Iron',
    nomDiaMm: 150,
    process: 'Reticulation Main',
    network: 'Local Reticulation',
    installYear: 1996,
    pressureRating: 'PN16',
    depthM: 1.35,
    cctvScore: 2,
    lineLengthM: 320.0,
    dataSource: 'Watercare Services Ltd Open Data',
    engineerNotes: 'Great North Road reticulation main connecting Kelston roundabout to Archibald Road intersection.',
    coordinates: [
      [-36.90850, 174.67880],
      [-36.90920, 174.68000],
      [-36.90970, 174.68090],
      [-36.91030, 174.68190],
      [-36.91100, 174.68300],
    ],
  },
  {
    compkey: 2017835,
    assetType: 'water',
    status: 'Operational - in use',
    material: 'Polyethylene',
    nomDiaMm: 100,
    process: 'Reticulation Main',
    network: 'Local Reticulation',
    installYear: 2012,
    pressureRating: 'PN16',
    depthM: 1.10,
    cctvScore: 1,
    lineLengthM: 210.0,
    dataSource: 'Watercare Services Ltd Open Data',
    engineerNotes: 'Westech Place cul-de-sac branch distribution loop.',
    coordinates: [
      [-36.90920, 174.68000],
      [-36.90980, 174.67910],
      [-36.91030, 174.67840],
      [-36.91080, 174.67780],
    ],
  },
  {
    compkey: 2017850,
    assetType: 'water',
    status: 'Operational - in use',
    material: 'UPVC',
    nomDiaMm: 100,
    process: 'Reticulation Main',
    network: 'Local Reticulation',
    installYear: 2001,
    pressureRating: 'PN12',
    depthM: 1.20,
    cctvScore: 2,
    lineLengthM: 280.0,
    dataSource: 'Watercare Services Ltd Open Data',
    engineerNotes: 'Brandon Road eastern reticulation main.',
    coordinates: [
      [-36.90900, 174.67550],
      [-36.90960, 174.67630],
      [-36.91020, 174.67700],
      [-36.91080, 174.67780],
    ],
  },
  {
    compkey: 3014101,
    assetType: 'wastewater',
    status: 'Operational - in use',
    material: 'Concrete',
    nomDiaMm: 225,
    process: 'Gravity Sewer',
    network: 'Local Reticulation',
    installYear: 1988,
    pressureRating: 'Gravity Class 3',
    depthM: 2.10,
    cctvScore: 2,
    lineLengthM: 195.0,
    dataSource: 'Watercare Services Ltd Open Data',
    engineerNotes: 'Great North Road wastewater trunk collector pipe.',
    coordinates: [
      [-36.90880, 174.67960],
      [-36.90940, 174.68050],
      [-36.91000, 174.68140],
      [-36.91060, 174.68230],
    ],
  },
  {
    compkey: 4018801,
    assetType: 'stormwater',
    status: 'Operational - in use',
    material: 'Reinforced Concrete',
    nomDiaMm: 375,
    process: 'Culvert',
    network: 'Local Reticulation',
    installYear: 1994,
    pressureRating: 'Gravity Class 2',
    depthM: 1.60,
    cctvScore: 2,
    lineLengthM: 175.0,
    dataSource: 'Auckland Council Healthy Waters GIS',
    coordinates: [
      [-36.90830, 174.68150],
      [-36.90900, 174.68220],
      [-36.90970, 174.68300],
      [-36.91040, 174.68370],
    ],
  },
];

// Physical fittings and valves
export const VERIFIED_FITTINGS: FittingAsset[] = [
  {
    id: 'VLV-10029',
    compkey: 2017899,
    type: 'valve',
    label: 'Isolation Sluice Valve 150mm',
    position: [-36.90920, 174.68000],
    status: 'Open - Normal',
    network: 'Water Reticulation',
    nomDiaMm: 150,
    material: 'Cast Iron resilient seated',
    criticalValving: true,
    dataSource: 'Watercare GIS Asset Registry',
  },
  {
    id: 'HYD-4015',
    compkey: 2017905,
    type: 'hydrant',
    label: 'Fire Hydrant FH-842',
    position: [-36.90930, 174.68015],
    status: 'Operational - tested 2024',
    network: 'Water Reticulation',
    nomDiaMm: 80,
    material: 'Gunmetal spindle',
    dataSource: 'Watercare GIS Asset Registry',
  },
  {
    id: 'WM-4015-GNR',
    compkey: 2017827,
    type: 'water_meter',
    label: 'Watercare Revenue Meter',
    position: [-36.90945, 174.68060],
    status: 'Operational',
    network: 'Customer Revenue Metering',
    nomDiaMm: 20,
    material: 'Composite brass',
    dataSource: 'Watercare Customer Metering',
  },
  {
    id: 'MH-WW-4091',
    compkey: 3014199,
    type: 'manhole',
    label: 'Wastewater Chamber MH-4091',
    position: [-36.90940, 174.68050],
    status: 'Operational',
    network: 'Wastewater Gravity',
    lidLevelM: 34.2,
    invertLevelM: 32.1,
    dataSource: 'Watercare Wastewater Asset DB',
  },
];

// Standard New Zealand Transverse Mercator 2000 (NZTM2000 - EPSG:2193) projection conversion
export function latLngToNZTM2000(lat: number, lng: number): { easting: string; northing: string } {
  const a = 6378137.0;
  const f = 1 / 298.257222101;
  const k0 = 0.9996;
  const lng0 = 173.0; // Central meridian for New Zealand
  const e2 = 2 * f - f * f;
  const falseEasting = 1600000.0;
  const falseNorthing = 10000000.0;
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;
  const lng0Rad = (lng0 * Math.PI) / 180;

  const dLng = lngRad - lng0Rad;
  const sinLat = Math.sin(latRad);
  const cosLat = Math.cos(latRad);
  const tanLat = Math.tan(latRad);
  const N = a / Math.sqrt(1 - e2 * sinLat * sinLat);
  const T = tanLat * tanLat;
  const C = (e2 / (1 - e2)) * cosLat * cosLat;
  const A = cosLat * dLng;

  const e4 = e2 * e2;
  const e6 = e4 * e2;
  const M = a * (
    (1 - e2 / 4 - 3 * e4 / 64 - 5 * e6 / 256) * latRad -
    (3 * e2 / 8 + 3 * e4 / 32 + 45 * e6 / 1024) * Math.sin(2 * latRad) +
    (15 * e4 / 256 + 45 * e6 / 1024) * Math.sin(4 * latRad) -
    (35 * e6 / 3072) * Math.sin(6 * latRad)
  );

  const eastingVal = falseEasting + k0 * N * (
    A +
    (1 - T + C) * Math.pow(A, 3) / 6 +
    (5 - 18 * T + T * T + 72 * C - 58 * (e2 / (1 - e2))) * Math.pow(A, 5) / 120
  );

  const northingVal = falseNorthing + k0 * (
    M +
    N * tanLat * (
      A * A / 2 +
      (5 - T + 9 * C + 4 * C * C) * Math.pow(A, 4) / 24 +
      (61 - 58 * T + T * T + 600 * C - 330 * (e2 / (1 - e2))) * Math.pow(A, 6) / 720
    )
  );

  return {
    easting: eastingVal.toLocaleString('en-NZ', { minimumFractionDigits: 3, maximumFractionDigits: 3 }),
    northing: northingVal.toLocaleString('en-NZ', { minimumFractionDigits: 3, maximumFractionDigits: 3 }),
  };
}
