// Dashboard.jsx
import { useState, useEffect } from "react";
import { empleadosApi, liquidacionesApi } from "../api/client";
import { Users, Calculator, TrendingUp, Calendar } from "lucide-react";

const fmt = n => n != null ? `$${Math.round(n).toLocaleString("es-CL")}` : "-";
const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

export function Dashboard() {
  const hoy = new Date();
  const [empleados, setEmpleados]   = useState([]);
  const [liqs, setLiqs]             = useState([]);

  useEffect(() => {
    empleadosApi.listar().then(setEmpleados).catch(()=>{});
    liquidacionesApi.porMes(hoy.getFullYear(), hoy.getMonth()+1).then(setLiqs).catch(()=>{});
  }, []);

  const totalLiquidoMes = liqs.reduce((s, l) => s + (l.liquido_a_pagar || 0), 0);

  const stats = [
    { label:"Empleados activos", value: empleados.length, icon: Users,       color:"bg-blue-50 text-blue-600"  },
    { label:"Liquidaciones mes", value: liqs.length,      icon: Calculator,  color:"bg-green-50 text-green-600"},
    { label:"Total líquido mes", value: fmt(totalLiquidoMes), icon: TrendingUp, color:"bg-purple-50 text-purple-600"},
    { label:"Mes en curso",      value: `${MESES[hoy.getMonth()]} ${hoy.getFullYear()}`, icon: Calendar, color:"bg-amber-50 text-amber-600"},
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard RRHH</h1>
        <p className="text-gray-500 text-sm">Agencia Convierte SPA · RUT 77.450.452-4</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card">
            <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center mb-3`}>
              <Icon size={18}/>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {empleados.length > 0 && (
        <div className="card p-5">
          <p className="text-sm font-semibold text-gray-700 mb-4">Equipo activo</p>
          <div className="space-y-3">
            {empleados.map(emp => {
              const liq = liqs.find(l => l.empleado_id === emp.id);
              return (
                <div key={emp.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold">
                      {emp.nombre.split(" ").map(w=>w[0]).slice(0,2).join("")}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{emp.nombre}</p>
                      <p className="text-xs text-gray-400">{emp.cargo || "Sin cargo"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {liq
                      ? <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Liq. {fmt(liq.liquido_a_pagar)}</span>
                      : <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">Pendiente</span>
                    }
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}


// Previred.jsx
import { previredApi } from "../api/client";
import { Download, FileSpreadsheet } from "lucide-react";

const MESES_FULL = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

export function Previred() {
  const hoy = new Date();
  const [mes, setMes]     = useState(hoy.getMonth()+1);
  const [anio, setAnio]   = useState(hoy.getFullYear());
  const [resumen, setResumen] = useState(null);
  const [error, setError] = useState("");
  const [descargando, setDescargando] = useState(false);

  const consultar = async () => {
    setError("");
    setResumen(null);
    try {
      const r = await previredApi.resumen(anio, mes);
      setResumen(r);
    } catch(e) {
      setError("No hay liquidaciones guardadas para ese período.");
    }
  };

  const exportar = async () => {
    setDescargando(true);
    try {
      const blob = await previredApi.exportar(anio, mes);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `previred_${anio}_${String(mes).padStart(2,"0")}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch(e) { alert("Error exportando"); }
    setDescargando(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Previred</h1>
        <p className="text-gray-500 text-sm">Exportación de cotizaciones previsionales y de salud</p>
      </div>
      <div className="card p-5">
        <div className="grid grid-cols-3 gap-4 items-end">
          <div>
            <label className="label">Mes</label>
            <select className="input" value={mes} onChange={e => setMes(Number(e.target.value))}>
              {MESES_FULL.map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Año</label>
            <input className="input" type="number" value={anio} onChange={e => setAnio(Number(e.target.value))}/>
          </div>
          <button onClick={consultar} className="btn-secondary">Consultar</button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">{error}</div>}

      {resumen && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              ["Empleados",    resumen.n_empleados, "text-gray-900"],
              ["Total AFP",    fmt(resumen.total_afp),     "text-blue-700"],
              ["Total Salud",  fmt(resumen.total_salud),   "text-green-700"],
              ["Total AFC",    fmt(resumen.total_afc),     "text-purple-700"],
            ].map(([k,v,c]) => (
              <div key={k} className="stat-card">
                <p className={`text-2xl font-bold ${c}`}>{v}</p>
                <p className="text-xs text-gray-500 mt-1">{k}</p>
              </div>
            ))}
          </div>
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <FileSpreadsheet size={20} className="text-green-600"/>
                <div>
                  <p className="font-semibold text-sm">Archivo Previred listo</p>
                  <p className="text-xs text-gray-400">previred_{anio}_{String(mes).padStart(2,"0")}.csv — {resumen.n_empleados} trabajadores</p>
                </div>
              </div>
              <button onClick={exportar} disabled={descargando} className="btn-primary flex items-center gap-2">
                <Download size={16}/>{descargando ? "Exportando..." : "Descargar CSV"}
              </button>
            </div>
            <p className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
              El archivo CSV incluye: RUT, nombre, AFP, renta imponible AFP, montos AFP (fondo + comisión), institución de salud, monto salud, AFC trabajador y AFC empleador. Compatible con importación directa en Previred.cl.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
