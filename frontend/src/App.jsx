import { Routes, Route } from "react-router-dom";

import Login from "./paginas/usuario/autenticacion/Login";
import Registro from "./paginas/usuario/autenticacion/Registro";
import ConfirmacionCorreo from "./paginas/usuario/autenticacion/ConfirmacionCorreo";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/confirmar-correo" element={<ConfirmacionCorreo />} />
    </Routes>
  );
}

export default App;