import { useState, useEffect } from "react";
import api from "../api/client";
import { Clock, RefreshCw } from "lucide-react";

const ACCION_COLOR = {
  crear:    "text-green-400 bg-green-900/30",
  editar:   "text-blue-400 bg-blue-900/30",
  eliminar: "text-red-400 bg-red-900/30",
  guardar:  "text-brand-400 bg-brand-500/10",
  generar:  "text-purple-400 bg-purple-900/30",
  exportar: "text-amber-400 bg-amber-900/30",
};

const ENTIDAD_LABEL = {
  empleado:    "Empleado",
  liquidacion: "Liquidación",
  finiquito:   "Finiquito",
  previred:    "Previred",
};

export default function ActivityLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargar = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/activity-log/");
      setLogs(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Historial</h1>
          <p className="text-zinc-500 text-sm">Registro de actividad por usuario</p>
        </div>
        <button onClick={cargar} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={14}/> Actualizar
        </button>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-zinc-500">
            <RefreshCw size={24} className="mx-auto animate-spin mb-2"/>
            <p>Cargando historial...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            <Clock size={40} className="mx-auto mb-3 opacity-30"/>
            <p>No hay actividad registrada aún</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-4 py-3 text-zinc-400 font-medium">Fecha y hora</th>
                <th className="text-left px-4 py-3 text-zinc-400 font-medium">Usuario</th>
                <th className="text-left px-4 py-3 text-zinc-400 font-medium">Acción</th>
                <th className="text-left px-4 py-3 text-zinc-400 font-medium">Módulo</th>
                <th className="text-left px-4 py-3 text-zinc-400 font-medium">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr
                  key={log.id}
                  className={`border-b border-zinc-800/50 hover:bg-zinc-800/40 transition-colors ${
                    i % 2 === 0 ? "" : "bg-zinc-900/30"
                  }`}
                >
                  <td className="px-4 py-3 text-zinc-400 font-mono text-xs whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-white">{log.user_nombre}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold capitalize ${
                      ACCION_COLOR[log.accion] || "text-zinc-400 bg-zinc-800"
                    }`}>
                      {log.accion}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-300">
                    {ENTIDAD_LABEL[log.entidad] || log.entidad}
                  </td>
                  <td className="px-4 py-3 text-zinc-400 max-w-xs truncate">
                    {log.detalle || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
