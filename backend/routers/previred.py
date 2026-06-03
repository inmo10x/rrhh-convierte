from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import EmpleadoDB, LiquidacionDB
from ..calculators.impuestos_calc import AFP_TASAS, FONASA_TASA
import csv, io

router = APIRouter(prefix="/previred", tags=["previred"])


@router.get("/exportar/{anio}/{mes}")
def exportar(anio: int, mes: int, db: Session = Depends(get_db)):
    liqs = db.query(LiquidacionDB).filter(
        LiquidacionDB.anio == anio,
        LiquidacionDB.mes  == mes,
    ).all()

    if not liqs:
        raise HTTPException(404, f"No hay liquidaciones guardadas para {mes}/{anio}")

    output = io.StringIO()
    writer = csv.writer(output, delimiter=";")

    writer.writerow([
        "RUT", "Nombre", "AFP", "Renta Imponible AFP",
        "Monto AFP (Fondo)", "Comisión AFP",
        "Institución Salud", "Renta Imponible Salud", "Monto Salud",
        "AFC Trabajador", "AFC Empleador",
        "Días Trabajados", "Total Haberes", "Líquido a Pagar",
    ])

    for liq in liqs:
        emp = db.query(EmpleadoDB).filter(EmpleadoDB.id == liq.empleado_id).first()
        if not emp or not liq.resultado:
            continue
        res = liq.resultado
        hi  = res.get("haberes_imponibles", 0)

        afp_data   = AFP_TASAS.get(emp.afp, AFP_TASAS["ProVida"])
        monto_afp  = round(hi * afp_data["ahorro"])
        comision   = round(hi * afp_data["comision"])
        monto_salud = res.get("salud", 0)
        afc_trab   = res.get("afc_trabajador", 0)
        afc_empl   = round(hi * 0.024) if emp.es_contrato_indefinido else round(hi * 0.030)
        inst_salud = "FONASA" if emp.es_fonasa else "ISAPRE"

        writer.writerow([
            emp.rut, emp.nombre, emp.afp,
            int(hi), monto_afp, comision,
            inst_salud, int(hi), monto_salud,
            afc_trab, afc_empl,
            liq.dias_trabajados,
            int(res.get("total_haberes", 0)),
            int(res.get("liquido_a_pagar", 0)),
        ])

    contenido = output.getvalue().encode("utf-8-sig")  # BOM para Excel
    nombre = f"previred_{anio}_{mes:02d}.csv"
    return Response(
        content=contenido,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{nombre}"'},
    )


@router.get("/resumen/{anio}/{mes}")
def resumen(anio: int, mes: int, db: Session = Depends(get_db)):
    liqs = db.query(LiquidacionDB).filter(
        LiquidacionDB.anio == anio,
        LiquidacionDB.mes  == mes,
    ).all()
    total_afp = total_salud = total_afc = total_liquido = 0
    for liq in liqs:
        r = liq.resultado or {}
        total_afp    += r.get("fondo_pensiones", 0) + r.get("comision_afp", 0)
        total_salud  += r.get("salud", 0)
        total_afc    += r.get("afc_trabajador", 0)
        total_liquido += r.get("liquido_a_pagar", 0)
    return {
        "mes": mes, "anio": anio,
        "n_empleados":   len(liqs),
        "total_afp":     int(total_afp),
        "total_salud":   int(total_salud),
        "total_afc":     int(total_afc),
        "total_liquido": int(total_liquido),
    }
