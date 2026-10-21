export type UserRole = 'user' | 'admin' | 'citizen' | 'official';
export type AccessLevel = 'user' | 'admin' | 'citizen' | 'official';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  organization: string;
  lastLogin?: string;
}

export type BaseMapStyle = 'google-maps' | 'carto-light' | 'esri-satellite' | 'linz-topo' | 'osm';

export interface AucklandSupplyZone {
  zoneId: string;
  zoneName: string;
  supplyId: string;
  supplyName: string;
  zonePopulation?: number;
  urbanRural?: 'Urban' | 'Rural';
  lat: number;
  lng: number;
  popRegist: number;
  popLowDe: number;
  popModDe: number;
  popHighDe: number;
  popMaori: number;
  dataSource: string;
  polygon?: [number, number][];
  shapeLength?: number;
  shapeArea?: number;
  complianceStatus?: string;
  supplierName?: string;
  primaryDam?: {
    name: string;
    catchment: string;
    capacityML: number;
    distanceKm: number;
  };
  treatmentPlant?: {
    name: string;
    process: string;
    waterQualityGrade: string;
  };
  reservoir?: {
    name: string;
    capacityM3: number;
    headLevelM: number;
  };
  streetMainTemplate?: {
    nomDiaMm: number;
    material: string;
  };
}

export interface PipeAsset {
  compkey: number;
  assetType: 'water' | 'wastewater' | 'stormwater';
  status: 'Operational - in use' | 'Under Maintenance' | 'Decommissioned' | 'Planned';
  material: 'Polyethylene' | 'UPVC' | 'Ductile Iron' | 'Cast Iron' | 'Asbestos Cement' | 'Concrete' | 'Reinforced Concrete' | 'Steel';
  nomDiaMm: number;
  process: 'Service Conn' | 'Reticulation Main' | 'Trunk Main' | 'Rising Main' | 'Gravity Sewer' | 'Culvert';
  network: 'Local Reticulation' | 'Bulk Transmission';
  coordinates: [number, number][]; // polyline [lat, lng]
  installYear: number;
  pressureRating: string;
  depthM: number;
  cctvScore?: number; // 1 (excellent) to 5 (severe structural defect)
  lineLengthM: number;
  dataSource: string;
  engineerNotes?: string;
}

export interface FittingAsset {
  id: string;
  compkey: number;
  type: 'valve' | 'hydrant' | 'manhole' | 'water_meter' | 'pump_station';
  position: [number, number]; // [lat, lng]
  status: string;
  network: string;
  label: string;
  nomDiaMm?: number;
  material?: string;
  lidLevelM?: number;
  invertLevelM?: number;
  criticalValving?: boolean;
  dataSource: string;
}

export interface WaterNetworkLineage {
  sourceDam: {
    name: string;
    catchment: string;
    capacityML: number;
    distanceKm: number;
  };
  treatmentPlant: {
    name: string;
    process: string;
    waterQualityGrade: string;
  };
  reservoir: {
    name: string;
    capacityM3: number;
    headLevelM: number;
  };
  streetMain: {
    compkey: number;
    name: string;
    nominalDiaMm: number;
    material: string;
  };
  servicePipe: {
    compkey: number;
    nominalDiaMm: number;
    material: string;
    pressureBar: number;
  };
  upstreamValve: {
    compkey: number;
    code: string;
    type: string;
  };
  wastewaterDestination: {
    treatmentPlant: string;
    outfallCatchment: string;
  };
}

