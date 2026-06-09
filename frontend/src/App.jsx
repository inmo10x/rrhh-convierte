import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";
import { Dashboard } from "./pages/index";
import Empleados    from "./pages/Empleados";
import Liquidaciones from "./pages/Liquidaciones";
import Finiquitos   from "./pages/Finiquitos";
import { Previred } from "./pages/index";
import ActivityLog  from "./pages/ActivityLog";

function AppInner() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"/>
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <Sidebar />
        <main className="flex-1 overflow-auto bg-zinc-50 dark:bg-zinc-950 transition-colors duration-200">
          <Routes>
            <Route path="/"              element={<Dashboard />} />
            <Route path="/empleados"     element={<Empleados />} />
            <Route path="/liquidaciones" element={<Liquidaciones />} />
            <Route path="/finiquitos"    element={<Finiquitos />} />
            <Route path="/previred"      element={<Previred />} />
            <Route path="/historial"     element={<ActivityLog />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </ThemeProvider>
  );
}
