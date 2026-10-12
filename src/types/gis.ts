export type UserRole = 'citizen' | 'official' | 'admin';
export type AccessLevel = 'citizen' | 'official' | 'admin';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  organization: string;
  lastLogin?: string;
}

export type BaseMapStyle = 'carto-light' | 'esri-satellite' | 'linz-topo' | 'osm';

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
