from pydantic import BaseModel
from typing import List, Optional, Literal
from backend.app.schemas.gis import WaterNetworkLineageSchema

class ParcelServicesSchema(BaseModel):
    waterConnected: bool = True
    wastewaterConnected: bool = True
    stormwaterConnected: bool = True
    rubbishCollectionDay: str = "Tuesday"
    meterLocationDescription: str = "Front boundary Toby box"
    outageStatus: Literal["Normal", "Planned Maintenance", "Active Outage"] = "Normal"
    outageDetails: Optional[str] = None

class ParcelPlanningSchema(BaseModel):
    maxBuildingCoveragePct: float
    maxHeightM: float
    minLandscapedAreaPct: float
    imperviousAreaLimitPct: float
    floodRisk: Literal["None", "Low", "Moderate", "High"] = "None"
    overlandFlowPath: bool = False
    heritageOverlay: bool = False
    catchmentZone: str

class ParcelEngineerDataSchema(BaseModel):
    supplyZoneId: str
    sewerSubcatchmentId: str
    pipeConnectionCompkey: int
    meterSerialNumber: str
    meterSizeMm: int
    meterLastReadM3: float
    backflowHazardLevel: Literal["Low", "Medium", "High"] = "Low"
    staticPressureKPa: float
    cathodicProtectionStatus: Literal["N/A", "Active", "Inspected"] = "N/A"
    scadaZoneId: str

class ParcelFeatureSchema(BaseModel):
    id: str
    streetNumber: str
    streetName: str
    suburb: str
    city: str
    fullAddress: str
    coordinates: List[List[float]]  # polygon vertices [[lat, lng], ...]
    center: List[float]             # [lat, lng]
    lotNumber: str
    dpNumber: str
    titleReference: str
    areaM2: float
    zoneCode: str
    zoneName: str
    zoneColor: str
    zoneDescription: str
    dataSource: str = "LINZ Cadastral & Auckland Council GIS"
    services: ParcelServicesSchema
    planning: ParcelPlanningSchema
    engineerData: ParcelEngineerDataSchema
    waterLineage: WaterNetworkLineageSchema

class AddressSearchResponse(BaseModel):
    query: str
    count: int
    results: List[ParcelFeatureSchema]
