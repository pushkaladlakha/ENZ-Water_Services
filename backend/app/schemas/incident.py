from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Literal

IncidentCategory = Literal[
    "contamination_discoloration",
    "chemical_odor_taste",
    "suspected_illness_pathogen",
    "pipe_burst_leak",
    "low_pressure_outage",
    "backflow_hazard",
    "other"
]

IncidentSeverity = Literal["standard", "high", "critical"]
IncidentStatus = Literal["Submitted", "Under Investigation", "Sampling Dispatched", "Resolved"]

class IncidentCreateRequest(BaseModel):
    category: IncidentCategory
    categoryLabel: Optional[str] = None
    severity: IncidentSeverity = "high"
    address: str
    coordinates: Optional[List[float]] = None  # [lat, lng]
    supplyZoneId: Optional[str] = None
    supplySchemeName: Optional[str] = None
    description: str = Field(..., min_length=10)
    observedAt: Optional[str] = None
    waterSupplyType: str = "Municipal Watercare Reticulation"
    boilWaterAdvised: bool = False
    reporterName: str = "Auckland Resident"
    reporterEmail: str = "resident@nzwater.org.nz"
    reporterPhone: Optional[str] = None
    isAnonymous: bool = False

class IncidentUpdateRequest(BaseModel):
    status: Optional[IncidentStatus] = None
    officerNotes: Optional[str] = None
    boilWaterAdvised: Optional[bool] = None

class IncidentResponse(BaseModel):
    id: str
    category: IncidentCategory
    categoryLabel: str
    severity: IncidentSeverity
    address: str
    coordinates: Optional[List[float]] = None
    supplyZoneId: Optional[str] = None
    supplySchemeName: Optional[str] = None
    description: str
    observedAt: str
    waterSupplyType: str
    boilWaterAdvised: bool
    reporterName: str
    reporterEmail: str
    reporterPhone: Optional[str] = None
    isAnonymous: bool
    status: IncidentStatus
    createdAt: str
    officerNotes: Optional[str] = None
