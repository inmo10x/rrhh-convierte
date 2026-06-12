import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, Download, CheckCircle2, AlertTriangle } from "lucide-react";
import { importarApi } from "../api/client";

export default function Importar() {
  const [archivo, setArchivo]   = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError]       = useState("");
  const inputRef = useRef(null);

  const descargarPlantilla = async () => {
    try {
      const blob = await importarApi.plantilla();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = "plantilla_liquidaciones.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Error descargando la plantilla");
    }
  };

  const importar = async () => {
    if (!archivo) return;
    setSubiendo(true);
    setError("");
    setResultado(null);
    try {
      const r = await importarApi.liquidaciones(archivo);
      setResultado(r);
      setArchivo(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (e) {
      setError(e.response?.data?.detail || e.message);
    }
    setSubiendo(false);
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Importar histórico</h1>
        <p className="text-zinc-500 text-sm">Carga liquidaciones ya hechas (Excel o CSV) para tener toda la historia en un solo lugar</p>
      </div>

      {/* Paso 1: plantilla */}
      <div className="card p-5">
        <div className="flex items-start gap-4">
          <div className="w-9 h-9 rounded-lg bg-brand-500/15 text-brand-400 border border-brand-500/20 flex items-center justify-center font-bold shrink-0">1</div>
          <div className="flex-1">
            <p className="font-semibold text-white mb-1">Descarga la plantilla</p>
            <p className="text-sm text-zinc-500 mb-3">
              Excel con las columnas esperadas y una fila de ejemplo. Una fila por
              empleado por mes. Si el RUT no existe en la app, el empleado se crea
              automáticamente con el nombre que traiga la fila.
            </p>
            <button onClick={descargarPlantilla} className="btn-secondary flex items-center gap-2 text-sm">
              <Download size={15}/> Plantilla Excel
            </button>
          </div>
        </div>
      </div>

      {/* Paso 2: subir */}
      <div className="card p-5">
        <div className="flex items-start gap-4">
          <div className="w-9 h-9 rounded-lg bg-brand-500/15 text-brand-400 border border-brand-500/20 flex items-center justify-center font-bold shrink-0">2</div>
          <div className="flex-1">
            <p className="font-semibold text-white mb-1">Sube el archivo con los datos</p>
            <p className="text-sm text-zinc-500 mb-3">
              Si un empleado ya tiene liquidación guardada para ese mes, se reemplaza con la del archivo.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.csv"
                onChange={e => setArchivo(e.target.files?.[0] || null)}
                className="text-sm text-zinc-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0
                           file:text-sm file:font-medium file:bg-brand-500 file:text-black
                           hover:file:bg-brand-600 file:cursor-pointer cursor-pointer"
              />
              <button
                onClick={importar}
                disabled={!archivo || subiendo}
                className="btn-primary flex items-center gap-2"
              >
                <Upload size={15}/>
                {subiendo ? "Importando..." : "Importar"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex gap-3 bg-red-900/20 border border-red-800 rounded-xl p-4 text-sm text-red-400">
          <AlertTriangle size={18} className="shrink-0 mt-0.5"/>
          <p>{error}</p>
        </div>
      )}

      {resultado && (
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle2 size={18}/>
            <p className="font-semibold">Importación completada</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              ["Liquidaciones nuevas",   resultado.creadas],
              ["Actualizadas",           resultado.actualizadas],
              ["Empleados creados",      resultado.empleados_creados],
            ].map(([k, v]) => (
              <div key={k} className="bg-zinc-800/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-white">{v}</p>
                <p className="text-xs text-zinc-500 mt-1">{k}</p>
              </div>
            ))}
          </div>
          {resultado.errores?.length > 0 && (
            <div className="bg-amber-900/20 border border-amber-800 rounded-lg p-3 text-sm">
              <p className="text-amber-400 font-medium mb-2 flex items-center gap-2">
                <AlertTriangle size={14}/> {resultado.errores.length} filas con problemas
              </p>
              <ul className="space-y-1 text-amber-300/80 text-xs">
                {resultado.errores.map((e, i) => (
                  <li key={i}>Fila {e.fila}: {e.error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 bg-zinc-800/40 border border-zinc-700/50 rounded-xl p-4 text-sm text-zinc-400">
        <FileSpreadsheet size={18} className="shrink-0 mt-0.5 text-brand-400"/>
        <p>
          Las liquidaciones importadas quedan marcadas como <strong className="text-zinc-300">histórico contadora </strong>
          y se pueden ver, exportar a Previred y descargar en PDF igual que las hechas en la app.
        </p>
      </div>
    </div>
  );
}
