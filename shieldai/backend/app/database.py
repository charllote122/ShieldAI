from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import logging

logger = logging.getLogger(__name__)

def get_database_engine():
    # Try different SQLite configurations
    db_paths = [
        "/app/shieldai.db",  # Absolute path in container
        "./shieldai.db",     # Relative path
        ":memory:",          # In-memory fallback
    ]
    
    for db_path in db_paths:
        if db_path == ":memory:":
            db_url = "sqlite:///:memory:"
        else:
            db_url = f"sqlite:///{db_path}"
        
        logger.info(f"Trying database: {db_url}")
        
        try:
            if db_path != ":memory:":
                # Try to create the directory if it doesn't exist
                os.makedirs(os.path.dirname(db_path), exist_ok=True)
            
            engine = create_engine(db_url, connect_args={"check_same_thread": False})
            with engine.connect() as conn:
                conn.execute("SELECT 1")
            logger.info(f"✅ Database connection successful: {db_url}")
            return engine
        except Exception as e:
            logger.warning(f"Failed with {db_url}: {e}")
            continue
    
    # Final fallback
    logger.info("🔄 Using in-memory SQLite database as final fallback")
    return create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})


engine = get_database_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    Base.metadata.create_all(bind=engine)
    logger.info("✅ Database tables created")
