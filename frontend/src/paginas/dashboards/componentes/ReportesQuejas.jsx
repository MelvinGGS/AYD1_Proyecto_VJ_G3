import { useState, useEffect } from "react";
import Swal from "sweetalert2";

function ReportesQuejas({ token }) {
  const [reportes, setReportes] = useState([]);
  const [filtro, setFiltro] = useState("todos");
  const [cargando, setCargando] = useState(false);
  
  const [reporteSeleccionado, setReporteSeleccionado] = useState(null);
  const [modalResolucion, setModalResolucion] = useState(null); 
  const [resolucionText, setResolucionText] = useState("");
  const [sancion, setSancion] = useState("ninguna");
  const [suspensionHasta, setSuspensionHasta] = useState("");

  const API_URL = "http://localhost:3000/api/admin/reportes";

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };

  const cargarReportes = async () => {
    setCargando(true);
    try {
      const response = await fetch(API_URL, { headers });
      const data = await response.json();
      if (data.success) {
        setReportes(data.data);
      } else {
        Swal.fire("Error", data.message || "No se pudieron cargar los reportes", "error");
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
      cargarReportes();
    }
  }, [token]);

  const cambiarEstadoRevision = async (id) => {
    try {
      const response = await fetch(`${API_URL}/${id}/resolver`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          estado_nuevo: "en_revision"
        })
      });
      const data = await response.json();
      if (data.success) {
        Swal.fire("En Revision", "El reporte ahora esta en revision.", "success");
        cargarReportes();
      } else {
        Swal.fire("Error", data.message || "No se pudo cambiar el estado", "error");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Error de conexion", "error");
    }
  };

  const abrirModalResolucion = (reporte, tipo) => {
    setReporteSeleccionado(reporte);
    setModalResolucion(tipo);
    setResolucionText("");
    setSancion("ninguna");
    setSuspensionHasta("");
  };

  const cerrarModal = () => {
    setReporteSeleccionado(null);
    setModalResolucion(null);
  };

  const guardarResolucion = async (e) => {
    e.preventDefault();
    if (!resolucionText.trim()) {
      Swal.fire("Advertencia", "Debes ingresar una explicacion o resolucion.", "warning");
      return;
    }

    if (modalResolucion === "aceptar" && sancion === "suspension_temporal" && !suspensionHasta) {
      Swal.fire("Advertencia", "Debes ingresar la fecha limite de la suspension.", "warning");
      return;
    }

    if (modalResolucion === "aceptar" && sancion === "suspension_temporal" && new Date(suspensionHasta) <= new Date()) {
      Swal.fire("Advertencia", "La fecha de suspension debe ser en el futuro.", "warning");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/${reporteSeleccionado.id}/resolver`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          estado_nuevo: modalResolucion === "aceptar" ? "aceptado" : "rechazado",
          resolucion: resolucionText,
          sancion_aplicada: modalResolucion === "aceptar" ? sancion : undefined,
          suspendido_hasta: modalResolucion === "aceptar" && sancion === "suspension_temporal" ? suspensionHasta : undefined
        })
      });

      const data = await response.json();
      if (data.success) {
        Swal.fire("Completado", data.message || "Reporte resuelto exitosamente.", "success");
        cerrarModal();
        cargarReportes();
      } else {
        Swal.fire("Error", data.message || "No se pudo resolver el reporte", "error");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Error de conexion", "error");
    }
  };

  const reportesFiltrados = reportes.filter((r) => {
    if (filtro === "todos") return true;
    return r.estado === filtro;
  });

  const getBadgeClass = (estado) => {
    switch (estado) {
      case "enviado": return "admin-badge-pendiente";
      case "en_revision": return "admin-badge-pendiente";
      case "aceptado": return "admin-badge-activo";
      case "rechazado": return "admin-badge-rechazado";
      default: return "";
    }
  };

  const getEstadoTexto = (estado) => {
    switch (estado) {
      case "enviado": return "Enviado";
      case "en_revision": return "En revision";
      case "aceptado": return "Aceptado";
      case "rechazado": return "Rechazado";
      default: return estado;
    }
  };

  return (
    <div className="reportes-quejas-container">
      <div className="admin-filter-row mb-4">
        {["todos", "enviado", "en_revision", "aceptado", "rechazado"].map((opc) => (
          <button
            key={opc}
            type="button"
            className={filtro === opc ? "active" : ""}
            onClick={() => setFiltro(opc)}
          >
            {opc === "todos" ? "Todos" : getEstadoTexto(opc)}
          </button>
        ))}
      </div>

      {cargando ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-2 text-muted">Cargando quejas...</p>
        </div>
      ) : reportesFiltrados.length === 0 ? (
        <div className="admin-table-panel p-4 text-center text-muted">
          No hay reportes o quejas registradas con este estado.
        </div>
      ) : (
        <div className="admin-table-panel">
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: "220px" }}>Reportante / Afectado</th>
                  <th style={{ width: "220px" }}>Usuario Reportado</th>
                  <th style={{ width: "200px" }}>Servicio / Motivo</th>
                  <th>Detalles de la Queja</th>
                  <th style={{ width: "160px" }}>Evidencias</th>
                  <th style={{ width: "120px" }}>Estado</th>
                  <th style={{ width: "240px" }}>Resolucion</th>
                  <th style={{ width: "150px" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {reportesFiltrados.map((rep) => (
                  <tr key={rep.id}>
                    <td>
                      <strong>{rep.reporter_nombre}</strong>
                      <small>{rep.reporter_email}</small>
                      <small className="badge bg-secondary text-capitalize">{rep.reporter_rol}</small>
                    </td>
                    <td>
                      <strong>{rep.reported_nombre}</strong>
                      <small>{rep.reported_email}</small>
                      <small className="badge bg-dark text-capitalize">{rep.reported_rol}</small>
                      {rep.reported_estado === "vetado" && (
                        <small className="text-danger font-weight-bold d-block mt-1">VETADO</small>
                      )}
                      {rep.reported_estado === "suspendido" && (
                        <small className="text-warning font-weight-bold d-block mt-1">SUSPENDIDO</small>
                      )}
                    </td>
                    <td>
                      <strong>{rep.motivo}</strong>
                      <small>Tipo: {rep.tipo_servicio === "envio" ? "Envio" : "Transporte"}</small>
                    </td>
                    <td>
                      <p className="m-0 text-secondary" style={{ fontSize: "0.95rem", whiteSpace: "pre-wrap", minWidth: "250px" }}>
                        {rep.descripcion}
                      </p>
                      <small className="text-muted d-block mt-1">Fecha: {new Date(rep.created_at).toLocaleString()}</small>
                    </td>
                    <td>
                      {rep.evidencias && rep.evidencias.length > 0 ? (
                        <div className="d-flex flex-wrap gap-2">
                          {rep.evidencias.map((ev, index) => (
                            <a
                              key={ev.id || index}
                              href={ev.url_archivo.startsWith("http") ? ev.url_archivo : `http://localhost:3000${ev.url_archivo}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="admin-photo-link"
                            >
                              <img
                                src={ev.url_archivo.startsWith("http") ? ev.url_archivo : `http://localhost:3000${ev.url_archivo}`}
                                alt="Evidencia"
                                className="admin-photo"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                              <span className="admin-photo-placeholder" style={{ display: 'none' }}>
                                Evidencia {index + 1}
                              </span>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted small">Sin evidencias</span>
                      )}
                    </td>
                    <td>
                      <span className={`admin-badge ${getBadgeClass(rep.estado)}`}>
                        {getEstadoTexto(rep.estado)}
                      </span>
                    </td>
                    <td>
                      {rep.resolucion ? (
                        <div>
                          <p className="m-0 small" style={{ maxWidth: "220px", overflowWrap: "break-word" }}>
                            {rep.resolucion}
                          </p>
                          {rep.sancion_aplicada && rep.sancion_aplicada !== "ninguna" && (
                            <span className="badge bg-danger mt-1 text-capitalize">
                              Sancion: {rep.sancion_aplicada.replace("_", " ")}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted small">No resuelto</span>
                      )}
                    </td>
                    <td>
                      <div className="d-flex flex-column gap-2">
                        {rep.estado === "enviado" && (
                          <button
                            type="button"
                            className="admin-button secondary py-2 btn-sm w-100"
                            onClick={() => cambiarEstadoRevision(rep.id)}
                          >
                            Revisar
                          </button>
                        )}
                        {(rep.estado === "enviado" || rep.estado === "en_revision") && (
                          <>
                            <button
                              type="button"
                              className="admin-button primary py-2 btn-sm w-100"
                              onClick={() => abrirModalResolucion(rep, "aceptar")}
                            >
                              Aceptar Queja
                            </button>
                            <button
                              type="button"
                              className="admin-button danger py-2 btn-sm w-100"
                              onClick={() => abrirModalResolucion(rep, "rechazar")}
                            >
                              Rechazar
                            </button>
                          </>
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

      {modalResolucion && (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
          <form className="admin-modal" onSubmit={guardarResolucion}>
            <div className="admin-modal-head">
              <div>
                <p className="admin-kicker">Moderacion de Quejas</p>
                <h3>{modalResolucion === "aceptar" ? "Aceptar Queja y Aplicar Resolucion" : "Rechazar Queja"}</h3>
              </div>
              <button type="button" className="admin-modal-close" onClick={cerrarModal}>
                X
              </button>
            </div>

            <p className="admin-modal-subtitle">
              Reporte contra: {reporteSeleccionado?.reported_nombre}
            </p>

            <label className="mb-2">
              Detalle de la Resolucion / Justificacion
              <textarea
                className="form-control"
                placeholder="Escribe aqui las conclusiones o justificaciones de tu resolucion..."
                value={resolucionText}
                onChange={(e) => setResolucionText(e.target.value)}
                required
              />
            </label>

            {modalResolucion === "aceptar" && (
              <>
                <label className="mb-2">
                  Sancion a aplicar al usuario reportado
                  <select
                    className="form-select"
                    value={sancion}
                    onChange={(e) => setSancion(e.target.value)}
                  >
                    <option value="ninguna">Ninguna (Apercibimiento simple)</option>
                    <option value="suspension_temporal">Suspension Temporal</option>
                    <option value="veto">Veto Permanente (Bloqueo de cuenta)</option>
                  </select>
                </label>

                {sancion === "suspension_temporal" && (
                  <label className="mb-2">
                    Suspender hasta la fecha
                    <input
                      type="datetime-local"
                      className="form-control"
                      value={suspensionHasta}
                      onChange={(e) => setSuspensionHasta(e.target.value)}
                      required
                    />
                  </label>
                )}
              </>
            )}

            <div className="admin-modal-actions">
              <button type="button" className="admin-button neutral" onClick={cerrarModal}>
                Cancelar
              </button>
              <button
                type="submit"
                className={`admin-button ${modalResolucion === "aceptar" ? "primary" : "danger"}`}
              >
                Confirmar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default ReportesQuejas;
