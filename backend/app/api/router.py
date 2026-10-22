from fastapi import APIRouter
from backend.app.api.routes import (
    health,
    addresses,
    water_supply,
    zones,
    networks,
    assets,
    incidents,
    auth,
)

api_router = APIRouter()

# Health endpoints mounted at root and /v1
api_router.include_router(health.router)

# Versioned routes (/api/v1/...)
v1_router = APIRouter(prefix="/v1")
v1_router.include_router(addresses.router)
v1_router.include_router(water_supply.router)
v1_router.include_router(zones.router)
v1_router.include_router(networks.router)
v1_router.include_router(assets.router)
v1_router.include_router(incidents.router)
v1_router.include_router(auth.router)

api_router.include_router(v1_router)

# Also mount unversioned aliases directly under /api for convenient frontend consumption
api_router.include_router(addresses.router)
api_router.include_router(water_supply.router)
api_router.include_router(zones.router)
api_router.include_router(networks.router)
api_router.include_router(assets.router)
api_router.include_router(incidents.router)
api_router.include_router(auth.router)
