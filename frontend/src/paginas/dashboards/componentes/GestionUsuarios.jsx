import { useState, useEffect } from "react";
import Swal from "sweetalert2";

function GestionUsuarios({ token }) {
  const [usuarios, setUsuarios] = useState([]);
  const [filtroRol, setFiltroRol] = useState("todos");
  const [cargando, setCargando] = useState(false);

  const [usuarioEditar, setUsuarioEditar] = useState(null);
  const [formEditar, setFormEditar] = useState({});
  const [usuarioVetar, setUsuarioVetar] = useState(null);
  const [motivoVeto, setMotivoVeto] = useState("");

  const API_URL = "http://localhost:3000/api/admin/usuarios";

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };

  const cargarUsuarios = async () => {
    setCargando(true);
    try {
      const endpoint = filtroRol === "todos" ? API_URL : `${API_URL}?rol=${filtroRol}`;
      const response = await fetch(endpoint, { headers });
      const data = await response.json();
      if (data.success) {
        setUsuarios(data.data);
      } else {
        Swal.fire("Error", data.message || "No se pudieron obtener los usuarios", "error");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Error de conexion con el servidor", "error");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (token) {
      cargarUsuarios();
    }
  }, [token, filtroRol]);

  const abrirModalEditar = (user) => {
    setUsuarioEditar(user);
    setFormEditar({
      nombre: user.cliente_nombre || user.operador_nombre || user.admin_nombre || "",
      apellido: user.cliente_apellido || user.operador_apellido || user.admin_apellido || "",
      telefono: user.cliente_telefono || user.operador_telefono || user.empresa_telefono || user.admin_telefono || "",
      dpi_cui: user.operador_dpi || "",
      zona_operacion: user.operador_zona || "",
      nombre_empresa: user.empresa_nombre || "",
      nit: user.empresa_nit || "",
      numero_licencia_operativa: user.empresa_licencia || "",
      genero: user.operador_genero || "prefiero_no_decir"
    });
  };

  const cerrarModalEditar = () => {
    setUsuarioEditar(null);
    setFormEditar({});
  };

  const guardarEdicion = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/${usuarioEditar.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(formEditar)
      });
      const data = await response.json();
      if (data.success) {
        Swal.fire("Guardado", "Usuario actualizado correctamente.", "success");
        cerrarModalEditar();
        cargarUsuarios();
      } else {
        Swal.fire("Error", data.message || "No se pudo actualizar el usuario", "error");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Error de conexion", "error");
    }
  };

  const abrirModalVetar = (user) => {
    setUsuarioVetar(user);
    setMotivoVeto("");
  };

  const cerrarModalVetar = () => {
    setUsuarioVetar(null);
    setMotivoVeto("");
  };

  const confirmarVeto = async (e) => {
    e.preventDefault();
    if (!motivoVeto.trim()) {
      Swal.fire("Advertencia", "Debes ingresar un motivo para vetar al usuario.", "warning");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/${usuarioVetar.id}/vetar`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ motivo: motivoVeto })
      });
      const data = await response.json();
      if (data.success) {
        Swal.fire("Vetado", "El usuario ha sido vetado de la plataforma.", "success");
        cerrarModalVetar();
        cargarUsuarios();
      } else {
        Swal.fire("Error", data.message || "No se pudo vetar al usuario", "error");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Error de conexion", "error");
    }
  };

  const getUsuarioEstadoBadge = (estado) => {
    switch (estado) {
      case "activo":
      case "verificado":
        return "admin-badge-activo";
      case "pendiente_verificacion":
      case "pendiente_aprobacion":
        return "admin-badge-pendiente";
      case "vetado":
      case "suspendido":
      default:
        return "admin-badge-rechazado";
    }
  };

  const getRolTexto = (rol) => {
    switch (rol) {
      case "cliente": return "Cliente";
      case "operador": return "Operador";
      case "empresa_transporte": return "Empresa de Transporte";
      case "administrador": return "Administrador";
      default: return rol;
    }
  };

  const getUsuarioNombre = (user) => {
    if (user.rol === "cliente") return `${user.cliente_nombre} ${user.cliente_apellido}`;
    if (user.rol === "operador") return `${user.operador_nombre} ${user.operador_apellido}`;
    if (user.rol === "empresa_transporte") return user.empresa_nombre;
    if (user.rol === "administrador") return `${user.admin_nombre} ${user.admin_apellido}`;
    return "Usuario";
  };

  return (
    <div className="gestion-usuarios-container">
      <div className="admin-filter-row mb-4">
        {["todos", "cliente", "operador", "empresa_transporte", "administrador"].map((rol) => (
          <button
            key={rol}
            type="button"
            className={filtroRol === rol ? "active" : ""}
            onClick={() => setFiltroRol(rol)}
          >
            {rol === "todos" ? "Todos" : getRolTexto(rol)}
          </button>
        ))}
      </div>

      {cargando ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-2 text-muted">Cargando usuarios...</p>
        </div>
      ) : usuarios.length === 0 ? (
        <div className="admin-table-panel p-4 text-center text-muted">
          No hay usuarios registrados con este rol.
        </div>
      ) : (
        <div className="admin-table-panel">
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: "240px" }}>Nombre completo / Razon Social</th>
                  <th style={{ width: "220px" }}>Correo Electronico</th>
                  <th style={{ width: "160px" }}>Rol</th>
                  <th style={{ width: "200px" }}>Detalles de Contacto</th>
                  <th style={{ width: "200px" }}>Documentos / IDs</th>
                  <th style={{ width: "140px" }}>Estado</th>
                  <th>Auditoria / Sancion</th>
                  <th style={{ width: "150px" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <strong>{getUsuarioNombre(user)}</strong>
                      <small className="text-muted">ID: {user.id.substring(0, 8)}...</small>
                    </td>
                    <td>
                      <strong>{user.email}</strong>
                      <small>{user.email_verificado ? "Email Verificado" : "Email Pendiente"}</small>
                    </td>
                    <td>
                      <span className="badge bg-dark">{getRolTexto(user.rol)}</span>
                    </td>
                    <td>
                      {user.rol === "cliente" && <small>Tel: {user.cliente_telefono}</small>}
                      {user.rol === "operador" && (
                        <>
                          <small>Tel: {user.operador_telefono}</small>
                          <small>Zona: {user.operador_zona}</small>
                          <small>Genero: {user.operador_genero}</small>
                        </>
                      )}
                      {user.rol === "empresa_transporte" && (
                        <>
                          <small>Tel: {user.empresa_telefono}</small>
                        </>
                      )}
                      {user.rol === "administrador" && <small>Tel: {user.admin_telefono || "Sin telefono"}</small>}
                    </td>
                    <td>
                      {user.rol === "operador" && (
                        <>
                          <small>DPI: <strong>{user.operador_dpi}</strong></small>
                        </>
                      )}
                      {user.rol === "empresa_transporte" && (
                        <>
                          <small>NIT: <strong>{user.empresa_nit}</strong></small>
                          <small>Lic: <strong>{user.empresa_licencia}</strong></small>
                        </>
                      )}
                      {user.rol !== "operador" && user.rol !== "empresa_transporte" && (
                        <span className="text-muted small">N/A</span>
                      )}
                    </td>
                    <td>
                      <span className={`admin-badge ${getUsuarioEstadoBadge(user.estado)}`}>
                        {user.estado.replace("_", " ").toUpperCase()}
                      </span>
                    </td>
                    <td>
                      {user.estado === "vetado" && (
                        <div className="text-danger small">
                          <strong>Vetado:</strong> {user.motivo_veto || "Sin motivo"}
                          <br />
                          <small>{user.fecha_veto ? new Date(user.fecha_veto).toLocaleDateString() : ""}</small>
                        </div>
                      )}
                      {user.estado === "suspendido" && (
                        <div className="text-warning small">
                          <strong>Suspendido:</strong> {user.motivo_suspension || "Sin motivo"}
                          <br />
                          <small>Hasta: {user.suspendido_hasta ? new Date(user.suspendido_hasta).toLocaleDateString() : ""}</small>
                        </div>
                      )}
                      {user.estado !== "vetado" && user.estado !== "suspendido" && (
                        <span className="text-muted small">Sin sanciones</span>
                      )}
                    </td>
                    <td>
                      <div className="d-flex flex-column gap-2">
                        <button
                          type="button"
                          className="admin-button secondary py-2 btn-sm w-100"
                          onClick={() => abrirModalEditar(user)}
                        >
                          Editar
                        </button>
                        {user.estado !== "vetado" && user.rol !== "administrador" && (
                          <button
                            type="button"
                            className="admin-button danger py-2 btn-sm w-100"
                            onClick={() => abrirModalVetar(user)}
                          >
                            Vetar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {usuarioEditar && (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
          <form className="admin-modal" onSubmit={guardarEdicion}>
            <div className="admin-modal-head">
              <div>
                <p className="admin-kicker">Gestion de Usuarios</p>
                <h3>Editar Datos de {getRolTexto(usuarioEditar.rol)}</h3>
              </div>
              <button type="button" className="admin-modal-close" onClick={cerrarModalEditar}>
                X
              </button>
            </div>

            <p className="admin-modal-subtitle">
              Correo: {usuarioEditar.email}
            </p>

            <div className="admin-form-grid">
              {(usuarioEditar.rol === "cliente" || usuarioEditar.rol === "operador" || usuarioEditar.rol === "administrador") && (
                <>
                  <label>
                    Nombre
                    <input
                      type="text"
                      className="form-control"
                      value={formEditar.nombre}
                      onChange={(e) => setFormEditar({ ...formEditar, nombre: e.target.value })}
                      required
                    />
                  </label>
                  <label>
                    Apellido
                    <input
                      type="text"
                      className="form-control"
                      value={formEditar.apellido}
                      onChange={(e) => setFormEditar({ ...formEditar, apellido: e.target.value })}
                      required
                    />
                  </label>
                </>
              )}

              {usuarioEditar.rol === "empresa_transporte" && (
                <label className="col-span-2">
                  Nombre de la Empresa
                  <input
                    type="text"
                    className="form-control"
                    value={formEditar.nombre_empresa}
                    onChange={(e) => setFormEditar({ ...formEditar, nombre_empresa: e.target.value })}
                    required
                  />
                </label>
              )}

              <label>
                Telefono
                <input
                  type="text"
                  className="form-control"
                  value={formEditar.telefono}
                  onChange={(e) => setFormEditar({ ...formEditar, telefono: e.target.value })}
                  required
                />
              </label>

              {usuarioEditar.rol === "operador" && (
                <>
                  <label>
                    DPI/CUI
                    <input
                      type="text"
                      className="form-control"
                      value={formEditar.dpi_cui}
                      onChange={(e) => setFormEditar({ ...formEditar, dpi_cui: e.target.value })}
                      required
                    />
                  </label>
                  <label>
                    Zona de Operacion
                    <input
                      type="text"
                      className="form-control"
                      value={formEditar.zona_operacion}
                      onChange={(e) => setFormEditar({ ...formEditar, zona_operacion: e.target.value })}
                      required
                    />
                  </label>
                  <label>
                    Genero
                    <select
                      className="form-select"
                      value={formEditar.genero}
                      onChange={(e) => setFormEditar({ ...formEditar, genero: e.target.value })}
                    >
                      <option value="masculino">Masculino</option>
                      <option value="femenino">Femenino</option>
                      <option value="otro">Otro</option>
                      <option value="prefiero_no_decir">Prefiero no decir</option>
                    </select>
                  </label>
                </>
              )}

              {usuarioEditar.rol === "empresa_transporte" && (
                <>
                  <label>
                    NIT
                    <input
                      type="text"
                      className="form-control"
                      value={formEditar.nit}
                      onChange={(e) => setFormEditar({ ...formEditar, nit: e.target.value })}
                      required
                    />
                  </label>
                  <label>
                    Licencia Operativa
                    <input
                      type="text"
                      className="form-control"
                      value={formEditar.numero_licencia_operativa}
                      onChange={(e) => setFormEditar({ ...formEditar, numero_licencia_operativa: e.target.value })}
                      required
                    />
                  </label>
                </>
              )}
            </div>

            <div className="admin-modal-actions mt-3">
              <button type="button" className="admin-button neutral" onClick={cerrarModalEditar}>
                Cancelar
              </button>
              <button type="submit" className="admin-button primary">
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      )}

      {usuarioVetar && (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
          <form className="admin-modal" onSubmit={confirmarVeto}>
            <div className="admin-modal-head">
              <div>
                <p className="admin-kicker">Gestion de Usuarios</p>
                <h3>Veto Permanente de Cuenta</h3>
              </div>
              <button type="button" className="admin-modal-close" onClick={cerrarModalVetar}>
                X
              </button>
            </div>

            <p className="admin-modal-subtitle">
              Usuario: {getUsuarioNombre(usuarioVetar)} ({usuarioVetar.email})
            </p>

            <div className="alert alert-danger font-weight-bold">
              ATENCION: Esta accion vetara al usuario permanentemente, deshabilitara su cuenta, cerrara sus sesiones activas y le notificara por correo electronico.
            </div>

            <label className="mb-2">
              Motivo del Veto
              <textarea
                className="form-control"
                placeholder="Escribe la justificacion formal para este veto permanente..."
                value={motivoVeto}
                onChange={(e) => setMotivoVeto(e.target.value)}
                required
              />
            </label>

            <div className="admin-modal-actions">
              <button type="button" className="admin-button neutral" onClick={cerrarModalVetar}>
                Cancelar
              </button>
              <button type="submit" className="admin-button danger">
                Confirmar Veto Permanente
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default GestionUsuarios;
