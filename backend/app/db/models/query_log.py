import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, BigInteger, Integer, DateTime, Text, ForeignKey
from backend.app.db.session import Base

class SpatialPropertyQuery(Base):
    __tablename__ = "spatial_property_queries"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("app_users.id", ondelete="SET NULL"), nullable=True)
    queried_address = Column(Text, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    matched_zone_id = Column(String(50), nullable=True)
    matched_pipe_compkey = Column(BigInteger, nullable=True)
    distance_to_main_meters = Column(Float, nullable=True)
    buffer_tier_detected = Column(String(50), nullable=True)
    response_time_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
