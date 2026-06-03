import { NavLink } from "react-router-dom";
import { Users, FileText, Calculator, Download, LayoutDashboard } from "lucide-react";

const links = [
  { to: "/",             icon: LayoutDashboard, label: "Dashboard"      },
  { to: "/empleados",    icon: Users,           label: "Empleados"      },
  { to: "/liquidaciones",icon: Calculator,      label: "Liquidaciones"  },
  { to: "/finiquitos",   icon: FileText,        label: "Finiquitos"     },
  { to: "/previred",     icon: Download,        label: "Previred"       },
];

export default function Sidebar() {
  return (
    <aside className="w-56 min-h-screen bg-brand-900 flex flex-col">
      <div className="px-6 py-5 border-b border-brand-700">
        <p className="text-white font-bold text-lg tracking-tight">RRHH</p>
        <p className="text-brand-100 text-xs font-medium">Agencia Convierte</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-500 text-white"
                  : "text-brand-100 hover:bg-brand-700 hover:text-white"
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-6 py-4 border-t border-brand-700">
        <p className="text-brand-300 text-xs">v1.0.0</p>
      </div>
    </aside>
  );
}