export interface ParcelFeature {
  id: string;
  streetNumber: string;
  streetName: string;
  suburb: string;
  city: string;
  fullAddress: string;
  coordinates: [number, number][]; // [lat, lng] polygon vertices
  center: [number, number]; // [lat, lng]
  lotNumber: string;
  dpNumber: string;
  titleReference: string;
  areaM2: number;
  zoneCode: string;
  zoneName: string;
  zoneColor: string;
  zoneDescription: string;
  dataSource: string;
  allocatedZoneId?: string;
  allocatedZoneName?: string;
  // Citizen-facing essential services
  services: {
    waterConnected: boolean;
    wastewaterConnected: boolean;
    stormwaterConnected: boolean;
    rubbishCollectionDay: string;
    meterLocationDescription: string;
    outageStatus: 'Normal' | 'Planned Maintenance' | 'Active Outage';
    outageDetails?: string;
  };
  // Planner / Unitary Plan attributes
  planning: {
    maxBuildingCoveragePct: number;
    maxHeightM: number;
    minLandscapedAreaPct: number;
    imperviousAreaLimitPct: number;
    floodRisk: 'None' | 'Low' | 'Moderate' | 'High';
    overlandFlowPath: boolean;
    heritageOverlay: boolean;
    catchmentZone: string;
  };
  // Technical engineering attributes (restricted to Official & Admin)
  engineerData: {
    supplyZoneId: string;
    sewerSubcatchmentId: string;
    pipeConnectionCompkey: number;
    meterSerialNumber: string;
    meterSizeMm: number;
    meterLastReadM3: number;
    backflowHazardLevel: 'Low' | 'Medium' | 'High';
    staticPressureKPa: number;
    cathodicProtectionStatus: 'N/A' | 'Active' | 'Inspected';
    scadaZoneId: string;
  };
  waterLineage: WaterNetworkLineage;
}

export interface LayerVisibility {
  supplyZones: boolean;
  supplyBuffers: boolean;
  parcels: boolean;
  residentialZones: boolean;
  waterPipes: boolean;
  wastewaterPipes: boolean;
  stormwaterPipes: boolean;
  fittings: boolean;
  floodHazard: boolean;
  streetNumbers: boolean;
  incidentReports?: boolean;
}

export type IncidentCategory = 
  | 'contamination_discoloration' 
  | 'chemical_odor_taste' 
  | 'suspected_illness_pathogen' 
  | 'pipe_burst_leak' 
  | 'low_pressure_outage' 
  | 'backflow_hazard' 
  | 'other';

export type IncidentSeverity = 'standard' | 'high' | 'critical';

export type IncidentStatus = 'Submitted' | 'Under Investigation' | 'Sampling Dispatched' | 'Resolved';

export interface WaterIncidentComplaint {
  id: string; // e.g. 'NZ-INC-2026-4819'
  category: IncidentCategory;
  categoryLabel: string;
  severity: IncidentSeverity;
  address: string;
  coordinates?: [number, number]; // [lat, lng]
  supplyZoneId?: string;
  supplySchemeName?: string;
  description: string;
  observedAt: string;
  waterSupplyType: string;
  boilWaterAdvised: boolean;
  reporterName: string;
  reporterEmail: string;
  reporterPhone?: string;
  isAnonymous: boolean;
  status: IncidentStatus;
  createdAt: string;
  officerNotes?: string;
}

export interface ActiveSelection {
  type: 'parcel' | 'pipe' | 'fitting' | 'supply_zone' | 'incident';
  data: ParcelFeature | PipeAsset | FittingAsset | AucklandSupplyZone | WaterIncidentComplaint | any;
  relatedAssets?: (PipeAsset | FittingAsset)[];
  unmapped?: boolean;
}

export type PathwayResolutionStatus = 
  | 'VERIFIED'
  | 'AMBIGUOUS'
  | 'NEAR_ZONE'
  | 'UNMAPPED_OUTSIDE_RETICULATION'
  | 'REVIEW_REQUIRED';

export interface PathwayResolvedZone {
  zoneId: string;
  zoneName: string;
  supplyId: string;
  supplyName: string;
  popRegist: number;
  popMaori?: number;
  urbanRural?: string;
  lat: number;
  lng: number;
  polygon?: [number, number][];
  dataSource?: string;
  primaryDam?: {
    name: string;
    catchment: string;
    capacityML: number;
    distanceKm: number;
  };
  treatmentPlant?: {
    name: string;
    process: string;
    waterQualityGrade: string;
  };
  reservoir?: {
    name: string;
    capacityM3: number;
    headLevelM: number;
  };
}

