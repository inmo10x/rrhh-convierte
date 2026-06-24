from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from .database import create_tables, SessionLocal
from .models import UserDB
from .auth import hash_password
from .routers import empleados, liquidaciones, finiquitos, previred
from .routers import auth as auth_router
from .routers import activity_log as log_router
from .routers import backup as backup_router
from .routers import importar as importar_router
from .routers.backup import crear_backup_startup

app = FastAPI(title="RRHH Convierte", version="1.0.1")

_allowed_origins = ["http://localhost:5173", "http://localhost:3000", "http://localhost:8000"]
if os.environ.get("RAILWAY_PUBLIC_DOMAIN"):
    _allowed_origins.append(f"https://{os.environ['RAILWAY_PUBLIC_DOMAIN']}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(empleados.router,       prefix="/api")
app.include_router(liquidaciones.router,   prefix="/api")
app.include_router(finiquitos.router,      prefix="/api")
app.include_router(previred.router,        prefix="/api")
app.include_router(auth_router.router,     prefix="/api")
app.include_router(log_router.router,      prefix="/api")
app.include_router(backup_router.router,   prefix="/api")
app.include_router(importar_router.router, prefix="/api")


@app.on_event("startup")
def startup():
    create_tables()

    # ── Backup automático antes de cualquier cambio ──────────────────────────
    # Se ejecuta en cada deploy. Si la DB tiene datos, los guarda en
    # /data/backups/backup_YYYYMMDD_HHMMSS.json (mismo volumen persistente).
    crear_backup_startup()

    # ── Crear usuario admin por defecto si no existe ninguno ─────────────────
    db = SessionLocal()
    try:
        if db.query(UserDB).count() == 0:
            admin = UserDB(
                nombre="Administrador",
                username="admin",
                hashed_password=hash_password("convierte2026"),
            )
            db.add(admin)
            db.commit()
    finally:
        db.close()


@app.get("/api/health")
def health():
    return {"status": "ok", "app": "RRHH Convierte"}


# Servir frontend en producción
STATIC_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.exists(STATIC_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(STATIC_DIR, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
