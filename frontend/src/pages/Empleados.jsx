import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, Save, ChevronDown, ChevronUp, Users, Globe } from "lucide-react";
import { empleadosApi } from "../api/client";

const AFPS = ["Capital","Cuprum","Habitat","Modelo","PlanVital","ProVida","Uno"];
const CAUSALES_BANCO = ["Cuenta RUT","Cuenta Corriente","Cuenta Vista","Cuenta Ahorro"];
const FORMAS_PAGO = ["Global66","Transferencia bancaria","Wise","PayPal","Efectivo","Otro"];
const PAISES = [
  "Argentina","Bolivia","Brasil","Chile","Colombia","Costa Rica","Cuba","Ecuador",
  "El Salvador","España","Guatemala","Honduras","México","Nicaragua","Panamá",
  "Paraguay","Perú","República Dominicana","Uruguay","Venezuela","Otro",
];

const EMPTY = {
  nombre:"", rut:"", fecha_inicio:"", cargo:"", centro_costo:"Administración",
  sueldo_base:"", gratificacion_mensual:"", bonos_fijos:[], colacion:"",
  movilizacion:"", afp:"ProVida", es_fonasa:true, es_contrato_indefinido:true,
  dias_feriado_tomados:0, cuenta_banco:"Banco Estado", cuenta_tipo:"Cuenta RUT", cuenta_numero:"",
  es_extranjero:false, pais:"Chile", moneda:"CLP", forma_pago:"Transferencia bancaria",
};

const fmt = n => n != null ? `$${Math.round(n).toLocaleString("es-CL")}` : "-";

