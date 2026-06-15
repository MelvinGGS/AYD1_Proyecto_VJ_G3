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
      email: datos.get("correo_electronico"),
      password: datos.get("contrasena")
    };

    try {
      const respuesta = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData)
      });

      if (respuesta.status === 202) {
        // Administrador requiere 2FA
        navigate('/confirmar-correo', { state: { esAdmin2FA: true, correo: requestData.email } });
      } else if (respuesta.ok) {
        const data = await respuesta.json();
        localStorage.setItem("token", data.token);
        localStorage.setItem("rol", data.rol);

        // Redirigir según el rol
        switch (data.rol) {
          case "administrador":
            navigate('/dashboard/admin');
            break;
          case "cliente":
            navigate('/dashboard/cliente');
            break;
          case "operador":
            navigate('/dashboard/operador');
            break;
          case "empresa_transporte":
            navigate('/dashboard/empresa');
            break;
          default:
            navigate('/');
        }
      } else {
        const data = await respuesta.json();
        setError(data.message || "Credenciales inválidas.");
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
        <p>Sistema de Gestión de Envíos y Logística</p>
      </div>

      <div className="panel-formulario">
        <div className="card">

          <h2 className="text-center mb-4" style={{ color: 'var(--color-secundario)', fontWeight: 'bold' }}>
            Iniciar Sesión
          </h2>

          <form
            noValidate
            className={validado ? "was-validated" : ""}
            onSubmit={manejarSubmit}
          >

            <div className="mb-3">
              <label className="form-label" style={{ fontWeight: '600', color: 'var(--color-secundario)' }}>
                Correo Electrónico
              </label>
              <input
                type="email"
                name="correo_electronico"
                className="form-control"
                placeholder="usuario@correo.com"
                required
              />
              <div className="invalid-feedback">
                Se debe ingresar un correo electrónico válido.
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label" style={{ fontWeight: '600', color: 'var(--color-secundario)' }}>
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
              <div style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '10px', borderRadius: '10px', marginBottom: '15px', fontSize: '14px', textAlign: 'center' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={cargando}
            >
              {cargando ? 'Ingresando...' : 'Ingresar'}
            </button>

            <p className="text-center mt-3" style={{ fontSize: '14px', color: 'var(--color-texto-mutado)' }}>
              ¿No tienes una cuenta?{" "}
              <Link
                to="/registro"
                style={{ color: 'var(--color-primario)', fontWeight: '600', textDecoration: 'none' }}
              >
                Regístrate aquí
              </Link>
            </p>

          </form>

        </div>
      </div>

    </div>
  );
}

export default Login;