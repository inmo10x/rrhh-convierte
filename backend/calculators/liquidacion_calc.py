from .impuestos_calc import calcular_descuentos


def calcular_liquidacion(
    sueldo_base: float,
    gratificacion_mensual: float,
    bonos_fijos: list[dict],        # [{"nombre": str, "monto": float}]
    colacion: float,
    movilizacion: float,
    dias_trabajados: int,
    dias_licencia: int,
    dias_vacaciones: int,
    dias_mes: int,
    afp: str,
    es_fonasa: bool,
    es_contrato_indefinido: bool = True,
    horas_extras_monto: float = 0,
    comisiones: float = 0,
) -> dict:
    dias_contratados = dias_trabajados + dias_licencia + dias_vacaciones

    # Proporcionar sueldo por días trabajados (licencias y vacaciones no descuentan)
    factor = dias_contratados / dias_mes if dias_mes > 0 else 1
    sueldo_mes       = round(sueldo_base * factor)
    grat_mes         = round(gratificacion_mensual * factor)
    bonos_mes        = sum(round(b["monto"] * factor) for b in bonos_fijos)
    semana_corrida   = _semana_corrida(sueldo_base, dias_trabajados, dias_mes)

    haberes_imponibles = sueldo_mes + grat_mes + bonos_mes + horas_extras_monto + comisiones + semana_corrida
    haberes_no_imp     = round(colacion * factor) + round(movilizacion * factor)
    total_haberes      = haberes_imponibles + haberes_no_imp

    desc = calcular_descuentos(haberes_imponibles, afp, es_fonasa, es_contrato_indefinido)

    liquido = total_haberes - desc["total_descuentos"]

    return {
        "sueldo_mes":          sueldo_mes,
        "gratificacion":       grat_mes,
        "bonos_fijos":         bonos_mes,
        "horas_extras":        horas_extras_monto,
        "comisiones":          comisiones,
        "semana_corrida":      semana_corrida,
        "haberes_imponibles":  haberes_imponibles,
        "colacion":            round(colacion * factor),
        "movilizacion":        round(movilizacion * factor),
        "haberes_no_imponibles": haberes_no_imp,
        "total_haberes":       total_haberes,
        "dias_trabajados":     dias_trabajados,
        "dias_licencia":       dias_licencia,
        "dias_vacaciones":     dias_vacaciones,
        **desc,
        "liquido_a_pagar":     max(0, liquido),
    }


def _semana_corrida(sueldo_base: float, dias_trabajados: int, dias_mes: int) -> int:
    """Semana corrida: aplica a trabajadores con remuneración variable + fija (simplificado)."""
    if dias_trabajados == 0 or dias_mes == 0:
        return 0
    # Cálculo simplificado: solo aplica si hay días domingos/festivos pagados
    # En esta versión retornamos 0 por defecto; implementar según contrato
    return 0
