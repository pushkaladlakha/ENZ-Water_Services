from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Dict, Any

class CoordinatePair(BaseModel):
    lat: float
    lng: float

class NZTMCoordinate(BaseModel):
    easting: float
    northing: float

class AucklandSupplyZoneSchema(BaseModel):
    zoneId: str
    zoneName: str
    supplyId: str
    supplyName: str
    zonePopulation: Optional[int] = 0
    urbanRural: Literal["Urban", "Rural"] = "Urban"
    lat: float
    lng: float
    popRegist: int = 0
    popLowDe: int = 0
    popModDe: int = 0
    popHighDe: int = 0
    popMaori: int = 0
    dataSource: str = "Taumata Arowai Drinking Water Register & Watercare Services Ltd"
    polygon: Optional[List[List[float]]] = None

class WaterSupplySchemeSchema(BaseModel):
    supplyId: str
    supplyName: str
    supplierName: str = "Watercare Services Limited"
    region: str = "Auckland Region"
    complianceStatus: str = "Compliant"
    sourceWaterType: str = "Surface Water Dams & River Intake"
    registeredPopulation: int = 0
    primaryTreatmentPlant: Optional[str] = None
    waterQualityGrade: Optional[str] = "Taumata Arowai Rule Compliant (Grade A1)"

class BufferTierSchema(BaseModel):
    tier: Literal["50m", "100m", "200m", "500m", "1500m"]
    tierName: str
    bufferLayer: str
    description: str
    distanceMeters: float

class SourceDamSchema(BaseModel):
    name: str
    catchment: str
    capacityML: float
    distanceKm: float

class TreatmentPlantSchema(BaseModel):
    name: str
    process: str
    waterQualityGrade: str

class ReservoirSchema(BaseModel):
    name: str
    capacityM3: float
    headLevelM: float

class StreetMainSchema(BaseModel):
    compkey: int
    name: str
    nominalDiaMm: int
    material: str

class ServicePipeSchema(BaseModel):
    compkey: int
    nominalDiaMm: int
    material: str
    pressureBar: float

class UpstreamValveSchema(BaseModel):
    compkey: int
    code: str
    type: str

class WastewaterDestinationSchema(BaseModel):
    treatmentPlant: str
    outfallCatchment: str

class WaterNetworkLineageSchema(BaseModel):
    sourceDam: SourceDamSchema
    treatmentPlant: TreatmentPlantSchema
    reservoir: ReservoirSchema
    streetMain: StreetMainSchema
    servicePipe: ServicePipeSchema
    upstreamValve: UpstreamValveSchema
    wastewaterDestination: WastewaterDestinationSchema

class PipeAssetSchema(BaseModel):
    compkey: int
    assetType: Literal["water", "wastewater", "stormwater"] = "water"
    status: Literal["Operational - in use", "Under Maintenance", "Decommissioned", "Planned"] = "Operational - in use"
    material: str
    nomDiaMm: int
    process: str = "Reticulation Main"
    network: str = "Local Reticulation"
    coordinates: List[List[float]]  # polyline [[lat, lng], ...]
    installYear: int
    pressureRating: str
    depthM: float
    cctvScore: Optional[int] = None
    lineLengthM: float
    dataSource: str = "Watercare Services GIS Registry"
    engineerNotes: Optional[str] = None

class FittingAssetSchema(BaseModel):
    id: str
    compkey: int
    type: Literal["valve", "hydrant", "manhole", "water_meter", "pump_station"]
    position: List[float]  # [lat, lng]
    status: str = "Operational"
    network: str = "Water Distribution"
    label: str
    nomDiaMm: Optional[int] = None
    material: Optional[str] = None
    lidLevelM: Optional[float] = None
    invertLevelM: Optional[float] = None
    criticalValving: Optional[bool] = False
    dataSource: str = "Watercare Open Data"
