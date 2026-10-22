from datetime import datetime, timezone
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.db.models.user import AppUser
from backend.app.schemas.auth import LoginRequest, TokenResponse, AuthUserResponse
from backend.app.core.security import verify_password, create_access_token, decode_access_token

security_scheme = HTTPBearer(auto_error=False)

class AuthService:
    def authenticate(self, db: Session, req: LoginRequest) -> Optional[TokenResponse]:
        user = db.query(AppUser).filter(AppUser.email == req.email.strip().lower()).first()
        if not user or not user.is_active:
            return None
        
        if not verify_password(req.password, user.password_hash):
            return None
        
        user.last_login_at = datetime.now(timezone.utc)
        db.commit()

        token = create_access_token(subject=user.id, role=user.role)
        user_resp = AuthUserResponse(
            id=user.id,
            name=user.full_name,
            email=user.email,
            role=user.role,
            title=user.job_title or "User",
            organization=user.organization,
            lastLogin=user.last_login_at.isoformat() if user.last_login_at else None
        )
        return TokenResponse(
            access_token=token,
            token_type="bearer",
            user=user_resp
        )

auth_service = AuthService()

def get_current_user_optional(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db)
) -> Optional[AppUser]:
    """Optional user dependency for public endpoints with RBAC enhancements."""
    if not auth:
        return None
    payload = decode_access_token(auth.credentials)
    if not payload:
        return None
    user_id = payload.get("sub")
    if not user_id:
        return None
    return db.query(AppUser).filter(AppUser.id == user_id).first()

def get_current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db)
) -> AppUser:
    """Strict authenticated user dependency."""
    if not auth:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing authorization header")
    payload = decode_access_token(auth.credentials)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired bearer token")
    user_id = payload.get("sub")
    user = db.query(AppUser).filter(AppUser.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account is inactive or not found")
    return user

def require_official_or_admin(user: AppUser = Depends(get_current_user)) -> AppUser:
    if user.role not in ["official", "admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access restricted to Authorized Officials or Administrators")
    return user

def require_admin(user: AppUser = Depends(get_current_user)) -> AppUser:
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access restricted to System Administrators")
    return user
