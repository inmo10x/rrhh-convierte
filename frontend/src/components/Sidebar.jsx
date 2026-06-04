import { NavLink } from "react-router-dom";
import { Users, FileText, Calculator, Download, LayoutDashboard, Clock, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

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

  return (
    <aside className="w-56 min-h-screen bg-zinc-950 border-r border-zinc-800 flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-500/15 border border-brand-500/25 flex items-center justify-center">
            <span className="text-brand-500 text-sm font-bold">R</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">RRHH</p>
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
                  ? "bg-brand-500/15 text-brand-400 border border-brand-500/20"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`
            }
          >
            <Icon size={15} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User + logout */}
      <div className="px-3 py-4 border-t border-zinc-800 space-y-2">
        <div className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800">
          <p className="text-xs text-zinc-400">Conectado como</p>
          <p className="text-sm font-medium text-white truncate">{user?.nombre}</p>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors text-sm"
        >
          <LogOut size={14}/>
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
