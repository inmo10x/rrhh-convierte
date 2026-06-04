from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from ..database import get_db
from ..models import ActivityLogDB, UserDB
from ..auth import get_current_user

router = APIRouter(prefix="/activity-log", tags=["activity-log"])


def registrar(
    db: Session,
    user: UserDB,
    accion: str,
    entidad: str,
    entidad_id: int = None,
    detalle: str = None,
):
    log = ActivityLogDB(
        user_id=user.id,
        user_nombre=user.nombre,
        accion=accion,
        entidad=entidad,
        entidad_id=entidad_id,
        detalle=detalle,
        timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    )
    db.add(log)
    db.commit()


@router.get("/")
def get_logs(
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user),
):
    logs = (
        db.query(ActivityLogDB)
        .order_by(ActivityLogDB.id.desc())
        .limit(300)
        .all()
    )
    return [
        {
            "id": l.id,
            "user_nombre": l.user_nombre,
            "accion": l.accion,
            "entidad": l.entidad,
            "entidad_id": l.entidad_id,
            "detalle": l.detalle,
            "timestamp": l.timestamp,
        }
        for l in logs
    ]
