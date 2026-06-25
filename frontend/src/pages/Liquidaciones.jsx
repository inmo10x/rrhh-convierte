import { useState, useEffect, useCallback } from "react";
import { empleadosApi, liquidacionesApi } from "../api/client";
import { Save, RefreshCw, Globe, FileDown, TrendingUp } from "lucide-react";

const fmtCLP = n => n != null ? `$${Math.round(n).toLocaleString("es-CL")}` : "-";
const fmtUSD = n => n != null ? `USD ${Number(n).toLocaleString("en-US", { minimumFractionDigits:2, maximumFractionDigits:2 })}` : "-";
const fmt = (n, moneda) => moneda === "USD" ? fmtUSD(n) : fmtCLP(n);
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

export default function Liquidaciones() {
  const hoy = new Date();
  const [mes, setMes]       = useState(hoy.getMonth() + 1);
  const [anio, setAnio]     = useState(hoy.getFullYear());
  const [empleados, setEmpleados] = useState([]);
  const [empId, setEmpId]   = useState("");
  const [dias, setDias]     = useState({ trabajados:30, licencia:0, vacaciones:0, mes:30 });
  const [extras, setExtras] = useState({ horas_extras:0, comisiones:0 });
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading]     = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado]   = useState(false);

  useEffect(() => { empleadosApi.listar().then(setEmpleados); }, []);

  const simular = useCallback(async () => {
    if (!empId) return;
    setLoading(true);
    try {
      const r = await liquidacionesApi.simular({
        empleado_id: Number(empId), mes, anio,
        dias_trabajados:  dias.trabajados,
        dias_licencia:    dias.licencia,
        dias_vacaciones:  dias.vacaciones,
        dias_mes:         dias.mes,
        horas_extras:     Number(extras.horas_extras),
        comisiones:       Number(extras.comisiones),
      });
      setResultado(r);
      setGuardado(false);
    } catch(e) { console.error(e); }
    setLoading(false);
  }, [empId, mes, anio, dias, extras]);

  useEffect(() => { simular(); }, [simular]);

  const payload = () => ({
    empleado_id: Number(empId), mes, anio,
    dias_trabajados:  dias.trabajados,
    dias_licencia:    dias.licencia,
    dias_vacaciones:  dias.vacaciones,
    dias_mes:         dias.mes,
    horas_extras:     Number(extras.horas_extras),
    comisiones:       Number(extras.comisiones),
  });

  const guardar = async () => {
    if (!resultado) return;
    setGuardando(true);
    await liquidacionesApi.guardar(payload());
    setGuardado(true);
    setGuardando(false);
  };

  const descargarPdf = async () => {
    if (!resultado) return;
    try {
      const blob = await liquidacionesApi.pdf(payload());
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      const emp  = empleados.find(e => e.id === Number(empId));
      a.href     = url;
      a.download = `liquidacion_${(emp?.nombre || "").replace(/\s+/g, "_").toLowerCase()}_${anio}_${String(mes).padStart(2, "0")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Error generando el PDF");
    }
  };

  const empSel = empleados.find(e => e.id === Number(empId));
  const esVendedor = empSel?.es_vendedor;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Liquidaciones</h1>
        <p className="text-zinc-500 text-sm">Cálculo mensual con simulación en tiempo real</p>
      </div>

      <div className="card p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="label">Empleado</label>
            <select className="input" value={empId} onChange={e => { setEmpId(e.target.value); setResultado(null); }}>
              <option value="">Seleccionar...</option>
              {empleados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Mes</label>
            <select className="input" value={mes} onChange={e => setMes(Number(e.target.value))}>
              {MESES.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Año</label>
            <input className="input" type="number" value={anio} onChange={e => setAnio(Number(e.target.value))}/>
          </div>
          <div>
            <label className="label">Días del mes</label>
            <input className="input" type="number" value={dias.mes} onChange={e => setDias(d => ({...d, mes: Number(e.target.value)}))}/>
          </div>
        </div>

        {empId && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-zinc-800">
            <div>
              <label className="label">Días trabajados</label>
              <input className="input" type="number" value={dias.trabajados} onChange={e => setDias(d => ({...d, trabajados: Number(e.target.value)}))}/>
            </div>
            <div>
              <label className="label">Días licencia médica</label>
              <input className="input" type="number" value={dias.licencia} onChange={e => setDias(d => ({...d, licencia: Number(e.target.value)}))}/>
            </div>
            <div>
              <label className="label">Días vacaciones</label>
              <input className="input" type="number" value={dias.vacaciones} onChange={e => setDias(d => ({...d, vacaciones: Number(e.target.value)}))}/>
            </div>
            <div>
              <label className="label">Horas extras ($)</label>
              <input className="input" type="number" value={extras.horas_extras} onChange={e => setExtras(x => ({...x, horas_extras: e.target.value}))}/>
            </div>
            <div className="col-span-2">
              <label className="label">Comisiones ($){esVendedor && <span className="ml-2 text-amber-400 text-xs">· aplica semana corrida y promedio vacaciones</span>}</label>
              <input className="input" type="number" value={extras.comisiones} onChange={e => setExtras(x => ({...x, comisiones: e.target.value}))}/>
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div className="text-center py-12 text-zinc-500">
          <RefreshCw size={24} className="mx-auto animate-spin mb-2"/>
          <p>Calculando...</p>
        </div>
      )}

      {resultado && !loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {resultado.es_extranjero && (
            <div className="col-span-full flex items-center gap-3 bg-blue-900/20 border border-blue-800/50 rounded-xl px-4 py-3 text-sm text-blue-400">
              <Globe size={16}/>
              <span>Trabajador extranjero — sin descuentos legales chilenos · Moneda: <strong>{resultado.moneda || "USD"}</strong></span>
            </div>
          )}

          {esVendedor && (
            <div className="col-span-full flex items-center gap-3 bg-amber-900/20 border border-amber-800/40 rounded-xl px-4 py-3 text-sm text-amber-400">
              <TrendingUp size={16}/>
              <span>
                Remuneración variable activa —
                {resultado.semana_corrida > 0 && ` semana corrida: ${fmtCLP(resultado.semana_corrida)} ·`}
                {resultado.vacaciones_art71 > 0
                  ? ` vacaciones calculadas por promedio 3 meses (art. 71): ${fmtCLP(resultado.vacaciones_art71)}`
                  : " vacaciones: promedio 3 meses se activará cuando haya historial"}
              </span>
            </div>
          )}

          {/* Haberes */}
          <div className="card p-5">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Haberes</p>
            <div className="space-y-2 text-sm">
              {[
                ["Sueldo del mes",         resultado.sueldo_mes],
                ["Gratificación",          resultado.gratificacion],
                ["Bonos fijos",            resultado.bonos_fijos],
                ["Horas extras",           resultado.horas_extras],
                ["Comisiones",             resultado.comisiones],
                ["Semana corrida",         resultado.semana_corrida],
                ["Vacaciones (art. 71)",   resultado.vacaciones_art71],
                ["Colación",               resultado.colacion],
                ["Movilización",           resultado.movilizacion],
              ].map(([k,v]) => v > 0 && (
                <div key={k} className="flex justify-between">
                  <span className={`${k === "Semana corrida" || k === "Vacaciones (art. 71)" ? "text-amber-400/80" : "text-zinc-400"}`}>{k}</span>
                  <span className="font-medium text-white">{fmt(v, resultado.moneda)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t border-zinc-800 font-semibold">
                <span className="text-zinc-300">Total haberes</span>
                <span className="text-brand-400">{fmt(resultado.total_haberes, resultado.moneda)}</span>
              </div>
            </div>
          </div>

          {/* Descuentos */}
          <div className="card p-5">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Descuentos</p>
            {resultado.es_extranjero ? (
              <div className="flex flex-col items-center justify-center h-24 text-zinc-600 text-sm text-center">
                <Globe size={22} className="mb-2 opacity-40"/>
                No aplican descuentos<br/>legales chilenos
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                {[
                  ["AFP (fondo pensiones)", resultado.fondo_pensiones],
                  ["Comisión AFP",          resultado.comision_afp],
                  ["AFC (cesantía)",        resultado.afc_trabajador],
                  ["Salud",                 resultado.salud],
                  ["Impuesto único",        resultado.impuesto_unico],
                ].map(([k,v]) => v > 0 && (
                  <div key={k} className="flex justify-between">
                    <span className="text-zinc-400">{k}</span>
                    <span className="font-medium text-red-400">{fmt(v, resultado.moneda)}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t border-zinc-800 font-semibold">
                  <span className="text-zinc-300">Total descuentos</span>
                  <span className="text-red-400">{fmt(resultado.total_descuentos, resultado.moneda)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Resumen */}
          <div className="card p-5 flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Resumen</p>
              <div className="space-y-2 text-sm">
                {!resultado.es_extranjero && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Imponible</span>
                      <span className="text-white">{fmt(resultado.haberes_imponibles, resultado.moneda)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Base tributable</span>
                      <span className="text-white">{fmt(resultado.base_tributable, resultado.moneda)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-zinc-400">Días trabajados</span>
                  <span className="text-white">{resultado.dias_trabajados}</span>
                </div>
                {resultado.dias_vacaciones > 0 && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Días vacaciones</span>
                    <span className="text-white">{resultado.dias_vacaciones}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-zinc-800">
              <p className="text-xs text-zinc-500 mb-1">Líquido a pagar</p>
              <p className="text-3xl font-bold text-brand-400">{fmt(resultado.liquido_a_pagar, resultado.moneda)}</p>
              <p className="text-xs text-zinc-500 mt-1">{empSel?.nombre}</p>
            </div>
            <button onClick={guardar} disabled={guardando || guardado}
              className={`mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                guardado
                  ? "bg-green-900/30 text-green-400 border border-green-800"
                  : "btn-primary"
              }`}>
              <Save size={15}/>
              {guardado ? "¡Guardado!" : guardando ? "Guardando..." : "Guardar liquidación"}
            </button>
            <button onClick={descargarPdf}
              className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium btn-secondary">
              <FileDown size={15}/>
              Descargar PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
