from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import EmpleadoDB, EmpleadoCreate, EmpleadoUpdate, EmpleadoOut, UserDB
from ..auth import get_current_user
from .activity_log import registrar

router = APIRouter(prefix="/empleados", tags=["empleados"])


def _to_db(data: EmpleadoCreate) -> dict:
    d = data.model_dump()
    d["bonos_fijos"] = [b.model_dump() if hasattr(b, "model_dump") else b for b in d["bonos_fijos"]]
    return d


@router.get("/", response_model=list[EmpleadoOut])
def listar(
    solo_activos: bool = True,
    db: Session = Depends(get_db),
    _: UserDB = Depends(get_current_user),
):
    q = db.query(EmpleadoDB)
    if solo_activos:
        q = q.filter(EmpleadoDB.activo == True)
    return q.all()


@router.get("/{id}", response_model=EmpleadoOut)
def obtener(
    id: int,
    db: Session = Depends(get_db),
    _: UserDB = Depends(get_current_user),
):
    emp = db.query(EmpleadoDB).filter(EmpleadoDB.id == id).first()
    if not emp:
        raise HTTPException(404, "Empleado no encontrado")
    return emp


@router.post("/", response_model=EmpleadoOut, status_code=201)
def crear(
    data: EmpleadoCreate,
    db: Session = Depends(get_db),
    user: UserDB = Depends(get_current_user),
):
    emp = EmpleadoDB(**_to_db(data))
    db.add(emp)
    db.commit()
    db.refresh(emp)
    registrar(db, user, "crear", "empleado", emp.id, emp.nombre)
    return emp


@router.put("/{id}", response_model=EmpleadoOut)
def actualizar(
    id: int,
    data: EmpleadoUpdate,
    db: Session = Depends(get_db),
    user: UserDB = Depends(get_current_user),
):
    emp = db.query(EmpleadoDB).filter(EmpleadoDB.id == id).first()
    if not emp:
        raise HTTPException(404, "Empleado no encontrado")
    for k, v in _to_db(data).items():
        setattr(emp, k, v)
    db.commit()
    db.refresh(emp)
    registrar(db, user, "editar", "empleado", emp.id, emp.nombre)
    return emp


@router.delete("/{id}")
def desactivar(
    id: int,
    db: Session = Depends(get_db),
    user: UserDB = Depends(get_current_user),
):
    emp = db.query(EmpleadoDB).filter(EmpleadoDB.id == id).first()
    if not emp:
        raise HTTPException(404, "Empleado no encontrado")
    emp.activo = False
    db.commit()
    registrar(db, user, "eliminar", "empleado", id, emp.nombre)
    return {"ok": True}
