from sqlalchemy import create_engine, text
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
    _migrate()


def _migrate():
    """Agrega columnas nuevas a tablas existentes sin borrar datos (SQLite no soporta IF NOT EXISTS en ALTER TABLE)."""
    migraciones = [
        # (tabla, columna, tipo_sql)
        ("empleados", "es_extranjero", "BOOLEAN DEFAULT FALSE"),
        ("empleados", "pais",          "VARCHAR DEFAULT 'Chile'"),
        ("empleados", "moneda",        "VARCHAR DEFAULT 'CLP'"),
        ("empleados", "forma_pago",    "VARCHAR DEFAULT 'Transferencia bancaria'"),
        ("empleados", "es_vendedor",   "BOOLEAN DEFAULT FALSE"),
    ]
    with engine.connect() as conn:
        for tabla, columna, tipo in migraciones:
            try:
                conn.execute(text(f"ALTER TABLE {tabla} ADD COLUMN {columna} {tipo}"))
                conn.commit()
                print(f"[migrate] Columna añadida: {tabla}.{columna}")
            except Exception:
                pass  # La columna ya existe — SQLite lanza error si se intenta agregar de nuevo


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
