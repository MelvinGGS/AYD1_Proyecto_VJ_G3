import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../estilos/admin.css";
import SolicitudesOperadores from "./componentes/SolicitudesOperadores";
import SolicitudesEmpresas from "./componentes/SolicitudesEmpresas";
import RegistrarAdminForm from "./componentes/RegistrarAdminForm";
import SolicitudesCambioPerfil from "./componentes/SolicitudesCambioPerfil";

// Componentes modulares
import ReportesQuejas from "./componentes/ReportesQuejas";
import GestionUsuarios from "./componentes/GestionUsuarios";
import VisualizacionOperaciones from "./componentes/VisualizacionOperaciones";
import EstadisticasAdmin from "./componentes/EstadisticasAdmin";
import BitacoraLogs from "./componentes/BitacoraLogs";

const API_URL = "http://localhost:3000/api/admin";

const estadoTexto = {
  pendiente: "Pendiente",
  en_revision: "En revision",
  aceptado: "Aprobado",
  rechazado: "Rechazado",
  pendiente_verificacion: "Pendiente de verificacion",
  pendiente_aprobacion: "Pendiente de aprobacion",
  activo: "Activo",
  suspendido: "Suspendido",
};

const filtros = [
  { id: "por_aprobar", label: "Por aprobar" },
  { id: "aprobados", label: "Aprobados" },
  { id: "rechazados", label: "Rechazados" },
  { id: "todos", label: "Todos" },
];

