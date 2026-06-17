import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import "../../../estilos/aute.css";

function CambiarPasswordTemporal() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const correo = location.state?.correo || "";
  const rol = location.state?.rol || localStorage.getItem("rol") || "";

  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  
  const [validado, setValidado] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [exito, setExito] = useState(false);

  const manejarSubmit = async (e) => {
    const formulario = e.currentTarget;
    e.preventDefault();

    if (!formulario.checkValidity()) {
      e.stopPropagation();
      setValidado(true);
      return;
    }

    setValidado(true);

    if (passwordNueva !== confirmarPassword) {
      setError("La nueva contraseña y su confirmacion no coinciden.");
      return;
    }

    if (passwordNueva.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }

    const regexPassword = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!regexPassword.test(passwordNueva)) {
      setError("La nueva contraseña debe tener al menos una mayúscula, un número y un carácter especial.");
      return;
    }

    setCargando(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const respuesta = await fetch("http://localhost:3000/api/auth/cambiar-password-temporal", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          password_actual: passwordActual,
          password_nueva: passwordNueva,
          confirmar_password: confirmarPassword
        })
      });

      const data = await respuesta.json();

      if (respuesta.ok) {
        setExito(true);
        setTimeout(() => {
          // Redirigir según el rol
          switch (rol) {
            case "operador":
              navigate("/dashboard/operador");
              break;
            case "empresa_transporte":
              navigate("/dashboard/empresa");
              break;
            default:
              navigate("/");
          }
        }, 2000);
      } else {
        setError(data.message || "Error al actualizar la contraseña.");
      }
    } catch (err) {
      setError("Error al conectar con el servidor.");
    }
    setCargando(false);
  };

  return (
    <div className="contenedor-auth">
      <div className="panel-info">
        <h1>TrackFlow-HUB</h1>
        <p>Establece tu contraseña definitiva de acceso</p>
      </div>

      <div className="panel-formulario">
        <div className="card">
          <h2 className="text-center mb-4" style={{ color: "var(--color-secundario)", fontWeight: "bold" }}>
            Actualizar Contraseña
          </h2>

          <p className="text-center mb-4" style={{ fontSize: "14px", color: "var(--color-texto-mutado)" }}>
            Has ingresado con una contraseña temporal. Por seguridad, debes cambiarla para continuar.
            {correo && <strong> (Cuenta: {correo})</strong>}
          </p>

          <form noValidate className={validado ? "was-validated" : ""} onSubmit={manejarSubmit}>
            <div className="mb-3">
              <label className="form-label" style={{ fontWeight: "600", color: "var(--color-secundario)" }}>
                Contraseña Temporal Actual
              </label>
              <input
                type="password"
                className="form-control"
                placeholder="Ingresa la contraseña temporal recibida"
                value={passwordActual}
                onChange={(e) => setPasswordActual(e.target.value)}
                required
              />
              <div className="invalid-feedback">Ingresa tu contraseña temporal actual.</div>
            </div>

            <div className="mb-3">
              <label className="form-label" style={{ fontWeight: "600", color: "var(--color-secundario)" }}>
                Nueva Contraseña
              </label>
              <input
                type="password"
                className="form-control"
                placeholder="********"
                value={passwordNueva}
                onChange={(e) => setPasswordNueva(e.target.value)}
                minLength="8"
                required
              />
              <div className="invalid-feedback">La contraseña debe tener al menos 8 caracteres.</div>
            </div>

            <div className="mb-3">
              <label className="form-label" style={{ fontWeight: "600", color: "var(--color-secundario)" }}>
                Confirmar Nueva Contraseña
              </label>
              <input
                type="password"
                className="form-control"
                placeholder="********"
                value={confirmarPassword}
                onChange={(e) => setConfirmarPassword(e.target.value)}
                minLength="8"
                required
              />
              <div className="invalid-feedback">Confirma tu nueva contraseña.</div>
            </div>

            {error && (
              <div style={{ backgroundColor: "#f8d7da", color: "#721c24", padding: "10px", borderRadius: "10px", marginBottom: "15px", fontSize: "14px", textAlign: "center" }}>
                {error}
              </div>
            )}

            {exito && (
              <div style={{ backgroundColor: "#d4edda", color: "#155724", padding: "10px", borderRadius: "10px", marginBottom: "15px", fontSize: "14px", textAlign: "center" }}>
                Contraseña actualizada con éxito. Redirigiendo a tu panel...
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={cargando || exito}>
              {cargando ? "Actualizando..." : "Actualizar Contraseña"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CambiarPasswordTemporal;
