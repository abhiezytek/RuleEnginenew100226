"""Authentication and Authorization Module"""
import os
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional
from passlib.context import CryptContext
import jwt
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy import Column, String, Boolean, DateTime, JSON
from sqlalchemy.orm import Session

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production-12345')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)

# User Roles
class UserRole:
    ADMIN = "admin"
    MANAGER = "manager"
    VIEWER = "viewer"

# Permission Matrix
ROLE_PERMISSIONS = {
    UserRole.ADMIN: {
        "can_create_rules": True,
        "can_edit_rules": True,
        "can_delete_rules": True,
        "can_manage_users": True,
        "can_view_rules": True,
        "can_evaluate": True,
        "can_view_audit": True,
        "can_seed_data": True,
    },
    UserRole.MANAGER: {
        "can_create_rules": True,
        "can_edit_rules": True,
        "can_delete_rules": True,
        "can_manage_users": False,
        "can_view_rules": True,
        "can_evaluate": True,
        "can_view_audit": True,
        "can_seed_data": False,
    },
    UserRole.VIEWER: {
        "can_create_rules": False,
        "can_edit_rules": False,
        "can_delete_rules": False,
        "can_manage_users": False,
        "can_view_rules": True,
        "can_evaluate": True,
        "can_view_audit": False,
        "can_seed_data": False,
    }
}

# Pydantic Models
class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    full_name: str
    role: str = UserRole.VIEWER

class UserUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: str
    last_login: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class ChangePassword(BaseModel):
    current_password: str
    new_password: str

# Helper functions
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.PyJWTError:
        return None

def check_permission(role: str, permission: str) -> bool:
    """Check if a role has a specific permission"""
    role_perms = ROLE_PERMISSIONS.get(role, {})
    return role_perms.get(permission, False)
