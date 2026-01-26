"""
Usage Checking Utilities

Provides dependency functions for checking usage limits in endpoints.
"""

import logging
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.services.usage_service import UsageService
from app.core.exceptions import UsageLimitExceededError, to_http_exception
from app.dependencies import get_current_user

logger = logging.getLogger(__name__)


async def check_usage_limit_dependency(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
) -> dict:
    """
    Dependency to check usage limits safely before processing requests.
    """

    # -------------------------------
    # 1. Validate authentication
    # -------------------------------
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )

    # -------------------------------
    # 2. Support dict OR object user
    # -------------------------------
    if isinstance(current_user, dict):
        user_id = current_user.get("user_id")
        tier = current_user.get("tier")
    else:
        # SQLAlchemy / Pydantic model support
        user_id = getattr(current_user, "id", None)
        tier = getattr(current_user, "tier", None)

    if not user_id or not tier:
        logger.error(f"Invalid user payload in usage check: {current_user}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        )

    # -------------------------------
    # 3. Check usage limits
    # -------------------------------
    usage_service = UsageService(db)

    try:
        await usage_service.check_usage_limit(user_id, tier)

    except UsageLimitExceededError as e:
        http_exc = to_http_exception(e)
        raise HTTPException(
            status_code=http_exc.status_code,
            detail=e.to_dict(),
        )

    except Exception:
        # 🔥 Prevent silent 500 crashes
        logger.exception("Usage limit check failed unexpectedly")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Usage check failed",
        )

    # -------------------------------
    # 4. Pass user forward
    # -------------------------------
    return current_user
