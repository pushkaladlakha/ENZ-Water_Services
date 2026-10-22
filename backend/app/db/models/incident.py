from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Boolean, DateTime, Text
from backend.app.db.session import Base

class WaterIncident(Base):
    __tablename__ = "water_incidents"

    id = Column(String(50), primary_key=True)  # e.g. 'NZ-DW-2026-4819'
    category = Column(String(50), nullable=False)
    category_label = Column(String(100), nullable=False)
    severity = Column(String(20), nullable=False, default="high")  # standard, high, critical
    address = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    supply_zone_id = Column(String(50), nullable=True)
    supply_scheme_name = Column(String(200), nullable=True)
    description = Column(Text, nullable=False)
    observed_at = Column(String(50), nullable=False)
    water_supply_type = Column(String(100), nullable=False, default="Municipal Watercare Reticulation")
    boil_water_advised = Column(Boolean, nullable=False, default=False)
    reporter_name = Column(String(150), nullable=False)
    reporter_email = Column(String(255), nullable=False)
    reporter_phone = Column(String(50), nullable=True)
    is_anonymous = Column(Boolean, nullable=False, default=False)
    status = Column(String(50), nullable=False, default="Submitted")  # Submitted, Under Investigation, Sampling Dispatched, Resolved
    officer_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
