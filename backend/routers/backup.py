"""
Backup automático en cada startup + endpoints para listar y descargar.
Los backups se guardan en /data/backups/ (mismo volumen que la DB).
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session
from ..database import get_db, SessionLocal
from ..models import EmpleadoDB, LiquidacionDB, UserDB
from ..auth import get_current_user
import json, os, glob
from datetime import datetime

router = APIRouter(prefix="/backup", tags=["backup"])

# ─── Ruta del directorio de backups ──────────────────────────────────────────
def _backup_dir() -> str:
    db_path = os.environ.get("DB_PATH", "./rrhh_convierte.db")
    bdir = os.path.join(os.path.dirname(os.path.abspath(db_path)), "backups")
    os.makedirs(bdir, exist_ok=True)
    return bdir


# ─── Función principal: crear backup ─────────────────────────────────────────
def crear_backup_startup():
    """Se llama desde main.py en cada startup. Guarda JSON con toda la data."""
    db = SessionLocal()
    try:
        empleados   = db.query(EmpleadoDB).all()
        liquidaciones = db.query(LiquidacionDB).all()

        if not empleados and not liquidaciones:
            return  # DB vacía, no vale la pena guardar backup

        def _row(obj):
            d = {c.name: getattr(obj, c.name) for c in obj.__table__.columns}
            # Convertir tipos no serializables
            for k, v in d.items():
                if hasattr(v, "isoformat"):
                    d[k] = v.isoformat()
            return d

        backup = {
            "timestamp":    datetime.now().isoformat(),
            "version":      "1.0",
            "empleados":    [_row(e) for e in empleados],
            "liquidaciones": [_row(l) for l in liquidaciones],
        }

        bdir = _backup_dir()
        filename = f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        filepath = os.path.join(bdir, filename)

        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(backup, f, ensure_ascii=False, indent=2)

        # Mantener solo los últimos 15 backups
        all_backups = sorted(glob.glob(os.path.join(bdir, "backup_*.json")))
        for old in all_backups[:-15]:
            os.remove(old)

        print(f"[backup] Guardado: {filename} "
              f"({len(empleados)} empleados, {len(liquidaciones)} liquidaciones)")

    except Exception as e:
        print(f"[backup] Advertencia: no se pudo crear backup: {e}")
    finally:
        db.close()


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/lista")
def listar_backups(_: UserDB = Depends(get_current_user)):
    """Lista todos los backups disponibles con metadata."""
    bdir = _backup_dir()
    files = sorted(glob.glob(os.path.join(bdir, "backup_*.json")), reverse=True)
    result = []
    for fp in files:
        try:
            size_kb = round(os.path.getsize(fp) / 1024, 1)
            with open(fp, "r", encoding="utf-8") as f:
                meta = json.load(f)
            result.append({
                "filename":    os.path.basename(fp),
                "timestamp":   meta.get("timestamp"),
                "empleados":   len(meta.get("empleados", [])),
                "liquidaciones": len(meta.get("liquidaciones", [])),
                "size_kb":     size_kb,
            })
        except Exception:
            continue
    return result


@router.get("/descargar/{filename}")
def descargar_backup(
    filename: str,
    _: UserDB = Depends(get_current_user),
):
    """Descarga un backup específico por nombre de archivo."""
    # Sanitize: solo permite nombres seguros
    if "/" in filename or ".." in filename or not filename.startswith("backup_"):
        raise HTTPException(400, "Nombre de archivo inválido")
    bdir = _backup_dir()
    filepath = os.path.join(bdir, filename)
    if not os.path.exists(filepath):
        raise HTTPException(404, "Backup no encontrado")
    return FileResponse(
        filepath,
        media_type="application/json",
        filename=filename,
    )


@router.get("/descargar-ultimo")
def descargar_ultimo(_: UserDB = Depends(get_current_user)):
    """Descarga el backup más reciente disponible."""
    bdir = _backup_dir()
    files = sorted(glob.glob(os.path.join(bdir, "backup_*.json")))
    if not files:
        raise HTTPException(404, "No hay backups disponibles aún")
    latest = files[-1]
    return FileResponse(
        latest,
        media_type="application/json",
        filename=os.path.basename(latest),
    )
