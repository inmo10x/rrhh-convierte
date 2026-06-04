import { useState, useEffect, useCallback } from "react";
import { empleadosApi, liquidacionesApi } from "../api/client";
import { Save, RefreshCw } from "lucide-react";

const fmt = n => n != null ? `$${Math.round(n).toLocaleString("es-CL")}` : "-";
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

  const guardar = async () => {
    if (!resultado) return;
    setGuardando(true);
    await liquidacionesApi.guardar({
      empleado_id: Number(empId), mes, anio,
      dias_trabajados:  dias.trabajados,
      dias_licencia:    dias.licencia,
      dias_vacaciones:  dias.vacaciones,
      dias_mes:         dias.mes,
      horas_extras:     Number(extras.horas_extras),
      comisiones:       Number(extras.comisiones),
    });
    setGuardado(true);
    setGuardando(false);
  };

  const empSel = empleados.find(e => e.id === Number(empId));

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
          {/* Haberes */}
          <div className="card p-5">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Haberes</p>
            <div className="space-y-2 text-sm">
              {[
                ["Sueldo del mes",    resultado.sueldo_mes],
                ["Gratificación",     resultado.gratificacion],
                ["Bonos fijos",       resultado.bonos_fijos],
                ["Horas extras",      resultado.horas_extras],
                ["Colación",          resultado.colacion],
                ["Movilización",      resultado.movilizacion],
              ].map(([k,v]) => v > 0 && (
                <div key={k} className="flex justify-between">
                  <span className="text-zinc-400">{k}</span>
                  <span className="font-medium text-white">{fmt(v)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t border-zinc-800 font-semibold">
                <span className="text-zinc-300">Total haberes</span>
                <span className="text-brand-400">{fmt(resultado.total_haberes)}</span>
              </div>
            </div>
          </div>

          {/* Descuentos */}
          <div className="card p-5">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Descuentos</p>
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
                  <span className="font-medium text-red-400">{fmt(v)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t border-zinc-800 font-semibold">
                <span className="text-zinc-300">Total descuentos</span>
                <span className="text-red-400">{fmt(resultado.total_descuentos)}</span>
              </div>
            </div>
          </div>

          {/* Resumen */}
          <div className="card p-5 flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Resumen</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Imponible</span>
                  <span className="text-white">{fmt(resultado.haberes_imponibles)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Base tributable</span>
                  <span className="text-white">{fmt(resultado.base_tributable)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Días trabajados</span>
                  <span className="text-white">{resultado.dias_trabajados}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-zinc-800">
              <p className="text-xs text-zinc-500 mb-1">Líquido a pagar</p>
              <p className="text-3xl font-bold text-brand-400">{fmt(resultado.liquido_a_pagar)}</p>
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
          </div>
        </div>
      )}
    </div>
  );
}
