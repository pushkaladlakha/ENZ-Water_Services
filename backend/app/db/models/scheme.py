from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime
from sqlalchemy.orm import relationship
from backend.app.db.session import Base

class WaterSupplyScheme(Base):
    __tablename__ = "water_supply_schemes"

    supply_id = Column(String(50), primary_key=True)  # e.g. 'AKL-SUP-01'
    supply_name = Column(String(200), nullable=False)
    supplier_name = Column(String(200), nullable=False, default="Watercare Services Limited")
    region = Column(String(100), nullable=False, default="Auckland Region")
    compliance_status = Column(String(50), nullable=False, default="Compliant")
    source_water_type = Column(String(100), nullable=False, default="Surface Water Dams & River Intake")
    registered_population = Column(Integer, nullable=False, default=0)
    primary_treatment_plant = Column(String(200), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    zones = relationship("WaterSupplyZone", back_populates="scheme")
