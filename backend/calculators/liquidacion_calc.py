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
    if dias_mes <= 0:
        dias_mes = 30

    # ─── Según Código del Trabajo ─────────────────────────────────────────────
    # • Días trabajados:       el EMPLEADOR paga (remuneración normal)
    # • Días de vacaciones:    el EMPLEADOR paga (art. 67 CT: remuneración íntegra)
    # • Días de licencia médica: el EMPLEADOR *no* paga; los cubre SUSESO o la
    #   ISAPRE mediante subsidio de incapacidad laboral (SIL). El empleador solo
    #   emite la liquidación por los días efectivamente a su cargo.
    # ─────────────────────────────────────────────────────────────────────────

    # Factor para remuneraciones imponibles (trabajados + vacaciones)
    dias_empleador   = dias_trabajados + dias_vacaciones
    factor_remun     = dias_empleador / dias_mes

    sueldo_mes  = round(sueldo_base          * factor_remun)
    grat_mes    = round(gratificacion_mensual * factor_remun)
    bonos_mes   = sum(round(b["monto"]       * factor_remun) for b in bonos_fijos)
    semana_corrida = _semana_corrida(sueldo_base, dias_trabajados, dias_mes)

    haberes_imponibles = (
        sueldo_mes + grat_mes + bonos_mes
        + horas_extras_monto + comisiones + semana_corrida
    )

    # Colación y movilización: beneficio de asistencia → solo días trabajados,
    # NO durante licencia médica ni vacaciones.
    factor_asistencia = dias_trabajados / dias_mes
    colacion_mes      = round(colacion      * factor_asistencia)
    movilizacion_mes  = round(movilizacion  * factor_asistencia)

    haberes_no_imp = colacion_mes + movilizacion_mes
    total_haberes  = haberes_imponibles + haberes_no_imp

    desc = calcular_descuentos(haberes_imponibles, afp, es_fonasa, es_contrato_indefinido)

    liquido = total_haberes - desc["total_descuentos"]

    return {
        "sueldo_mes":            sueldo_mes,
        "gratificacion":         grat_mes,
        "bonos_fijos":           bonos_mes,
        "horas_extras":          horas_extras_monto,
        "comisiones":            comisiones,
        "semana_corrida":        semana_corrida,
        "haberes_imponibles":    haberes_imponibles,
        "colacion":              colacion_mes,
        "movilizacion":          movilizacion_mes,
        "haberes_no_imponibles": haberes_no_imp,
        "total_haberes":         total_haberes,
        "dias_trabajados":       dias_trabajados,
        "dias_licencia":         dias_licencia,
        "dias_vacaciones":       dias_vacaciones,
        **desc,
        "liquido_a_pagar":       max(0, liquido),
    }


def _semana_corrida(sueldo_base: float, dias_trabajados: int, dias_mes: int) -> int:
    """Semana corrida: aplica a trabajadores con remuneración variable + fija (simplificado)."""
    if dias_trabajados == 0 or dias_mes == 0:
        return 0
    # Cálculo simplificado: solo aplica si hay días domingos/festivos pagados
    # En esta versión retornamos 0 por defecto; implementar según contrato
    return 0
