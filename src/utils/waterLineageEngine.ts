import { ParcelFeature, PipeAsset, AucklandSupplyZone } from '../types/gis';
import { VERIFIED_PARCELS, VERIFIED_PIPES } from '../data/nzData';

export interface AucklandZoneScheme {
  zoneId: string;
  zoneName: string;
  supplyId: string;
  supplyName: string;
  popRegist: number;
  popLowDe: number;
  popModDe: number;
  popHighDe: number;
  popMaori: number;
  urbanRural: 'Urban' | 'Rural';
  lat: number;
  lng: number;
  radiusKm: number;
  polygon: [number, number][];
  primaryDam: {
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
  streetMainTemplate: {
    nomDiaMm: number;
    material: string;
  };
  dataSource: string;
}

// Authoritative Auckland Supply Zones & Schemes from Auckland_zone_list.xlsx & AklDizzy
export const AUCKLAND_ZONE_SCHEMES: AucklandZoneScheme[] = [
  {
    zoneId: 'AKL-SZ-14',
    zoneName: 'Titirangi & Kelston Supply Zone',
    supplyId: 'SUP-AKL-WEST-01',
    supplyName: 'Huia / Waitakere Western Water Supply Scheme',
    popRegist: 48250,
    popLowDe: 14200,
    popModDe: 22100,
    popHighDe: 11950,
    popMaori: 6180,
    urbanRural: 'Urban',
    lat: -36.9125,
    lng: 174.6780,
    radiusKm: 4.5,
    polygon: [
      [-36.8980, 174.6520],
      [-36.9010, 174.6990],
      [-36.9320, 174.6960],
      [-36.9360, 174.6480],
    ],
    primaryDam: {
      name: 'Waitakere Dam & Lower Nihotupu Dam',
      catchment: 'Waitakere Ranges Native Catchment',
      capacityML: 29800,
      distanceKm: 14.6,
    },
    treatmentPlant: {
      name: 'Huia Water Treatment Plant',
      process: 'Dissolved Air Flotation (DAF), Rapid Gravity Sand Filtration & Disinfection',
      waterQualityGrade: 'Taumata Arowai Rule Compliant (Grade A1)',
    },
    reservoir: {
      name: 'Titirangi High-Level Water Reservoir',
      capacityM3: 45000,
      headLevelM: 132,
    },
    streetMainTemplate: {
      nomDiaMm: 150,
      material: 'Ductile Iron',
    },
    dataSource: 'Taumata Arowai Drinking Water Register & Watercare Services Ltd',
  },
  {
    zoneId: 'AKL-SZ-15',
    zoneName: 'New Lynn & Avondale Supply Zone',
    supplyId: 'SUP-AKL-WEST-01',
    supplyName: 'Huia / Waitakere Western Water Supply Scheme',
    popRegist: 56100,
    popLowDe: 16800,
    popModDe: 24500,
    popHighDe: 14800,
    popMaori: 7320,
    urbanRural: 'Urban',
    lat: -36.9050,
    lng: 174.6980,
    radiusKm: 3.5,
    polygon: [
      [-36.8850, 174.6880],
      [-36.8910, 174.7260],
      [-36.9220, 174.7210],
      [-36.9170, 174.6840],
    ],
    primaryDam: {
      name: 'Lower Huia Dam & Upper Nihotupu Dam',
      catchment: 'Huia & Nihotupu Catchments (Waitakere Ranges)',
      capacityML: 22500,
      distanceKm: 16.2,
    },
    treatmentPlant: {
      name: 'Huia Water Treatment Plant',
      process: 'DAF & Granular Activated Carbon Filtration',
      waterQualityGrade: 'Taumata Arowai Rule Compliant (Grade A1)',
    },
    reservoir: {
      name: 'New Lynn Distribution Balancing Reservoir',
      capacityM3: 32000,
      headLevelM: 98,
    },
    streetMainTemplate: {
      nomDiaMm: 200,
      material: 'Cast Iron (Cement Lined)',
    },
    dataSource: 'Taumata Arowai Drinking Water Register & Watercare Services Ltd',
  },
  {
    zoneId: 'AKL-SZ-01',
    zoneName: 'Auckland Central CBD & Waterfront',
    supplyId: 'SUP-AKL-CENTRAL-01',
    supplyName: 'Central Isthmus Bulk Supply Scheme',
    popRegist: 72400,
    popLowDe: 31000,
    popModDe: 26000,
    popHighDe: 15400,
    popMaori: 4900,
    urbanRural: 'Urban',
    lat: -36.8485,
    lng: 174.7633,
    radiusKm: 3.0,
    polygon: [
      [-36.8340, 174.7430],
      [-36.8370, 174.7820],
      [-36.8660, 174.7790],
      [-36.8630, 174.7380],
    ],
    primaryDam: {
      name: 'Cosseys Dam & Upper Nihotupu Dam (Dual Feed)',
      catchment: 'Hunua Ranges & Waitakere Ranges Shared Supply',
      capacityML: 38400,
      distanceKm: 32.0,
    },
    treatmentPlant: {
      name: 'Ardmore Water Treatment Plant & Huia WTP',
      process: 'Coagulation, Dual Media Filtration & Chlorine/UV Disinfection',
      waterQualityGrade: 'Taumata Arowai Rule Compliant (Grade Aa)',
    },
    reservoir: {
      name: 'Khyber Pass Water Reservoir (Grafton)',
      capacityM3: 40000,
      headLevelM: 88,
    },
    streetMainTemplate: {
      nomDiaMm: 300,
      material: 'Steel Mortar Lined',
    },
    dataSource: 'Taumata Arowai Drinking Water Register & Watercare Services Ltd',
  },
  {
    zoneId: 'AKL-SZ-02',
    zoneName: 'Ponsonby, Grey Lynn & Herne Bay',
    supplyId: 'SUP-AKL-CENTRAL-01',
    supplyName: 'Central Isthmus Bulk Supply Scheme',
    popRegist: 38900,
    popLowDe: 24500,
    popModDe: 10400,
    popHighDe: 4000,
    popMaori: 2300,
    urbanRural: 'Urban',
    lat: -36.8580,
    lng: 174.7430,
    radiusKm: 2.8,
    polygon: [
      [-36.8440, 174.7230],
      [-36.8490, 174.7560],
      [-36.8760, 174.7490],
      [-36.8710, 174.7160],
    ],
    primaryDam: {
      name: 'Upper Nihotupu Dam & Cosseys Dam',
      catchment: 'Waitakere Ranges & Hunua Ranges Ring Main',
      capacityML: 28500,
      distanceKm: 22.4,
    },
    treatmentPlant: {
      name: 'Huia Water Treatment Plant',
      process: 'Dissolved Air Flotation & Sand Filtration',
      waterQualityGrade: 'Taumata Arowai Rule Compliant (Grade A1)',
    },
    reservoir: {
      name: 'Ponsonby Water Reservoir (Pompallier)',
      capacityM3: 25000,
      headLevelM: 76,
    },
    streetMainTemplate: {
      nomDiaMm: 150,
      material: 'Cast Iron',
    },
    dataSource: 'Taumata Arowai Drinking Water Register & Watercare Services Ltd',
  },
  {
    zoneId: 'AKL-SZ-08',
    zoneName: 'Henderson & Te Atatu Supply Zone',
    supplyId: 'SUP-AKL-WEST-02',
    supplyName: 'Waitakere Northern Scheme',
    popRegist: 62400,
    popLowDe: 18200,
    popModDe: 27900,
    popHighDe: 16300,
    popMaori: 8450,
    urbanRural: 'Urban',
    lat: -36.8850,
    lng: 174.6550,
    radiusKm: 4.8,
    polygon: [
      [-36.8520, 174.6320],
      [-36.8580, 174.6860],
      [-36.9020, 174.6810],
      [-36.8970, 174.6260],
    ],
    primaryDam: {
      name: 'Waitakere Dam & Swanson Catchment',
      catchment: 'Waitakere Ranges Native Headwaters',
      capacityML: 17600,
      distanceKm: 11.2,
    },
    treatmentPlant: {
      name: 'Waitakere Water Treatment Plant',
      process: 'Direct Filtration & UV Disinfection',
      waterQualityGrade: 'Taumata Arowai Rule Compliant (Grade A1)',
    },
    reservoir: {
      name: 'Henderson High-Level Service Reservoir',
      capacityM3: 28000,
      headLevelM: 105,
    },
    streetMainTemplate: {
      nomDiaMm: 200,
      material: 'Polyethylene PE100',
    },
    dataSource: 'Taumata Arowai Drinking Water Register & Watercare Services Ltd',
  },
  {
    zoneId: 'AKL-SZ-20',
    zoneName: 'Takapuna & Devonport Supply Zone',
    supplyId: 'SUP-AKL-NORTH-01',
    supplyName: 'North Shore Southern Supply Scheme',
    popRegist: 59300,
    popLowDe: 32000,
    popModDe: 19500,
    popHighDe: 7800,
    popMaori: 3100,
    urbanRural: 'Urban',
    lat: -36.7880,
    lng: 174.7720,
    radiusKm: 4.0,
    polygon: [
      [-36.7620, 174.7480],
      [-36.7680, 174.8080],
      [-36.8370, 174.8020],
      [-36.8270, 174.7420],
    ],
    primaryDam: {
      name: 'Mangatangi Dam & Waikato River Pipeline',
      catchment: 'Hunua Ranges & Waikato River Raw Water Intake',
      capacityML: 52000,
      distanceKm: 46.0,
    },
    treatmentPlant: {
      name: 'Ardmore Water Treatment Plant & Waikato WTP',
      process: 'Membrane Ultrafiltration & Dual Media Coagulation',
      waterQualityGrade: 'Taumata Arowai Rule Compliant (Grade Aa)',
    },
    reservoir: {
      name: 'Takapuna Lake Pupuke Balancing Reservoir',
      capacityM3: 35000,
      headLevelM: 65,
    },
    streetMainTemplate: {
      nomDiaMm: 200,
      material: 'Ductile Iron',
    },
    dataSource: 'Taumata Arowai Drinking Water Register & Watercare Services Ltd',
  },
  {
    zoneId: 'AKL-SZ-24',
    zoneName: 'Albany & Hibiscus Coast Supply Zone',
    supplyId: 'SUP-AKL-NORTH-02',
    supplyName: 'North Shore Northern Scheme',
    popRegist: 68100,
    popLowDe: 35400,
    popModDe: 23100,
    popHighDe: 9600,
    popMaori: 3800,
    urbanRural: 'Urban',
    lat: -36.7320,
    lng: 174.7080,
    radiusKm: 5.5,
    polygon: [
      [-36.7020, 174.6780],
      [-36.7080, 174.7420],
      [-36.7580, 174.7370],
      [-36.7520, 174.6720],
    ],
    primaryDam: {
      name: 'Ardmore Dam Network & Waikato Water Intake',
      catchment: 'Waikato River & Hunua Regional Reservoirs',
      capacityML: 65000,
      distanceKm: 54.0,
    },
    treatmentPlant: {
      name: 'Waikato Water Treatment Plant (Tuakau)',
      process: 'Advanced Membrane Filtration & Granular Carbon',
      waterQualityGrade: 'Taumata Arowai Rule Compliant (Grade Aa)',
    },
    reservoir: {
      name: 'Albany Heights Water Storage Reservoir',
      capacityM3: 42000,
      headLevelM: 140,
    },
    streetMainTemplate: {
      nomDiaMm: 250,
      material: 'Polyethylene PE100 High-Density',
    },
    dataSource: 'Taumata Arowai Drinking Water Register & Watercare Services Ltd',
  },
  {
    zoneId: 'AKL-SZ-35',
    zoneName: 'Manukau Central & Papatoetoe',
    supplyId: 'SUP-AKL-SOUTH-01',
    supplyName: 'Southern Auckland Scheme',
    popRegist: 81200,
    popLowDe: 12500,
    popModDe: 31200,
    popHighDe: 37500,
    popMaori: 14200,
    urbanRural: 'Urban',
    lat: -36.9920,
    lng: 174.8760,
    radiusKm: 5.0,
    polygon: [
      [-36.9620, 174.8420],
      [-36.9680, 174.9120],
      [-37.0220, 174.9080],
      [-37.0170, 174.8380],
    ],
    primaryDam: {
      name: 'Mangatangi Dam & Mangatawhiri Dam',
      catchment: 'Hunua Ranges Native Forest Catchment',
      capacityML: 50500,
      distanceKm: 28.5,
    },
    treatmentPlant: {
      name: 'Ardmore Water Treatment Plant',
      process: 'Coagulation, Clarification & Sand Filtration',
      waterQualityGrade: 'Taumata Arowai Rule Compliant (Grade Aa)',
    },
    reservoir: {
      name: 'Redoubt Road Regional Storage Reservoir',
      capacityM3: 120000,
      headLevelM: 110,
    },
    streetMainTemplate: {
      nomDiaMm: 250,
      material: 'Ductile Iron Concrete Lined',
    },
    dataSource: 'Taumata Arowai Drinking Water Register & Watercare Services Ltd',
  },
  {
    zoneId: 'AKL-SZ-38',
    zoneName: 'Papakura & Drury Supply Zone',
    supplyId: 'SUP-AKL-SOUTH-02',
    supplyName: 'Hunua Foothills Scheme',
    popRegist: 43500,
    popLowDe: 11200,
    popModDe: 19800,
    popHighDe: 12500,
    popMaori: 8900,
    urbanRural: 'Urban',
    lat: -37.0650,
    lng: 174.9450,
    radiusKm: 5.0,
    polygon: [
      [-37.0320, 174.9120],
      [-37.0380, 174.9780],
      [-37.0980, 174.9720],
      [-37.0920, 174.9080],
    ],
    primaryDam: {
      name: 'Hays Creek Dam & Cosseys Dam',
      catchment: 'Hunua Ranges Foothills Catchment',
      capacityML: 14200,
      distanceKm: 9.8,
    },
    treatmentPlant: {
      name: 'Ardmore Water Treatment Plant',
      process: 'Dual Media Rapid Filtration',
      waterQualityGrade: 'Taumata Arowai Rule Compliant (Grade Aa)',
    },
    reservoir: {
      name: 'Papakura Eastern Service Reservoir',
      capacityM3: 30000,
      headLevelM: 85,
    },
    streetMainTemplate: {
      nomDiaMm: 150,
      material: 'Ductile Iron',
    },
    dataSource: 'Taumata Arowai Drinking Water Register & Watercare Services Ltd',
  },
  {
    zoneId: 'AKL-SZ-42',
    zoneName: 'Helensville & Parakai Rural Zone',
    supplyId: 'SUP-AKL-RURAL-01',
    supplyName: 'North West Rural Water Scheme',
    popRegist: 6900,
    popLowDe: 1800,
    popModDe: 3200,
    popHighDe: 1900,
    popMaori: 1450,
    urbanRural: 'Rural',
    lat: -36.6800,
    lng: 174.4500,
    radiusKm: 4.5,
    polygon: [
      [-36.6480, 174.4180],
      [-36.6540, 174.4880],
      [-36.7180, 174.4820],
      [-36.7120, 174.4120],
    ],
    primaryDam: {
      name: 'Helensville Deep Aquifer Borefield & Spring Source',
      catchment: 'Kaipara Groundwater Catchment Basin',
      capacityML: 4500,
      distanceKm: 4.2,
    },
    treatmentPlant: {
      name: 'Helensville Water Treatment Plant',
      process: 'Aeration, Green Sand Manganese Filtration & Disinfection',
      waterQualityGrade: 'Taumata Arowai Rule Compliant Grade B (Rural Standard)',
    },
    reservoir: {
      name: 'Helensville Hilltop Storage Reservoir',
      capacityM3: 6500,
      headLevelM: 70,
    },
    streetMainTemplate: {
      nomDiaMm: 100,
      material: 'Polyethylene PE100',
    },
    dataSource: 'Taumata Arowai Drinking Water Register & Watercare Services Ltd',
  },
];

// Calculate Haversine distance in kilometers
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Find closest verified cadastral parcel within 50 meters
export function findNearestVerifiedParcel(lat: number, lng: number): ParcelFeature | null {
  let closest: ParcelFeature | null = null;
  let minDist = 0.05; // 50m max threshold

  for (const parcel of VERIFIED_PARCELS) {
    const dist = calculateDistanceKm(lat, lng, parcel.center[0], parcel.center[1]);
    if (dist < minDist) {
      minDist = dist;
      closest = parcel;
    }
  }

  return closest;
}

// Resolves which drinking water supply zone encloses or is closest to coordinate
export function resolveDrinkingWaterSupplyZone(lat: number, lng: number): AucklandZoneScheme | null {
  let closestScheme: AucklandZoneScheme | null = null;
  let minDistance = 999999;

  for (const scheme of AUCKLAND_ZONE_SCHEMES) {
    const dist = calculateDistanceKm(lat, lng, scheme.lat, scheme.lng);
    if (dist <= scheme.radiusKm && dist < minDistance) {
      minDistance = dist;
      closestScheme = scheme;
    }
  }

  // If outside all zone radii, return closest if within 15km, else null
  if (!closestScheme) {
    for (const scheme of AUCKLAND_ZONE_SCHEMES) {
      const dist = calculateDistanceKm(lat, lng, scheme.lat, scheme.lng);
      if (dist < minDistance && dist <= 15) {
        minDistance = dist;
        closestScheme = scheme;
      }
    }
  }

  return closestScheme;
}

// Resolves supply buffer tier (matching AklDizzy_Buffers50m to 1500m)
export function resolveSupplyBufferTier(distanceMeters: number): {
  tierName: string;
  bufferLayer: string;
  description: string;
  distanceMeters: number;
} {
  if (distanceMeters <= 50) {
    return {
      tierName: 'Within 50m (Immediate Reticulation Spine)',
      bufferLayer: 'AklDizzy_Buffers50m',
      description: 'Property directly abuts or sits within 50m of primary municipal reticulation.',
      distanceMeters,
    };
  }
  if (distanceMeters <= 100) {
    return {
      tierName: 'Within 100m (Secondary Buffer)',
      bufferLayer: 'AklDizzy_Buffers100m',
      description: 'Property is within 100m of local reticulated water scheme main.',
      distanceMeters,
    };
  }
  if (distanceMeters <= 200) {
    return {
      tierName: 'Within 200m (Catchment Buffer)',
      bufferLayer: 'AklDizzy_Buffers200m',
      description: 'Property is within 200m service envelope of potable water main.',
      distanceMeters,
    };
  }
  if (distanceMeters <= 500) {
    return {
      tierName: 'Within 500m (Collector Corridor)',
      bufferLayer: 'AklDizzy_Buffers500m',
      description: 'Property is within 500m of bulk distribution network.',
      distanceMeters,
    };
  }
  return {
    tierName: 'Within 1500m (Outer Service Envelope)',
    bufferLayer: 'AklDizzy_Buffers1500m',
    description: 'Property is within 1500m outer service envelope of municipal water supply scheme.',
    distanceMeters,
  };
}
