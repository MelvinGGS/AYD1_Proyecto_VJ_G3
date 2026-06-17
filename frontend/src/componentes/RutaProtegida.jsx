import { Navigate } from "react-router-dom";

function RutaProtegida({ children, rolPermitido }) {
  const token = localStorage.getItem("token");
  const rol = localStorage.getItem("rol");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (rolPermitido && rol !== rolPermitido) {
    switch (rol) {
      case "administrador":
        return <Navigate to="/dashboard/admin" replace />;
      case "cliente":
        return <Navigate to="/dashboard/cliente" replace />;
      case "operador":
        return <Navigate to="/dashboard/operador" replace />;
      case "empresa_transporte":
        return <Navigate to="/dashboard/empresa" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  return children;
}

export default RutaProtegida;
