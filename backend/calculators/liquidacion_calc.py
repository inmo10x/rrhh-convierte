import calendar
from .impuestos_calc import calcular_descuentos


def _domingos_mes(mes: int, anio: int) -> int:
    """Cuenta los domingos del mes (días de descanso semanal remunerado)."""
    cal = calendar.monthcalendar(anio, mes)
    return sum(1 for week in cal if week[calendar.SUNDAY] != 0)


def calcular_liquidacion(
    sueldo_base: float,
    gratificacion_mensual: float,
    bonos_fijos: list,              # [{"nombre": str, "monto": float}]
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
    mes: int = None,
    anio: int = None,
    es_vendedor: bool = False,
    promedio_diario_3meses: float = None,
) -> dict:
    if dias_mes <= 0:
        dias_mes = 30

    # ─── Según Código del Trabajo ─────────────────────────────────────────────
    # • Días trabajados:       el EMPLEADOR paga (remuneración normal)
    # • Días de vacaciones:    el EMPLEADOR paga.
    #     - Trabajador con remuneración fija: art. 67 — remuneración íntegra
    #       (prorrateada al mes).
    #     - Trabajador con remuneración variable: art. 71 — promedio de lo
    #       ganado en los últimos 3 meses (pasado como promedio_diario_3meses).
    # • Días de licencia médica: NO los paga el empleador; los cubre SUSESO/ISAPRE.
    # ─────────────────────────────────────────────────────────────────────────

    # Para vendedores con historial de 3 meses y días de vacaciones:
    # las vacaciones se pagan al promedio diario (Art. 71).
    # Para todos los demás: factor normal incluye vacaciones.
    usar_art71 = es_vendedor and dias_vacaciones > 0 and promedio_diario_3meses

    if usar_art71:
        factor_remun    = dias_trabajados / dias_mes
        vacaciones_art71 = round(promedio_diario_3meses * dias_vacaciones)
    else:
        dias_empleador  = dias_trabajados + dias_vacaciones
        factor_remun    = dias_empleador / dias_mes
        vacaciones_art71 = 0

    sueldo_mes  = round(sueldo_base           * factor_remun)
    grat_mes    = round(gratificacion_mensual  * factor_remun)
    bonos_mes   = sum(round(b["monto"]         * factor_remun) for b in bonos_fijos)

    # ─── Semana corrida (CT Art. 45) ──────────────────────────────────────────
    # Aplica a trabajadores con remuneración variable (es_vendedor).
    # Por cada semana completa trabajada el empleado tiene derecho a que los
    # días de descanso (domingos) se le paguen en proporción a lo ganado.
    # Fórmula DT: SC = comisiones_mes / días_trabajados × domingos_en_mes
    semana_corrida = 0
    if es_vendedor and comisiones > 0 and dias_trabajados > 0 and mes and anio:
        domingos = _domingos_mes(mes, anio)
        semana_corrida = round(comisiones / dias_trabajados * domingos)

    haberes_imponibles = (
        sueldo_mes + grat_mes + bonos_mes
        + horas_extras_monto + comisiones + semana_corrida + vacaciones_art71
    )

    # Colación / movilización: beneficio de asistencia → solo días trabajados
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
        "vacaciones_art71":      vacaciones_art71,
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
