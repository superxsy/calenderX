from sqlmodel import SQLModel, create_engine, Session
import os
from pathlib import Path

# Database file path - store in backend directory
DATABASE_PATH = Path(__file__).parent.parent / "calendarx.db"
DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

# Create engine with check_same_thread=False for SQLite
engine = create_engine(
    DATABASE_URL,
    echo=False,  # Set to True for SQL debugging
    connect_args={"check_same_thread": False}
)


def create_db_and_tables():
    """Create database and all tables"""
    SQLModel.metadata.create_all(engine)


def get_session():
    """Dependency to get database session"""
    with Session(engine) as session:
        yield session