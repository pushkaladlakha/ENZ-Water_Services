from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.db.session import Base

class WaterSupplyZone(Base):
    __tablename__ = "water_supply_zones"

    zone_id = Column(String(50), primary_key=True)  # e.g. 'AKL-SZ-14'
    zone_name = Column(String(200), nullable=False)
    supply_id = Column(String(50), ForeignKey("water_supply_schemes.supply_id", ondelete="RESTRICT"), nullable=False, index=True)
    urban_rural = Column(String(20), nullable=False, default="Urban")
    zone_population = Column(Integer, nullable=False, default=0)
    supply_latitude = Column(Float, nullable=False)
    supply_longitude = Column(Float, nullable=False)
    geom_geojson = Column(Text, nullable=True)  # GeoJSON polygon/multipolygon string
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    scheme = relationship("WaterSupplyScheme", back_populates="zones")
    demographics = relationship("ZoneDemographic", back_populates="zone", uselist=False, cascade="all, delete-orphan")
    buffers = relationship("SupplyZoneBuffer", back_populates="zone", cascade="all, delete-orphan")
    assets = relationship("WaterNetworkAsset", back_populates="parent_zone")

class ZoneDemographic(Base):
    __tablename__ = "zone_demographics"

    zone_id = Column(String(50), ForeignKey("water_supply_zones.zone_id", ondelete="CASCADE"), primary_key=True)
    pop_registered = Column(Integer, nullable=False, default=0)
    pop_low_deprivation = Column(Integer, nullable=False, default=0)
    pop_moderate_deprivation = Column(Integer, nullable=False, default=0)
    pop_high_deprivation = Column(Integer, nullable=False, default=0)
    pop_maori = Column(Integer, nullable=False, default=0)
    census_source_year = Column(Integer, nullable=False, default=2023)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    zone = relationship("WaterSupplyZone", back_populates="demographics")

class SupplyZoneBuffer(Base):
    __tablename__ = "supply_zone_buffers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    zone_id = Column(String(50), ForeignKey("water_supply_zones.zone_id", ondelete="CASCADE"), nullable=False, index=True)
    distance_tier = Column(String(20), nullable=False)  # '50m', '100m', '200m', '500m', '1500m'
    buffer_distance_meters = Column(Integer, nullable=False)
    geom_geojson = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    zone = relationship("WaterSupplyZone", back_populates="buffers")
