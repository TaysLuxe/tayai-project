"""
Admin Endpoints - Administrative operations for TayAI.

Provides:
- Knowledge base CRUD operations
- Bulk upload functionality
- Persona testing
- System statistics
- User management and activity monitoring
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from typing import List, Optional
from datetime import datetime, timedelta

from app.db.database import get_db
from app.db.models import User, ChatMessage, UsageTracking, UserTier, MissingKBItem, QuestionLog, EscalationLog
from app.schemas.knowledge import (
    KnowledgeBaseItem,
    KnowledgeBaseCreate,
    KnowledgeBaseUpdate,
    BulkUploadRequest,
    BulkUploadResult,
    KnowledgeStats,
    SearchRequest,
    SearchResponse,
    SearchResult,
    ReindexResponse
)
from app.schemas.logging import (
    MissingKBItem as MissingKBItemSchema,
    MissingKBItemUpdate,
    QuestionLog as QuestionLogSchema,
    MissingKBStats,
    QuestionStats,
    MissingKBExport,
    QuestionExport,
    LoggingStatsResponse,
    EscalationLog as EscalationLogSchema,
    EscalationLogUpdate,
    EscalationStats,
    MissingKBDashboard,
    MissingKBDashboardItem,
)
from app.schemas.chat import PersonaTestRequest, PersonaTestResponse
from app.schemas.auth import UserResponse
from app.services.knowledge_service import KnowledgeService
from app.services.chat_service import ChatService
from app.services.user_service import UserService
from app.services.usage_service import UsageService
from app.core import ConversationContext
from app.utils import truncate_text
from app.dependencies import get_current_admin

router = APIRouter()


# =============================================================================
# Knowledge Base CRUD
# =============================================================================

@router.post("/knowledge", response_model=KnowledgeBaseItem)
async def create_knowledge_item(
    item: KnowledgeBaseCreate,
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    """Create a new knowledge base item."""
    service = KnowledgeService(db)
    return await service.create_knowledge_item(item)


@router.get("/knowledge", response_model=List[KnowledgeBaseItem])
async def list_knowledge_items(
    category: Optional[str] = None,
    active_only: bool = True,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    """List knowledge base items with optional filtering."""
    from app.core.performance import optimize_query
    service = KnowledgeService(db)
    # Optimize limit to prevent excessive queries
    optimized_limit = min(limit, 500)  # Cap at 500
    return await service.list_knowledge_items(
        category=category,
        active_only=active_only,
        limit=optimized_limit,
        offset=offset
    )


@router.get("/knowledge/{item_id}", response_model=KnowledgeBaseItem)
async def get_knowledge_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    """Get a single knowledge base item."""
    service = KnowledgeService(db)
    item = await service.get_knowledge_item(item_id)
    
    if not item:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Item not found")
    return item


@router.put("/knowledge/{item_id}", response_model=KnowledgeBaseItem)
async def update_knowledge_item(
    item_id: int,
    update: KnowledgeBaseUpdate,
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    """Update an existing knowledge base item."""
    service = KnowledgeService(db)
    item = await service.update_knowledge_item(item_id, update)
    
    if not item:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Item not found")
    return item


@router.delete("/knowledge/{item_id}")
async def delete_knowledge_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    """Delete a knowledge base item."""
    service = KnowledgeService(db)
    deleted = await service.delete_knowledge_item(item_id)
    
    if not deleted:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Item not found")
    return {"message": "Item deleted successfully"}


# =============================================================================
# Bulk Operations
# =============================================================================

@router.post("/knowledge/bulk", response_model=BulkUploadResult)
async def bulk_upload(
    request: BulkUploadRequest,
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    """Bulk upload multiple knowledge base items."""
    service = KnowledgeService(db)
    
    items = [
        KnowledgeBaseCreate(
            title=item.title,
            content=item.content,
            category=item.category
        )
        for item in request.items
    ]
    
    return await service.bulk_create(items)


@router.post("/knowledge/reindex", response_model=ReindexResponse)
async def reindex_knowledge(
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    """Reindex all knowledge base items in PostgreSQL pgvector."""
    service = KnowledgeService(db)
    success, errors = await service.reindex_all()
    
    return ReindexResponse(
        success_count=success,
        error_count=errors,
        message=f"Reindex: {success} success, {errors} errors"
    )


# =============================================================================
# Search & Stats
# =============================================================================

@router.post("/knowledge/search", response_model=SearchResponse)
async def search_knowledge(
    request: SearchRequest,
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    """Search the knowledge base using semantic search."""
    service = KnowledgeService(db)
    results = await service.search_knowledge(
        query=request.query,
        category=request.category,
        top_k=request.top_k
    )
    
    search_results = [
        SearchResult(
            id=r.get("id", ""),
            score=r.get("score", 0),
            title=r.get("metadata", {}).get("title"),
            category=r.get("metadata", {}).get("category"),
            content_preview=truncate_text(r.get("metadata", {}).get("content", ""), 200)
        )
        for r in results
    ]
    
    return SearchResponse(
        query=request.query,
        results=search_results,
        total_results=len(search_results)
    )


@router.get("/knowledge/stats", response_model=KnowledgeStats)
async def get_stats(
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    """Get knowledge base statistics."""
    service = KnowledgeService(db)
    return await service.get_stats()


@router.get("/knowledge/categories")
async def get_categories(
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    """Get all categories with item counts."""
    service = KnowledgeService(db)
    return {"categories": await service.get_categories()}


# =============================================================================
# Persona Testing
# =============================================================================

@router.post("/persona/test", response_model=PersonaTestResponse)
async def test_persona(
    request: PersonaTestRequest,
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    """Test AI persona response without saving to history."""
    # Parse context type if provided
    context_type = None
    if request.context_type:
        try:
            context_type = ConversationContext(request.context_type)
        except ValueError:
            valid = [c.value for c in ConversationContext]
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"Invalid context type. Valid: {valid}"
            )
    
    chat_service = ChatService(db)
    result = await chat_service.test_persona_response(
        test_message=request.message,
        context_type=context_type
    )
    
    return PersonaTestResponse(**result)


@router.get("/persona/context-types")
async def get_context_types(
    admin: dict = Depends(get_current_admin)
):
    """Get available conversation context types."""
    descriptions = {
        ConversationContext.HAIR_EDUCATION: "Hair care and styling advice",
        ConversationContext.BUSINESS_MENTORSHIP: "Business strategy guidance",
        ConversationContext.PRODUCT_RECOMMENDATION: "Product recommendations",
        ConversationContext.TROUBLESHOOTING: "Problem solving",
        ConversationContext.GENERAL: "General conversation"
    }
    
    return {
        "context_types": [
            {"value": ctx.value, "description": descriptions.get(ctx, "")}
            for ctx in ConversationContext
        ]
    }


# =============================================================================
# User Management
# =============================================================================

@router.get("/users", response_model=List[UserResponse])
async def list_users(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    tier: Optional[str] = None,
    active_only: bool = True,
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    """List all users with optional filtering."""
    user_service = UserService(db)
    
    tier_enum = None
    if tier:
        try:
            tier_enum = UserTier(tier)
        except ValueError:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"Invalid tier. Valid: {[t.value for t in UserTier]}"
            )
    
    users = await user_service.list_users(
        limit=limit,
        offset=offset,
        tier=tier_enum,
        active_only=active_only
    )
    
    return [UserResponse.model_validate(u) for u in users]


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    """Get a specific user's details."""
    user_service = UserService(db)
    user = await user_service.get_user_by_id(user_id)
    
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    
    return UserResponse.model_validate(user)


