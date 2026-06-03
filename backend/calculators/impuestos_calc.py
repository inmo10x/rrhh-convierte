# Tabla impuesto único segunda categoría — tramos mensuales 2026
# Actualizar 'uf_valor' mensualmente según valor oficial SII
# Fuente: Ley de Impuesto a la Renta, Art. 43 N°1

UF_VALOR = 39_000  # Valor referencial junio 2026 — actualizar mensualmente

TRAMOS = [
    # (desde_uf, hasta_uf, tasa, factor_rebaja_uf)
    (0,    13.5,  0.00,  0.000),
    (13.5, 30,    0.04,  0.540),
    (30,   50,    0.08,  1.740),
    (50,   70,    0.135, 4.490),
    (70,   90,    0.23,  11.130),
    (90,   120,   0.304, 17.790),
    (120,  150,   0.35,  23.310),
    (150,  float("inf"), 0.40, 30.810),
]

# Tasas previsionales 2026 (trabajador)
AFP_TASAS = {
    "Capital":   {"ahorro": 0.1000, "comision": 0.0144},
    "Cuprum":    {"ahorro": 0.1000, "comision": 0.0144},
    "Habitat":   {"ahorro": 0.1000, "comision": 0.0127},
    "Modelo":    {"ahorro": 0.1000, "comision": 0.0058},
    "PlanVital": {"ahorro": 0.1000, "comision": 0.0116},
    "ProVida":   {"ahorro": 0.1000, "comision": 0.0145},
    "Uno":       {"ahorro": 0.1000, "comision": 0.0049},
}

AFC_TRABAJADOR_INDEFINIDO = 0.006   # Seguro cesantía — contrato indefinido
AFC_TRABAJADOR_PLAZO_FIJO = 0.000
FONASA_TASA = 0.07


def calcular_impuesto_unico(base_tributable: float, uf_valor: float = UF_VALOR) -> float:
    """Calcula impuesto único segunda categoría según base tributable mensual."""
    base_uf = base_tributable / uf_valor
    for desde, hasta, tasa, rebaja_uf in TRAMOS:
        if desde <= base_uf < hasta:
            impuesto = base_tributable * tasa - rebaja_uf * uf_valor
            return max(0, round(impuesto))
    return 0


def tasa_afp_total(afp: str) -> float:
    datos = AFP_TASAS.get(afp, AFP_TASAS["ProVida"])
    return datos["ahorro"] + datos["comision"]


def calcular_descuentos(
    haberes_imponibles: float,
    afp: str,
    es_fonasa: bool,
    es_contrato_indefinido: bool = True,
) -> dict:
    fondo_pensiones = round(haberes_imponibles * AFP_TASAS.get(afp, AFP_TASAS["ProVida"])["ahorro"])
    comision_afp    = round(haberes_imponibles * AFP_TASAS.get(afp, AFP_TASAS["ProVida"])["comision"])
    afc             = round(haberes_imponibles * (AFC_TRABAJADOR_INDEFINIDO if es_contrato_indefinido else AFC_TRABAJADOR_PLAZO_FIJO))
    salud           = round(haberes_imponibles * FONASA_TASA) if es_fonasa else 0

    total_previsional = fondo_pensiones + comision_afp + afc + salud
    base_tributable   = max(0, haberes_imponibles - total_previsional)
    impuesto_unico    = calcular_impuesto_unico(base_tributable)

    return {
        "fondo_pensiones": fondo_pensiones,
        "comision_afp":    comision_afp,
        "afc_trabajador":  afc,
        "salud":           salud,
        "total_previsional": total_previsional,
        "base_tributable": base_tributable,
        "impuesto_unico":  impuesto_unico,
        "total_descuentos": total_previsional + impuesto_unico,
    }
