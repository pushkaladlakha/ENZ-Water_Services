from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.core.errors import ApiError, api_error_handler, generic_http_error_handler
from backend.app.api.router import api_router
from backend.app.db.session import SessionLocal
from backend.app.db.seed import seed_database

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure database tables exist and seed baseline authoritative records
    db = SessionLocal()
    try:
        seed_database(db)
    except Exception as e:
        print(f"[!] Warning during DB startup seeding: {e}")
    finally:
        db.close()
    yield
    # Shutdown logic (if any)

app = FastAPI(
    title="Taumata Arowai GIS Platform API",
    description="Official spatial drinking water register, supply zone management, and reticulation network asset inspection backend for New Zealand.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Exception Handlers
app.add_exception_handler(ApiError, api_error_handler)
app.add_exception_handler(HTTPException, generic_http_error_handler)

# Mount API routes under /api
app.include_router(api_router, prefix="/api")

@app.get("/")
def root():
    return {
        "service": "Taumata Arowai GIS Platform API",
        "docs": "/docs",
        "health": "/api/health",
        "status": "online"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
