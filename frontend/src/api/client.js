import axios from "axios";

const api = axios.create({ baseURL: "/api" });

// Adjuntar token en cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("rrhh_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Si el servidor devuelve 401, limpiar sesión y recargar
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("rrhh_token");
      localStorage.removeItem("rrhh_nombre");
      localStorage.removeItem("rrhh_user_id");
      window.location.href = "/";
    }
    return Promise.reject(err);
  }
);

export const empleadosApi = {
  listar:     ()         => api.get("/empleados/").then(r => r.data),
  obtener:    (id)       => api.get(`/empleados/${id}`).then(r => r.data),
  crear:      (data)     => api.post("/empleados/", data).then(r => r.data),
  actualizar: (id, data) => api.put(`/empleados/${id}`, data).then(r => r.data),
  eliminar:   (id)       => api.delete(`/empleados/${id}`).then(r => r.data),
};

export const liquidacionesApi = {
  simular:     (data)       => api.post("/liquidaciones/simular", data).then(r => r.data),
  guardar:     (data)       => api.post("/liquidaciones/guardar", data).then(r => r.data),
  porMes:      (anio, mes)  => api.get(`/liquidaciones/mes/${anio}/${mes}`).then(r => r.data),
  porEmpleado: (id)         => api.get(`/liquidaciones/empleado/${id}`).then(r => r.data),
};

export const finiquitosApi = {
  simular:      (data) => api.post("/finiquitos/simular", data).then(r => r.data),
  generarDocx:  (data) => api.post("/finiquitos/generar-docx", data, { responseType: "blob" }).then(r => r.data),
};

export const previredApi = {
  resumen:  (anio, mes) => api.get(`/previred/resumen/${anio}/${mes}`).then(r => r.data),
  exportar: (anio, mes) => api.get(`/previred/exportar/${anio}/${mes}`, { responseType: "blob" }).then(r => r.data),
};

export default api;