export default function Empleados() {
  const [empleados, setEmpleados] = useState([]);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandido, setExpandido] = useState(null);

  const cargar = () => empleadosApi.listar().then(setEmpleados).catch(console.error);

  useEffect(() => { cargar(); }, []);

  const abrirNuevo = () => setForm({ ...EMPTY });
  const abrirEditar = (emp) => setForm({ ...emp,
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
          <h1 className="text-2xl font-bold text-white">Empleados</h1>
          <p className="text-zinc-500 text-sm">{empleados.length} activos</p>
        </div>
        <button onClick={abrirNuevo} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Nuevo empleado
        </button>
      </div>

      {/* Lista */}
      <div className="card divide-y divide-zinc-800">
        {empleados.length === 0 && (
          <div className="p-12 text-center text-zinc-500">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p>No hay empleados registrados</p>
          </div>
        )}
        {empleados.map(emp => (
          <div key={emp.id}>
            <div className="flex items-center gap-4 p-4 hover:bg-zinc-800/50 transition-colors">
              <div className="w-10 h-10 rounded-full bg-brand-500/15 text-brand-400 border border-brand-500/20 flex items-center justify-center font-bold text-sm">
                {emp.nombre.split(" ").map(w => w[0]).slice(0,2).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-white truncate">{emp.nombre}</p>
                  {emp.es_extranjero && (
                    <span className="text-xs bg-blue-900/40 text-blue-400 border border-blue-800/50 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                      <Globe size={10}/> {emp.pais}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500">{emp.rut} · {emp.cargo || "Sin cargo"}</p>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-white">{fmt(emp.sueldo_base)}</p>
                <p className="text-xs text-zinc-500">base cálculo {fmt(baseCalculo(emp))}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setExpandido(expandido === emp.id ? null : emp.id)}
                  className="p-2 text-zinc-500 hover:text-zinc-300 rounded-lg hover:bg-zinc-700">
                  {expandido === emp.id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                </button>
                <button onClick={() => abrirEditar(emp)} className="p-2 text-zinc-500 hover:text-brand-400 rounded-lg hover:bg-zinc-700">
                  <Edit2 size={16}/>
                </button>
                <button onClick={() => eliminar(emp.id, emp.nombre)} className="p-2 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-zinc-700">
                  <Trash2 size={16}/>
                </button>
              </div>
            </div>
            {expandido === emp.id && (
              <div className="px-16 pb-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm bg-zinc-800/30">
                {[
                  ["Sueldo base", fmt(emp.sueldo_base)],
                  ["Gratificación", fmt(emp.gratificacion_mensual)],
                  ["Colación", fmt(emp.colacion)],
                  ["AFP", emp.afp],
                  ["Salud", emp.es_fonasa ? "Fonasa" : "Isapre"],
                  ["Inicio", emp.fecha_inicio],
                  ["Feriado tomado", `${emp.dias_feriado_tomados} días`],
                  ["Banco", emp.es_extranjero ? emp.forma_pago : `${emp.cuenta_banco} · ${emp.cuenta_numero}`],
                  ...(emp.es_extranjero ? [["País", emp.pais], ["Moneda", emp.moneda]] : []),
                ].map(([k, v]) => (
                  <div key={k} className="py-2">
                    <p className="text-xs text-zinc-500">{k}</p>
                    <p className="font-medium text-zinc-200">{v}</p>
                  </div>
                ))}
                {(emp.bonos_fijos || []).length > 0 && (
                  <div className="col-span-2 py-2">
                    <p className="text-xs text-zinc-500 mb-1">Bonos fijos</p>
                    {emp.bonos_fijos.map((b,i) => (
                      <p key={i} className="font-medium text-zinc-200">{b.nombre}: {fmt(b.monto)}</p>
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
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-gold-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-zinc-800">
              <h2 className="text-lg font-bold text-white">{form.id ? "Editar empleado" : "Nuevo empleado"}</h2>
              <button onClick={() => setForm(null)} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white"><X size={18}/></button>
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

              <hr className="border-zinc-800"/>
              <p className="text-sm font-semibold text-zinc-300">Remuneraciones</p>
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
                  <p className="text-sm font-semibold text-zinc-300">Bonos fijos</p>
                  <button onClick={agregarBono} className="text-xs text-brand-400 hover:text-brand-300 font-medium">+ Agregar bono</button>
                </div>
                {(form.bonos_fijos || []).map((b, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input className="input flex-1" placeholder="Nombre del bono" value={b.nombre} onChange={e => setBono(i,"nombre",e.target.value)}/>
                    <input className="input w-36" type="number" placeholder="Monto" value={b.monto} onChange={e => setBono(i,"monto",e.target.value)}/>
                    <button onClick={() => eliminarBono(i)} className="p-2 text-red-400 hover:text-red-300"><X size={16}/></button>
                  </div>
                ))}
              </div>

              <hr className="border-zinc-800"/>
              {/* Toggle extranjero */}
              <div className="flex items-center justify-between bg-zinc-800/50 rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-zinc-300 flex items-center gap-2"><Globe size={15} className="text-blue-400"/> Trabajador extranjero</p>
                  <p className="text-xs text-zinc-500">Pago en USD, sin descuentos legales chilenos</p>
                </div>
                <button
                  type="button"
                  onClick={() => set("es_extranjero", !form.es_extranjero)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${form.es_extranjero ? "bg-blue-600" : "bg-zinc-600"}`}
                >
                  <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${form.es_extranjero ? "translate-x-5" : ""}`}/>
                </button>
              </div>

              {form.es_extranjero ? (
                <>
                  <p className="text-sm font-semibold text-zinc-300">Datos internacionales</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">País</label>
                      <select className="input" value={form.pais} onChange={e => set("pais", e.target.value)}>
                        {PAISES.map(p => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Moneda</label>
                      <div className="flex gap-4 mt-2">
                        <label className="flex items-center gap-2 text-sm cursor-pointer text-zinc-300">
                          <input type="radio" checked={form.moneda === "USD"} onChange={() => set("moneda", "USD")}/> USD
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer text-zinc-300">
                          <input type="radio" checked={form.moneda === "CLP"} onChange={() => set("moneda", "CLP")}/> CLP
                        </label>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="label">Forma de pago</label>
                      <select className="input" value={form.forma_pago} onChange={e => set("forma_pago", e.target.value)}>
                        {FORMAS_PAGO.map(f => <option key={f}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Tipo contrato</label>
                      <div className="flex gap-4 mt-2">
                        <label className="flex items-center gap-2 text-sm cursor-pointer text-zinc-300">
                          <input type="radio" checked={form.es_contrato_indefinido} onChange={() => set("es_contrato_indefinido", true)}/> Indefinido
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer text-zinc-300">
                          <input type="radio" checked={!form.es_contrato_indefinido} onChange={() => set("es_contrato_indefinido", false)}/> Plazo fijo
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="label">Días vacaciones tomados</label>
                      <input className="input" type="number" value={form.dias_feriado_tomados} onChange={e => set("dias_feriado_tomados", e.target.value)}/>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-zinc-300">Previsión y salud</p>
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
                        <label className="flex items-center gap-2 text-sm cursor-pointer text-zinc-300">
                          <input type="radio" checked={form.es_fonasa} onChange={() => set("es_fonasa", true)}/> Fonasa
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer text-zinc-300">
                          <input type="radio" checked={!form.es_fonasa} onChange={() => set("es_fonasa", false)}/> Isapre
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="label">Tipo contrato</label>
                      <div className="flex gap-4 mt-2">
                        <label className="flex items-center gap-2 text-sm cursor-pointer text-zinc-300">
                          <input type="radio" checked={form.es_contrato_indefinido} onChange={() => set("es_contrato_indefinido", true)}/> Indefinido
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer text-zinc-300">
                          <input type="radio" checked={!form.es_contrato_indefinido} onChange={() => set("es_contrato_indefinido", false)}/> Plazo fijo
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="label">Días feriado tomados</label>
                      <input className="input" type="number" value={form.dias_feriado_tomados} onChange={e => set("dias_feriado_tomados", e.target.value)}/>
                    </div>
                  </div>
                  <hr className="border-zinc-800"/>
                  <p className="text-sm font-semibold text-zinc-300">Cuenta bancaria</p>
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
                </>
              )}
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-zinc-800">
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
