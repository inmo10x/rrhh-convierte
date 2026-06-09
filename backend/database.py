from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .models import Base

import os
_db_path = os.environ.get("DB_PATH", "./rrhh_convierte.db")
# Crear el directorio si no existe (necesario para el volumen en Railway)
_db_dir = os.path.dirname(os.path.abspath(_db_path))
os.makedirs(_db_dir, exist_ok=True)
DATABASE_URL = f"sqlite:///{_db_path}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def create_tables():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
