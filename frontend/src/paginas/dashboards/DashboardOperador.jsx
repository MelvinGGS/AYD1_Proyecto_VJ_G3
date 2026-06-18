import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../estilos/topNavbar.css";

function DashboardOperador() {
  const navigate = useNavigate();
  const [vista, setVista] = useState("inicio");

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("rol");
    navigate("/");
  };

  return (
    <div style={{ backgroundColor: "#F1F5F9", minHeight: "100vh" }}>
      {/* Top Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark navbar-usuario">
        <div className="container">
          <span className="navbar-brand fw-bold">TrackFlow-HUB</span>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarOperador"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarOperador">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <button
                  className={`nav-link border-0 bg-transparent ${vista === "inicio" ? "active" : ""}`}
                  onClick={() => setVista("inicio")}
                >
                  Inicio
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link border-0 bg-transparent ${vista === "servicios" ? "active" : ""}`}
                  onClick={() => setVista("servicios")}
                >
                  Gestión de Servicios
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link border-0 bg-transparent ${vista === "calendario" ? "active" : ""}`}
                  onClick={() => setVista("calendario")}
                >
                  Calendario Envíos
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link border-0 bg-transparent ${vista === "calificaciones" ? "active" : ""}`}
                  onClick={() => setVista("calificaciones")}
                >
                  Calificaciones / Reseñas
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link border-0 bg-transparent ${vista === "reportes" ? "active" : ""}`}
                  onClick={() => setVista("reportes")}
                >
                  Gestión de Reportes
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link border-0 bg-transparent ${vista === "cupones" ? "active" : ""}`}
                  onClick={() => setVista("cupones")}
                >
                  Gestión de Cupones
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link border-0 bg-transparent ${vista === "perfil" ? "active" : ""}`}
                  onClick={() => setVista("perfil")}
                >
                  Mi Perfil
                </button>
              </li>
            </ul>

            <button className="admin-logout" type="button" onClick={cerrarSesion}>
              Cerrar sesion
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="container dashboard-page-container">
        {vista === "inicio" && (
          <div className="row">
            <div className="col-12">
              <div className="dashboard-card-custom text-center py-5">
                <h1 className="fw-bold mb-3" style={{ color: "var(--color-secundario)" }}>
                  Bienvenido al Portal del Operador Logístico
                </h1>
                <p className="text-muted mb-4">
                  Administra tu catálogo de servicios de entrega, visualiza las reservaciones en tu zona de cobertura, y reporta anomalías.
                </p>
                <div className="row justify-content-center">
                  <div className="col-md-3 mb-3">
                    <div className="p-3 border rounded bg-light">
                      <h3 className="fw-bold text-primary">Q4,500.00</h3>
                      <span className="text-muted">Mis Ganancias (80%)</span>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="p-3 border rounded bg-light">
                      <h3 className="fw-bold text-success">3</h3>
                      <span className="text-muted">Servicios Activos</span>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="p-3 border rounded bg-light">
                      <h3 className="fw-bold text-warning">4.8 / 5</h3>
                      <span className="text-muted">Calificación General</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {vista === "servicios" && (
          <div className="row">
            <div className="col-md-5">
              <div className="dashboard-card-custom">
                <h2 className="dashboard-card-title">Crear Nuevo Servicio</h2>
                <div className="mb-3">
                  <label className="form-label">Nombre del Servicio</label>
                  <input type="text" className="form-control" placeholder="Ej. Envío Express Metropolitano" />
                </div>
                <div className="mb-3">
                  <label className="form-label">Zona de Cobertura</label>
                  <input type="text" className="form-control" placeholder="Ej. Zona 10, 15, 16" />
                </div>
                <div className="row">
                  <div className="col-6 mb-3">
                    <label className="form-label">Carga Máxima (kg)</label>
                    <input type="number" className="form-control" />
                  </div>
                  <div className="col-6 mb-3">
                    <label className="form-label">Precio por Envío</label>
                    <input type="number" className="form-control" />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Fotografías del Vehículo/Bodega (Mínimo 3)</label>
                  <input type="file" className="form-control" multiple />
                </div>
                <button className="btn btn-primary w-100">Publicar Servicio</button>
              </div>
            </div>
            <div className="col-md-7">
              <div className="dashboard-card-custom">
                <h2 className="dashboard-card-title">Mis Servicios Registrados</h2>
                <div className="list-group">
                  <div className="list-group-item p-3 mb-2 border rounded">
                    <div className="d-flex w-100 justify-content-between">
                      <h5 className="mb-1 fw-bold">Envío Carga Liviana</h5>
                      <span className="badge bg-success">Activo</span>
                    </div>
                    <p className="mb-1 text-muted">Precio: Q45.00. Cobertura: Zona 1, 9, 10. Límite: 20kg.</p>
                    <div className="mt-2">
                      <button className="btn btn-sm btn-outline-secondary me-2">Editar</button>
                      <button className="btn btn-sm btn-outline-warning me-2">Suspender temporalmente</button>
                      <button className="btn btn-sm btn-outline-danger">Eliminar</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {vista === "calendario" && (
          <div className="row">
            <div className="col-12">
              <div className="dashboard-card-custom">
                <h2 className="dashboard-card-title">Calendario de Envíos Programados</h2>
                <p className="text-muted">Fechas reservadas por los clientes para recolección y entrega.</p>
                <div className="list-group">
                  <div className="list-group-item p-3 mb-2 border rounded bg-light">
                    <div className="d-flex w-100 justify-content-between">
                      <h6 className="fw-bold">Fecha: 19/06/2026</h6>
                      <small className="text-primary fw-bold">Q45.00</small>
                    </div>
                    <p className="mb-0 text-muted">Cliente: Juan Pérez. Dirección de recolección: Zona 10. Paquete: Documentos.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {vista === "calificaciones" && (
          <div className="row">
            <div className="col-12">
              <div className="dashboard-card-custom">
                <h2 className="dashboard-card-title">Calificaciones de Clientes</h2>
                <div className="list-group">
                  <div className="list-group-item p-3 mb-3 border rounded">
                    <div className="d-flex w-100 justify-content-between">
                      <h6 className="fw-bold">Cliente: Juan Pérez</h6>
                      <small className="text-warning">Puntuación: 5 / 5</small>
                    </div>
                    <p className="mb-2 text-muted">El paquete llegó a tiempo y en perfectas condiciones.</p>
                    <div className="p-2 border rounded bg-light">
                      <label className="form-label mb-1 fw-bold" style={{ fontSize: "12px" }}>Responder a este comentario</label>
                      <div className="d-flex gap-2">
                        <input type="text" className="form-control form-control-sm" placeholder="Escribe tu respuesta" />
                        <button className="btn btn-sm btn-primary">Responder</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {vista === "reportes" && (
          <div className="row">
            <div className="col-md-6">
              <div className="dashboard-card-custom">
                <h2 className="dashboard-card-title">Reportar Cliente</h2>
                <p className="text-muted">Reporta conductas inapropiadas o información falsa de recolección/destino.</p>
                <div className="mb-3">
                  <label className="form-label">Cliente</label>
                  <input type="text" className="form-control" placeholder="Ej. Juan Pérez" />
                </div>
                <div className="mb-3">
                  <label className="form-label">Motivo</label>
                  <input type="text" className="form-control" placeholder="Ej. Daño intencional, dirección falsa" />
                </div>
                <div className="mb-3">
                  <label className="form-label">Descripción de hechos</label>
                  <textarea className="form-control" rows="3"></textarea>
                </div>
                <div className="mb-3">
                  <label className="form-label">Evidencia de soporte (Fotos/Videos)</label>
                  <input type="file" className="form-control" />
                </div>
                <button className="btn btn-danger w-100">Enviar Reporte</button>
              </div>
            </div>
            <div className="col-md-6">
              <div className="dashboard-card-custom">
                <h2 className="dashboard-card-title">Reportes recibidos de clientes</h2>
                <div className="list-group">
                  <div className="list-group-item p-3 mb-2 border rounded bg-light">
                    <h6 className="fw-bold">No se recolectó a tiempo</h6>
                    <p className="mb-1 text-muted">Estado del reporte: Enviado (en espera de revisión del admin).</p>
                    <small>Cliente: Juan Pérez</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {vista === "cupones" && (
          <div className="row">
            <div className="col-md-6">
              <div className="dashboard-card-custom">
                <h2 className="dashboard-card-title">Crear Cupón de Descuento</h2>
                <div className="mb-3">
                  <label className="form-label">Código del Cupón</label>
                  <input type="text" className="form-control" placeholder="Ej. VERANO2026" />
                </div>
                <div className="mb-3">
                  <label className="form-label">Tipo de Descuento</label>
                  <select className="form-select">
                    <option>Porcentaje</option>
                    <option>Monto Fijo</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Valor del Descuento</label>
                  <input type="number" className="form-control" />
                </div>
                <button className="btn btn-primary w-100">Generar y Enviar Cupón</button>
              </div>
            </div>
          </div>
        )}

        {vista === "perfil" && (
          <div className="row">
            <div className="col-12">
              <div className="dashboard-card-custom">
                <h2 className="dashboard-card-title">Editar Perfil del Operador</h2>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Nombre</label>
                    <input type="text" className="form-control" defaultValue="Mario" />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Apellido</label>
                    <input type="text" className="form-control" defaultValue="Gómez" />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Teléfono</label>
                    <input type="text" className="form-control" defaultValue="44445555" />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Zona de Operación</label>
                    <input type="text" className="form-control" defaultValue="Zona 10" />
                  </div>
                  <div className="col-12">
                    <div className="alert alert-warning">
                      Cualquier cambio de información requiere de aprobación del administrador antes de hacerse efectivo.
                    </div>
                  </div>
                </div>
                <button className="btn btn-primary me-2">Solicitar Cambios</button>
                <button className="btn btn-secondary">Descargar Reporte PDF Ganancias</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardOperador;