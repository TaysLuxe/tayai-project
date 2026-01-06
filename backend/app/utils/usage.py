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
    Dependency function to check usage limits before processing requests.
    
    This can be used as a FastAPI dependency to automatically check
    usage limits and raise appropriate errors if exceeded.
    
    Usage:
        @router.post("/endpoint")
        async def my_endpoint(
            request: MyRequest,
            _: dict = Depends(check_usage_limit_dependency)
        ):
            # Usage limit already checked, proceed with request
            ...
    
    Raises:
        HTTPException: If usage limit is exceeded
        
    Returns:
        Current user dict (for convenience)
    """
    usage_service = UsageService(db)
    try:
        await usage_service.check_usage_limit(
            current_user["user_id"],
            current_user["tier"]
        )
    except UsageLimitExceededError as e:
        http_exc = to_http_exception(e)
        raise HTTPException(
            status_code=http_exc.status_code,
            detail=e.to_dict()
        )
    
    return current_user

