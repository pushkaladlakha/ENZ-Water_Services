from pydantic import BaseModel
from typing import Optional, Literal

UserRole = Literal["citizen", "official", "admin"]

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "AuthUserResponse"

class AuthUserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: UserRole
    title: str
    organization: str
    lastLogin: Optional[str] = None
