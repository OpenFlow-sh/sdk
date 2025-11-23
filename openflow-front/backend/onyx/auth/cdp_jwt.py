"""
CDP JWT Generator
Creates JWTs compatible with CDP custom authentication
"""
import jwt
from datetime import datetime, timedelta
from typing import Dict
import os

PRIVATE_KEY_PATH = os.getenv("JWT_PRIVATE_KEY_PATH", "./keys/private_key.pem")
JWT_ISSUER = os.getenv("JWT_ISSUER", "http://localhost:8000")
JWT_AUDIENCE = os.getenv("JWT_AUDIENCE", "openflow-platform")


def load_private_key() -> str:
    """Load private key for JWT signing"""
    with open(PRIVATE_KEY_PATH, "r") as f:
        return f.read()


def create_cdp_jwt(user_id: str, email: str) -> str:
    """
    Create JWT for CDP authentication
    
    Args:
        user_id: Unique user identifier from openflow.sh
        email: User's email address
        
    Returns:
        Signed JWT token
    """
    now = datetime.utcnow()
    
    payload = {
        # Required claims for CDP
        "iss": JWT_ISSUER,  # Must match CDP Portal config
        "sub": user_id,     # Stable user ID (CDP uses this)
        "aud": JWT_AUDIENCE, # Must match CDP Portal config
        "exp": now + timedelta(hours=1),  # Expiration
        "iat": now,  # Issued at
        
        # Optional claims (useful for debugging)
        "email": email,
        "type": "cdp_auth"
    }
    
    private_key = load_private_key()
    
    token = jwt.encode(
        payload, 
        private_key, 
        algorithm="RS256",
        headers={"kid": "openflow-key-1"}  # Key ID from JWKS
    )
    
    return token


def verify_cdp_jwt(token: str) -> Dict:
    """
    Verify JWT (for testing)
    
    Returns:
        Decoded payload if valid
    """
    public_key_path = PRIVATE_KEY_PATH.replace("private", "public")
    with open(public_key_path, "r") as f:
        public_key = f.read()
    
    try:
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            audience=JWT_AUDIENCE,
            issuer=JWT_ISSUER
        )
        return payload
    except jwt.InvalidTokenError as e:
        raise ValueError(f"Invalid JWT: {str(e)}")