from datetime import datetime, timezone
from sqlalchemy import Column, BigInteger, String, Integer, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.db.session import Base

class WaterNetworkAsset(Base):
    __tablename__ = "water_network_assets"

    compkey = Column(BigInteger, primary_key=True)  # Watercare Computer Key
    asset_category = Column(String(50), nullable=False, index=True)  # pipe, valve, hydrant, treatment_plant, raw_dam, service_reservoir
    asset_name = Column(String(255), nullable=False)
    operational_status = Column(String(50), nullable=False, default="Operational - in use")
    nominal_diameter_mm = Column(Integer, nullable=True)
    material = Column(String(100), nullable=True)
    pressure_class = Column(String(50), nullable=True)
    installation_year = Column(Integer, nullable=True)
    invert_depth_m = Column(Float, nullable=True)
    cctv_condition_score = Column(Integer, nullable=True)
    line_length_m = Column(Float, nullable=True)
    storage_capacity_ml = Column(Float, nullable=True)
    treatment_technology = Column(String(200), nullable=True)
    parent_zone_id = Column(String(50), ForeignKey("water_supply_zones.zone_id", ondelete="SET NULL"), nullable=True, index=True)
    geom_geojson = Column(Text, nullable=True)  # GeoJSON Point or LineString
    engineer_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    parent_zone = relationship("WaterSupplyZone", back_populates="assets")