@router.patch("/users/{user_id}")
async def update_user(
    user_id: int,
    tier: Optional[str] = None,
    is_active: Optional[bool] = None,
    is_admin: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    """Update a user's tier or status."""
    user_service = UserService(db)
    
    tier_enum = None
    if tier:
        try:
            tier_enum = UserTier(tier)
        except ValueError:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"Invalid tier. Valid: {[t.value for t in UserTier]}"
            )
    
    user = await user_service.update_user(
        user_id=user_id,
        tier=tier_enum,
        is_active=is_active,
        is_admin=is_admin
    )
    
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    
    return UserResponse.model_validate(user)


@router.get("/users/{user_id}/activity")
async def get_user_activity(
    user_id: int,
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    """Get a user's chat activity."""
    # Verify user exists
    user_service = UserService(db)
    user = await user_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    
    # Get chat history
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.user_id == user_id)
        .order_by(desc(ChatMessage.created_at))
        .limit(limit)
    )
    messages = list(result.scalars().all())
    
    # Get usage stats
    usage_service = UsageService(db)
    usage = await usage_service.get_usage_status(user_id, user.tier.value)
    
    return {
        "user": UserResponse.model_validate(user),
        "usage": usage,
        "recent_messages": [
            {
                "id": m.id,
                "message": truncate_text(m.message, 100),
                "response": truncate_text(m.response, 100) if m.response else None,
                "tokens_used": m.tokens_used,
                "created_at": m.created_at.isoformat() if m.created_at else None
            }
            for m in messages
        ],
        "total_messages": len(messages)
    }


