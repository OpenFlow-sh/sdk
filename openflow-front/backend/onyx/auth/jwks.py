"""
JWKS Endpoint for CDP Custom Authentication
Exposes public keys for JWT validation
"""
from fastapi import APIRouter, HTTPException
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.asymmetric import rsa
import base64
import os
import json

router = APIRouter()

# Path to keys (generate once, store securely)
PRIVATE_KEY_PATH = os.getenv("JWT_PRIVATE_KEY_PATH", "./keys/private_key.pem")
PUBLIC_KEY_PATH = os.getenv("JWT_PUBLIC_KEY_PATH", "./keys/public_key.pem")


def load_public_key():
    """Load RSA public key from PEM file"""
    try:
        with open(PUBLIC_KEY_PATH, "rb") as f:
            return serialization.load_pem_public_key(
                f.read(),
                backend=default_backend()
            )
    except FileNotFoundError:
        raise HTTPException(
            status_code=500,
            detail="Public key not found. Run key generation script."
        )


def public_key_to_jwk(public_key) -> dict:
    """Convert RSA public key to JWK format"""
    public_numbers = public_key.public_numbers()
    
    # Convert modulus (n) and exponent (e) to base64url
    n_bytes = public_numbers.n.to_bytes(
        (public_numbers.n.bit_length() + 7) // 8, 
        'big'
    )
    e_bytes = public_numbers.e.to_bytes(
        (public_numbers.e.bit_length() + 7) // 8, 
        'big'
    )
    
    return {
        "kty": "RSA",
        "use": "sig",
        "kid": "openflow-key-1",
        "alg": "RS256",
        "n": base64.urlsafe_b64encode(n_bytes).decode().rstrip('='),
        "e": base64.urlsafe_b64encode(e_bytes).decode().rstrip('=')
    }


@router.get("/.well-known/jwks.json")
async def get_jwks():
    """
    Public endpoint for JWKS
    CDP will call this to validate JWTs
    """
    try:
        public_key = load_public_key()
        jwk = public_key_to_jwk(public_key)
        
        return {
            "keys": [jwk]
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate JWKS: {str(e)}"
        )


# Key generation utility (run once during setup)
def generate_key_pair():
    """Generate RSA key pair for JWT signing"""
    import os
    
    # Create keys directory
    os.makedirs("./keys", exist_ok=True)
    
    # Generate private key
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
        backend=default_backend()
    )
    
    # Save private key
    with open(PRIVATE_KEY_PATH, "wb") as f:
        f.write(private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        ))
    
    # Save public key
    public_key = private_key.public_key()
    with open(PUBLIC_KEY_PATH, "wb") as f:
        f.write(public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        ))
    
    print(f"✅ Keys generated:")
    print(f"   Private: {PRIVATE_KEY_PATH}")
    print(f"   Public: {PUBLIC_KEY_PATH}")


if __name__ == "__main__":
    # Run to generate keys
    generate_key_pair()