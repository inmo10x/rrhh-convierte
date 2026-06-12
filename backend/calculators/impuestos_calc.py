# Cálculo de descuentos legales — impuesto único, AFP, salud, AFC
# Fuente: Ley de Impuesto a la Renta Art. 43 N°1, DL 3.500, Ley 19.728

import json
import time
import urllib.request

# ─── UF ───────────────────────────────────────────────────────────────────────
# Valor de respaldo si la API no responde. Se actualiza solo como referencia.
UF_VALOR_FALLBACK = 39_000

_uf_cache = {"valor": None, "fecha": None}


def obtener_uf() -> float:
    """
    Obtiene la UF del día desde mindicador.cl (datos oficiales CMF).
    Caché en memoria de 1 día; si la API falla, usa el último valor
    conocido o el fallback.
    """
    hoy = time.strftime("%Y-%m-%d")
    if _uf_cache["valor"] and _uf_cache["fecha"] == hoy:
        return _uf_cache["valor"]
    try:
        with urllib.request.urlopen("https://mindicador.cl/api/uf", timeout=5) as r:
            data = json.load(r)
        valor = float(data["serie"][0]["valor"])
        _uf_cache["valor"] = valor
        _uf_cache["fecha"] = hoy
        return valor
    except Exception:
        return _uf_cache["valor"] or UF_VALOR_FALLBACK


# ─── Topes imponibles (en UF) ─────────────────────────────────────────────────
# Rentas máximas para cotizar. Valores 2025; la Superintendencia de Pensiones
# los reajusta cada año en enero — actualizar anualmente.
TOPE_IMPONIBLE_AFP_UF = 87.8    # AFP y salud
TOPE_IMPONIBLE_AFC_UF = 131.9   # Seguro de cesantía

# ─── Impuesto único segunda categoría — tramos mensuales en UF ───────────────
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


def calcular_impuesto_unico(base_tributable: float, uf_valor: float | None = None) -> float:
    """Calcula impuesto único segunda categoría según base tributable mensual."""
    uf = uf_valor or obtener_uf()
    base_uf = base_tributable / uf
    for desde, hasta, tasa, rebaja_uf in TRAMOS:
        if desde <= base_uf < hasta:
            impuesto = base_tributable * tasa - rebaja_uf * uf
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
    uf = obtener_uf()

    # Aplicar topes imponibles: se cotiza solo hasta la renta máxima legal
    base_afp_salud = min(haberes_imponibles, TOPE_IMPONIBLE_AFP_UF * uf)
    base_afc       = min(haberes_imponibles, TOPE_IMPONIBLE_AFC_UF * uf)

    afp_data        = AFP_TASAS.get(afp, AFP_TASAS["ProVida"])
    fondo_pensiones = round(base_afp_salud * afp_data["ahorro"])
    comision_afp    = round(base_afp_salud * afp_data["comision"])
    afc             = round(base_afc * (AFC_TRABAJADOR_INDEFINIDO if es_contrato_indefinido else AFC_TRABAJADOR_PLAZO_FIJO))
    salud           = round(base_afp_salud * FONASA_TASA) if es_fonasa else 0

    total_previsional = fondo_pensiones + comision_afp + afc + salud
    base_tributable   = max(0, haberes_imponibles - total_previsional)
    impuesto_unico    = calcular_impuesto_unico(base_tributable, uf)

    return {
        "fondo_pensiones": fondo_pensiones,
        "comision_afp":    comision_afp,
        "afc_trabajador":  afc,
        "salud":           salud,
        "total_previsional": total_previsional,
        "base_tributable": base_tributable,
        "impuesto_unico":  impuesto_unico,
        "total_descuentos": total_previsional + impuesto_unico,
        "uf_valor":        round(uf, 2),
        "tope_imponible_aplicado": haberes_imponibles > TOPE_IMPONIBLE_AFP_UF * uf,
    }
