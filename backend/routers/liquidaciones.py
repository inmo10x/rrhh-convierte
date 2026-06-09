from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import EmpleadoDB, LiquidacionDB, LiquidacionInput, UserDB
from ..calculators.liquidacion_calc import calcular_liquidacion
from ..auth import get_current_user
from .activity_log import registrar

router = APIRouter(prefix="/liquidaciones", tags=["liquidaciones"])


def _emp_to_params(emp: EmpleadoDB) -> dict:
    return {
        "sueldo_base":            emp.sueldo_base,
        "gratificacion_mensual":  emp.gratificacion_mensual,
        "bonos_fijos":            emp.bonos_fijos or [],
        "colacion":               emp.colacion,
        "movilizacion":           emp.movilizacion,
        "afp":                    emp.afp,
        "es_fonasa":              emp.es_fonasa,
        "es_contrato_indefinido": emp.es_contrato_indefinido,
    }


def _calc_extranjero(emp: EmpleadoDB, data) -> dict:
    """Liquidación simplificada para trabajadores extranjeros (sin descuentos legales CL)."""
    factor = data.dias_trabajados / data.dias_mes if data.dias_mes else 1
    sueldo_mes   = round(emp.sueldo_base * factor, 2)
    bonos        = sum(b.get("monto", 0) for b in (emp.bonos_fijos or []))
    horas_extras = data.horas_extras
    comisiones   = data.comisiones
    total_haberes = sueldo_mes + bonos + horas_extras + comisiones
    return {
        "liquido_a_pagar":    total_haberes,
        "total_haberes":      total_haberes,
        "total_descuentos":   0,
        "sueldo_mes":         sueldo_mes,
        "gratificacion":      0,
        "bonos_fijos":        bonos,
        "horas_extras":       horas_extras,
        "comisiones":         comisiones,
        "colacion":           0,
        "movilizacion":       0,
        "haberes_imponibles": sueldo_mes,
        "base_tributable":    0,
        "fondo_pensiones":    0,
        "comision_afp":       0,
        "afc_trabajador":     0,
        "salud":              0,
        "impuesto_unico":     0,
        "dias_trabajados":    data.dias_trabajados,
        "moneda":             getattr(emp, "moneda", "CLP"),
        "es_extranjero":      True,
    }


@router.post("/simular")
def simular(
    data: LiquidacionInput,
    db: Session = Depends(get_db),
    _: UserDB = Depends(get_current_user),
):
    emp = db.query(EmpleadoDB).filter(EmpleadoDB.id == data.empleado_id).first()
    if not emp:
        raise HTTPException(404, "Empleado no encontrado")
    if getattr(emp, "es_extranjero", False):
        result = _calc_extranjero(emp, data)
    else:
        result = calcular_liquidacion(
            **_emp_to_params(emp),
            dias_trabajados=data.dias_trabajados,
            dias_licencia=data.dias_licencia,
            dias_vacaciones=data.dias_vacaciones,
            dias_mes=data.dias_mes,
            horas_extras_monto=data.horas_extras,
            comisiones=data.comisiones,
        )
    return {"empleado": emp.nombre, "mes": data.mes, "anio": data.anio, **result}


@router.post("/guardar")
def guardar(
    data: LiquidacionInput,
    db: Session = Depends(get_db),
    user: UserDB = Depends(get_current_user),
):
    emp = db.query(EmpleadoDB).filter(EmpleadoDB.id == data.empleado_id).first()
    if not emp:
        raise HTTPException(404, "Empleado no encontrado")

    if getattr(emp, "es_extranjero", False):
        result = _calc_extranjero(emp, data)
    else:
        result = calcular_liquidacion(
            **_emp_to_params(emp),
            dias_trabajados=data.dias_trabajados,
            dias_licencia=data.dias_licencia,
            dias_vacaciones=data.dias_vacaciones,
            dias_mes=data.dias_mes,
            horas_extras_monto=data.horas_extras,
            comisiones=data.comisiones,
        )

    existente = db.query(LiquidacionDB).filter(
        LiquidacionDB.empleado_id == data.empleado_id,
        LiquidacionDB.mes == data.mes,
        LiquidacionDB.anio == data.anio,
    ).first()

    if existente:
        existente.resultado = result
        existente.dias_trabajados = data.dias_trabajados
        existente.dias_licencia   = data.dias_licencia
        existente.dias_vacaciones = data.dias_vacaciones
        liq = existente
    else:
        liq = LiquidacionDB(
            empleado_id=data.empleado_id,
            mes=data.mes, anio=data.anio,
            dias_trabajados=data.dias_trabajados,
            dias_licencia=data.dias_licencia,
            dias_vacaciones=data.dias_vacaciones,
            dias_mes=data.dias_mes,
            horas_extras=data.horas_extras,
            comisiones=data.comisiones,
            resultado=result,
        )
        db.add(liq)
    db.commit()

    registrar(db, user, "guardar", "liquidacion", liq.id,
              f"{emp.nombre} — {data.mes}/{data.anio}")
    return {"ok": True, "id": liq.id, **result}


@router.get("/mes/{anio}/{mes}")
def por_mes(
    anio: int,
    mes: int,
    db: Session = Depends(get_db),
    _: UserDB = Depends(get_current_user),
):
    liqs = db.query(LiquidacionDB).filter(
        LiquidacionDB.anio == anio,
        LiquidacionDB.mes == mes,
    ).all()
    return [{"id": l.id, "empleado_id": l.empleado_id, **l.resultado} for l in liqs]


@router.get("/empleado/{empleado_id}")
def por_empleado(
    empleado_id: int,
    db: Session = Depends(get_db),
    _: UserDB = Depends(get_current_user),
):
    liqs = db.query(LiquidacionDB).filter(
        LiquidacionDB.empleado_id == empleado_id
    ).order_by(LiquidacionDB.anio.desc(), LiquidacionDB.mes.desc()).all()
    return liqs
