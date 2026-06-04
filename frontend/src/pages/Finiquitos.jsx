import { useState, useEffect, useCallback } from "react";
import { empleadosApi, finiquitosApi } from "../api/client";
import { FileDown, RefreshCw, AlertCircle } from "lucide-react";

const fmt = n => n != null ? `$${Math.round(n).toLocaleString("es-CL")}` : "-";

const CAUSALES = [
  { value:"161_1", label:"Art. 161 inciso 1° — Necesidades de la empresa" },
  { value:"161_2", label:"Art. 161 inciso 2° — Desahucio del empleador" },
  { value:"159_1", label:"Art. 159 N°1 — Mutuo acuerdo" },
  { value:"159_2", label:"Art. 159 N°2 — Renuncia voluntaria" },
  { value:"159_4", label:"Art. 159 N°4 — Vencimiento del plazo" },
  { value:"159_5", label:"Art. 159 N°5 — Conclusión del servicio" },
];

export default function Finiquitos() {
  const hoy = new Date().toISOString().split("T")[0];
  const [empleados, setEmpleados]   = useState([]);
  const [empId, setEmpId]           = useState("");
  const [fechaTerm, setFechaTerm]   = useState(hoy);
  const [causal, setCausal]         = useState("161_1");
  const [feriadoOverride, setFeriadoOverride] = useState("");
  const [nCuotas, setNCuotas]       = useState(1);
  const [fechaCuota, setFechaCuota] = useState(hoy);
  const [ciudad, setCiudad]         = useState("Concepción");
  const [resultado, setResultado]   = useState(null);
  const [loading, setLoading]       = useState(false);
  const [descargando, setDescargando] = useState(false);

  useEffect(() => { empleadosApi.listar().then(setEmpleados); }, []);

  const simular = useCallback(async () => {
    if (!empId || !fechaTerm) return;
    setLoading(true);
    try {
      const r = await finiquitosApi.simular({
        empleado_id: Number(empId),
        fecha_termino: fechaTerm,
        causal,
        monto_feriado_override: feriadoOverride ? Number(feriadoOverride) : null,
        n_cuotas: nCuotas,
        fecha_primera_cuota: fechaCuota,
        ciudad_notaria: ciudad,
      });
      setResultado(r);
    } catch(e) { console.error(e); }
    setLoading(false);
  }, [empId, fechaTerm, causal, feriadoOverride, nCuotas, fechaCuota, ciudad]);

  useEffect(() => { simular(); }, [simular]);

  const descargar = async () => {
    setDescargando(true);
    try {
      const blob = await finiquitosApi.generarDocx({
        empleado_id: Number(empId),
        fecha_termino: fechaTerm,
        causal,
        monto_feriado_override: feriadoOverride ? Number(feriadoOverride) : null,
        n_cuotas: nCuotas,
        fecha_primera_cuota: fechaCuota,
        ciudad_notaria: ciudad,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const emp = empleados.find(e => e.id === Number(empId));
      a.download = `finiquito_${emp?.nombre?.replace(/\s+/g,"_").toLowerCase()}_${fechaTerm}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch(e) { alert("Error generando documento: " + e.message); }
    setDescargando(false);
  };

  const empSel = empleados.find(e => e.id === Number(empId));
  const anos   = resultado?.anos_servicio;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Finiquitos</h1>
        <p className="text-zinc-500 text-sm">Calculadora según Código del Trabajo chileno</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulario */}
        <div className="card p-5 space-y-4">
          <p className="text-sm font-semibold text-zinc-300">Datos del término</p>
          <div>
            <label className="label">Empleado</label>
            <select className="input" value={empId} onChange={e => setEmpId(e.target.value)}>
              <option value="">Seleccionar...</option>
              {empleados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </div>
          {empSel && (
            <div className="bg-brand-500/5 border border-brand-500/15 rounded-lg p-3 text-xs text-brand-400 space-y-1">
              <p>Inicio: <strong>{empSel.fecha_inicio}</strong></p>
              <p>Base cálculo: <strong>{fmt((empSel.sueldo_base||0) + (empSel.gratificacion_mensual||0) + (empSel.bonos_fijos||[]).reduce((s,b)=>s+b.monto,0))}</strong></p>
              <p>Feriado tomado: <strong>{empSel.dias_feriado_tomados} días</strong></p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Fecha de término</label>
              <input className="input" type="date" value={fechaTerm} onChange={e => setFechaTerm(e.target.value)}/>
            </div>
            <div>
              <label className="label">Causal</label>
              <select className="input" value={causal} onChange={e => setCausal(e.target.value)}>
                {CAUSALES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Feriado proporcional ($) <span className="text-zinc-600 font-normal">— dejar vacío para calcular automáticamente</span></label>
            <input className="input" type="number" value={feriadoOverride} onChange={e => setFeriadoOverride(e.target.value)} placeholder="Ingresar monto si lo tienes de contabilidad"/>
          </div>

          <hr className="border-zinc-800"/>
          <p className="text-sm font-semibold text-zinc-300">Pago en cuotas</p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">N° cuotas</label>
              <select className="input" value={nCuotas} onChange={e => setNCuotas(Number(e.target.value))}>
                {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Primera cuota</label>
              <input className="input" type="date" value={fechaCuota} onChange={e => setFechaCuota(e.target.value)}/>
            </div>
            <div>
              <label className="label">Ciudad notaría</label>
              <input className="input" value={ciudad} onChange={e => setCiudad(e.target.value)}/>
            </div>
          </div>
        </div>

        {/* Resultado */}
        <div className="space-y-4">
          {loading && (
            <div className="card p-12 text-center text-zinc-500">
              <RefreshCw size={24} className="mx-auto animate-spin mb-2"/>
              <p>Calculando...</p>
            </div>
          )}
          {resultado && !loading && (
            <>
              {anos?.fraccion_redondeada && (
                <div className="flex gap-3 bg-amber-900/20 border border-amber-800 rounded-xl p-4 text-sm text-amber-400">
                  <AlertCircle size={18} className="shrink-0 mt-0.5"/>
                  <p>La fracción de {anos.meses_fraccion} meses y {anos.dias_fraccion} días <strong>supera 6 meses</strong>, por lo que se redondea al año siguiente (Art. 163 CT).</p>
                </div>
              )}

              <div className="card p-5">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-4">Liquidación del finiquito</p>
                <div className="space-y-3 text-sm">
                  {resultado.feriado_proporcional?.monto > 0 && (
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-zinc-300">Feriado proporcional</p>
                        <p className="text-xs text-zinc-500">
                          {resultado.feriado_proporcional.fuente === "contabilidad"
                            ? "Según contabilidad"
                            : `${resultado.feriado_proporcional.dias_pendientes} días hábiles pendientes`}
                        </p>
                      </div>
                      <span className="font-semibold text-white">{fmt(resultado.feriado_proporcional.monto)}</span>
                    </div>
                  )}
                  {resultado.indemnizacion_anos > 0 && (
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-zinc-300">Indemnización por años de servicio</p>
                        <p className="text-xs text-zinc-500">{anos?.anos_indemnizacion} {anos?.anos_indemnizacion === 1 ? "año" : "años"} × {fmt(resultado.base_indemnizacion)}</p>
                      </div>
                      <span className="font-semibold text-white">{fmt(resultado.indemnizacion_anos)}</span>
                    </div>
                  )}
                  {resultado.indemnizacion_aviso > 0 && (
                    <div className="flex justify-between">
                      <p className="text-zinc-300">Indemnización sustitutiva aviso previo</p>
                      <span className="font-semibold text-white">{fmt(resultado.indemnizacion_aviso)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-3 border-t border-zinc-800 text-base font-bold">
                    <span className="text-white">TOTAL</span>
                    <span className="text-brand-400">{fmt(resultado.total)}</span>
                  </div>
                </div>
              </div>

              {resultado.cuotas?.length > 0 && (
                <div className="card p-5">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Plan de pago</p>
                  <div className="space-y-2">
                    {resultado.cuotas.map(c => (
                      <div key={c.numero} className="flex justify-between text-sm">
                        <span className="text-zinc-400">Cuota {c.numero} — {c.fecha}</span>
                        <span className="font-semibold text-white">{fmt(c.monto)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={descargar} disabled={descargando || !empId}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                <FileDown size={18}/>
                {descargando ? "Generando Word..." : "Descargar Finiquito (.docx)"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
