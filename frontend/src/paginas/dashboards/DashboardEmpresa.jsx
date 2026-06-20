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


  //  para estados para perfil
  const [perfil, setPerfil] = useState(null);
  const [formPerfil, setFormPerfil] = useState({ nombre_empresa: "", telefono: "", telefono_respaldo: "" });
  const [mensajePerfil, setMensajePerfil] = useState("");
  const [solicitudesCambio, setSolicitudesCambio] = useState([]);


  // estados para cupones
  const [cupones, setCupones] = useState([]);
  const [formCupon, setFormCupon] = useState({
    codigo: "", descripcion: "", tipo_descuento: "porcentaje",
    valor_descuento: "", fecha_inicio: "", fecha_fin: "", usos_maximos: ""
  });
  const [mensajeCupon, setMensajeCupon] = useState("");


  // ESTADOS PARA EL MODAL DE CANCELACIÓN
  const [modalCancelacion, setModalCancelacion] = useState(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState("");

  useEffect(() => {
    if (vista === "rutas" && empresaId) cargarRutas();
    if (vista === "perfil") { cargarPerfil(); cargarSolicitudesCambio(); }
    if (vista === "cupones") cargarCupones();
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

  // Para el perfil
  const cargarPerfil = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/empresa/perfil", {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();
      if (data.success) {
        setPerfil(data.data);
        setFormPerfil({
          nombre_empresa: data.data.nombre_empresa || "",
          telefono: data.data.telefono || "",
          telefono_respaldo: data.data.telefono_respaldo || ""
        });
      }
    } catch (error) {
      console.error("Error al cargar perfil", error);
    }
  };

  const cargarSolicitudesCambio = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/empresa/perfil/solicitudes", {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();
      if (data.success) setSolicitudesCambio(data.data);
    } catch (error) {
      console.error("Error al cargar solicitudes", error);
    }
  };

  const solicitarCambioPerfil = async () => {
    if (!formPerfil.nombre_empresa || !formPerfil.telefono) {
      setMensajePerfil("Nombre y teléfono son requeridos.");
      return;
    }
    try {
      const res = await fetch("http://localhost:3000/api/empresa/perfil/solicitar-cambio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(formPerfil)
      });
      const data = await res.json();
      setMensajePerfil(data.message);
      if (data.success) cargarSolicitudesCambio();
    } catch (error) {
      setMensajePerfil("Error al enviar solicitud.");
    }
  };

  // para los cupones
  const cargarCupones = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/empresa/cupones", {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();
      if (data.success) setCupones(data.data);
    } catch (error) {
      console.error("Error al cargar cupones", error);
    }
  };

  const crearCupon = async () => {
    if (!formCupon.codigo || !formCupon.valor_descuento || !formCupon.fecha_inicio || !formCupon.fecha_fin) {
      setMensajeCupon("Completa todos los campos obligatorios.");
      return;
    }
    try {
      const res = await fetch("http://localhost:3000/api/empresa/cupones", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(formCupon)
      });
      const data = await res.json();
      setMensajeCupon(data.message);
      if (data.success) {
        setFormCupon({ codigo: "", descripcion: "", tipo_descuento: "porcentaje", valor_descuento: "", fecha_inicio: "", fecha_fin: "", usos_maximos: "" });
        cargarCupones();
      }
    } catch (error) {
      setMensajeCupon("Error al crear cupón.");
    }
  };

  const desactivarCupon = async (id) => {
    try {
      const res = await fetch(`http://localhost:3000/api/empresa/cupones/${id}/desactivar`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();
      if (data.success) cargarCupones();
    } catch (error) {
      console.error("Error al desactivar cupón", error);
    }
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
                    onChange={(e) => setFormularioRuta({ ...formularioRuta, nombre_ruta: e.target.value })}
                  />
                </div>
                <div className="row">
                  <div className="col-6 mb-3">
                    <label className="form-label">Origen</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formularioRuta.origen}
                      onChange={(e) => setFormularioRuta({ ...formularioRuta, origen: e.target.value })}
                    />
                  </div>
                  <div className="col-6 mb-3">
                    <label className="form-label">Destino</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formularioRuta.destino}
                      onChange={(e) => setFormularioRuta({ ...formularioRuta, destino: e.target.value })}
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
                      onChange={(e) => setFormularioRuta({ ...formularioRuta, precio: e.target.value })}
                    />
                  </div>
                  <div className="col-6 mb-3">
                    <label className="form-label">Tiempo Estimado</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ej. 4 horas"
                      value={formularioRuta.tiempo_estimado}
                      onChange={(e) => setFormularioRuta({ ...formularioRuta, tiempo_estimado: e.target.value })}
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
            <div className="col-md-5">
              <div className="dashboard-card-custom">
                <h2 className="dashboard-card-title">Crear Cupón</h2>

                <div className="mb-3">
                  <label className="form-label fw-semibold" style={{ color: "var(--color-secundario)" }}>
                    Código <span style={{ color: "var(--color-primario)" }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej. VERANO2026"
                    value={formCupon.codigo}
                    onChange={(e) => setFormCupon({ ...formCupon, codigo: e.target.value.toUpperCase() })}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold" style={{ color: "var(--color-secundario)" }}>Descripción</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej. Descuento de temporada"
                    value={formCupon.descripcion}
                    onChange={(e) => setFormCupon({ ...formCupon, descripcion: e.target.value })}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold" style={{ color: "var(--color-secundario)" }}>
                    Tipo de Descuento <span style={{ color: "var(--color-primario)" }}>*</span>
                  </label>
                  <select
                    className="form-select"
                    value={formCupon.tipo_descuento}
                    onChange={(e) => setFormCupon({ ...formCupon, tipo_descuento: e.target.value })}
                  >
                    <option value="porcentaje">Porcentaje (%)</option>
                    <option value="monto_fijo">Monto Fijo (Q)</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold" style={{ color: "var(--color-secundario)" }}>
                    Valor <span style={{ color: "var(--color-primario)" }}>*</span>
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder={formCupon.tipo_descuento === "porcentaje" ? "Ej. 10" : "Ej. 25"}
                    value={formCupon.valor_descuento}
                    onChange={(e) => setFormCupon({ ...formCupon, valor_descuento: e.target.value })}
                  />
                </div>

                <div className="row">
                  <div className="col-6 mb-3">
                    <label className="form-label fw-semibold" style={{ color: "var(--color-secundario)" }}>
                      Fecha Inicio <span style={{ color: "var(--color-primario)" }}>*</span>
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      value={formCupon.fecha_inicio}
                      onChange={(e) => setFormCupon({ ...formCupon, fecha_inicio: e.target.value })}
                    />
                  </div>
                  <div className="col-6 mb-3">
                    <label className="form-label fw-semibold" style={{ color: "var(--color-secundario)" }}>
                      Fecha Fin <span style={{ color: "var(--color-primario)" }}>*</span>
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      value={formCupon.fecha_fin}
                      onChange={(e) => setFormCupon({ ...formCupon, fecha_fin: e.target.value })}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold" style={{ color: "var(--color-secundario)" }}>Usos Máximos</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Dejar vacío para ilimitado"
                    value={formCupon.usos_maximos}
                    onChange={(e) => setFormCupon({ ...formCupon, usos_maximos: e.target.value })}
                  />
                </div>

                {mensajeCupon && (
                  <div className="p-3 rounded mb-3" style={{
                    backgroundColor: mensajeCupon.includes("exitosamente") ? "#F0FDF4" : "#FEF2F2",
                    border: `1px solid ${mensajeCupon.includes("exitosamente") ? "#BBF7D0" : "#FECACA"}`,
                    color: mensajeCupon.includes("exitosamente") ? "#166534" : "#991B1B",
                    fontSize: "14px"
                  }}>
                    {mensajeCupon}
                  </div>
                )}

                <button
                  onClick={crearCupon}
                  style={{
                    width: "100%",
                    backgroundColor: "var(--color-primario)",
                    color: "white",
                    border: "none",
                    borderRadius: "var(--radio)",
                    padding: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                    fontSize: "15px"
                  }}
                >
                  Crear Cupón
                </button>
              </div>
            </div>

            <div className="col-md-7">
              <div className="dashboard-card-custom">
                <h2 className="dashboard-card-title">Mis Cupones</h2>
                {cupones.length === 0 ? (
                  <div className="text-center py-5">
                    <p style={{ color: "var(--color-texto-mutado)", fontSize: "14px" }}>No hay cupones creados aún.</p>
                  </div>
                ) : (
                  cupones.map((c) => (
                    <div key={c.id} className="p-3 mb-3 rounded" style={{ border: "1px solid #E2E8F0", backgroundColor: c.estado === "activo" ? "var(--color-blanco)" : "var(--color-fondo)" }}>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <h5 className="mb-0 fw-bold" style={{ color: "var(--color-primario)", letterSpacing: "1px" }}>{c.codigo}</h5>
                          <p className="mb-0" style={{ fontSize: "13px", color: "var(--color-texto-mutado)" }}>{c.descripcion}</p>
                        </div>
                        <span style={{
                          fontSize: "11px", fontWeight: "700", textTransform: "uppercase",
                          padding: "3px 10px", borderRadius: "20px",
                          backgroundColor: c.estado === "activo" ? "#DBEAFE" : "#F1F5F9",
                          color: c.estado === "activo" ? "#1D4ED8" : "var(--color-texto-mutado)"
                        }}>
                          {c.estado}
                        </span>
                      </div>

                      <div className="d-flex gap-3 mb-2" style={{ fontSize: "13px" }}>
                        <span style={{ color: "var(--color-secundario)", fontWeight: "600" }}>
                          {c.tipo_descuento === "porcentaje" ? `${c.valor_descuento}% OFF` : `Q${c.valor_descuento} OFF`}
                        </span>
                        <span style={{ color: "var(--color-texto-mutado)" }}>
                          {new Date(c.fecha_inicio).toLocaleDateString()} → {new Date(c.fecha_fin).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="d-flex justify-content-between align-items-center">
                        <span style={{ fontSize: "12px", color: "var(--color-texto-mutado)" }}>
                          Usos: {c.usos_actuales} / {c.usos_maximos || "Ilimitado"}
                        </span>
                        {c.estado === "activo" && (
                          <button
                            onClick={() => desactivarCupon(c.id)}
                            style={{
                              backgroundColor: "transparent",
                              color: "var(--color-texto-mutado)",
                              border: "1px solid #E2E8F0",
                              borderRadius: "8px",
                              padding: "4px 12px",
                              fontSize: "12px",
                              cursor: "pointer",
                              fontWeight: "600"
                            }}
                          >
                            Desactivar
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {vista === "perfil" && (
          <div className="row">
            <div className="col-md-8">
              <div className="dashboard-card-custom">
                <h2 className="dashboard-card-title">Perfil de la Empresa</h2>

                {perfil && (
                  <div className="row mb-4">
                    <div className="col-md-6">
                      <div className="p-3 rounded" style={{ backgroundColor: "var(--color-fondo)", border: "1px solid #E2E8F0" }}>
                        <p className="mb-1" style={{ fontSize: "12px", color: "var(--color-texto-mutado)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Email</p>
                        <p className="mb-0 fw-bold" style={{ color: "var(--color-secundario)" }}>{perfil.email}</p>
                      </div>
                    </div>
                    <div className="col-md-3 mt-3 mt-md-0">
                      <div className="p-3 rounded" style={{ backgroundColor: "var(--color-fondo)", border: "1px solid #E2E8F0" }}>
                        <p className="mb-1" style={{ fontSize: "12px", color: "var(--color-texto-mutado)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>NIT</p>
                        <p className="mb-0 fw-bold" style={{ color: "var(--color-secundario)" }}>{perfil.nit}</p>
                      </div>
                    </div>
                    <div className="col-md-3 mt-3 mt-md-0">
                      <div className="p-3 rounded" style={{ backgroundColor: "var(--color-fondo)", border: "1px solid #E2E8F0" }}>
                        <p className="mb-1" style={{ fontSize: "12px", color: "var(--color-texto-mutado)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Licencia</p>
                        <p className="mb-0 fw-bold" style={{ color: "var(--color-secundario)", fontSize: "13px" }}>{perfil.numero_licencia_operativa}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ height: "1px", backgroundColor: "#E2E8F0", marginBottom: "20px" }}></div>

                <p style={{ fontSize: "13px", color: "var(--color-texto-mutado)", marginBottom: "16px" }}>
                  Puedes solicitar cambios en los siguientes campos. El administrador revisará y aprobará o rechazará tu solicitud.
                </p>

                <div className="mb-3">
                  <label className="form-label fw-semibold" style={{ color: "var(--color-secundario)" }}>
                    Nombre de la Empresa
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={formPerfil.nombre_empresa}
                    onChange={(e) => setFormPerfil({ ...formPerfil, nombre_empresa: e.target.value })}
                  />
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold" style={{ color: "var(--color-secundario)" }}>
                      Teléfono Principal
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={formPerfil.telefono}
                      onChange={(e) => setFormPerfil({ ...formPerfil, telefono: e.target.value })}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold" style={{ color: "var(--color-secundario)" }}>
                      Teléfono de Respaldo
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={formPerfil.telefono_respaldo}
                      onChange={(e) => setFormPerfil({ ...formPerfil, telefono_respaldo: e.target.value })}
                    />
                  </div>
                </div>

                <div className="p-3 rounded mb-3" style={{ backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE" }}>
                  <p className="mb-0" style={{ fontSize: "13px", color: "#1D4ED8" }}>
                    El NIT y la licencia operativa no pueden modificarse. Los cambios solicitados requieren aprobación del administrador.
                  </p>
                </div>

                {mensajePerfil && (
                  <div className="p-3 rounded mb-3" style={{
                    backgroundColor: mensajePerfil.includes("enviada") ? "#F0FDF4" : "#FEF2F2",
                    border: `1px solid ${mensajePerfil.includes("enviada") ? "#BBF7D0" : "#FECACA"}`,
                    color: mensajePerfil.includes("enviada") ? "#166534" : "#991B1B",
                    fontSize: "14px"
                  }}>
                    {mensajePerfil}
                  </div>
                )}

                <button
                  onClick={solicitarCambioPerfil}
                  style={{
                    backgroundColor: "var(--color-primario)",
                    color: "white",
                    border: "none",
                    borderRadius: "var(--radio)",
                    padding: "10px 24px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  Solicitar Cambios
                </button>
              </div>
            </div>

            <div className="col-md-4">
              <div className="dashboard-card-custom">
                <h2 className="dashboard-card-title">Historial de Solicitudes</h2>
                {solicitudesCambio.length === 0 ? (
                  <div className="text-center py-4">
                    <p style={{ color: "var(--color-texto-mutado)", fontSize: "14px" }}>No hay solicitudes registradas.</p>
                  </div>
                ) : (
                  solicitudesCambio.map((s) => (
                    <div key={s.id} className="p-3 mb-3 rounded" style={{ border: "1px solid #E2E8F0", backgroundColor: "var(--color-fondo)" }}>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span style={{
                          fontSize: "11px", fontWeight: "700", textTransform: "uppercase",
                          letterSpacing: "0.5px", padding: "3px 10px", borderRadius: "20px",
                          backgroundColor: s.estado === "pendiente" ? "#FEF9C3" : s.estado === "aprobado" ? "#DCFCE7" : "#FEE2E2",
                          color: s.estado === "pendiente" ? "#854D0E" : s.estado === "aprobado" ? "#166534" : "#991B1B"
                        }}>
                          {s.estado}
                        </span>
                        <span style={{ fontSize: "11px", color: "var(--color-texto-mutado)" }}>
                          {new Date(s.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <p style={{ fontSize: "12px", fontWeight: "600", color: "var(--color-texto-mutado)", marginBottom: "4px" }}>CAMBIOS SOLICITADOS</p>
                      {s.campos_nuevos && Object.entries(s.campos_nuevos).map(([campo, valor]) => (
                        <div key={campo} className="d-flex justify-content-between" style={{ fontSize: "12px", marginBottom: "2px" }}>
                          <span style={{ color: "var(--color-texto-mutado)" }}>{campo.replace(/_/g, " ")}:</span>
                          <span style={{ color: "var(--color-secundario)", fontWeight: "600" }}>{valor || "—"}</span>
                        </div>
                      ))}

                      {s.motivo_rechazo && (
                        <div className="mt-2 p-2 rounded" style={{ backgroundColor: "#FEE2E2", fontSize: "12px", color: "#991B1B" }}>
                          <strong>Motivo de rechazo:</strong> {s.motivo_rechazo}
                        </div>
                      )}
                    </div>
                  ))
                )}
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