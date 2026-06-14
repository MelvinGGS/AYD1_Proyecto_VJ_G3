import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../../estilos/aute.css";

function Registro() {
  const navigate = useNavigate();
  const [rol, setRol] = useState("cliente"); // 'cliente', 'operador', 'empresa_transporte'
  const [validado, setValidado] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  // Estados comunes
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [telefono, setTelefono] = useState("");
  const [telefonoRespaldo, setTelefonoRespaldo] = useState("");

  // Campos específicos de Cliente e Integrantes individuales (Cliente/Operador)
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  
  // Específico Cliente
  const [direccionOrigen, setDireccionOrigen] = useState("");

  // Específico Operador
  const [dpiCui, setDpiCui] = useState("");
  const [zonaOperacion, setZonaOperacion] = useState("");
  const [genero, setGenero] = useState("");
  const [fotografia, setFotografia] = useState(null);

  // Específico Empresa de Transporte
  const [nombreEmpresa, setNombreEmpresa] = useState("");
  const [nit, setNit] = useState("");
  const [numeroLicenciaOperativa, setNumeroLicenciaOperativa] = useState("");

  const manejarCambioArchivo = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFotografia(e.target.files[0]);
    }
  };

  const manejarSubmit = async (e) => {
    const formulario = e.currentTarget;
    e.preventDefault();

    if (!formulario.checkValidity()) {
      e.stopPropagation();
      setValidado(true);
      return;
    }

    setValidado(true);

    if (password !== confirmarPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    // Validar requisitos adicionales de la contraseña: 1 mayúscula, 1 número, 1 caracter especial
    const regexPassword = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!regexPassword.test(password)) {
      setError("La contraseña debe tener al menos una mayúscula, un número y un carácter especial.");
      return;
    }

    setCargando(true);
    setError("");

    try {
      let respuesta;
      const baseUrl = "http://localhost:3000";

      if (rol === "cliente") {
        const payload = {
          nombre,
          apellido,
          telefono,
          email,
          password,
          confirmar_password: confirmarPassword,
        };
        if (direccionOrigen.trim()) {
          payload.direccion_origen = direccionOrigen;
        }

        respuesta = await fetch(`${baseUrl}/api/auth/registro/cliente`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else if (rol === "empresa_transporte") {
        const payload = {
          nombre_empresa: nombreEmpresa,
          telefono,
          email,
          password,
          confirmar_password: confirmarPassword,
          nit,
          numero_licencia_operativa: numeroLicenciaOperativa,
        };
        if (telefonoRespaldo.trim()) {
          payload.telefono_respaldo = telefonoRespaldo;
        }

        respuesta = await fetch(`${baseUrl}/api/auth/registro/empresa`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else if (rol === "operador") {
        if (!fotografia) {
          setError("Se requiere subir una fotografía para el operador logístico.");
          setCargando(false);
          return;
        }
        if (dpiCui.length !== 13) {
          setError("El DPI/CUI debe tener exactamente 13 dígitos.");
          setCargando(false);
          return;
        }

        const formData = new FormData();
        formData.append("nombre", nombre);
        formData.append("apellido", apellido);
        formData.append("dpi_cui", dpiCui);
        formData.append("telefono", telefono);
        if (telefonoRespaldo.trim()) {
          formData.append("telefono_respaldo", telefonoRespaldo);
        }
        formData.append("email", email);
        formData.append("password", password);
        formData.append("confirmar_password", confirmarPassword);
        formData.append("fotografia", fotografia);
        formData.append("zona_operacion", zonaOperacion);
        formData.append("genero", genero);

        respuesta = await fetch(`${baseUrl}/api/auth/registro/operador`, {
          method: "POST",
          body: formData,
        });
      }

      const data = await respuesta.json();

      if (respuesta.ok || respuesta.status === 201) {
        navigate("/confirmar-correo", { state: { correo: email } });
      } else {
        setError(data.message || "Error al registrar la cuenta.");
      }
    } catch (err) {
      setError("Error de conexión con el servidor.");
    }
    setCargando(false);
  };

  return (
    <div className="container-fluid min-vh-100">
      <div className="row min-vh-100">
        
        {/* Panel Izquierdo con Marca */}
        <div className="col-lg-6 d-flex flex-column justify-content-center align-items-center panel-info text-center">
          <h1>TrackFlow-HUB</h1>
          <p>Sistema de Gestión de Envíos y Logística</p>
        </div>

        {/* Panel Derecho de Formulario */}
        <div className="col-lg-6 d-flex justify-content-center align-items-center panel-formulario py-5">
          <div className="card-registro">
            <div>
              <h2 className="text-center mb-4" style={{ fontWeight: "bold", color: "var(--color-secundario)" }}>
                Crear Cuenta
              </h2>

              {/* Selector de Rol Premium con Minitarjetas */}
              <div className="role-cards-container">
                <div
                  className={`role-card ${rol === "cliente" ? "active" : ""}`}
                  onClick={() => {
                    setRol("cliente");
                    setError("");
                  }}
                >
                  <svg className="role-card-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span className="role-card-title">Cliente</span>
                </div>

                <div
                  className={`role-card ${rol === "operador" ? "active" : ""}`}
                  onClick={() => {
                    setRol("operador");
                    setError("");
                  }}
                >
                  <svg className="role-card-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                  <span className="role-card-title">Operador</span>
                </div>

                <div
                  className={`role-card ${rol === "empresa_transporte" ? "active" : ""}`}
                  onClick={() => {
                    setRol("empresa_transporte");
                    setError("");
                  }}
                >
                  <svg className="role-card-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="3" width="15" height="13" rx="2" ry="2" />
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                    <circle cx="5.5" cy="18.5" r="2.5" />
                    <circle cx="18.5" cy="18.5" r="2.5" />
                  </svg>
                  <span className="role-card-title">Empresa</span>
                </div>
              </div>

              <form
                noValidate
                className={validado ? "was-validated" : ""}
                onSubmit={manejarSubmit}
              >
                {/* GRID FIJO DE CAMPOS */}
                <div className="row">
                  
                  {/* Nombre / Nombre Empresa */}
                  <div className="col-md-6 mb-3">
                    {rol === "empresa_transporte" ? (
                      <>
                        <label className="form-label">Nombre de la Empresa</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Transportes Rápidos GT"
                          value={nombreEmpresa}
                          onChange={(e) => setNombreEmpresa(e.target.value)}
                          required
                        />
                        <div className="invalid-feedback">Nombre de empresa requerido.</div>
                      </>
                    ) : (
                      <>
                        <label className="form-label">Nombre</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Ej. Carlos"
                          value={nombre}
                          onChange={(e) => setNombre(e.target.value)}
                          required
                        />
                        <div className="invalid-feedback">Ingresa tu nombre.</div>
                      </>
                    )}
                  </div>

                  {/* Apellido / NIT */}
                  <div className="col-md-6 mb-3">
                    {rol === "empresa_transporte" ? (
                      <>
                        <label className="form-label">NIT</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Ej. 12345678-9"
                          value={nit}
                          onChange={(e) => setNit(e.target.value)}
                          required
                        />
                        <div className="invalid-feedback">NIT requerido.</div>
                      </>
                    ) : (
                      <>
                        <label className="form-label">Apellido</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Ej. García"
                          value={apellido}
                          onChange={(e) => setApellido(e.target.value)}
                          required
                        />
                        <div className="invalid-feedback">Ingresa tu apellido.</div>
                      </>
                    )}
                  </div>

                  {/* Correo Electrónico (Común) */}
                  <div className="col-md-12 mb-3">
                    <label className="form-label">Correo Electrónico</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="usuario@correo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <div className="invalid-feedback">Ingresa un correo válido.</div>
                  </div>

                  {/* Teléfono y Dirección / DPI / Licencia */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Teléfono</label>
                    <input
                      type="tel"
                      className="form-control"
                      placeholder="55551234"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      required
                    />
                    <div className="invalid-feedback">Teléfono requerido.</div>
                  </div>

                  <div className="col-md-6 mb-3">
                    {rol === "cliente" && (
                      <>
                        <label className="form-label">Dirección Origen (Opcional)</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Ej. Zona 1, Guatemala"
                          value={direccionOrigen}
                          onChange={(e) => setDireccionOrigen(e.target.value)}
                        />
                      </>
                    )}

                    {rol === "operador" && (
                      <>
                        <label className="form-label">DPI / CUI</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="13 dígitos"
                          value={dpiCui}
                          onChange={(e) => setDpiCui(e.target.value.replace(/\D/g, ""))}
                          maxLength="13"
                          minLength="13"
                          required
                        />
                        <div className="invalid-feedback">DPI requerido (13 dígitos).</div>
                      </>
                    )}

                    {rol === "empresa_transporte" && (
                      <>
                        <label className="form-label">Licencia Operativa</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="LIC-OP-001-2026"
                          value={numeroLicenciaOperativa}
                          onChange={(e) => setNumeroLicenciaOperativa(e.target.value)}
                          required
                        />
                        <div className="invalid-feedback">Licencia requerida.</div>
                      </>
                    )}
                  </div>

                  {/* Contraseñas (Comunes) */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Contraseña</label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="********"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength="8"
                      required
                    />
                    <div className="invalid-feedback">Requerida (mín 8 chars).</div>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Confirmar Contraseña</label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="********"
                      value={confirmarPassword}
                      onChange={(e) => setConfirmarPassword(e.target.value)}
                      minLength="8"
                      required
                    />
                    <div className="invalid-feedback">Confirma la contraseña.</div>
                  </div>

                  {/* Campos adicionales de Operador (Doble Fila) */}
                  {rol === "operador" && (
                    <>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Género</label>
                        <select
                          className="form-control"
                          value={genero}
                          onChange={(e) => setGenero(e.target.value)}
                          required
                        >
                          <option value="">Selecciona...</option>
                          <option value="masculino">Masculino</option>
                          <option value="femenino">Femenino</option>
                          <option value="otro">Otro</option>
                          <option value="prefiero_no_decir">Prefiero no decir</option>
                        </select>
                        <div className="invalid-feedback">Selecciona un género.</div>
                      </div>

                      <div className="col-md-6 mb-3">
                        <label className="form-label">Teléfono Respaldo (Opcional)</label>
                        <input
                          type="tel"
                          className="form-control"
                          placeholder="55554321"
                          value={telefonoRespaldo}
                          onChange={(e) => setTelefonoRespaldo(e.target.value)}
                        />
                      </div>

                      <div className="col-md-12 mb-3">
                        <label className="form-label">Zona de Operación</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Ej. Zona 10, Ciudad de Guatemala"
                          value={zonaOperacion}
                          onChange={(e) => setZonaOperacion(e.target.value)}
                          required
                        />
                        <div className="invalid-feedback">Ingresa tu zona de operación.</div>
                      </div>

                      <div className="col-md-12 mb-3">
                        <label className="form-label">Fotografía de Perfil (JPG/PNG)</label>
                        <input
                          type="file"
                          className="form-control"
                          accept="image/jpeg,image/png"
                          onChange={manejarCambioArchivo}
                          required
                        />
                        <div className="invalid-feedback">Sube tu fotografía de perfil.</div>
                      </div>
                    </>
                  )}

                  {/* Teléfono de Respaldo de Empresa de Transporte */}
                  {rol === "empresa_transporte" && (
                    <div className="col-md-12 mb-3">
                      <label className="form-label">Teléfono Respaldo (Opcional)</label>
                      <input
                        type="tel"
                        className="form-control"
                        placeholder="55554321"
                        value={telefonoRespaldo}
                        onChange={(e) => setTelefonoRespaldo(e.target.value)}
                      />
                    </div>
                  )}


                </div>

                {/* Alerta de Error */}
                {error && (
                  <div
                    style={{
                      backgroundColor: "#f8d7da",
                      color: "#721c24",
                      padding: "10px",
                      borderRadius: "5px",
                      margin: "10px 0 15px 0",
                      fontSize: "14px",
                      textAlign: "center",
                    }}
                  >
                    {error}
                  </div>
                )}

                {/* Botón de Envío */}
                <button
                  type="submit"
                  className="btn btn-primary w-100 py-2 mt-3"
                  disabled={cargando}
                >
                  {cargando ? "Registrando..." : "Registrarse"}
                </button>
              </form>
            </div>

            {/* Enlace a Login */}
            <p className="text-center mt-3 mb-0" style={{ fontSize: "14px" }}>
              ¿Ya tienes una cuenta?{" "}
              <Link
                to="/"
                className="link-secondary link-offset-2 link-underline-opacity-25 link-underline-opacity-100-hover"
                style={{ fontWeight: "600", color: "var(--color-primario)" }}
              >
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Registro;