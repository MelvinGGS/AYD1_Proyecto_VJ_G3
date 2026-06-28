import { useState, useEffect } from "react";
import Swal from "sweetalert2";

function VisualizacionOperaciones({ token }) {
  const [seccion, setSeccion] = useState("servicios"); 
  const [ordenarPor, setOrdenarPor] = useState("");
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(false);

  const API_URL = "http://localhost:3000/api/admin/visualizacion";

  const headers = {
    Authorization: `Bearer ${token}`
  };

  useEffect(() => {
    if (seccion === "servicios") {
      setOrdenarPor("zona_geografica");
    } else {
      setOrdenarPor("destino");
    }
  }, [seccion]);

  const cargarDatos = async () => {
    if (!ordenarPor) return;
    setCargando(true);
    try {
      const endpoint = seccion === "servicios" ? "servicios" : "envios";
      const response = await fetch(`${API_URL}/${endpoint}?ordenar_por=${ordenarPor}`, { headers });
      const resData = await response.json();
      if (resData.success) {
        setDatos(resData.data);
      } else {
        Swal.fire("Error", resData.message || "Error al obtener informacion operacional", "error");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Error de conexion con el servidor", "error");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (token && ordenarPor) {
      cargarDatos();
    }
  }, [token, seccion, ordenarPor]);

  const getStatusBadge = (estado) => {
    switch (estado) {
      case "activa":
      case "activo":
      case "confirmado":
      case "entregado":
        return "admin-badge-activo";
      case "pendiente_pago":
      case "en_carrito":
      case "en_transito":
        return "admin-badge-pendiente";
      case "cancelada":
      case "cancelado":
      case "suspendida":
      case "suspendido":
      case "eliminado":
      case "reembolsado":
      default:
        return "admin-badge-rechazado";
    }
  };

  const getStatusText = (estado) => {
    return estado ? estado.replace("_", " ").toUpperCase() : "";
  };

  return (
    <div className="visualizacion-operaciones-container">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div className="btn-group" role="group">
          <button
            type="button"
            className={`btn ${seccion === "servicios" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setSeccion("servicios")}
            style={{ fontWeight: "700" }}
          >
            Servicios de Transporte (Rutas)
          </button>
          <button
            type="button"
            className={`btn ${seccion === "envios" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setSeccion("envios")}
            style={{ fontWeight: "700" }}
          >
            Envios Registrados (Operadores)
          </button>
        </div>

        <div className="d-flex align-items-center gap-2">
          <label className="m-0 font-weight-bold text-secondary" style={{ fontSize: "0.95rem" }}>
            Ordenar por:
          </label>
          <select
            className="form-select"
            style={{ width: "240px", fontWeight: "700" }}
            value={ordenarPor}
            onChange={(e) => setOrdenarPor(e.target.value)}
          >
            {seccion === "servicios" ? (
              <>
                <option value="zona_geografica">Zona Geografica (Rutas)</option>
                <option value="empresa">Empresa Proveedora</option>
              </>
            ) : (
              <>
                <option value="destino">Destino (Direccion)</option>
                <option value="operador">Operador Logistico</option>
              </>
            )}
          </select>
        </div>
      </div>

      {cargando ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-2 text-muted">Cargando informacion...</p>
        </div>
      ) : datos.length === 0 ? (
        <div className="admin-table-panel p-4 text-center text-muted">
          No hay datos registrados para esta seccion.
        </div>
      ) : seccion === "servicios" ? (
        <div className="admin-table-panel">
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: "240px" }}>Nombre Ruta / Servicio</th>
                  <th style={{ width: "240px" }}>Empresa</th>
                  <th style={{ width: "160px" }}>Origen</th>
                  <th style={{ width: "160px" }}>Destino</th>
                  <th style={{ width: "220px" }}>Detalles Horario</th>
                  <th style={{ width: "120px" }}>Precio</th>
                  <th style={{ width: "140px" }}>Capacidad</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {datos.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.nombre_ruta}</strong>
                      <small>Tipo: {item.tipo_servicio}</small>
                      <small>Puntuacion: {Number(item.calificacion_promedio).toFixed(1)} ★ ({item.total_calificaciones} resenas)</small>
                    </td>
                    <td>
                      <strong>{item.nombre_empresa}</strong>
                      <small>NIT: {item.nit}</small>
                      <small>Tel: {item.telefono}</small>
                    </td>
                    <td>
                      <span className="text-dark font-weight-bold">{item.origen}</span>
                    </td>
                    <td>
                      <span className="text-dark font-weight-bold">{item.destino}</span>
                    </td>
                    <td>
                      <strong>{item.tiempo_estimado}</strong>
                      <small>Salida: {item.hora_salida}</small>
                      <small>Dias: {item.dias_disponibles}</small>
                    </td>
                    <td>
                      <span className="text-success font-weight-bold" style={{ fontSize: "1.05rem" }}>
                        Q {Number(item.precio).toFixed(2)}
                      </span>
                    </td>
                    <td>
                      <strong>{item.capacidad_pasajeros || "N/A"} pasajeros</strong>
                    </td>
                    <td>
                      <span className={`admin-badge ${getStatusBadge(item.estado)}`}>
                        {getStatusText(item.estado)}
                      </span>
                      {item.motivo_cancelacion && (
                        <small className="text-danger mt-1 d-block">Razon: {item.motivo_cancelacion}</small>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="admin-table-panel">
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: "130px" }}>ID Envio</th>
                  <th style={{ width: "180px" }}>Cliente</th>
                  <th style={{ width: "200px" }}>Operador Logistico</th>
                  <th style={{ width: "260px" }}>Ruta Envio (Origen - Destino)</th>
                  <th>Descripcion del Paquete</th>
                  <th style={{ width: "120px" }}>Gasto Total</th>
                  <th style={{ width: "200px" }}>Desglose (Comision / Ganancia)</th>
                  <th style={{ width: "120px" }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {datos.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.id.substring(0, 8)}...</strong>
                      <small>{new Date(item.created_at).toLocaleDateString()}</small>
                    </td>
                    <td>
                      <strong>{item.cliente_nombre} {item.cliente_apellido}</strong>
                    </td>
                    <td>
                      <strong>{item.operador_nombre} {item.operador_apellido}</strong>
                      <small>{item.operador_email}</small>
                      <small>Tel: {item.operador_telefono}</small>
                    </td>
                    <td>
                      <div className="d-flex flex-column">
                        <small>Desde: <span className="text-dark font-weight-bold">{item.direccion_origen}</span></small>
                        <small>Hasta: <span className="text-dark font-weight-bold">{item.direccion_destino}</span></small>
                      </div>
                    </td>
                    <td>
                      <strong>{item.nombre_servicio}</strong>
                      <p className="m-0 small text-secondary" style={{ fontSize: "0.9rem" }}>{item.descripcion_paquete}</p>
                      <small className="text-muted">Peso: {item.peso_paquete_kg} kg</small>
                    </td>
                    <td>
                      <span className="text-success font-weight-bold" style={{ fontSize: "1.05rem" }}>
                        Q {Number(item.precio_total).toFixed(2)}
                      </span>
                    </td>
                    <td>
                      <small className="text-primary font-weight-bold d-block">
                        Comision (20%): Q {Number(item.comision_plataforma).toFixed(2)}
                      </small>
                      <small className="text-secondary font-weight-bold d-block">
                        Operador (80%): Q {Number(item.ganancia_proveedor).toFixed(2)}
                      </small>
                    </td>
                    <td>
                      <span className={`admin-badge ${getStatusBadge(item.estado)}`}>
                        {getStatusText(item.estado)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default VisualizacionOperaciones;
