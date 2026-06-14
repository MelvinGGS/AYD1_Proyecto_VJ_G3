import { useNavigate } from 'react-router-dom';
import { useState } from "react";
import { Link } from "react-router-dom";
import "../../../estilos/aute.css";

function Login() {

  const navigate = useNavigate();
  const [validado, setValidado] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const manejarSubmit = async (e) => {
    const formulario = e.currentTarget;
    e.preventDefault();

    if (!formulario.checkValidity()) {
      e.stopPropagation();
      setValidado(true);
      return;
    }

    setValidado(true);
    setCargando(true);
    setError("");

    const datos = new FormData(formulario);
    const requestData = {
      correo_electronico: datos.get("correo_electronico"),
      contrasena: datos.get("contrasena")
    };

    try {
      const respuesta = await fetch("http://localhost:3001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData)
      });

      if (respuesta.status === 202) {
        // Administrador requiere 2FA
        navigate('/confirmar-correo', { state: { esAdmin2FA: true, correo: requestData.correo_electronico } });
      } else if (respuesta.ok) {
        // Login exitoso, guardar token y redirigir
        const data = await respuesta.json();
        localStorage.setItem("token", data.token);
        localStorage.setItem("rol", data.rol);
        
        if (data.rol === "administrador" || data.rol === "admin") {
          navigate('/dashboard');
        } else {
          navigate('/eventos');
        }
      } else {
        const texto = await respuesta.text();
        setError(texto || "Credenciales invalidas");
      }
    } catch (err) {
      setError("Error al conectar con el servidor.");
    }
    setCargando(false);
  };

  return (
    <div className="container-fluid min-vh-100">
      <div className="row min-vh-100">

        <div className="col-lg-6 d-flex flex-column justify-content-center align-items-center panel-info text-center">
          <h1>TrackFlow-HUB</h1>
          <p>Sistema de Gestión de Envíos y Logística</p>
        </div>

        <div className="col-lg-6 d-flex justify-content-center align-items-center panel-formulario">
          <div
            className="card shadow p-4 w-100"
            style={{ maxWidth: "450px" }}
          >

            <h2 className="text-center mb-4">
              Iniciar Sesión
            </h2>

            <form
              noValidate
              className={validado ? "was-validated" : ""}
              onSubmit={manejarSubmit}
            >

              <div className="mb-3">
                <label className="form-label">
                  Correo Electrónico
                </label>

                <input
                  type="email"
                  name="correo_electronico"
                  className="form-control"
                  placeholder="Ingresa tu correo electrónico"
                  required
                />

                <div className="invalid-feedback">
                  Se debe ingresar un correo electrónico válido.
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">
                  Contraseña
                </label>

                <input
                  type="password"
                  name="contrasena"
                  className="form-control"
                  placeholder="********"
                  minLength="8"
                  required
                />

                <div className="invalid-feedback">
                  La contraseña debe tener al menos 8 caracteres.
                </div>
              </div>

              {error && (
                <div style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '10px', borderRadius: '5px', marginBottom: '15px', fontSize: '14px', textAlign: 'center' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary w-100"
                disabled={cargando}
              >
                {cargando ? 'Ingresando...' : 'Ingresar'}
              </button>

              <p className="text-center mt-3">
                No tienes una cuenta?{" "}
                <Link
                  to="/registro"
                  className="link-secondary link-offset-2 link-underline-opacity-25 link-underline-opacity-100-hover"
                >
                  Regístrate aquí
                </Link>
              </p>

            </form>

          </div>
        </div>

      </div>
    </div>
  );
}

export default Login;