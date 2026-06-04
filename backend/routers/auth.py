from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import UserDB, LoginRequest, CreateUserRequest
from ..auth import verify_password, hash_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(UserDB).filter(UserDB.username == req.username).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")
    token = create_access_token({"sub": str(user.id), "nombre": user.nombre})
    return {
        "access_token": token,
        "token_type": "bearer",
        "nombre": user.nombre,
        "user_id": user.id,
    }


@router.get("/me")
def me(current_user: UserDB = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "nombre": current_user.nombre,
        "username": current_user.username,
    }


@router.post("/usuarios", status_code=201)
def crear_usuario(
    req: CreateUserRequest,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user),
):
    if db.query(UserDB).filter(UserDB.username == req.username).first():
        raise HTTPException(400, "El nombre de usuario ya existe")
    user = UserDB(
        nombre=req.nombre,
        username=req.username,
        hashed_password=hash_password(req.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"id": user.id, "nombre": user.nombre, "username": user.username}


@router.get("/usuarios")
def listar_usuarios(
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user),
):
    users = db.query(UserDB).filter(UserDB.activo == True).all()
    return [{"id": u.id, "nombre": u.nombre, "username": u.username} for u in users]
