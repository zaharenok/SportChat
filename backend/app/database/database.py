from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.models import Base
import os

# Database URL
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./sportchat.db")

# Create engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

# Create session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Create tables
async def create_tables():
    Base.metadata.create_all(bind=engine)

# Initialize database with seed data
async def init_db():
    await create_tables()
    # Add seed data here if needed