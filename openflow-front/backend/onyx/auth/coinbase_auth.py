"""
Coinbase CDP Authentication
Handles user creation/login via Coinbase CDP Embedded Wallets
"""
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from onyx.auth.schemas import UserCreate
from onyx.auth.users import (
    UserManager,
    get_user_manager,
    auth_backend,
    generate_password,
)
from onyx.db.engine.async_sql_engine import get_async_session
from onyx.db.models import User
from onyx.utils.logger import setup_logger
from fastapi_users import exceptions

logger = setup_logger()

router = APIRouter()


class CoinbaseLoginRequest(BaseModel):
    email: str
    coinbase_user_id: str
    wallet_address: str


class CoinbaseLoginResponse(BaseModel):
    success: bool
    user: dict


@router.post("/auth/coinbase-login")
async def coinbase_login(
    request: Request,
    body: CoinbaseLoginRequest,
    user_manager: UserManager = Depends(get_user_manager),
    db_session: AsyncSession = Depends(get_async_session),
) -> Response:
    """
    Authenticate or create user via Coinbase CDP
    
    This endpoint:
    1. Checks if user exists by email
    2. If not, creates a new user
    3. Updates user with Coinbase wallet address
    4. Creates session and sets cookie
    5. Returns user data
    """
    try:
        email = body.email.lower()
        logger.info(f"Coinbase login attempt for email: {email}")
        
        # Try to get existing user
        user: Optional[User] = None
        try:
            user = await user_manager.get_by_email(email)
            logger.info(f"Found existing user: {user.id}")
            
            # Update user with wallet address if not set
            if not hasattr(user, 'wallet_address') or not user.wallet_address:
                await user_manager.user_db.update(
                    user,
                    {"wallet_address": body.wallet_address}
                )
                logger.info(f"Updated wallet address for user {user.id}")
                
        except exceptions.UserNotExists:
            logger.info(f"User not found, creating new user for {email}")
            
            # Create new user with Coinbase authentication
            user_create = UserCreate(
                email=email,
                password=generate_password(),  # Random password, won't be used
                is_verified=True,  # Coinbase handles verification
            )
            
            try:
                user = await user_manager.create(user_create, safe=False, request=request)
                
                # Update with wallet address
                await user_manager.user_db.update(
                    user,
                    {"wallet_address": body.wallet_address}
                )
                
                logger.info(f"Created new user with Coinbase: {user.id}")
                
            except exceptions.UserAlreadyExists:
                # Race condition - user was created between check and create
                user = await user_manager.get_by_email(email)
                logger.info(f"User created in race condition: {user.id}")
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create or retrieve user"
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User account is disabled"
            )
        
        # Create authentication session using the same backend as regular login
        strategy = await auth_backend.get_strategy()
        response = await auth_backend.login(strategy, user)
        await user_manager.on_after_login(user, request, response)
        
        # Return user data with session cookie set
        return Response(
            content='{"success": true, "user": {"id": "' + str(user.id) + '", "email": "' + user.email + '"}}',
            status_code=200,
            headers=dict(response.headers),
            media_type="application/json"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Coinbase login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication failed: {str(e)}"
        )