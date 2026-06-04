import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/client";
import { Lock, User } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { username, password });
      login(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Error al iniciar sesión");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 mb-4 shadow-gold-lg">
            <span className="text-brand-500 text-2xl font-bold">R</span>
          </div>
          <h1 className="text-2xl font-bold text-white">RRHH Convierte</h1>
          <p className="text-zinc-500 text-sm mt-1">Agencia Convierte SPA</p>
        </div>

        {/* Card */}
        <div className="card p-6 space-y-5">
          <p className="text-sm font-semibold text-zinc-300">Iniciar sesión</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Usuario</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"/>
                <input
                  className="input pl-9"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="admin"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Contraseña</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"/>
                <input
                  className="input pl-9"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5"
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        </div>

        <p className="text-center text-zinc-600 text-xs mt-6">
          © 2026 Agencia Convierte SPA
        </p>
      </div>
    </div>
  );
}