@router.get("/users/{user_id}/usage")
async def get_user_usage(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    """Get a user's usage statistics."""
    user_service = UserService(db)
    user = await user_service.get_user_by_id(user_id)
    
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    
    usage_service = UsageService(db)
    usage = await usage_service.get_usage_status(user_id, user.tier.value)
    
    return usage


# =============================================================================
# System Statistics & Monitoring
# =============================================================================

@router.get("/stats/overview")
async def get_system_overview(
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    """Get system-wide statistics overview."""
    user_service = UserService(db)
    
    # User counts
    total_users = await user_service.get_user_count(active_only=False)
    active_users = await user_service.get_user_count(active_only=True)
    users_by_tier = await user_service.get_users_by_tier()
    
    # Message counts
    result = await db.execute(
        select(func.count(ChatMessage.id))
    )
    total_messages = result.scalar() or 0
    
    # Token usage
    result = await db.execute(
        select(func.sum(ChatMessage.tokens_used))
    )
    total_tokens = result.scalar() or 0
    
    # API costs
    result = await db.execute(
        select(func.sum(UsageTracking.api_cost))
    )
    total_cost_micro = result.scalar() or 0
    total_cost_usd = total_cost_micro / 1_000_000
    
    # Messages today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    result = await db.execute(
        select(func.count(ChatMessage.id))
        .where(ChatMessage.created_at >= today_start)
    )
    messages_today = result.scalar() or 0
    
    # Messages this week
    week_start = today_start - timedelta(days=today_start.weekday())
    result = await db.execute(
        select(func.count(ChatMessage.id))
        .where(ChatMessage.created_at >= week_start)
    )
    messages_this_week = result.scalar() or 0
    
    # Knowledge base stats
    knowledge_service = KnowledgeService(db)
    kb_stats = await knowledge_service.get_stats()
    
    return {
        "users": {
            "total": total_users,
            "active": active_users,
            "by_tier": users_by_tier
        },
        "messages": {
            "total": total_messages,
            "today": messages_today,
            "this_week": messages_this_week
        },
        "tokens": {
            "total_used": total_tokens
        },
        "api_costs": {
            "total_usd": round(total_cost_usd, 4),
            "total_micro_dollars": total_cost_micro
        },
        "knowledge_base": {
            "total_items": kb_stats.total_items,
            "active_items": kb_stats.active_items,
            "categories": kb_stats.categories_count
        }
    }


@router.get("/stats/activity")
async def get_activity_stats(
    days: int = Query(7, ge=1, le=30),
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    """Get activity statistics over time."""
    from sqlalchemy import cast, Date
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Messages per day
    result = await db.execute(
        select(
            cast(ChatMessage.created_at, Date).label('date'),
            func.count(ChatMessage.id).label('count'),
            func.sum(ChatMessage.tokens_used).label('tokens')
        )
        .where(ChatMessage.created_at >= start_date)
        .group_by(cast(ChatMessage.created_at, Date))
        .order_by(cast(ChatMessage.created_at, Date))
    )
    
    daily_stats = [
        {
            "date": str(row.date),
            "messages": row.count,
            "tokens": row.tokens or 0
        }
        for row in result.all()
    ]
    
    # Active users per day
    result = await db.execute(
        select(
            cast(ChatMessage.created_at, Date).label('date'),
            func.count(func.distinct(ChatMessage.user_id)).label('active_users')
        )
        .where(ChatMessage.created_at >= start_date)
        .group_by(cast(ChatMessage.created_at, Date))
        .order_by(cast(ChatMessage.created_at, Date))
    )
    
    active_users_daily = {
        str(row.date): row.active_users
        for row in result.all()
    }
    
    # Merge active users into daily stats
    for stat in daily_stats:
        stat['active_users'] = active_users_daily.get(stat['date'], 0)
    
    return {
        "period_days": days,
        "daily_stats": daily_stats
    }


@router.get("/stats/top-users")
async def get_top_users(
    limit: int = Query(10, ge=1, le=50),
    period_days: int = Query(30, ge=1, le=90),
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    """Get top users by message count."""
    start_date = datetime.utcnow() - timedelta(days=period_days)
    
    result = await db.execute(
        select(
            ChatMessage.user_id,
            func.count(ChatMessage.id).label('message_count'),
            func.sum(ChatMessage.tokens_used).label('tokens_used')
        )
        .where(ChatMessage.created_at >= start_date)
        .group_by(ChatMessage.user_id)
        .order_by(desc('message_count'))
        .limit(limit)
    )
    
    top_users_data = result.all()
    
    # Get user details
    user_service = UserService(db)
    top_users = []
    
    for row in top_users_data:
        user = await user_service.get_user_by_id(row.user_id)
        if user:
            top_users.append({
                "user_id": user.id,
                "username": user.username,
                "tier": user.tier.value,
                "message_count": row.message_count,
                "tokens_used": row.tokens_used or 0
            })
    
    return {
        "period_days": period_days,
        "top_users": top_users
    }


# =============================================================================
# Missing KB Items & Question Logging
# =============================================================================

@router.get("/logs/missing-kb", response_model=List[MissingKBItemSchema])
async def list_missing_kb_items(
    unresolved_only: bool = Query(True, description="Show only unresolved items"),
    namespace: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    """List missing KB items for weekly review and updates."""
    query = select(MissingKBItem)
    
    if unresolved_only:
        query = query.where(MissingKBItem.is_resolved == False)
    
    if namespace:
        query = query.where(MissingKBItem.suggested_namespace == namespace)
    
    query = query.order_by(desc(MissingKBItem.created_at)).limit(limit).offset(offset)
    
    result = await db.execute(query)
    items = list(result.scalars().all())
    
    return [MissingKBItemSchema.model_validate(item) for item in items]


@router.patch("/logs/missing-kb/{item_id}", response_model=MissingKBItemSchema)
async def update_missing_kb_item(
    item_id: int,
    update: MissingKBItemUpdate,
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    """Mark a missing KB item as resolved (e.g., after adding content)."""
    result = await db.execute(select(MissingKBItem).where(MissingKBItem.id == item_id))
    item = result.scalar_one_or_none()
    
    if not item:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Missing KB item not found")
    
    if update.is_resolved is not None:
        item.is_resolved = update.is_resolved
        if update.is_resolved:
            item.resolved_at = datetime.utcnow()
    
    if update.resolved_by_kb_id is not None:
        item.resolved_by_kb_id = update.resolved_by_kb_id
    
    await db.commit()
    await db.refresh(item)
    
    return MissingKBItemSchema.model_validate(item)


@router.get("/logs/missing-kb/stats", response_model=MissingKBStats)
async def get_missing_kb_stats(
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    """Get statistics about missing KB items."""
    # Total counts
    result = await db.execute(
        select(func.count(MissingKBItem.id))
        .where(MissingKBItem.is_resolved == False)
    )
    total_unresolved = result.scalar() or 0
    
    result = await db.execute(
        select(func.count(MissingKBItem.id))
        .where(MissingKBItem.is_resolved == True)
    )
    total_resolved = result.scalar() or 0
    
    # By namespace
    result = await db.execute(
        select(
            MissingKBItem.suggested_namespace,
            func.count(MissingKBItem.id).label('count')
        )
        .where(MissingKBItem.is_resolved == False)
        .group_by(MissingKBItem.suggested_namespace)
    )
    by_namespace = {row.suggested_namespace or "unspecified": row.count for row in result.all()}
    
    # Recent items
    result = await db.execute(
        select(MissingKBItem)
        .where(MissingKBItem.is_resolved == False)
        .order_by(desc(MissingKBItem.created_at))
        .limit(10)
    )
    recent_items = [MissingKBItemSchema.model_validate(item) for item in result.scalars().all()]
    
    # This week (last 7 days)
    week_ago = datetime.utcnow() - timedelta(days=7)
    result = await db.execute(
        select(func.count(MissingKBItem.id))
        .where(
            MissingKBItem.is_resolved == False,
            MissingKBItem.created_at >= week_ago
        )
    )
    this_week = result.scalar() or 0
    
    # Priority items (low RAG score or frequently asked)
    # For now, count items with low RAG scores in metadata
    priority_items = total_unresolved  # Will be refined with frequency data
    
    return MissingKBStats(
        total_unresolved=total_unresolved,
        total_resolved=total_resolved,
        by_namespace=by_namespace,
        recent_items=recent_items,
        this_week=this_week,
        priority_items=priority_items
    )


@router.get("/logs/missing-kb/export", response_model=List[MissingKBExport])
async def export_missing_kb_items(
    unresolved_only: bool = Query(True),
    export_format: str = Query("json", regex="^(json|csv|notion)$", alias="format"),
    days: Optional[int] = Query(None, description="Only export items from last N days"),
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    """Export missing KB items for Notion/Sheets/Airtable integration."""
    from datetime import datetime, timedelta
    
    query = select(MissingKBItem)
    
    if unresolved_only:
        query = query.where(MissingKBItem.is_resolved == False)
    
    if days:
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        query = query.where(MissingKBItem.created_at >= cutoff_date)
    
    query = query.order_by(desc(MissingKBItem.created_at))
    
    result = await db.execute(query)
    items = result.scalars().all()
    
    exports = [
        MissingKBExport(
            id=item.id,
            question=item.question,
            missing_detail=item.missing_detail,
            suggested_namespace=item.suggested_namespace,
            user_id=item.user_id,
            is_resolved=item.is_resolved,
            created_at=item.created_at,
            resolved_at=item.resolved_at
        )
        for item in items
    ]
    
    # If CSV format requested, return as CSV string
    if export_format == "csv":
        import csv
        from io import StringIO
        
        output = StringIO()
        writer = csv.DictWriter(output, fieldnames=[
            "id", "question", "missing_detail", "suggested_namespace",
            "user_id", "is_resolved", "created_at", "resolved_at"
        ])
        writer.writeheader()
        
        for item in exports:
            writer.writerow({
                "id": item.id,
                "question": item.question,
                "missing_detail": item.missing_detail,
                "suggested_namespace": item.suggested_namespace or "",
                "user_id": item.user_id,
                "is_resolved": item.is_resolved,
                "created_at": item.created_at.isoformat() if item.created_at else "",
                "resolved_at": item.resolved_at.isoformat() if item.resolved_at else ""
            })
        
        return Response(content=output.getvalue(), media_type="text/csv")
    
    return exports


@router.get("/logs/questions", response_model=List[QuestionLogSchema])
async def list_question_logs(
    category: Optional[str] = None,
    context_type: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    """List question logs for insights and content development."""
    query = select(QuestionLog)
    
    if category:
        query = query.where(QuestionLog.category == category)
    
    if context_type:
        query = query.where(QuestionLog.context_type == context_type)
    
    query = query.order_by(desc(QuestionLog.created_at)).limit(limit).offset(offset)
    
    result = await db.execute(query)
    items = list(result.scalars().all())
    
    return [QuestionLogSchema.model_validate(item) for item in items]


@router.get("/logs/questions/stats", response_model=QuestionStats)
async def get_question_stats(
    period_days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    """Get statistics about questions asked."""
    start_date = datetime.utcnow() - timedelta(days=period_days)
    
    # Total questions
    result = await db.execute(
        select(func.count(QuestionLog.id))
        .where(QuestionLog.created_at >= start_date)
    )
    total_questions = result.scalar() or 0
    
    # Top questions (by normalized question)
    result = await db.execute(
        select(
            QuestionLog.normalized_question,
            QuestionLog.question,
            func.count(QuestionLog.id).label('count'),
            func.min(QuestionLog.created_at).label('first_asked'),
            func.max(QuestionLog.created_at).label('last_asked')
        )
        .where(QuestionLog.created_at >= start_date)
        .where(QuestionLog.normalized_question.isnot(None))
        .group_by(QuestionLog.normalized_question, QuestionLog.question)
        .order_by(desc('count'))
        .limit(20)
    )
    
    top_questions = [
        {
            "question": row.question,
            "normalized_question": row.normalized_question,
            "count": row.count,
            "first_asked": row.first_asked.isoformat() if row.first_asked else None,
            "last_asked": row.last_asked.isoformat() if row.last_asked else None
        }
        for row in result.all()
    ]
    
    # By category
    result = await db.execute(
        select(
            QuestionLog.category,
            func.count(QuestionLog.id).label('count')
        )
        .where(QuestionLog.created_at >= start_date)
        .where(QuestionLog.category.isnot(None))
        .group_by(QuestionLog.category)
    )
    by_category = {row.category: row.count for row in result.all()}
    
    # By context type
    result = await db.execute(
        select(
            QuestionLog.context_type,
            func.count(QuestionLog.id).label('count')
        )
        .where(QuestionLog.created_at >= start_date)
        .where(QuestionLog.context_type.isnot(None))
        .group_by(QuestionLog.context_type)
    )
    by_context_type = {row.context_type: row.count for row in result.all()}
    
    # Recent questions
    result = await db.execute(
        select(QuestionLog)
        .where(QuestionLog.created_at >= start_date)
        .order_by(desc(QuestionLog.created_at))
        .limit(10)
    )
    recent_questions = [QuestionLogSchema.model_validate(item) for item in result.scalars().all()]
    
    return QuestionStats(
        total_questions=total_questions,
        top_questions=top_questions,
        by_category=by_category,
        by_context_type=by_context_type,
        recent_questions=recent_questions
    )


@router.get("/logs/questions/export", response_model=List[QuestionExport])
async def export_question_logs(
    period_days: int = Query(30, ge=1, le=365),
    export_format: str = Query("json", regex="^(json|csv)$", alias="format"),
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    """Export question logs for insights and content development."""
    start_date = datetime.utcnow() - timedelta(days=period_days)
    
    # Get aggregated questions (by normalized question)
    result = await db.execute(
        select(
            QuestionLog.normalized_question,
            QuestionLog.question,
            QuestionLog.category,
            QuestionLog.context_type,
            QuestionLog.user_tier,
            func.count(QuestionLog.id).label('count'),
            func.min(QuestionLog.created_at).label('first_asked'),
            func.max(QuestionLog.created_at).label('last_asked'),
            func.min(QuestionLog.id).label('sample_id')
        )
        .where(QuestionLog.created_at >= start_date)
        .group_by(
            QuestionLog.normalized_question,
            QuestionLog.question,
            QuestionLog.category,
            QuestionLog.context_type,
            QuestionLog.user_tier
        )
        .order_by(desc('count'))
    )
    
    exports = []
    for row in result.all():
        # Get a sample user_id from one of the logs
        sample_result = await db.execute(
            select(QuestionLog.user_id)
            .where(QuestionLog.id == row.sample_id)
        )
        sample_user_id = sample_result.scalar()
        
        exports.append(
            QuestionExport(
                id=row.sample_id or 0,
                question=row.question or row.normalized_question or "",
                normalized_question=row.normalized_question,
                category=row.category,
                context_type=row.context_type,
                user_id=sample_user_id or 0,
                user_tier=row.user_tier,
                count=row.count,
                first_asked=row.first_asked or datetime.utcnow(),
                last_asked=row.last_asked or datetime.utcnow()
            )
        )
    
    # If CSV format requested, return as CSV string
    if export_format == "csv":
        import csv
        from io import StringIO
        
        output = StringIO()
        writer = csv.DictWriter(output, fieldnames=[
            "question", "normalized_question", "category", "context_type",
            "user_tier", "count", "first_asked", "last_asked"
        ])
        writer.writeheader()
        
        for item in exports:
            writer.writerow({
                "question": item.question,
                "normalized_question": item.normalized_question or "",
                "category": item.category or "",
                "context_type": item.context_type or "",
                "user_tier": item.user_tier or "",
                "count": item.count,
                "first_asked": item.first_asked.isoformat() if item.first_asked else "",
                "last_asked": item.last_asked.isoformat() if item.last_asked else ""
            })
        
        return Response(content=output.getvalue(), media_type="text/csv")
    
    return exports


@router.get("/logs/stats", response_model=LoggingStatsResponse)
async def get_all_logging_stats(
    period_days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    """Get comprehensive logging statistics for dashboard."""
    # Missing KB stats
    missing_kb_result = await get_missing_kb_stats(db=db, admin=admin)
    
    # Question stats
    question_result = await get_question_stats(period_days=period_days, db=db, admin=admin)
    
    return LoggingStatsResponse(
        missing_kb=missing_kb_result,
        questions=question_result
    )


# =============================================================================
# Escalation Tracking
# =============================================================================

@router.get("/logs/escalations", response_model=List[EscalationLogSchema])
async def list_escalations(
    offer: Optional[str] = Query(None, description="Filter by offer type"),
    converted_only: bool = Query(False, description="Show only converted escalations"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    """List escalation logs for conversion tracking and optimization."""
    query = select(EscalationLog)
    
    if offer:
        query = query.where(EscalationLog.offer == offer)
    
    if converted_only:
        query = query.where(EscalationLog.converted == True)
    
    query = query.order_by(desc(EscalationLog.created_at)).limit(limit).offset(offset)
    
    result = await db.execute(query)
    items = list(result.scalars().all())
    
    return [EscalationLogSchema.model_validate(item) for item in items]


@router.get("/logs/escalations/stats", response_model=EscalationStats)
async def get_escalation_stats(
    period_days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    """Get statistics about escalations to paid offerings."""
    start_date = datetime.utcnow() - timedelta(days=period_days)
    
    # Total escalations
    result = await db.execute(
        select(func.count(EscalationLog.id))
        .where(EscalationLog.created_at >= start_date)
    )
    total_escalations = result.scalar() or 0
    
    # By offer
    result = await db.execute(
        select(
            EscalationLog.offer,
            func.count(EscalationLog.id).label('count')
        )
        .where(EscalationLog.created_at >= start_date)
        .group_by(EscalationLog.offer)
    )
    by_offer = {row.offer: row.count for row in result.all()}
    
    # By reason
    result = await db.execute(
        select(
            EscalationLog.escalation_reason,
            func.count(EscalationLog.id).label('count')
        )
        .where(EscalationLog.created_at >= start_date)
        .group_by(EscalationLog.escalation_reason)
    )
    by_reason = {row.escalation_reason or "unspecified": row.count for row in result.all()}
    
    # Conversion rate
    result = await db.execute(
        select(func.count(EscalationLog.id))
        .where(
            EscalationLog.created_at >= start_date,
            EscalationLog.converted == True
        )
    )
    converted_count = result.scalar() or 0
    conversion_rate = (converted_count / total_escalations * 100) if total_escalations > 0 else 0.0
    
    # Recent escalations
    result = await db.execute(
        select(EscalationLog)
        .where(EscalationLog.created_at >= start_date)
        .order_by(desc(EscalationLog.created_at))
        .limit(10)
    )
    recent_escalations = [EscalationLogSchema.model_validate(item) for item in result.scalars().all()]
    
    return EscalationStats(
        total_escalations=total_escalations,
        by_offer=by_offer,
        conversion_rate=round(conversion_rate, 2),
        by_reason=by_reason,
        recent_escalations=recent_escalations
    )


# =============================================================================
# Missing KB Dashboard
# =============================================================================

@router.get("/dashboard/missing-kb", response_model=MissingKBDashboard)
async def get_missing_kb_dashboard(
    namespace: Optional[str] = Query(None, description="Filter by namespace"),
    priority: Optional[str] = Query(None, regex="^(high|medium|low)$", description="Filter by priority"),
    days: int = Query(7, ge=1, le=90, description="Show items from last N days"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=200, description="Items per page"),
    sort_by: str = Query("created_at", regex="^(created_at|frequency|priority)$", description="Sort field"),
    sort_order: str = Query("desc", regex="^(asc|desc)$", description="Sort order"),
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    """
    Get comprehensive dashboard view of missing KB items.
    
    This is the main dashboard for Jumar and Annika to review missing information,
    prioritize uploads, and track the knowledge feedback loop.
    """
    from datetime import timedelta
    
    # Get stats
    stats = await get_missing_kb_stats(db=db, admin=admin)
    
    # Build query
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    query = select(MissingKBItem).where(
        MissingKBItem.is_resolved == False,
        MissingKBItem.created_at >= cutoff_date
    )
    
    if namespace:
        query = query.where(MissingKBItem.suggested_namespace == namespace)
    
    # Get all items to calculate frequency
    result = await db.execute(query)
    all_items = result.scalars().all()
    
    # Group by question to calculate frequency
    question_groups = {}
    for item in all_items:
        # Normalize question for grouping (simple approach)
        normalized = item.question.lower().strip()[:100]  # First 100 chars
        if normalized not in question_groups:
            question_groups[normalized] = []
        question_groups[normalized].append(item)
    
    # Build dashboard items with frequency
    dashboard_items = []
    for normalized_q, items in question_groups.items():
        # Use the most recent item as the representative
        representative = max(items, key=lambda x: x.created_at)
        frequency = len(items)
        
        # Calculate priority
        # High: frequently asked (3+) or low RAG score
        rag_score = None
        if representative.extra_metadata:
            rag_score = representative.extra_metadata.get("rag_score")
        
        if frequency >= 3 or (rag_score is not None and rag_score < 0.5):
            priority_level = "high"
        elif frequency >= 2 or (rag_score is not None and rag_score < 0.7):
            priority_level = "medium"
        else:
            priority_level = "low"
        
        # Filter by priority if requested
        if priority and priority_level != priority:
            continue
        
        # Extract upload guidance from metadata
        upload_guidance = None
        if representative.extra_metadata:
            upload_guidance = representative.extra_metadata.get("upload_guidance")
        
        dashboard_item = MissingKBDashboardItem(
            id=representative.id,
            question=representative.question,
            missing_detail=representative.missing_detail,
            suggested_namespace=representative.suggested_namespace,
            user_id=representative.user_id,
            is_resolved=representative.is_resolved,
            created_at=representative.created_at,
            resolved_at=representative.resolved_at,
            resolved_by_kb_id=representative.resolved_by_kb_id,
            frequency=frequency,
            priority=priority_level,
            rag_score=rag_score,
            user_tier=representative.extra_metadata.get("user_tier") if representative.extra_metadata else None,
            context_type=representative.extra_metadata.get("context_type") if representative.extra_metadata else None,
            upload_guidance=upload_guidance
        )
        dashboard_items.append(dashboard_item)
    
    # Sort items
    if sort_by == "frequency":
        dashboard_items.sort(key=lambda x: x.frequency, reverse=(sort_order == "desc"))
    elif sort_by == "priority":
        priority_order = {"high": 3, "medium": 2, "low": 1}
        dashboard_items.sort(key=lambda x: priority_order.get(x.priority, 0), reverse=(sort_order == "desc"))
    else:  # created_at
        dashboard_items.sort(key=lambda x: x.created_at, reverse=(sort_order == "desc"))
    
    # Paginate
    total_items = len(dashboard_items)
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    paginated_items = dashboard_items[start_idx:end_idx]
    
    return MissingKBDashboard(
        stats=stats,
        items=paginated_items,
        total_items=total_items,
        page=page,
        page_size=page_size
    )


@router.post("/dashboard/missing-kb/bulk-resolve")
async def bulk_resolve_missing_kb(
    item_ids: List[int],
    resolved_by_kb_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    """
    Bulk mark missing KB items as resolved.
    
    Use this after uploading content to resolve multiple items at once.
    """
    if not item_ids:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No item IDs provided")
    
    result = await db.execute(
        select(MissingKBItem).where(MissingKBItem.id.in_(item_ids))
    )
    items = result.scalars().all()
    
    if len(items) != len(item_ids):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Some items not found")
    
    now = datetime.utcnow()
    for item in items:
        item.is_resolved = True
        item.resolved_at = now
        if resolved_by_kb_id:
            item.resolved_by_kb_id = resolved_by_kb_id
    
    await db.commit()
    
    return {
        "resolved_count": len(items),
        "message": f"Successfully resolved {len(items)} missing KB items"
    }


@router.get("/dashboard/missing-kb/weekly-review")
async def get_weekly_review(
    format: str = Query("json", regex="^(json|csv|notion)$", description="Export format"),
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    """
    Get weekly review export for Annika to upload content.
    
    This creates a prioritized list of missing KB items from the last 7 days,
    formatted for easy review and content upload.
    """
    from datetime import timedelta
    
    cutoff_date = datetime.utcnow() - timedelta(days=7)
    
    result = await db.execute(
        select(MissingKBItem)
        .where(
            MissingKBItem.is_resolved == False,
            MissingKBItem.created_at >= cutoff_date
        )
        .order_by(desc(MissingKBItem.created_at))
    )
    
    items = result.scalars().all()
    
    # Group by namespace for organized review
    by_namespace = {}
    for item in items:
        namespace = item.suggested_namespace or "unspecified"
        if namespace not in by_namespace:
            by_namespace[namespace] = []
        
        # Extract metadata
        upload_guidance = None
        rag_score = None
        if item.extra_metadata:
            upload_guidance = item.extra_metadata.get("upload_guidance")
            rag_score = item.extra_metadata.get("rag_score")
        
        by_namespace[namespace].append({
            "id": item.id,
            "question": item.question,
            "missing_detail": item.missing_detail,
            "upload_guidance": upload_guidance,
            "rag_score": rag_score,
            "created_at": item.created_at.isoformat()
        })
    
    if format == "json":
        return {
            "week_start": cutoff_date.isoformat(),
            "total_items": len(items),
            "by_namespace": by_namespace,
            "summary": {
                namespace: len(items_list) 
                for namespace, items_list in by_namespace.items()
            }
        }
    elif format == "csv":
        import csv
        from io import StringIO
        
        output = StringIO()
        writer = csv.DictWriter(output, fieldnames=[
            "id", "namespace", "question", "missing_detail", 
            "upload_guidance", "rag_score", "created_at"
        ])
        writer.writeheader()
        
        for namespace, items_list in by_namespace.items():
            for item in items_list:
                writer.writerow({
                    "id": item["id"],
                    "namespace": namespace,
                    "question": item["question"],
                    "missing_detail": item["missing_detail"],
                    "upload_guidance": item["upload_guidance"] or "",
                    "rag_score": item["rag_score"] or "",
                    "created_at": item["created_at"]
                })
        
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=weekly_kb_review.csv"}
        )
    else:  # notion
        # Format for Notion database import
        notion_items = []
        for namespace, items_list in by_namespace.items():
            for item in items_list:
                notion_items.append({
                    "Question": item["question"],
                    "Missing Detail": item["missing_detail"],
                    "Namespace": namespace,
                    "Upload Guidance": item["upload_guidance"] or "",
                    "Priority": "High" if (item["rag_score"] or 1.0) < 0.5 else "Medium",
                    "Date": item["created_at"][:10],  # Just date
                    "Status": "Unresolved"
                })
        
        return {"items": notion_items, "format": "notion"}


@router.patch("/logs/escalations/{escalation_id}", response_model=EscalationLogSchema)
async def update_escalation(
    escalation_id: int,
    update: EscalationLogUpdate,
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    """Update an escalation log (e.g., mark as converted via webhook)."""
    result = await db.execute(
        select(EscalationLog).where(EscalationLog.id == escalation_id)
    )
    item = result.scalar_one_or_none()
    
    if not item:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Escalation log not found")
    
    if update.converted is not None:
        item.converted = update.converted
        if update.converted:
            item.converted_at = datetime.utcnow()
    
    if update.conversion_tracked is not None:
        item.conversion_tracked = update.conversion_tracked
    
    await db.commit()
    await db.refresh(item)
    
    return EscalationLogSchema.model_validate(item)

