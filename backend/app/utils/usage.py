"""
Usage Checking Utilities

Provides dependency functions for checking usage limits in endpoints.
"""
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.services.usage_service import UsageService
from app.core.exceptions import UsageLimitExceededError, to_http_exception
from app.dependencies import get_current_user

async def check_usage_limit_dependency(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
) -> dict:
    """
    Dependency to check usage limits safely.
    """

    # ✅ Validate current_user structure
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )

    user_id = current_user.get("user_id")
    tier = current_user.get("tier")

    if not user_id or not tier:
        logger.error(f"Invalid user payload: {current_user}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token"
        )

    usage_service = UsageService(db)

    try:
        await usage_service.check_usage_limit(user_id, tier)

    except UsageLimitExceededError as e:
        http_exc = to_http_exception(e)
        raise HTTPException(
            status_code=http_exc.status_code,
            detail=e.to_dict()
        )

    except Exception as e:
        # 🔥 THIS WAS MISSING (critical)
        logger.exception("Usage limit check failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Usage check failed"
        )

    return current_user

