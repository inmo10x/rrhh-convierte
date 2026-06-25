"""
Genera la liquidación de sueldo en PDF, formato clásico chileno:
encabezado empresa → datos trabajador → haberes / asistencia / descuentos
→ totales → líquido a pagar.
"""
import io
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

EMPRESA = "AGENCIA CONVIERTE SPA"
EMPRESA_RUT = "77.450.452-4"

MESES = ["", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio",
         "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]


def _clp(v) -> str:
    return f"${round(v or 0):,}".replace(",", ".")


def _usd(v) -> str:
    return f"USD {v or 0:,.2f}"


def generar_liquidacion_pdf(emp, mes: int, anio: int, res: dict) -> bytes:
    """emp: EmpleadoDB · res: dict resultado de la liquidación."""
    es_ext = bool(res.get("es_extranjero"))
    fmt = _usd if (es_ext and res.get("moneda") == "USD") else _clp

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=letter,
        leftMargin=18*mm, rightMargin=18*mm, topMargin=16*mm, bottomMargin=16*mm,
        title=f"Liquidación {emp.nombre} {mes:02d}-{anio}",
    )

    styles = getSampleStyleSheet()
    bold = ParagraphStyle("bold", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=9)
    norm = ParagraphStyle("norm", parent=styles["Normal"], fontSize=9)
    titulo = ParagraphStyle("titulo", parent=styles["Normal"], fontName="Helvetica-Bold",
                            fontSize=12, alignment=1)

    borde = TableStyle([
        ("BOX", (0, 0), (-1, -1), 1.2, colors.black),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ])

    elems = []

    elems.append(Paragraph("LIQUIDACIÓN DE SUELDO", titulo))
    elems.append(Spacer(1, 6))

    # ── Encabezado empresa ────────────────────────────────────────────────
    enc = Table([
        [Paragraph("<b>EMPRESA</b>", bold), Paragraph(EMPRESA, norm),
         Paragraph("<b>MES</b>", bold), Paragraph(f"{MESES[mes]} {anio}", norm)],
        [Paragraph("<b>RUT</b>", bold), Paragraph(EMPRESA_RUT, norm), "", ""],
    ], colWidths=[28*mm, 80*mm, 22*mm, 45*mm])
    enc.setStyle(borde)
    elems.append(enc)
    elems.append(Spacer(1, 6))

    # ── Datos trabajador ──────────────────────────────────────────────────
    prevision = "—" if es_ext else (emp.afp or "")
    salud_lbl = "—" if es_ext else ("FONASA" if emp.es_fonasa else "ISAPRE")
    trab = Table([
        [Paragraph("<b>NOMBRE</b>", bold), Paragraph(emp.nombre.upper(), norm),
         Paragraph("<b>CARGO</b>", bold), Paragraph(emp.cargo or "—", norm)],
        [Paragraph("<b>RUT</b>", bold), Paragraph(emp.rut, norm),
         Paragraph("<b>AFP</b>", bold), Paragraph(prevision, norm)],
        [Paragraph("<b>C. COSTO</b>", bold), Paragraph(emp.centro_costo or "—", norm),
         Paragraph("<b>SALUD</b>", bold), Paragraph(salud_lbl, norm)],
    ] + ([[Paragraph("<b>PAÍS</b>", bold), Paragraph(emp.pais or "", norm),
           Paragraph("<b>PAGO</b>", bold), Paragraph(emp.forma_pago or "", norm)]] if es_ext else []),
        colWidths=[28*mm, 80*mm, 22*mm, 45*mm])
    trab.setStyle(borde)
    elems.append(trab)
    elems.append(Spacer(1, 8))

    # ── Cuerpo: haberes | descuentos ──────────────────────────────────────
    haberes = [
        ("Sueldo del mes",        res.get("sueldo_mes")),
        ("Gratificación",         res.get("gratificacion")),
        ("Bonos",                 res.get("bonos_fijos")),
        ("Horas extras",          res.get("horas_extras")),
        ("Comisiones",            res.get("comisiones")),
        ("Semana corrida",        res.get("semana_corrida")),
        ("Vacaciones (art. 71)",  res.get("vacaciones_art71")),
        ("Colación",              res.get("colacion")),
        ("Movilización",          res.get("movilizacion")),
    ]
    descuentos = [
        ("Fondo de pensiones", res.get("fondo_pensiones")),
        ("Comisión AFP",       res.get("comision_afp")),
        ("AFC trabajador",     res.get("afc_trabajador")),
        ("Salud",              res.get("salud")),
        ("Impuesto único",     res.get("impuesto_unico")),
        ("Otros descuentos",   res.get("otros_descuentos")),
    ]

    filas_h = [(n, fmt(v)) for n, v in haberes if v]
    filas_d = [(n, fmt(v)) for n, v in descuentos if v]
    if es_ext and not filas_d:
        filas_d = [("No aplican descuentos legales chilenos", "")]

    n_filas = max(len(filas_h), len(filas_d), 1)
    filas_h += [("", "")] * (n_filas - len(filas_h))
    filas_d += [("", "")] * (n_filas - len(filas_d))

    cuerpo_data = [[
        Paragraph("<b>= = =  H A B E R E S  = = =</b>", bold), "",
        Paragraph("<b>= = =  D E S C U E N T O S  = = =</b>", bold), "",
    ]]
    for (hn, hv), (dn, dv) in zip(filas_h, filas_d):
        cuerpo_data.append([Paragraph(hn, norm), Paragraph(hv, norm),
                            Paragraph(dn, norm), Paragraph(dv, norm)])
    cuerpo_data.append([
        Paragraph("<b>TOTAL HABERES</b>", bold), Paragraph(f"<b>{fmt(res.get('total_haberes'))}</b>", bold),
        Paragraph("<b>TOTAL DESCUENTOS</b>", bold), Paragraph(f"<b>{fmt(res.get('total_descuentos'))}</b>", bold),
    ])

    cuerpo = Table(cuerpo_data, colWidths=[55*mm, 32*mm, 56*mm, 32*mm])
    cuerpo.setStyle(TableStyle([
        ("BOX", (0, 0), (1, -1), 1.2, colors.black),
        ("BOX", (2, 0), (3, -1), 1.2, colors.black),
        ("LINEBELOW", (0, 0), (-1, 0), 0.8, colors.black),
        ("LINEABOVE", (0, -1), (-1, -1), 0.8, colors.black),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("ALIGN", (3, 0), (3, -1), "RIGHT"),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    elems.append(cuerpo)
    elems.append(Spacer(1, 6))

    # ── Asistencia ────────────────────────────────────────────────────────
    asis = Table([[
        Paragraph("<b>Días trabajados</b>", bold), Paragraph(str(res.get("dias_trabajados", "")), norm),
        Paragraph("<b>Días licencia</b>", bold), Paragraph(str(res.get("dias_licencia", 0)), norm),
        Paragraph("<b>Días vacaciones</b>", bold), Paragraph(str(res.get("dias_vacaciones", 0)), norm),
    ]], colWidths=[33*mm, 25*mm, 30*mm, 25*mm, 35*mm, 27*mm])
    asis.setStyle(borde)
    elems.append(asis)
    elems.append(Spacer(1, 10))

    # ── Líquido a pagar ───────────────────────────────────────────────────
    liq = Table([[
        Paragraph("<b>LÍQUIDO A PAGAR</b>",
                  ParagraphStyle("liq", parent=bold, fontSize=11)),
        Paragraph(f"<b>{fmt(res.get('liquido_a_pagar'))}</b>",
                  ParagraphStyle("liqv", parent=bold, fontSize=12, alignment=2)),
    ]], colWidths=[100*mm, 75*mm])
    liq.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 1.6, colors.black),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    elems.append(liq)
    elems.append(Spacer(1, 22))

    # ── Firma ─────────────────────────────────────────────────────────────
    firma = Table([[
        Paragraph("_______________________________<br/>Firma empleador", norm),
        Paragraph("_______________________________<br/>Firma trabajador", norm),
    ]], colWidths=[87*mm, 87*mm])
    firma.setStyle(TableStyle([("ALIGN", (0, 0), (-1, -1), "CENTER")]))
    elems.append(firma)

    doc.build(elems)
    return buf.getvalue()
