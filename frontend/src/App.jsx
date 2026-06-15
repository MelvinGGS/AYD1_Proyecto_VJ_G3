import { Routes, Route } from "react-router-dom";

import Login from "./paginas/usuario/autenticacion/Login";
import Registro from "./paginas/usuario/autenticacion/Registro";
import ConfirmacionCorreo from "./paginas/usuario/autenticacion/ConfirmacionCorreo";
import DashboardAdmin from "./paginas/dashboards/DashboardAdmin";
import DashboardCliente from "./paginas/dashboards/DashboardCliente";
import DashboardOperador from "./paginas/dashboards/DashboardOperador";
import DashboardEmpresa from "./paginas/dashboards/DashboardEmpresa";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/confirmar-correo" element={<ConfirmacionCorreo />} />
      <Route path="/dashboard" element={<DashboardAdmin />} />
      {/* <Route path="/dashboard/admin" element={<DashboardAdmin />} /> */}
      <Route path="/dashboard/cliente" element={<DashboardCliente />} />
      <Route path="/dashboard/operador" element={<DashboardOperador />} />
      <Route path="/dashboard/empresa" element={<DashboardEmpresa />} />
    </Routes>
  );
}

export default App;