from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import EmpleadoDB, LiquidacionDB, LiquidacionInput
from ..calculators.liquidacion_calc import calcular_liquidacion

router = APIRouter(prefix="/liquidaciones", tags=["liquidaciones"])


def _emp_to_params(emp: EmpleadoDB) -> dict:
    return {
        "sueldo_base":           emp.sueldo_base,
        "gratificacion_mensual": emp.gratificacion_mensual,
        "bonos_fijos":           emp.bonos_fijos or [],
        "colacion":              emp.colacion,
        "movilizacion":          emp.movilizacion,
        "afp":                   emp.afp,
        "es_fonasa":             emp.es_fonasa,
        "es_contrato_indefinido": emp.es_contrato_indefinido,
    }


@router.post("/simular")
def simular(data: LiquidacionInput, db: Session = Depends(get_db)):
    emp = db.query(EmpleadoDB).filter(EmpleadoDB.id == data.empleado_id).first()
    if not emp:
        raise HTTPException(404, "Empleado no encontrado")
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
def guardar(data: LiquidacionInput, db: Session = Depends(get_db)):
    emp = db.query(EmpleadoDB).filter(EmpleadoDB.id == data.empleado_id).first()
    if not emp:
        raise HTTPException(404, "Empleado no encontrado")

    # Evitar duplicados
    existente = db.query(LiquidacionDB).filter(
        LiquidacionDB.empleado_id == data.empleado_id,
        LiquidacionDB.mes == data.mes,
        LiquidacionDB.anio == data.anio,
    ).first()

    result = calcular_liquidacion(
        **_emp_to_params(emp),
        dias_trabajados=data.dias_trabajados,
        dias_licencia=data.dias_licencia,
        dias_vacaciones=data.dias_vacaciones,
        dias_mes=data.dias_mes,
        horas_extras_monto=data.horas_extras,
        comisiones=data.comisiones,
    )

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
    return {"ok": True, "id": liq.id, **result}


@router.get("/mes/{anio}/{mes}")
def por_mes(anio: int, mes: int, db: Session = Depends(get_db)):
    liqs = db.query(LiquidacionDB).filter(
        LiquidacionDB.anio == anio,
        LiquidacionDB.mes == mes,
    ).all()
    return [{"id": l.id, "empleado_id": l.empleado_id, **l.resultado} for l in liqs]


@router.get("/empleado/{empleado_id}")
def por_empleado(empleado_id: int, db: Session = Depends(get_db)):
    liqs = db.query(LiquidacionDB).filter(
        LiquidacionDB.empleado_id == empleado_id
    ).order_by(LiquidacionDB.anio.desc(), LiquidacionDB.mes.desc()).all()
    return liqs