function DashboardAdmin() {
  const navigate = useNavigate();
  const [vista, setVista] = useState("operadores");
  const [filtroEstado, setFiltroEstado] = useState("por_aprobar");
  const [operadores, setOperadores] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [accionando, setAccionando] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [modalRechazo, setModalRechazo] = useState(null);
  const [modalReunion, setModalReunion] = useState(null);
  const [modalError, setModalError] = useState("");
  const [adminForm, setAdminForm] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    email: "",
    password: "",
    confirmar_password: "",
  });

  const token = useMemo(() => localStorage.getItem("token") || "", []);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const limpiarMensajes = () => {
    setMensaje("");
    setError("");
  };

  const manejarRespuesta = async (respuesta) => {
    const data = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) {
      throw new Error(data.message || "No se pudo completar la accion.");
    }
    return data;
  };

  const cargarSolicitudes = async () => {
    if (!token) {
      setError("No hay sesion de administrador activa. Inicia sesion nuevamente.");
      return;
    }

    setCargando(true);
    limpiarMensajes();

    try {
      const [resOperadores, resEmpresas] = await Promise.all([
        fetch(`${API_URL}/solicitudes/operadores`, { headers }),
        fetch(`${API_URL}/solicitudes/empresas`, { headers }),
      ]);

      const dataOperadores = await manejarRespuesta(resOperadores);
      const dataEmpresas = await manejarRespuesta(resEmpresas);

      setOperadores(dataOperadores.data || []);
      setEmpresas(dataEmpresas.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarSolicitudes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const solicitudesActuales = vista === "operadores" ? operadores : empresas;

  const resumen = useMemo(() => {
    const pendientes = solicitudesActuales.filter((item) =>
      item.estado_solicitud === "pendiente" || item.estado_solicitud === "en_revision"
    ).length;
    const aprobados = solicitudesActuales.filter((item) => item.estado_solicitud === "aceptado").length;
    const rechazados = solicitudesActuales.filter((item) => item.estado_solicitud === "rechazado").length;

    return { pendientes, aprobados, rechazados, total: solicitudesActuales.length };
  }, [solicitudesActuales]);

  const solicitudesFiltradas = useMemo(() => {
    if (filtroEstado === "por_aprobar") {
      return solicitudesActuales.filter((item) =>
        item.estado_solicitud === "pendiente" || item.estado_solicitud === "en_revision"
      );
    }

    if (filtroEstado === "aprobados") {
      return solicitudesActuales.filter((item) => item.estado_solicitud === "aceptado");
    }

    if (filtroEstado === "rechazados") {
      return solicitudesActuales.filter((item) => item.estado_solicitud === "rechazado");
    }

    return solicitudesActuales;
  }, [filtroEstado, solicitudesActuales]);

  const ejecutarAccion = async (clave, url, opciones = {}) => {
    setAccionando(clave);
    limpiarMensajes();

    try {
      const respuesta = await fetch(url, {
        method: opciones.method || "PATCH",
        headers,
        body: opciones.body ? JSON.stringify(opciones.body) : undefined,
      });

      const data = await manejarRespuesta(respuesta);
      setMensaje(data.message || "Accion completada correctamente.");
      await cargarSolicitudes();
    } catch (err) {
      setError(err.message);
    } finally {
      setAccionando("");
    }
  };

  const fechaMinimaReunion = () => {
    const ahora = new Date();
    ahora.setMinutes(ahora.getMinutes() - ahora.getTimezoneOffset());
    return ahora.toISOString().slice(0, 16);
  };

  const cerrarModales = () => {
    setModalRechazo(null);
    setModalReunion(null);
    setModalError("");
  };

  const abrirModalRechazo = (tipo, solicitud) => {
    limpiarMensajes();
    setModalError("");
    setModalRechazo({
      tipo,
      solicitudId: solicitud.solicitud_id,
      titulo: tipo === "operador"
        ? `${solicitud.nombre} ${solicitud.apellido}`
        : solicitud.nombre_empresa,
      motivo_rechazo: "",
    });
  };

  const abrirModalReunion = (empresa) => {
    limpiarMensajes();
    setModalError("");
    setModalReunion({
      solicitudId: empresa.solicitud_id,
      nombreEmpresa: empresa.nombre_empresa,
      reunion_fecha: "",
      reunion_enlace: "",
    });
  };

  const rechazarOperador = (solicitudId, motivoRechazo) => {
    const motivo = motivoRechazo?.trim();
    if (!motivo) {
      setModalError("Ingresa un motivo para rechazar la solicitud.");
      return;
    }

    ejecutarAccion(
      `rechazar-operador-${solicitudId}`,
      `${API_URL}/solicitudes/operadores/${solicitudId}/rechazar`,
      { body: { motivo_rechazo: motivo } }
    );
    cerrarModales();
  };

  const rechazarEmpresa = (solicitudId, motivoRechazo) => {
    const motivo = motivoRechazo?.trim();
    if (!motivo) {
      setModalError("Ingresa un motivo para rechazar la solicitud.");
      return;
    }

    ejecutarAccion(
      `rechazar-empresa-${solicitudId}`,
      `${API_URL}/solicitudes/empresas/${solicitudId}/rechazar`,
      { body: { motivo_rechazo: motivo } }
    );
    cerrarModales();
  };

  const agendarReunion = (solicitudId, datosReunion) => {
    const reunion = datosReunion || {};
    if (!reunion.reunion_fecha || !reunion.reunion_enlace) {
      setModalError("Ingresa fecha y enlace para agendar la reunion.");
      return;
    }

    if (new Date(reunion.reunion_fecha) <= new Date()) {
      setModalError("La fecha de la reunion no puede ser una fecha pasada.");
      return;
    }

    ejecutarAccion(
      `reunion-${solicitudId}`,
      `${API_URL}/solicitudes/empresas/${solicitudId}/agendar-reunion`,
      { body: reunion }
    );
    cerrarModales();
  };

  const registrarAdministrador = async (e) => {
    e.preventDefault();

    if (adminForm.password !== adminForm.confirmar_password) {
      setError("Las contrasenas no coinciden.");
      return;
    }

    setAccionando("crear-admin");
    limpiarMensajes();

    try {
      const respuesta = await fetch(`${API_URL}/administradores`, {
        method: "POST",
        headers,
        body: JSON.stringify(adminForm),
      });

      const data = await manejarRespuesta(respuesta);
      setMensaje(data.message || "Administrador creado correctamente.");
      setAdminForm({
        nombre: "",
        apellido: "",
        telefono: "",
        email: "",
        password: "",
        confirmar_password: "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setAccionando("");
    }
  };

  const renderEstado = (estado) => (
    <span className={`admin-badge admin-badge-${estado || "neutral"}`}>
      {estadoTexto[estado] || estado || "Sin estado"}
    </span>
  );

  const cambiarVista = (nuevaVista) => {
    setVista(nuevaVista);
    setFiltroEstado("por_aprobar");
    limpiarMensajes();
  };

  const puedeResolver = (estado) => estado === "pendiente" || estado === "en_revision";

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("rol");
    navigate("/");
  };

  const isTabAprobaciones = vista === "operadores" || vista === "empresas";

  return (
    <main className="admin-page">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand-mark">TF</span>
          <div>
            <h1>TrackFlow-HUB</h1>
            <p>Administrador</p>
          </div>
        </div>

        <nav className="admin-nav" aria-label="Panel administrador">
          <button className={vista === "operadores" ? "active" : ""} onClick={() => cambiarVista("operadores")}>
            Operadores
          </button>
          <button className={vista === "empresas" ? "active" : ""} onClick={() => cambiarVista("empresas")}>
            Empresas
          </button>
          <button className={vista === "administradores" ? "active" : ""} onClick={() => cambiarVista("administradores")}>
            Administradores
          </button>
          <button className={vista === "cambios_perfil" ? "active" : ""} onClick={() => cambiarVista("cambios_perfil")}>
            Cambios de Perfil
          </button>
          <button className={vista === "reportes_quejas" ? "active" : ""} onClick={() => cambiarVista("reportes_quejas")}>
            Quejas/Reportes
          </button>
          <button className={vista === "gestion_usuarios" ? "active" : ""} onClick={() => cambiarVista("gestion_usuarios")}>
            Usuarios
          </button>
          <button className={vista === "visualizacion_operaciones" ? "active" : ""} onClick={() => cambiarVista("visualizacion_operaciones")}>
            Visualizar Operaciones
          </button>
          <button className={vista === "estadisticas_admin" ? "active" : ""} onClick={() => cambiarVista("estadisticas_admin")}>
            Estadisticas y PDFs
          </button>
          <button className={vista === "logs_actividad" ? "active" : ""} onClick={() => cambiarVista("logs_actividad")}>
            Bitacora / Logs
          </button>
        </nav>

        <button className="admin-logout" type="button" onClick={cerrarSesion}>
          Cerrar sesion
        </button>
      </aside>

      <section className="admin-content">
        <header className="admin-header">
          <div>
            <p className="admin-kicker">Panel de Administracion</p>
            <h2>
              {vista === "operadores" ? "Solicitudes de operadores"
                : vista === "empresas" ? "Solicitudes de empresas"
                  : vista === "cambios_perfil" ? "Solicitudes de cambio de perfil"
                    : vista === "reportes_quejas" ? "Moderacion de quejas y reportes"
                      : vista === "gestion_usuarios" ? "Gestion global de usuarios"
                        : vista === "visualizacion_operaciones" ? "Visualizacion de datos operacionales"
                          : vista === "estadisticas_admin" ? "Panel de estadisticas y descargas PDF"
                            : vista === "logs_actividad" ? "Bitacora de actividad de auditoria"
                              : "Registrar administrador"}
            </h2>
          </div>
          {isTabAprobaciones && (
            <button className="admin-icon-button" type="button" onClick={cargarSolicitudes} disabled={cargando} title="Actualizar">
              {cargando ? "..." : "R"}
            </button>
          )}
        </header>

        {mensaje && <div className="admin-alert success">{mensaje}</div>}
        {error && <div className="admin-alert error">{error}</div>}

        {isTabAprobaciones && (
          <>
            <section className="admin-metrics" aria-label="Resumen de solicitudes">
              <button type="button" className={filtroEstado === "por_aprobar" ? "active" : ""} onClick={() => setFiltroEstado("por_aprobar")}>
                <span>{resumen.pendientes}</span>
                Por aprobar
              </button>
              <button type="button" className={filtroEstado === "aprobados" ? "active" : ""} onClick={() => setFiltroEstado("aprobados")}>
                <span>{resumen.aprobados}</span>
                Aprobados
              </button>
              <button type="button" className={filtroEstado === "rechazados" ? "active" : ""} onClick={() => setFiltroEstado("rechazados")}>
                <span>{resumen.rechazados}</span>
                Rechazados
              </button>
              <button type="button" className={filtroEstado === "todos" ? "active" : ""} onClick={() => setFiltroEstado("todos")}>
                <span>{resumen.total}</span>
                Total
              </button>
            </section>

            <div className="admin-filter-row" role="tablist" aria-label="Filtro de estado">
              {filtros.map((filtro) => (
                <button
                  key={filtro.id}
                  type="button"
                  className={filtroEstado === filtro.id ? "active" : ""}
                  onClick={() => setFiltroEstado(filtro.id)}
                >
                  {filtro.label}
                </button>
              ))}
            </div>
          </>
        )}

        {vista === "operadores" && (
          <SolicitudesOperadores
            operadores={solicitudesFiltradas}
            puedeResolver={puedeResolver}
            ejecutarAccion={ejecutarAccion}
            abrirModalRechazo={abrirModalRechazo}
            renderEstado={renderEstado}
            accionando={accionando}
            cargando={cargando}
            API_URL={API_URL}
            estadoTexto={estadoTexto}
          />
        )}

        {vista === "empresas" && (
          <SolicitudesEmpresas
            empresas={solicitudesFiltradas}
            puedeResolver={puedeResolver}
            ejecutarAccion={ejecutarAccion}
            abrirModalRechazo={abrirModalRechazo}
            abrirModalReunion={abrirModalReunion}
            renderEstado={renderEstado}
            accionando={accionando}
            cargando={cargando}
            API_URL={API_URL}
            estadoTexto={estadoTexto}
          />
        )}

        {vista === "cambios_perfil" && (
          <SolicitudesCambioPerfil token={token} />
        )}

        {vista === "administradores" && (
          <RegistrarAdminForm
            adminForm={adminForm}
            setAdminForm={setAdminForm}
            registrarAdministrador={registrarAdministrador}
            accionando={accionando}
          />
        )}

        {/* Módulos Adicionales */}
        {vista === "reportes_quejas" && (
          <ReportesQuejas token={token} />
        )}

        {vista === "gestion_usuarios" && (
          <GestionUsuarios token={token} />
        )}

        {vista === "visualizacion_operaciones" && (
          <VisualizacionOperaciones token={token} />
        )}

        {vista === "estadisticas_admin" && (
          <EstadisticasAdmin token={token} />
        )}

        {vista === "logs_actividad" && (
          <BitacoraLogs token={token} />
        )}
      </section>

      {modalReunion && (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-reunion-title">
          <form
            className="admin-modal"
            onSubmit={(e) => {
              e.preventDefault();
              agendarReunion(modalReunion.solicitudId, {
                reunion_fecha: modalReunion.reunion_fecha,
                reunion_enlace: modalReunion.reunion_enlace,
              });
            }}
          >
            <div className="admin-modal-head">
              <div>
                <p className="admin-kicker">Empresa de transporte</p>
                <h3 id="modal-reunion-title">Agendar reunion</h3>
              </div>
              <button type="button" className="admin-modal-close" onClick={cerrarModales} aria-label="Cerrar">
                X
              </button>
            </div>

            <p className="admin-modal-subtitle">{modalReunion.nombreEmpresa}</p>

            <label>
              Fecha y hora
              <input
                type="datetime-local"
                min={fechaMinimaReunion()}
                value={modalReunion.reunion_fecha}
                onChange={(e) => setModalReunion({ ...modalReunion, reunion_fecha: e.target.value })}
                required
              />
            </label>

            <label>
              Enlace de reunion
              <input
                type="url"
                placeholder="https://meet.google.com/..."
                value={modalReunion.reunion_enlace}
                onChange={(e) => setModalReunion({ ...modalReunion, reunion_enlace: e.target.value })}
                required
              />
            </label>

            {modalError && <div className="admin-modal-error">{modalError}</div>}

            <div className="admin-modal-actions">
              <button type="button" className="admin-button neutral" onClick={cerrarModales}>
                Cancelar
              </button>
              <button type="submit" className="admin-button secondary" disabled={accionando === `reunion-${modalReunion.solicitudId}`}>
                Guardar reunion
              </button>
            </div>
          </form>
        </div>
      )}

      {modalRechazo && (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-rechazo-title">
          <form
            className="admin-modal"
            onSubmit={(e) => {
              e.preventDefault();
              if (modalRechazo.tipo === "operador") {
                rechazarOperador(modalRechazo.solicitudId, modalRechazo.motivo_rechazo);
              } else {
                rechazarEmpresa(modalRechazo.solicitudId, modalRechazo.motivo_rechazo);
              }
            }}
          >
            <div className="admin-modal-head">
              <div>
                <p className="admin-kicker">Solicitud de {modalRechazo.tipo}</p>
                <h3 id="modal-rechazo-title">Rechazar solicitud</h3>
              </div>
              <button type="button" className="admin-modal-close" onClick={cerrarModales} aria-label="Cerrar">
                X
              </button>
            </div>

            <p className="admin-modal-subtitle">{modalRechazo.titulo}</p>

            <label>
              Motivo de rechazo
              <textarea
                rows="5"
                placeholder="Escribe el motivo que recibira el usuario"
                value={modalRechazo.motivo_rechazo}
                onChange={(e) => setModalRechazo({ ...modalRechazo, motivo_rechazo: e.target.value })}
                required
              />
            </label>

            {modalError && <div className="admin-modal-error">{modalError}</div>}

            <div className="admin-modal-actions">
              <button type="button" className="admin-button neutral" onClick={cerrarModales}>
                Cancelar
              </button>
              <button
                type="submit"
                className="admin-button danger"
                disabled={accionando === `rechazar-${modalRechazo.tipo}-${modalRechazo.solicitudId}`}
              >
                Confirmar rechazo
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

export default DashboardAdmin;
