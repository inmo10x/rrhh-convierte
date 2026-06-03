from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from datetime import date
from ..database import get_db
from ..models import EmpleadoDB, FiniquitoInput
from ..calculators.finiquito_calc import (
    calcular_base_indemnizacion, calcular_finiquito, distribuir_cuotas
)
from ..generators.finiquito_docx import generar_finiquito_docx

router = APIRouter(prefix="/finiquitos", tags=["finiquitos"])


@router.post("/simular")
def simular(data: FiniquitoInput, db: Session = Depends(get_db)):
    emp = db.query(EmpleadoDB).filter(EmpleadoDB.id == data.empleado_id).first()
    if not emp:
        raise HTTPException(404, "Empleado no encontrado")

    base = calcular_base_indemnizacion(
        emp.sueldo_base,
        emp.gratificacion_mensual,
        emp.bonos_fijos or [],
    )
    fin = calcular_finiquito(
        fecha_inicio=emp.fecha_inicio,
        fecha_termino=data.fecha_termino,
        base_indemnizacion=base,
        dias_feriado_tomados=int(emp.dias_feriado_tomados or 0),
        causal=data.causal,
        monto_feriado_override=data.monto_feriado_override,
    )
    cuotas = distribuir_cuotas(fin["total"], data.n_cuotas, data.fecha_primera_cuota)
    return {**fin, "cuotas": cuotas, "base_indemnizacion": base}


@router.post("/generar-docx")
def generar(data: FiniquitoInput, db: Session = Depends(get_db)):
    emp = db.query(EmpleadoDB).filter(EmpleadoDB.id == data.empleado_id).first()
    if not emp:
        raise HTTPException(404, "Empleado no encontrado")

    base = calcular_base_indemnizacion(
        emp.sueldo_base,
        emp.gratificacion_mensual,
        emp.bonos_fijos or [],
    )
    fin = calcular_finiquito(
        fecha_inicio=emp.fecha_inicio,
        fecha_termino=data.fecha_termino,
        base_indemnizacion=base,
        dias_feriado_tomados=int(emp.dias_feriado_tomados or 0),
        causal=data.causal,
        monto_feriado_override=data.monto_feriado_override,
    )
    cuotas = distribuir_cuotas(fin["total"], data.n_cuotas, data.fecha_primera_cuota)

    empleado_dict = {
        "nombre": emp.nombre,
        "rut":    emp.rut,
        "cuenta_bancaria": {
            "banco":  emp.cuenta_banco,
            "tipo":   emp.cuenta_tipo,
            "numero": emp.cuenta_numero,
        },
    }

    docx_bytes = generar_finiquito_docx(
        empleado=empleado_dict,
        finiquito=fin,
        cuotas=cuotas,
        ciudad_notaria=data.ciudad_notaria,
        fecha_firma=data.fecha_firma or date.today(),
    )

    nombre_archivo = f"finiquito_{emp.nombre.replace(' ', '_').lower()}_{data.fecha_termino}.docx"
    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{nombre_archivo}"'},
    )
