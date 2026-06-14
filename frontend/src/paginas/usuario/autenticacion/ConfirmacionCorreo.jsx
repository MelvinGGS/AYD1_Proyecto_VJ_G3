import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../../../estilos/aute.css";

function ConfirmacionCorreo() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extraer estado si venimos de Login (2FA Administrador)
  const esAdmin2FA = location.state?.esAdmin2FA || false;
  const correoAdmin = location.state?.correo || "";

  const [codigo, setCodigo] = useState("");
  const [confirmado, setConfirmado] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const manejarConfirmacion = async (e) => {
    e.preventDefault();

    if (!codigo.trim()) {
      setError("Debes ingresar el codigo de confirmacion.");
      return;
    }

    setCargando(true);
    setError("");

    try {
      let respuesta;
      
      if (esAdmin2FA) {
        // Flujo 2FA Administrador
        respuesta = await fetch("http://localhost:3001/api/auth/verificar-2fa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            correo_electronico: correoAdmin,
            codigo_2fa: codigo
          })
        });
      } else {
        // Flujo confirmacion de registro normal (GET)
        respuesta = await fetch("http://localhost:3001/api/auth/confirmar?token=" + codigo);
      }

      if (respuesta.ok || respuesta.status === 202) {
        if (esAdmin2FA) {
          // Si es 2FA, guardamos token y vamos directo al dashboard
          const data = await respuesta.json();
          localStorage.setItem("token", data.token);
          localStorage.setItem("rol", data.rol);
          
          if (data.rol === "administrador" || data.rol === "admin") {
            navigate('/dashboard');
          } else {
            navigate('/eventos');
          }
        } else {
          // Si es registro normal, mostramos mensaje de exito
          setConfirmado(true);
        }
      } else {
        const texto = await respuesta.text();
        setError(texto || "El codigo es invalido o ya fue utilizado.");
      }
    } catch (err) {
      setError("No se pudo conectar con el servidor. Intenta de nuevo.");
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

            {!confirmado ? (
              <>
                <h2 className="text-center mb-3">
                  {esAdmin2FA ? "Autenticación de 2 Pasos" : "Confirma tu Correo"}
                </h2>

                <p style={{ color: 'var(--color-secundario)', textAlign: 'center', marginBottom: '25px', fontSize: '14px' }}>
                  Hemos enviado un codigo de seis dígitos a tu correo electronico. Ingresalo a continuacion para {esAdmin2FA ? "iniciar sesión" : "activar tu cuenta"}.
                </p>

                <form onSubmit={manejarConfirmacion}>
                  <div className="mb-3">
                    <label className="form-label">
                      Codigo de Verificación
                    </label>

                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ingresa el codigo que recibiste"
                      value={codigo}
                      onChange={(e) => setCodigo(e.target.value)}
                      style={{ textAlign: 'center', letterSpacing: '2px', fontSize: '16px' }}
                    />
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
                    {cargando ? 'Verificando...' : 'Confirmar Código'}
                  </button>

                  <p style={{ color: 'var(--color-secundario)', textAlign: 'center', marginTop: '15px', fontSize: '13px' }}>
                    Si no encuentras el correo, revisa tu carpeta de spam.
                  </p>
                </form>
              </>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#d4edda', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
                  <span style={{ color: '#155724', fontSize: '28px', fontWeight: 'bold' }}>&#10003;</span>
                </div>

                <h2 style={{ color: '#155724', marginBottom: '15px' }}>
                  Correo Confirmado
                </h2>

                <p style={{ color: 'var(--color-secundario)', marginBottom: '25px' }}>
                  Tu cuenta ha sido verificada exitosamente. Ya puedes iniciar sesion en TrackFlow-HUB.
                </p>

                <button
                  className="btn btn-primary w-100"
                  onClick={() => navigate('/')}
                >
                  Ir a Iniciar Sesion
                </button>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}

export default ConfirmacionCorreo;
