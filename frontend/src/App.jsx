import { Routes, Route } from "react-router-dom";

import Login from "./paginas/usuario/autenticacion/Login";
import Registro from "./paginas/usuario/autenticacion/Registro";
import ConfirmacionCorreo from "./paginas/usuario/autenticacion/ConfirmacionCorreo";
import CambiarPasswordTemporal from "./paginas/usuario/autenticacion/CambiarPasswordTemporal";
import DashboardAdmin from "./paginas/dashboards/DashboardAdmin";
import DashboardCliente from "./paginas/dashboards/DashboardCliente";
import DashboardOperador from "./paginas/dashboards/DashboardOperador";
import DashboardEmpresa from "./paginas/dashboards/DashboardEmpresa";
import RutaProtegida from "./componentes/RutaProtegida";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/confirmar-correo" element={<ConfirmacionCorreo />} />
      <Route path="/cambiar-password-temporal" element={<CambiarPasswordTemporal />} />
      
      {/* Rutas protegidas */}
      <Route path="/dashboard" element={
        <RutaProtegida rolPermitido="administrador">
          <DashboardAdmin />
        </RutaProtegida>
      } />
      <Route path="/dashboard/admin" element={
        <RutaProtegida rolPermitido="administrador">
          <DashboardAdmin />
        </RutaProtegida>
      } />
      <Route path="/dashboard/cliente" element={
        <RutaProtegida rolPermitido="cliente">
          <DashboardCliente />
        </RutaProtegida>
      } />
      <Route path="/dashboard/operador" element={
        <RutaProtegida rolPermitido="operador">
          <DashboardOperador />
        </RutaProtegida>
      } />
      <Route path="/dashboard/empresa" element={
        <RutaProtegida rolPermitido="empresa_transporte">
          <DashboardEmpresa />
        </RutaProtegida>
      } />
    </Routes>
  );
}

export default App;
