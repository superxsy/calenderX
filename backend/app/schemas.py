from pydantic import BaseModel, EmailStr, Field
from datetime import datetime, date, time
from typing import Optional
from app.models import TaskStatus


# Auth Schemas
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=100)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    email: str
    created_at: datetime


# Task Schemas
class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    task_date: date
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    tag_name: Optional[str] = Field(None, max_length=50)
    tag_color: Optional[str] = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")
    status: TaskStatus = TaskStatus.TODO


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    task_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    tag_name: Optional[str] = Field(None, max_length=50)
    tag_color: Optional[str] = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")
    status: Optional[TaskStatus] = None


class TaskStatusUpdate(BaseModel):
    status: TaskStatus


class TaskResponse(BaseModel):
    id: int
    user_id: int
    title: str
    description: Optional[str]
    task_date: date
    start_time: Optional[time]
    end_time: Optional[time]
    tag_name: Optional[str]
    tag_color: Optional[str]
    status: TaskStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Error Schemas
class ErrorResponse(BaseModel):
    detail: str