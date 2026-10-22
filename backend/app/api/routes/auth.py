from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.schemas.auth import LoginRequest, TokenResponse, AuthUserResponse
from backend.app.services.auth_service import auth_service, get_current_user
from backend.app.db.models.user import AppUser

router = APIRouter(prefix="/auth", tags=["Authentication & RBAC"])

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate with user email and password; returns JWT access token."""
    token_resp = auth_service.authenticate(db, req)
    if not token_resp:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    return token_resp

@router.get("/me", response_model=AuthUserResponse)
def get_current_user_profile(current_user: AppUser = Depends(get_current_user)):
    """Retrieve profile and role of currently authenticated user."""
    return AuthUserResponse(
        id=current_user.id,
        name=current_user.full_name,
        email=current_user.email,
        role=current_user.role,
        title=current_user.job_title or "User",
        organization=current_user.organization,
        lastLogin=current_user.last_login_at.isoformat() if current_user.last_login_at else None
    )