export interface PathwayResolvedScheme {
  supplyId: string;
  supplyName: string;
  supplierName: string;
  region?: string;
  complianceStatus?: string;
  sourceWaterType?: string;
  registeredPopulation?: number;
  primaryTreatmentPlant?: string;
  waterQualityGrade?: string;
}

export interface DijkstraSegment {
  from: [number, number];
  to: [number, number];
  distanceMeters: number;
  segmentName: string;
  pipeType?: string;
  material?: string;
  nomDiaMm?: number;
  compkey?: number;
}

export type TravelMode = 'vehicle' | 'walking';

export interface DijkstraRouteResult {
  sourceAddress: string;
  sourceCoordinates: [number, number];
  targetZoneId: string;
  targetZoneName: string;
  targetCoordinates: [number, number];
  totalDistanceMeters: number;
  totalDistanceKm: number;
  pathCoordinates: [number, number][];
  segments: DijkstraSegment[];
  nodeCount: number;
  computationTimeMs: number;
  algorithm: string;
  provenance: string;
  googleMapsDirectionsUrl: string;
  travelMode?: TravelMode;
  roadNames?: string[];
}

export interface SingleConnectivityPath {
  coordinates: [number, number][]; // [Dam, Treatment Plant, Address]
  totalDistanceKm: number;
  damName: string;
  damCoordinates?: [number, number] | null;
  damAddress?: string;
  hasVerifiedDamCoords: boolean;
  plantName: string;
  plantCoordinates?: [number, number] | null;
  plantAddress?: string;
  hasVerifiedPlantCoords: boolean;
  address: string;
  addressCoordinates: [number, number];
  googleMapsDirectUrl: string;
  disclaimer: string;
}

export interface PathwayResolutionResult {
  status: PathwayResolutionStatus;
  queriedAddress: string;
  addressId?: string;
  lotNumber?: string;
  dpNumber?: string;
  coordinates: [number, number]; // [lat, lng]
  nztm2000?: {
    easting: number;
    northing: number;
  };
  supplyZone?: PathwayResolvedZone | null;
  supplyScheme?: PathwayResolvedScheme | null;
  servingTreatmentPlant?: {
    name: string;
    process?: string;
    waterQualityGrade?: string;
    coordinates?: [number, number];
    address?: string;
    verifiedSource?: string;
  } | null;
  sourceDamFacility?: {
    name: string;
    catchment?: string;
    capacityML?: number;
    distanceKm?: number;
    coordinates?: [number, number];
    address?: string;
    verifiedSource?: string;
  } | null;
  singleConnectivityPath?: SingleConnectivityPath | null;
  bufferTier?: {
    tierName: string;
    distanceMeters: number;
    description?: string;
  } | null;
  lineage?: any | null;
  matchedPipeCompkey?: number | null;
  distanceToMainMeters?: number | null;
  warnings: string[];
  confidenceScore: number;
  dataProvenance: string;
  dijkstraRoute?: DijkstraRouteResult | null;
}

export interface WaterTestingProfileResult {
  addressId: string;
  address: string;
  lotPlan?: string;
  allocatedZoneId: string;
  allocatedZoneName: string;
  supplyId: string;
  supplyName: string;
  coordinates: [number, number]; // [lat, lng] of address
  zoneCoordinates: [number, number]; // [lat, lng] of supply zone
  distanceKm: number;
  transitTimeMinutes: number;
  transitTimeFormatted: string;
  pressurePsi: number;
  pressureKPa: number;
  ph: number;
  chlorineMgL: number;
  turbidityNtu: number;
  ecoliCfuPer100ml: number;
  fluorideMgL: number;
  waterQualityGrade: string;
  complianceStatus: 'Compliant' | 'Advisory' | 'Critical';
  testedAt: string;
  sourceDam: string;
  treatmentPlant: string;
  reservoir: string;
  distributionMain: string;
  servicePipe: string;
  googleMapsDirectionsUrl: string;
  googleMapsEmbedUrl: string;
  pipelineLineage?: WaterNetworkLineage | null;
}


