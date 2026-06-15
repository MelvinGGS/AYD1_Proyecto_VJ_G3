import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../../../estilos/aute.css";

function ConfirmacionCorreo() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extraer estado si venimos de Login (2FA Administrador) o Registro (confirmacion normal)
  const esAdmin2FA = location.state?.esAdmin2FA || false;
  const correoUsuario = location.state?.correo || "";

  const [codigo, setCodigo] = useState("");
  const [confirmado, setConfirmado] = useState(false);
  const [rolVerificado, setRolVerificado] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const manejarConfirmacion = async (e) => {
    e.preventDefault();

    if (!codigo.trim()) {
      setError("Debes ingresar el codigo de confirmacion.");
      return;
    }

    if (!correoUsuario) {
      setError("No se encontró un correo asociado a esta sesión.");
      return;
    }

    setCargando(true);
    setError("");

    try {
      let respuesta;
      
      if (esAdmin2FA) {
        // Flujo 2FA Administrador
        respuesta = await fetch("http://localhost:3000/api/auth/login/admin/verificar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: correoUsuario,
            token_2fa: codigo
          })
        });
      } else {
        respuesta = await fetch("http://localhost:3000/api/auth/verificar-correo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: correoUsuario, // se envía el email al backend para identificar al usuario
            token: codigo         // Token de confirmación para verificación de correo
          })
        });
      }

      const data = await respuesta.json();

      if (respuesta.ok || respuesta.status === 202) {
        if (esAdmin2FA) {
          // Si es 2FA, guardamos token y vamos directo al dashboard
          localStorage.setItem("token", data.data?.token || "");
          localStorage.setItem("rol", data.data?.rol || "");
          
          if (data.data?.rol === "administrador" || data.rol === "admin") {
            navigate('/dashboard');
          } else {
            navigate('/eventos');
          }
        } else {
          // Si es registro normal, mostramos mensaje de exito
          setRolVerificado(data.rol);
          setConfirmado(true);
        }
      } else {
        const texto = await respuesta.text();
        setError(texto || "El codigo es invalido o ya fue utilizado.");
      }
    } catch (err) {
      setError("No se pudo conectar con el servidor o el código es inválido. Por favor intenta de nuevo o contacta a soporte.");
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

                {/* --- RENDERIZADO CONDICIONAL SEGÚN EL ROL --- */}
                {rolVerificado === 'operador' ? (
                  <>
                    <p style={{ color: 'var(--color-secundario)', marginBottom: '15px' }}>
                      Tu cuenta ha sido verificada exitosamente. Actualmente tu perfil de operador logístico se encuentra en <strong>proceso de revisión</strong> por parte de la administración.
                    </p>
                    <p style={{ color: 'var(--color-secundario)', marginBottom: '25px', fontSize: '14px' }}>
                      Te notificaremos por correo electrónico cuando seas aceptado.
                    </p>
                  </>
                ) : rolVerificado === 'empresa_transporte' ? (
                  <>
                    <p style={{ color: 'var(--color-secundario)', marginBottom: '15px' }}>
                      Tu cuenta ha sido verificada exitosamente. El siguiente paso es agendar una <strong>reunión virtual</strong> con nuestro equipo.
                    </p>
                    <p style={{ color: 'var(--color-secundario)', marginBottom: '25px', fontSize: '14px' }}>
                      Por favor mantente atento a tu correo electrónico, ahí te enviaremos la fecha, hora y enlace de la reunión.
                    </p>
                  </>
                ) : (
                  <p style={{ color: 'var(--color-secundario)', marginBottom: '25px' }}>
                    Tu cuenta ha sido verificada exitosamente. Ya puedes iniciar sesión en TrackFlow-HUB.
                  </p>
                )}

                <button
                  className="btn btn-primary w-100"
                  onClick={() => navigate('/')}
                >
                  Regresar al Inicio
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