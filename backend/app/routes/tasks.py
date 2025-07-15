from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime, date

from app.db import get_session
from app.models import Task, User, TaskStatus
from app.schemas import (
    TaskCreate,
    TaskUpdate,
    TaskStatusUpdate,
    TaskResponse,
    ErrorResponse
)
from app.auth import get_current_user

router = APIRouter()


@router.get(
    "/",
    response_model=List[TaskResponse],
    summary="List user's tasks",
    description="Get all tasks for the current user with optional filtering"
)
async def get_tasks(
    status: Optional[TaskStatus] = Query(None, description="Filter by task status"),
    date_from: Optional[date] = Query(None, description="Filter tasks from this date"),
    date_to: Optional[date] = Query(None, description="Filter tasks to this date"),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get all tasks for the current user with optional filtering"""
    statement = select(Task).where(Task.user_id == current_user.id)
    
    # Apply filters
    if status:
        statement = statement.where(Task.status == status)
    if date_from:
        statement = statement.where(Task.task_date >= date_from)
    if date_to:
        statement = statement.where(Task.task_date <= date_to)
    
    # Order by task_date and start_time
    statement = statement.order_by(Task.task_date, Task.start_time)
    
    tasks = session.exec(statement).all()
    return tasks


@router.post(
    "/",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new task",
    responses={
        422: {"model": ErrorResponse, "description": "Validation error"}
    }
)
async def create_task(
    task_data: TaskCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Create a new task for the current user"""
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        logger.info(f"Creating task with data: {task_data.dict()}")
        
        new_task = Task(
            user_id=current_user.id,
            **task_data.dict()
        )
        
        session.add(new_task)
        session.commit()
        session.refresh(new_task)
        
        logger.info(f"Task created successfully with ID: {new_task.id}")
        return new_task
        
    except Exception as e:
        logger.error(f"Error creating task: {str(e)}")
        logger.error(f"Task data: {task_data.dict()}")
        raise


@router.get(
    "/{task_id}",
    response_model=TaskResponse,
    summary="Get a specific task",
    responses={
        404: {"model": ErrorResponse, "description": "Task not found"}
    }
)
async def get_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get a specific task by ID"""
    task = session.get(Task, task_id)
    
    if not task or task.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    return task


@router.put(
    "/{task_id}",
    response_model=TaskResponse,
    summary="Update a task",
    responses={
        404: {"model": ErrorResponse, "description": "Task not found"},
        422: {"model": ErrorResponse, "description": "Validation error"}
    }
)
async def update_task(
    task_id: int,
    task_data: TaskUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Update a task (full update)"""
    task = session.get(Task, task_id)
    
    if not task or task.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Update only provided fields
    update_data = task_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)
    
    task.updated_at = datetime.utcnow()
    
    session.add(task)
    session.commit()
    session.refresh(task)
    
    return task


@router.patch(
    "/{task_id}/status",
    response_model=TaskResponse,
    summary="Update task status",
    responses={
        404: {"model": ErrorResponse, "description": "Task not found"},
        422: {"model": ErrorResponse, "description": "Validation error"}
    }
)
async def update_task_status(
    task_id: int,
    status_data: TaskStatusUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Update only the status of a task"""
    task = session.get(Task, task_id)
    
    if not task or task.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    task.status = status_data.status
    task.updated_at = datetime.utcnow()
    
    session.add(task)
    session.commit()
    session.refresh(task)
    
    return task


@router.delete(
    "/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a task",
    responses={
        404: {"model": ErrorResponse, "description": "Task not found"}
    }
)
async def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Delete a task"""
    task = session.get(Task, task_id)
    
    if not task or task.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    session.delete(task)
    session.commit()
    
    return None