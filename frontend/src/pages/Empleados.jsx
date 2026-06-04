import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, Save, ChevronDown, ChevronUp, Users } from "lucide-react";
import { empleadosApi } from "../api/client";

const AFPS = ["Capital","Cuprum","Habitat","Modelo","PlanVital","ProVida","Uno"];
const CAUSALES_BANCO = ["Cuenta RUT","Cuenta Corriente","Cuenta Vista","Cuenta Ahorro"];

const EMPTY = {
  nombre:"", rut:"", fecha_inicio:"", cargo:"", centro_costo:"Administración",
  sueldo_base:"", gratificacion_mensual:"", bonos_fijos:[], colacion:"",
  movilizacion:"", afp:"ProVida", es_fonasa:true, es_contrato_indefinido:true,
  dias_feriado_tomados:0, cuenta_banco:"Banco Estado", cuenta_tipo:"Cuenta RUT", cuenta_numero:"",
};

const fmt = n => n != null ? `$${Math.round(n).toLocaleString("es-CL")}` : "-";

export default function Empleados() {
  const [empleados, setEmpleados] = useState([]);
  const [form, setForm] = useState(null);   // null = cerrado, {} = editando
  const [loading, setLoading] = useState(false);
  const [expandido, setExpandido] = useState(null);

  const cargar = () => empleadosApi.listar().then(setEmpleados).catch(console.error);

  useEffect(() => { cargar(); }, []);

  const abrirNuevo = () => setForm({ ...EMPTY });
  const abrirEditar = (emp) => setForm({
    ...emp,
    fecha_inicio: emp.fecha_inicio,
    sueldo_base: emp.sueldo_base,
    gratificacion_mensual: emp.gratificacion_mensual,
    colacion: emp.colacion,
    movilizacion: emp.movilizacion,
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const agregarBono = () => set("bonos_fijos", [...(form.bonos_fijos || []), { nombre: "", monto: "" }]);
  const setBono = (i, k, v) => {
    const bonos = [...form.bonos_fijos];
    bonos[i] = { ...bonos[i], [k]: k === "monto" ? Number(v) : v };
    set("bonos_fijos", bonos);
  };
  const eliminarBono = (i) => set("bonos_fijos", form.bonos_fijos.filter((_, j) => j !== i));

  const guardar = async () => {
    setLoading(true);
    try {
      const payload = {
        ...form,
        sueldo_base: Number(form.sueldo_base),
        gratificacion_mensual: Number(form.gratificacion_mensual || 0),
        colacion: Number(form.colacion || 0),
        movilizacion: Number(form.movilizacion || 0),
        dias_feriado_tomados: Number(form.dias_feriado_tomados || 0),
        bonos_fijos: (form.bonos_fijos || []).filter(b => b.nombre && b.monto),
      };
      if (form.id) await empleadosApi.actualizar(form.id, payload);
      else await empleadosApi.crear(payload);
      await cargar();
      setForm(null);
    } catch (e) {
      alert("Error: " + (e.response?.data?.detail || e.message));
    }
    setLoading(false);
  };

  const eliminar = async (id, nombre) => {
    if (!confirm(`¿Desactivar a ${nombre}?`)) return;
    await empleadosApi.eliminar(id);
    cargar();
  };

  const baseCalculo = (emp) =>
    (emp.sueldo_base || 0) + (emp.gratificacion_mensual || 0) +
    (emp.bonos_fijos || []).reduce((s, b) => s + (b.monto || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Empleados</h1>
          <p className="text-gray-500 text-sm">{empleados.length} activos</p>
        </div>
        <button onClick={abrirNuevo} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Nuevo empleado
        </button>
      </div>

      {/* Lista */}
      <div className="card divide-y divide-gray-50">
        {empleados.length === 0 && (
          <div className="p-12 text-center text-gray-400">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p>No hay empleados registrados</p>
          </div>
        )}
        {empleados.map(emp => (
          <div key={emp.id}>
            <div className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
              <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm">
                {emp.nombre.split(" ").map(w => w[0]).slice(0,2).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{emp.nombre}</p>
                <p className="text-xs text-gray-500">{emp.rut} · {emp.cargo || "Sin cargo"}</p>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-900">{fmt(emp.sueldo_base)}</p>
                <p className="text-xs text-gray-400">base cálculo {fmt(baseCalculo(emp))}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setExpandido(expandido === emp.id ? null : emp.id)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                  {expandido === emp.id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                </button>
                <button onClick={() => abrirEditar(emp)} className="p-2 text-gray-400 hover:text-brand-500 rounded-lg hover:bg-gray-100">
                  <Edit2 size={16}/>
                </button>
                <button onClick={() => eliminar(emp.id, emp.nombre)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100">
                  <Trash2 size={16}/>
                </button>
              </div>
            </div>
            {expandido === emp.id && (
              <div className="px-16 pb-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm bg-gray-50">
                {[
                  ["Sueldo base", fmt(emp.sueldo_base)],
                  ["Gratificación", fmt(emp.gratificacion_mensual)],
                  ["Colación", fmt(emp.colacion)],
                  ["AFP", emp.afp],
                  ["Salud", emp.es_fonasa ? "Fonasa" : "Isapre"],
                  ["Inicio", emp.fecha_inicio],
                  ["Feriado tomado", `${emp.dias_feriado_tomados} días`],
                  ["Banco", `${emp.cuenta_banco} · ${emp.cuenta_numero}`],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="text-xs text-gray-400">{k}</p>
                    <p className="font-medium">{v}</p>
                  </div>
                ))}
                {(emp.bonos_fijos || []).length > 0 && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400 mb-1">Bonos fijos</p>
                    {emp.bonos_fijos.map((b,i) => (
                      <p key={i} className="font-medium">{b.nombre}: {fmt(b.monto)}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal formulario */}
      {form && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold">{form.id ? "Editar empleado" : "Nuevo empleado"}</h2>
              <button onClick={() => setForm(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18}/></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Nombre completo *</label>
                  <input className="input" value={form.nombre} onChange={e => set("nombre", e.target.value)} placeholder="María Peralta Vergaray"/>
                </div>
                <div>
                  <label className="label">RUT *</label>
                  <input className="input" value={form.rut} onChange={e => set("rut", e.target.value)} placeholder="12.345.678-9"/>
                </div>
                <div>
                  <label className="label">Fecha inicio *</label>
                  <input className="input" type="date" value={form.fecha_inicio} onChange={e => set("fecha_inicio", e.target.value)}/>
                </div>
                <div>
                  <label className="label">Cargo</label>
                  <input className="input" value={form.cargo} onChange={e => set("cargo", e.target.value)} placeholder="KAM"/>
                </div>
                <div>
                  <label className="label">Centro de costo</label>
                  <input className="input" value={form.centro_costo} onChange={e => set("centro_costo", e.target.value)}/>
                </div>
              </div>

              <hr className="border-gray-100"/>
              <p className="text-sm font-semibold text-gray-700">Remuneraciones</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Sueldo base *</label>
                  <input className="input" type="number" value={form.sueldo_base} onChange={e => set("sueldo_base", e.target.value)}/>
                </div>
                <div>
                  <label className="label">Gratificación mensual</label>
                  <input className="input" type="number" value={form.gratificacion_mensual} onChange={e => set("gratificacion_mensual", e.target.value)}/>
                </div>
                <div>
                  <label className="label">Colación</label>
                  <input className="input" type="number" value={form.colacion} onChange={e => set("colacion", e.target.value)}/>
                </div>
                <div>
                  <label className="label">Movilización</label>
                  <input className="input" type="number" value={form.movilizacion} onChange={e => set("movilizacion", e.target.value)}/>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-700">Bonos fijos</p>
                  <button onClick={agregarBono} className="text-xs text-brand-500 hover:text-brand-700 font-medium">+ Agregar bono</button>
                </div>
                {(form.bonos_fijos || []).map((b, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input className="input flex-1" placeholder="Nombre del bono" value={b.nombre} onChange={e => setBono(i,"nombre",e.target.value)}/>
                    <input className="input w-36" type="number" placeholder="Monto" value={b.monto} onChange={e => setBono(i,"monto",e.target.value)}/>
                    <button onClick={() => eliminarBono(i)} className="p-2 text-red-400 hover:text-red-600"><X size={16}/></button>
                  </div>
                ))}
              </div>

              <hr className="border-gray-100"/>
              <p className="text-sm font-semibold text-gray-700">Previsión y salud</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">AFP</label>
                  <select className="input" value={form.afp} onChange={e => set("afp", e.target.value)}>
                    {AFPS.map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Salud</label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" checked={form.es_fonasa} onChange={() => set("es_fonasa", true)}/> Fonasa
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" checked={!form.es_fonasa} onChange={() => set("es_fonasa", false)}/> Isapre
                    </label>
                  </div>
                </div>
                <div>
                  <label className="label">Tipo contrato</label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" checked={form.es_contrato_indefinido} onChange={() => set("es_contrato_indefinido", true)}/> Indefinido
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" checked={!form.es_contrato_indefinido} onChange={() => set("es_contrato_indefinido", false)}/> Plazo fijo
                    </label>
                  </div>
                </div>
                <div>
                  <label className="label">Días feriado tomados</label>
                  <input className="input" type="number" value={form.dias_feriado_tomados} onChange={e => set("dias_feriado_tomados", e.target.value)}/>
                </div>
              </div>

              <hr className="border-gray-100"/>
              <p className="text-sm font-semibold text-gray-700">Cuenta bancaria</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">Banco</label>
                  <input className="input" value={form.cuenta_banco} onChange={e => set("cuenta_banco", e.target.value)} placeholder="Banco Estado"/>
                </div>
                <div>
                  <label className="label">Tipo</label>
                  <select className="input" value={form.cuenta_tipo} onChange={e => set("cuenta_tipo", e.target.value)}>
                    {CAUSALES_BANCO.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Número</label>
                  <input className="input" value={form.cuenta_numero} onChange={e => set("cuenta_numero", e.target.value)}/>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
              <button onClick={() => setForm(null)} className="btn-secondary">Cancelar</button>
              <button onClick={guardar} disabled={loading} className="btn-primary flex items-center gap-2">
                <Save size={16}/> {loading ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
