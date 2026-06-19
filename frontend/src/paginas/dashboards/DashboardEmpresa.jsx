import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../estilos/topNavbar.css";

function DashboardEmpresa() {
  const navigate = useNavigate();
  const [vista, setVista] = useState("inicio");

  const empresaId = localStorage.getItem("usuario_id") || localStorage.getItem("id");

  const [rutas, setRutas] = useState([]);
  const [archivoCSV, setArchivoCSV] = useState(null);
  const [rutaEditandoId, setRutaEditandoId] = useState(null);
  const [formularioRuta, setFormularioRuta] = useState({
    nombre_ruta: "", origen: "", destino: "", precio: "", tiempo_estimado: ""
  });

  // ESTADOS PARA EL MODAL DE CANCELACIÓN
  const [modalCancelacion, setModalCancelacion] = useState(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState("");

  useEffect(() => {
    if (vista === "rutas" && empresaId) {
      cargarRutas();
    }
  }, [vista]);

  const cargarRutas = async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/rutas/empresa/${empresaId}`);
      const data = await res.json();
      if (data.success) setRutas(data.data);
    } catch (error) {
      console.error("Error al cargar rutas", error);
    }
  };

  const manejarEnvioManual = async (e) => {
    e.preventDefault();
    const url = rutaEditandoId 
      ? `http://localhost:3000/api/rutas/${rutaEditandoId}` 
      : `http://localhost:3000/api/rutas/manual`;
    
    const metodo = rutaEditandoId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method: metodo,
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        // YA NO ENVIAMOS empresa_id AQUÍ
        body: JSON.stringify({
          tipo_servicio: "Estandar",
          ...formularioRuta
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setFormularioRuta({ nombre_ruta: "", origen: "", destino: "", precio: "", tiempo_estimado: "" });
        setRutaEditandoId(null);
        cargarRutas();
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      alert("Error de conexión al guardar la ruta.");
    }
  };

  const manejarSubidaCSV = async () => {
    if (!archivoCSV) return alert("Por favor selecciona un archivo CSV.");
    
    const formData = new FormData();
    formData.append("archivo_csv", archivoCSV);
    // YA NO AGREGAMOS empresa_id AL FORMDATA

    try {
      const res = await fetch("http://localhost:3000/api/rutas/csv", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setArchivoCSV(null);
        cargarRutas();
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      alert("Error de conexión al subir CSV.");
    }
  };

  const cambiarEstadoRuta = async (idRuta, nuevoEstado, motivo = "") => {
    try {
      const res = await fetch(`http://localhost:3000/api/rutas/${idRuta}/estado`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        // YA NO ENVIAMOS empresa_id AQUÍ
        body: JSON.stringify({ nuevo_estado: nuevoEstado, motivo_cancelacion: motivo })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        cargarRutas();
      }
    } catch (error) {
      alert("Error al cambiar estado.");
    }
  };

  const prepararEdicion = (ruta) => {
    setRutaEditandoId(ruta.id);
    setFormularioRuta({
      nombre_ruta: ruta.nombre_ruta,
      origen: ruta.origen,
      destino: ruta.destino,
      precio: ruta.precio,
      tiempo_estimado: ruta.tiempo_estimado || ""
    });
  };

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("rol");
    localStorage.removeItem("usuario_id");
    localStorage.removeItem("id");
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
            data-bs-target="#navbarEmpresa"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarEmpresa">
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
                  className={`nav-link border-0 bg-transparent ${vista === "rutas" ? "active" : ""}`}
                  onClick={() => setVista("rutas")}
                >
                  Gestión de Rutas
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link border-0 bg-transparent ${vista === "flota" ? "active" : ""}`}
                  onClick={() => setVista("flota")}
                >
                  Flota Vehículos
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link border-0 bg-transparent ${vista === "reportes" ? "active" : ""}`}
                  onClick={() => setVista("reportes")}
                >
                  Reportes Recibidos
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
                  Bienvenido al Portal de la Empresa de Transporte
                </h1>
                <p className="text-muted mb-4">
                  Carga tus rutas de viaje, administra los vehículos de tu flota, y ofrece descuentos de viaje a tus clientes.
                </p>
                <div className="row justify-content-center">
                  <div className="col-md-3 mb-3">
                    <div className="p-3 border rounded bg-light">
                      <h3 className="fw-bold text-primary">Q12,600.00</h3>
                      <span className="text-muted">Ganancias Generadas (90%)</span>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="p-3 border rounded bg-light">
                      <h3 className="fw-bold text-success">4</h3>
                      <span className="text-muted">Rutas Operativas</span>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="p-3 border rounded bg-light">
                      <h3 className="fw-bold text-warning">8</h3>
                      <span className="text-muted">Vehículos Flota</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {vista === "rutas" && (
          <div className="row">
            <div className="col-md-5">
              <div className="dashboard-card-custom mb-4">
                <h2 className="dashboard-card-title">Carga Masiva de Rutas/Flota</h2>
                <div className="mb-3">
                  <label className="form-label">Archivo CSV de Rutas</label>
                  <input 
                    type="file" 
                    className="form-control" 
                    accept=".csv" 
                    onChange={(e) => setArchivoCSV(e.target.files[0])}
                  />
                </div>
                <button className="btn btn-secondary w-100" onClick={manejarSubidaCSV}>
                  Cargar Archivo CSV
                </button>
              </div>

              <div className="dashboard-card-custom">
                <h2 className="dashboard-card-title">
                  {rutaEditandoId ? "Editar Ruta" : "Registrar Ruta Manualmente"}
                </h2>
                <div className="mb-3">
                  <label className="form-label">Nombre de la Ruta</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Ej. Capital - Xela" 
                    value={formularioRuta.nombre_ruta}
                    onChange={(e) => setFormularioRuta({...formularioRuta, nombre_ruta: e.target.value})}
                  />
                </div>
                <div className="row">
                  <div className="col-6 mb-3">
                    <label className="form-label">Origen</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={formularioRuta.origen}
                      onChange={(e) => setFormularioRuta({...formularioRuta, origen: e.target.value})}
                    />
                  </div>
                  <div className="col-6 mb-3">
                    <label className="form-label">Destino</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={formularioRuta.destino}
                      onChange={(e) => setFormularioRuta({...formularioRuta, destino: e.target.value})}
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="col-6 mb-3">
                    <label className="form-label">Precio Boleto</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={formularioRuta.precio}
                      onChange={(e) => setFormularioRuta({...formularioRuta, precio: e.target.value})}
                    />
                  </div>
                  <div className="col-6 mb-3">
                    <label className="form-label">Tiempo Estimado</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Ej. 4 horas" 
                      value={formularioRuta.tiempo_estimado}
                      onChange={(e) => setFormularioRuta({...formularioRuta, tiempo_estimado: e.target.value})}
                    />
                  </div>
                </div>
                <button className="btn btn-primary w-100" onClick={manejarEnvioManual}>
                  {rutaEditandoId ? "Guardar Cambios" : "Registrar Ruta"}
                </button>
                {rutaEditandoId && (
                  <button 
                    type="button" 
                    className="btn btn-light w-100 mt-2"
                    onClick={() => {
                      setRutaEditandoId(null);
                      setFormularioRuta({ nombre_ruta: "", origen: "", destino: "", precio: "", tiempo_estimado: "" });
                    }}
                  >
                    Cancelar Edición
                  </button>
                )}
              </div>
            </div>
            <div className="col-md-7">
              <div className="dashboard-card-custom">
                <h2 className="dashboard-card-title">Rutas de Transporte</h2>
                <div className="list-group">
                  {rutas.length === 0 ? (
                    <div className="list-group-item p-3 mb-2 border rounded text-center">
                      <p className="text-muted mb-0">No hay rutas registradas.</p>
                    </div>
                  ) : (
                    rutas.map((ruta) => (
                      <div key={ruta.id} className="list-group-item p-3 mb-2 border rounded">
                        <div className="d-flex w-100 justify-content-between">
                          <h5 className="mb-1 fw-bold">{ruta.nombre_ruta}</h5>
                          <span className={`badge ${ruta.estado === 'activa' ? 'bg-success' : ruta.estado === 'suspendida' ? 'bg-warning' : 'bg-danger'}`}>
                            {ruta.estado.charAt(0).toUpperCase() + ruta.estado.slice(1)}
                          </span>
                        </div>
                        <p className="mb-1 text-muted">Origen: {ruta.origen}. Destino: {ruta.destino}.</p>
                        <small className="text-muted">Precio: Q{ruta.precio}. Tiempo: {ruta.tiempo_estimado || 'N/A'}.</small>
                        <div className="mt-2">
                          <button 
                            className="btn btn-sm btn-outline-secondary me-2"
                            onClick={() => prepararEdicion(ruta)}
                          >
                            Editar
                          </button>
                          {ruta.estado !== 'suspendida' && (
                            <button 
                              className="btn btn-sm btn-outline-warning me-2"
                              onClick={() => cambiarEstadoRuta(ruta.id, "suspendida")}
                            >
                              Suspender temporalmente
                            </button>
                          )}
                          {ruta.estado !== 'cancelada' && (
                            <button 
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => setModalCancelacion(ruta.id)}
                            >
                              Cancelar por emergencia
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {vista === "flota" && (
          <div className="row">
            <div className="col-md-5">
              <div className="dashboard-card-custom">
                <h2 className="dashboard-card-title">Registrar Vehículo Manualmente</h2>
                <div className="mb-3">
                  <label className="form-label">Tipo de Vehículo</label>
                  <input type="text" className="form-control" placeholder="Ej. Microbús, Autobús" />
                </div>
                <div className="mb-3">
                  <label className="form-label">Placa</label>
                  <input type="text" className="form-control" placeholder="Ej. C-908BXD" />
                </div>
                <div className="row">
                  <div className="col-6 mb-3">
                    <label className="form-label">Capacidad de pasajeros</label>
                    <input type="number" className="form-control" />
                  </div>
                  <div className="col-6 mb-3">
                    <label className="form-label">Modelo / Año</label>
                    <input type="text" className="form-control" placeholder="Ej. Toyota 2022" />
                  </div>
                </div>
                <button className="btn btn-primary w-100">Registrar Vehículo</button>
              </div>
            </div>
            <div className="col-md-7">
              <div className="dashboard-card-custom">
                <h2 className="dashboard-card-title">Flota de Vehículos Registrada</h2>
                <div className="list-group">
                  <div className="list-group-item p-3 mb-2 border rounded">
                    <div className="d-flex w-100 justify-content-between">
                      <h5 className="mb-1 fw-bold">Autobús Pulman</h5>
                      <span className="badge bg-success">Disponible</span>
                    </div>
                    <p className="mb-1 text-muted">Placa: C-123XYZ. Capacidad: 45 pasajeros. Modelo: Scania 2021.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {vista === "reportes" && (
          <div className="row">
            <div className="col-12">
              <div className="dashboard-card-custom">
                <h2 className="dashboard-card-title">Reportes Recibidos de Clientes</h2>
                <p className="text-muted">Quejas reportadas por los clientes sobre tus servicios de transporte.</p>
                <div className="list-group">
                  <div className="list-group-item p-3 mb-2 border rounded bg-light">
                    <h6 className="fw-bold">Cobro de boleto extra en bus</h6>
                    <p className="mb-1 text-muted">Estado del reporte: En revisión (el administrador está validando).</p>
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
                <h2 className="dashboard-card-title">Generar Cupón de Descuento</h2>
                <div className="mb-3">
                  <label className="form-label">Código del Cupón</label>
                  <input type="text" className="form-control" placeholder="Ej. SEMANASANTA" />
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
                <h2 className="dashboard-card-title">Perfil de la Empresa de Transporte</h2>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Nombre de la Empresa</label>
                    <input type="text" className="form-control" defaultValue="Transportes Unidos" />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">NIT</label>
                    <input type="text" className="form-control" defaultValue="12345678-9" disabled />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Licencia Operativa</label>
                    <input type="text" className="form-control" defaultValue="LIC-OP-001-2026" disabled />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Teléfono</label>
                    <input type="text" className="form-control" defaultValue="44445555" />
                  </div>
                  <div className="col-12">
                    <div className="alert alert-warning">
                      Los cambios en la información de perfil requieren aprobación del administrador.
                    </div>
                  </div>
                </div>
                <button className="btn btn-primary me-2">Solicitar Cambios de Perfil</button>
                <button className="btn btn-secondary">Descargar Reporte PDF Ganancias</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* COMPONENTE MODAL DE CANCELACIÓN */}
      {modalCancelacion && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
          backgroundColor: "rgba(0, 0, 0, 0.6)", zIndex: 9999,
          display: "flex", justifyContent: "center", alignItems: "center"
        }}>
          <div className="card p-4 shadow-lg" style={{ width: "90%", maxWidth: "450px", borderRadius: "12px", border: "none" }}>
            <h4 className="fw-bold text-danger mb-3">Cancelar Ruta por Emergencia</h4>
            <p className="text-muted mb-3" style={{ fontSize: "14px" }}>
              Al cancelar esta ruta, se notificará inmediatamente por correo electrónico a todos los clientes con reservaciones activas. Por favor, indica el motivo:
            </p>
            <textarea 
              className="form-control mb-4" 
              rows="3" 
              placeholder="Ej. Condiciones climáticas adversas, bloqueo en carretera..."
              value={motivoCancelacion}
              onChange={(e) => setMotivoCancelacion(e.target.value)}
              autoFocus
            ></textarea>
            <div className="d-flex justify-content-end">
              <button 
                className="btn btn-light me-2" 
                onClick={() => { setModalCancelacion(null); setMotivoCancelacion(""); }}
              >
                Mantener Ruta
              </button>
              <button 
                className="btn btn-danger" 
                onClick={() => {
                  if (!motivoCancelacion.trim()) return alert("Por favor, ingresa un motivo para notificar a los clientes.");
                  cambiarEstadoRuta(modalCancelacion, "cancelada", motivoCancelacion);
                  setModalCancelacion(null);
                  setMotivoCancelacion("");
                }}
              >
                Confirmar Cancelación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardEmpresa;