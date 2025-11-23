"""
CDP Authentication Routes
Provides JWT endpoint for CDP Embedded Wallets authentication
"""
from fastapi import APIRouter, Depends, HTTPException
from onyx.auth.cdp_jwt import create_cdp_jwt
from onyx.auth.users import current_user
from onyx.db.models import User

router = APIRouter()


@router.get("/auth/cdp-jwt")
async def get_cdp_jwt(user: User | None = Depends(current_user)):
    """
    Generate CDP-compatible JWT for authenticated user
    Called by frontend after openflow.sh login
    """
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        jwt_token = create_cdp_jwt(
            user_id=str(user.id),
            email=user.email
        )
        
        return {
            "token": jwt_token,
            "user_id": str(user.id),
            "email": user.email
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate CDP JWT: {str(e)}"
        )