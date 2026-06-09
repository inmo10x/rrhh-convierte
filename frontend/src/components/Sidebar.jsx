import { NavLink } from "react-router-dom";
import { Users, FileText, Calculator, Download, LayoutDashboard, Clock, LogOut, Sun, Moon, HardDrive } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { backupApi } from "../api/client";
import { useState } from "react";

const links = [
  { to: "/",              icon: LayoutDashboard, label: "Dashboard"     },
  { to: "/empleados",     icon: Users,           label: "Empleados"     },
  { to: "/liquidaciones", icon: Calculator,      label: "Liquidaciones" },
  { to: "/finiquitos",    icon: FileText,        label: "Finiquitos"    },
  { to: "/previred",      icon: Download,        label: "Previred"      },
  { to: "/historial",     icon: Clock,           label: "Historial"     },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const [descargando, setDescargando] = useState(false);

  const descargarBackup = async () => {
    setDescargando(true);
    try {
      const blob = await backupApi.descargarUltimo();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `rrhh_backup_${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("No hay backups disponibles aún. Se crearán en el próximo deploy.");
    }
    setDescargando(false);
  };

  return (
    <aside className="w-56 min-h-screen flex flex-col border-r transition-colors duration-200
                      bg-white border-zinc-200
                      dark:bg-zinc-950 dark:border-zinc-800">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-500/15 border border-brand-500/25 flex items-center justify-center">
            <span className="text-brand-500 text-sm font-bold">R</span>
          </div>
          <div>
            <p className="font-bold text-sm leading-tight text-zinc-900 dark:text-white">RRHH</p>
            <p className="text-zinc-500 text-xs">Convierte</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-brand-500/15 text-brand-500 border border-brand-500/20"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
              }`
            }
          >
            <Icon size={15} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
        {/* Backup */}
        <button
          onClick={descargarBackup}
          disabled={descargando}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm
                     font-medium transition-colors disabled:opacity-50
                     text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100
                     dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800"
        >
          <HardDrive size={14} className="text-brand-500"/>
          {descargando ? "Descargando..." : "Descargar backup"}
        </button>

        {/* Toggle claro/oscuro */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm
                     font-medium transition-colors
                     text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100
                     dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800"
        >
          {isDark
            ? <><Sun size={14} className="text-brand-500"/> Modo claro</>
            : <><Moon size={14} className="text-brand-500"/> Modo oscuro</>
          }
        </button>

        {/* Usuario */}
        <div className="px-3 py-2 rounded-lg bg-zinc-100 border border-zinc-200
                        dark:bg-zinc-900 dark:border-zinc-800">
          <p className="text-xs text-zinc-400">Conectado como</p>
          <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{user?.nombre}</p>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg
                     text-zinc-500 hover:text-red-500 hover:bg-red-50
                     dark:hover:text-red-400 dark:hover:bg-zinc-800
                     transition-colors text-sm"
        >
          <LogOut size={14}/>
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
