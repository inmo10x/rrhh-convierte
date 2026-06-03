# RRHH Convierte

Administrador de RRHH para Agencia Convierte SPA. Gestión de empleados, liquidaciones mensuales, finiquitos y exportación Previred.

## Módulos

- **Empleados** — CRUD con historial de remuneraciones y cuenta bancaria
- **Liquidaciones** — Calculadora mensual con simulación en tiempo real (impuesto único, AFP, salud, AFC)
- **Finiquitos** — Calculadora según art. 161/159 CT, generación de Word listo para notaría
- **Previred** — Exportación CSV compatible con Previred.cl

---

## Instalación

### Requisitos
- Python 3.11+
- Node.js 18+

### Backend

```bash
cd backend
pip install -r requirements.txt
```

### Frontend

```bash
cd frontend
npm install
```

---

## Uso en desarrollo

Abrir dos terminales:

**Terminal 1 — Backend:**
```bash
cd backend
uvicorn main:app --reload --port 8000
```
API disponible en: http://localhost:8000/api

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```
App disponible en: http://localhost:5173

---

## Uso en producción (servidor único)

```bash
# 1. Construir el frontend
cd frontend && npm run build

# 2. Correr solo el backend (sirve el frontend también)
cd .. && python -m backend.main
```
App disponible en: http://localhost:8000

---

## Estructura del proyecto

```
rrhh-convierte/
├── backend/
│   ├── main.py                      # FastAPI app
│   ├── database.py                  # SQLite / SQLAlchemy
│   ├── models.py                    # Modelos y esquemas Pydantic
│   ├── calculators/
│   │   ├── impuestos_calc.py        # Impuesto único 2026, tasas AFP/salud/AFC
│   │   ├── liquidacion_calc.py      # Cálculo mensual completo
│   │   └── finiquito_calc.py        # Años de servicio, feriado, indemnizaciones
│   ├── generators/
│   │   └── finiquito_docx.py        # Generador Word con todas las cláusulas
│   ├── routers/
│   │   ├── empleados.py             # CRUD empleados
│   │   ├── liquidaciones.py         # Simular y guardar liquidaciones
│   │   ├── finiquitos.py            # Simular y descargar finiquito
│   │   └── previred.py              # Exportación CSV Previred
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Empleados.jsx
│       │   ├── Liquidaciones.jsx
│       │   ├── Finiquitos.jsx
│       │   └── index.jsx            # Dashboard + Previred
│       ├── api/client.js
│       └── components/Sidebar.jsx
└── README.md
```

---

## Mantenimiento mensual

### Actualizar valor de la UF
En `backend/calculators/impuestos_calc.py`, línea 8:
```python
UF_VALOR = 39_000  # ← Actualizar primer día hábil de cada mes
```

### Actualizar tasas AFP
Las tasas de comisión AFP cambian 1-2 veces al año. Verificar en www.spensiones.cl y actualizar el dict `AFP_TASAS` en el mismo archivo.

---

## Base de datos

SQLite — archivo `rrhh_convierte.db` en el directorio raíz del backend. Se crea automáticamente al iniciar.

---

## Notas legales

- Cálculos según Código del Trabajo de Chile (actualizado a 2026)
- Impuesto único: tabla mensual segunda categoría, Art. 43 N°1 LIR
- Indemnización por años: Art. 163 CT (fracción > 6 meses redondea al año siguiente)
- Feriado proporcional: 1,25 días hábiles por mes, Art. 67 CT
- AFC: Ley 19.728 (trabajador indefinido: 0,6%)
- Verificar siempre con contador antes de firmar finiquitos
