from sqlalchemy import Column, Integer, String, Float, Boolean, Date, JSON, ForeignKey, Text
from sqlalchemy.orm import declarative_base, relationship
from pydantic import BaseModel
from typing import Optional
from datetime import date

Base = declarative_base()


# ─── ORM Models ──────────────────────────────────────────────────────────────

class UserDB(Base):
    __tablename__ = "users"
    id              = Column(Integer, primary_key=True, index=True)
    nombre          = Column(String, nullable=False)
    username        = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    activo          = Column(Boolean, default=True)
    logs            = relationship("ActivityLogDB", back_populates="user")


class ActivityLogDB(Base):
    __tablename__ = "activity_logs"
    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id"))
    user_nombre = Column(String)
    accion      = Column(String)   # crear | editar | eliminar | guardar | generar | exportar
    entidad     = Column(String)   # empleado | liquidacion | finiquito | previred
    entidad_id  = Column(Integer, nullable=True)
    detalle     = Column(String, nullable=True)
    timestamp   = Column(String)
    user        = relationship("UserDB", back_populates="logs")


class EmpleadoDB(Base):
    __tablename__ = "empleados"
    id                    = Column(Integer, primary_key=True, index=True)
    nombre                = Column(String, nullable=False)
    rut                   = Column(String, unique=True, nullable=False)
    fecha_inicio          = Column(Date, nullable=False)
    cargo                 = Column(String, default="")
    centro_costo          = Column(String, default="Administración")
    sueldo_base           = Column(Float, nullable=False)
    gratificacion_mensual = Column(Float, default=0)
    bonos_fijos           = Column(JSON, default=list)
    colacion              = Column(Float, default=0)
    movilizacion          = Column(Float, default=0)
    afp                   = Column(String, default="ProVida")
    es_fonasa             = Column(Boolean, default=True)
    es_contrato_indefinido = Column(Boolean, default=True)
    dias_feriado_tomados  = Column(Float, default=0)
    cuenta_banco          = Column(String, default="")
    cuenta_tipo           = Column(String, default="Cuenta RUT")
    cuenta_numero         = Column(String, default="")
    # Trabajadores extranjeros
    es_extranjero         = Column(Boolean, default=False)
    pais                  = Column(String, default="Chile")
    moneda                = Column(String, default="CLP")   # "CLP" o "USD"
    forma_pago            = Column(String, default="Transferencia bancaria")
    activo                = Column(Boolean, default=True)
    liquidaciones         = relationship("LiquidacionDB", back_populates="empleado", cascade="all, delete")


class LiquidacionDB(Base):
    __tablename__ = "liquidaciones"
    id             = Column(Integer, primary_key=True, index=True)
    empleado_id    = Column(Integer, ForeignKey("empleados.id"), nullable=False)
    mes            = Column(Integer, nullable=False)
    anio           = Column(Integer, nullable=False)
    dias_trabajados = Column(Integer, default=30)
    dias_licencia  = Column(Integer, default=0)
    dias_vacaciones = Column(Integer, default=0)
    dias_mes       = Column(Integer, default=30)
    horas_extras   = Column(Float, default=0)
    comisiones     = Column(Float, default=0)
    resultado      = Column(JSON)
    empleado       = relationship("EmpleadoDB", back_populates="liquidaciones")


# ─── Pydantic Schemas ─────────────────────────────────────────────────────────

class BonoFijo(BaseModel):
    nombre: str
    monto: float


class EmpleadoCreate(BaseModel):
    nombre: str
    rut: str
    fecha_inicio: date
    cargo: str = ""
    centro_costo: str = "Administración"
    sueldo_base: float
    gratificacion_mensual: float = 0
    bonos_fijos: list[BonoFijo] = []
    colacion: float = 0
    movilizacion: float = 0
    afp: str = "ProVida"
    es_fonasa: bool = True
    es_contrato_indefinido: bool = True
    dias_feriado_tomados: float = 0
    cuenta_banco: str = ""
    cuenta_tipo: str = "Cuenta RUT"
    cuenta_numero: str = ""
    es_extranjero: bool = False
    pais: str = "Chile"
    moneda: str = "CLP"
    forma_pago: str = "Transferencia bancaria"


class EmpleadoUpdate(EmpleadoCreate):
    pass


class EmpleadoOut(EmpleadoCreate):
    id: int
    activo: bool

    class Config:
        from_attributes = True


class LiquidacionInput(BaseModel):
    empleado_id: int
    mes: int
    anio: int
    dias_trabajados: int = 30
    dias_licencia: int = 0
    dias_vacaciones: int = 0
    dias_mes: int = 30
    horas_extras: float = 0
    comisiones: float = 0


class FiniquitoInput(BaseModel):
    empleado_id: int
    fecha_termino: date
    causal: str = "161_1"
    monto_feriado_override: Optional[float] = None
    n_cuotas: int = 1
    fecha_primera_cuota: date
    ciudad_notaria: str = "Santiago"
    fecha_firma: Optional[date] = None


class LoginRequest(BaseModel):
    username: str
    password: str


class CreateUserRequest(BaseModel):
    nombre: str
    username: str
    password: str
