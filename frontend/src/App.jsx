import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import { Dashboard }    from "./pages/index";
import Empleados        from "./pages/Empleados";
import Liquidaciones    from "./pages/Liquidaciones";
import Finiquitos       from "./pages/Finiquitos";
import { Previred }     from "./pages/index";

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/"              element={<Dashboard />} />
            <Route path="/empleados"     element={<Empleados />} />
            <Route path="/liquidaciones" element={<Liquidaciones />} />
            <Route path="/finiquitos"    element={<Finiquitos />} />
            <Route path="/previred"      element={<Previred />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
