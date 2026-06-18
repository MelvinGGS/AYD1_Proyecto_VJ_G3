import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../estilos/topNavbar.css";

const formatearHora12 = (hora24) => {
  if (!hora24) return "";
  const [horasStr, minutosStr] = hora24.split(":");
  let horas = parseInt(horasStr);
  const ampm = horas >= 12 ? "pm" : "am";
  horas = horas % 12;
  horas = horas ? horas : 12;
  return `${horas}:${minutosStr} ${ampm}`;
};

function DashboardOperador() {
  const navigate = useNavigate();
  const [vista, setVista] = useState("inicio");
  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  const token = localStorage.getItem("token");

  const cargarServicios = async () => {
    setCargando(true);
    setError("");
    try {
      const respuesta = await fetch("http://localhost:3000/api/operador/servicios", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await respuesta.json();
      if (respuesta.ok) {
        setServicios(data.data.items || []);
      } else {
        setError(data.message || "Error al obtener los servicios.");
      }
    } catch (err) {
      setError("Error al conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (vista === "servicios") {
      cargarServicios();
    }
  }, [vista]);

  const manejarRegistroServicio = async (e) => {
    e.preventDefault();
    setError("");
    setExito("");

    const form = e.target;
    const formData = new FormData();
    formData.append("nombre_servicio", form.nombre_servicio.value);
    formData.append("zona_cobertura", form.zona_cobertura.value);
    formData.append("capacidad_carga_kg", form.capacidad_carga_kg.value);
    formData.append("precio_envio", form.precio_envio.value);
    formData.append("descripcion", form.descripcion.value);

    const checkboxesDias = form.querySelectorAll('input[name="dias_disponibles"]:checked');
    const diasSeleccionados = Array.from(checkboxesDias).map(el => el.value);

    if (diasSeleccionados.length === 0) {
      setError("Debes seleccionar al menos un día de la semana.");
      return;
    }

    const horaInicio = form.horario_hora_inicio.value;
    const horaFin = form.horario_hora_fin.value;

    if (!horaInicio || !horaFin) {
      setError("Debes ingresar la hora de inicio y de fin.");
      return;
    }

    const diasStr = diasSeleccionados.join(", ");
    const horaInicio12 = formatearHora12(horaInicio);
    const horaFin12 = formatearHora12(horaFin);
    const horarioDisponible = `${diasStr} de ${horaInicio12} a ${horaFin12}`;

    formData.append("horario_disponible", horarioDisponible);

    const inputFotos = form.fotos;
    if (inputFotos.files.length < 3) {
      setError("Debes seleccionar al menos 3 fotografias.");
      return;
    }

    for (let i = 0; i < inputFotos.files.length; i++) {
      formData.append("fotos", inputFotos.files[i]);
    }

    setCargando(true);
    try {
      const respuesta = await fetch("http://localhost:3000/api/operador/servicios", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      const data = await respuesta.json();
      if (respuesta.ok) {
        setExito("Servicio registrado exitosamente.");
        form.reset();
        cargarServicios();
      } else {
        setError(data.message || "Error al registrar el servicio.");
      }
    } catch (err) {
      setError("Error al conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  };

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
                
                {error && (
                  <div className="alert alert-danger" role="alert" style={{ fontSize: "14px" }}>
                    {error}
                  </div>
                )}
                {exito && (
                  <div className="alert alert-success" role="alert" style={{ fontSize: "14px" }}>
                    {exito}
                  </div>
                )}

                <form onSubmit={manejarRegistroServicio}>
                  <div className="mb-3">
                    <label className="form-label">Nombre del Servicio</label>
                    <input
                      type="text"
                      name="nombre_servicio"
                      className="form-control"
                      placeholder="Ej. Envio Express Metropolitano"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Descripcion</label>
                    <textarea
                      name="descripcion"
                      className="form-control"
                      rows="2"
                      placeholder="Ej. Servicio de envio rapido para paquetes livianos"
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Zona de Cobertura</label>
                    <input
                      type="text"
                      name="zona_cobertura"
                      className="form-control"
                      placeholder="Ej. Zona 10, 15, 16"
                      required
                    />
                  </div>
                  <div className="row">
                    <div className="col-6 mb-3">
                      <label className="form-label">Carga Maxima (kg)</label>
                      <input
                        type="number"
                        name="capacidad_carga_kg"
                        className="form-control"
                        step="0.01"
                        placeholder="Ej. 20"
                        required
                      />
                    </div>
                    <div className="col-6 mb-3">
                      <label className="form-label">Precio por Envio</label>
                      <input
                        type="number"
                        name="precio_envio"
                        className="form-control"
                        step="0.01"
                        placeholder="Ej. 45"
                        required
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold text-dark">Horario Disponible</label>
                    <div className="p-3 border rounded bg-light">
                      <div className="mb-3">
                        <label className="form-label text-muted d-block" style={{ fontSize: "12px" }}>Días Disponibles</label>
                        <div className="d-flex flex-wrap gap-2">
                          {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].map((dia) => (
                            <div key={dia} className="form-check form-check-inline border rounded p-2 bg-white flex-grow-1 text-center" style={{ minWidth: "90px" }}>
                              <input
                                className="form-check-input ms-0 me-2"
                                type="checkbox"
                                name="dias_disponibles"
                                value={dia}
                                id={`check-${dia}`}
                              />
                              <label className="form-check-label fw-semibold text-dark" htmlFor={`check-${dia}`} style={{ fontSize: "13px" }}>
                                {dia}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-6">
                          <label className="form-label text-muted" style={{ fontSize: "12px" }}>Hora Inicio (Desde)</label>
                          <input
                            type="time"
                            name="horario_hora_inicio"
                            className="form-control"
                            required
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label text-muted" style={{ fontSize: "12px" }}>Hora Fin (Hasta)</label>
                          <input
                            type="time"
                            name="horario_hora_fin"
                            className="form-control"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Fotografias del Vehiculo/Bodega (Minimo 3)</label>
                    <input
                      type="file"
                      name="fotos"
                      className="form-control"
                      multiple
                      accept="image/*"
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary w-100" disabled={cargando}>
                    {cargando ? "Publicando..." : "Publicar Servicio"}
                  </button>
                </form>
              </div>
            </div>
            <div className="col-md-7">
              <div className="dashboard-card-custom">
                <h2 className="dashboard-card-title">Mis Servicios Registrados</h2>
                
                {cargando && servicios.length === 0 ? (
                  <p className="text-center text-muted py-4">Cargando servicios...</p>
                ) : servicios.length === 0 ? (
                  <p className="text-center text-muted py-4">No tienes servicios registrados en el sistema.</p>
                ) : (
                  <div className="list-group">
                    {servicios.map((serv) => (
                      <div key={serv.id} className="list-group-item p-3 mb-3 border rounded bg-white">
                        <div className="d-flex w-100 justify-content-between align-items-center">
                          <h5 className="mb-1 fw-bold text-dark">{serv.nombre_servicio}</h5>
                          <span className={`badge ${serv.estado === "activo" ? "bg-success" : "bg-warning text-dark"}`}>
                            {serv.estado === "activo" ? "Activo" : "Suspendido"}
                          </span>
                        </div>
                        
                        {serv.descripcion && (
                          <p className="mb-2 text-muted" style={{ fontSize: "14px" }}>
                            {serv.descripcion}
                          </p>
                        )}
                        
                        <p className="mb-1 text-muted" style={{ fontSize: "13px" }}>
                          <strong>Precio:</strong> Q{serv.precio_envio.toFixed(2)} |{" "}
                          <strong>Cobertura:</strong> {serv.zona_cobertura} |{" "}
                          <strong>Limite:</strong> {serv.capacidad_carga_kg} kg
                        </p>
                        
                        {serv.horario_disponible && (
                          <p className="mb-2 text-muted" style={{ fontSize: "13px" }}>
                            <strong>Horario:</strong> {serv.horario_disponible}
                          </p>
                        )}

                        {serv.fotos && serv.fotos.length > 0 && (
                          <div className="d-flex gap-2 my-2 overflow-auto py-1">
                            {serv.fotos.map((foto, index) => (
                              <img
                                key={index}
                                src={foto.url_foto}
                                alt={`Foto ${index + 1} del servicio`}
                                className="border rounded"
                                style={{ width: "60px", height: "60px", objectFit: "cover" }}
                              />
                            ))}
                          </div>
                        )}
                        
                        <div className="mt-2 pt-2 border-top d-flex gap-2">
                          <button className="btn btn-sm btn-outline-secondary" disabled>
                            Editar
                          </button>
                          <button className="btn btn-sm btn-outline-warning" disabled>
                            Suspender temporalmente
                          </button>
                          <button className="btn btn-sm btn-outline-danger" disabled>
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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