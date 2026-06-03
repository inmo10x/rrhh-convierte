from datetime import date
from dateutil.relativedelta import relativedelta


DIAS_HABILES_POR_MES = 1.25   # Art. 67 CT: 15 días hábiles por cada 11 meses trabajados


def calcular_base_indemnizacion(
    sueldo_base: float,
    gratificacion_mensual: float,
    bonos_fijos: list[dict],
) -> float:
    """
    Base de cálculo para indemnizaciones y aviso previo (art. 172 CT).
    Incluye: sueldo base + gratificación mensual + bonos fijos permanentes.
    No incluye: colación, movilización, bonos esporádicos.
    Tope: 90 UF (no aplicado aquí — el operador debe verificar si supera el tope).
    """
    return sueldo_base + gratificacion_mensual + sum(b["monto"] for b in bonos_fijos)


def calcular_anos_servicio(fecha_inicio: date, fecha_termino: date) -> dict:
    """
    Calcula años de servicio para indemnización.
    Art. 163: fracción > 6 meses se redondea al año siguiente.
    """
    diff = relativedelta(fecha_termino, fecha_inicio)
    anos = diff.years
    meses_fraccion = diff.months
    dias_fraccion  = diff.days

    # Fracción superior a 6 meses → cuenta como año completo
    if meses_fraccion > 6 or (meses_fraccion == 6 and dias_fraccion > 0):
        anos_indemnizacion = anos + 1
        fraccion_redondeada = True
    else:
        anos_indemnizacion = anos
        fraccion_redondeada = False

    return {
        "anos_exactos":         anos,
        "meses_fraccion":       meses_fraccion,
        "dias_fraccion":        dias_fraccion,
        "anos_indemnizacion":   anos_indemnizacion,
        "fraccion_redondeada":  fraccion_redondeada,
    }


def calcular_feriado_proporcional(
    fecha_inicio: date,
    fecha_termino: date,
    dias_tomados: int,
    base_diaria: float | None = None,
    monto_feriado_override: float | None = None,
) -> dict:
    """
    Calcula feriado proporcional pendiente.
    Si se entrega monto_feriado_override, se usa directamente (viene de contabilidad).
    Si no, se calcula: 1.25 días hábiles por mes * meses trabajados - días tomados.
    """
    if monto_feriado_override is not None:
        return {
            "dias_habiles_acumulados": None,
            "dias_tomados":            dias_tomados,
            "dias_pendientes":         None,
            "monto":                   round(monto_feriado_override),
            "fuente":                  "contabilidad",
        }

    diff = relativedelta(fecha_termino, fecha_inicio)
    meses_totales = diff.years * 12 + diff.months + (1 if diff.days > 0 else 0)
    dias_acumulados = round(meses_totales * DIAS_HABILES_POR_MES, 2)
    dias_pendientes = max(0, dias_acumulados - dias_tomados)

    monto = 0
    if base_diaria:
        monto = round(dias_pendientes * base_diaria)

    return {
        "dias_habiles_acumulados": dias_acumulados,
        "dias_tomados":            dias_tomados,
        "dias_pendientes":         round(dias_pendientes, 2),
        "monto":                   monto,
        "fuente":                  "calculado",
    }


def calcular_finiquito(
    fecha_inicio: date,
    fecha_termino: date,
    base_indemnizacion: float,
    dias_feriado_tomados: int,
    causal: str,                        # "161_1", "159_1", "159_2", etc.
    monto_feriado_override: float | None = None,
) -> dict:
    """
    Calcula todos los componentes del finiquito.
    Causales que generan indemnización: art. 161 (necesidades empresa / desahucio).
    Causales sin indemnización: art. 159 (mutuo acuerdo, vencimiento, etc.).
    """
    anos = calcular_anos_servicio(fecha_inicio, fecha_termino)

    # Base diaria para feriado
    base_diaria = base_indemnizacion / 30

    feriado = calcular_feriado_proporcional(
        fecha_inicio, fecha_termino,
        dias_feriado_tomados,
        base_diaria=base_diaria,
        monto_feriado_override=monto_feriado_override,
    )

    tiene_indemnizacion = causal.startswith("161")
    tiene_aviso_previo  = causal == "161_1"   # necesidades empresa (no desahucio trabajador)

    indemnizacion_anos   = round(base_indemnizacion * anos["anos_indemnizacion"]) if tiene_indemnizacion else 0
    indemnizacion_aviso  = round(base_indemnizacion) if tiene_aviso_previo else 0

    total = feriado["monto"] + indemnizacion_anos + indemnizacion_aviso

    return {
        "fecha_inicio":          str(fecha_inicio),
        "fecha_termino":         str(fecha_termino),
        "causal":                causal,
        "base_indemnizacion":    round(base_indemnizacion),
        "anos_servicio":         anos,
        "feriado_proporcional":  feriado,
        "indemnizacion_anos":    indemnizacion_anos,
        "indemnizacion_aviso":   indemnizacion_aviso,
        "total":                 total,
    }


def distribuir_cuotas(total: float, n_cuotas: int, fecha_primera: date) -> list[dict]:
    """Distribuye el total en n cuotas mensuales desde fecha_primera."""
    base = total // n_cuotas
    resto = total - base * n_cuotas
    cuotas = []
    for i in range(n_cuotas):
        monto = int(base + (resto if i == n_cuotas - 1 else 0))
        fecha = fecha_primera + relativedelta(months=i)
        cuotas.append({"numero": i + 1, "fecha": str(fecha), "monto": monto})
    return cuotas
