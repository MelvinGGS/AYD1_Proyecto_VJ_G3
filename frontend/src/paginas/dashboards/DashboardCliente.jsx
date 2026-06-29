import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../estilos/cliente.css";

import inicioIcon from "../../assets/iconos/inicio.png";
import enviosIcon from "../../assets/iconos/envios.png";
import transporteIcon from "../../assets/iconos/transporte.png";
import carritoIcon from "../../assets/iconos/carrito.png";
import perfilIcon from "../../assets/iconos/perfil.png";
import ayudaIcon from "../../assets/iconos/ayuda.png";
import logoutIcon from "../../assets/iconos/logout.png";
import historialIcon from "../../assets/iconos/historial.png";
import cuponesIcon from "../../assets/iconos/cupones.png";
import buscarIcon from "../../assets/iconos/buscar.png";

function RutaCard({ ruta, onAgregar, cargando, fechaFiltro = "" }) {
  const [fecha, setFecha] = useState(fechaFiltro);

  useEffect(() => {
    if (fechaFiltro) setFecha(fechaFiltro);
  }, [fechaFiltro]);

  return (
    <article className="transport-catalog-card">
      <div className="transport-card-top">
        <div>
          <span className="transport-type">{ruta.tipo_servicio}</span>
          <h3>{ruta.nombre_ruta}</h3>
          <p>{ruta.nombre_empresa}</p>
        </div>
        <strong>Q{Number(ruta.precio).toFixed(2)}</strong>
      </div>

      <div className="transport-route-line"><span>{ruta.origen}</span><i>→</i><span>{ruta.destino}</span></div>
      <div className="transport-metrics">
        <span><b>{ruta.hora_salida ? ruta.hora_salida.slice(0, 5) : "Por confirmar"}</b>Salida</span>
        <span><b>{ruta.tiempo_estimado || "Por confirmar"}</b>Duracion</span>
        <span><b>{Number(ruta.calificacion_empresa || 0).toFixed(1)} / 5</b>Empresa</span>
      </div>

      <div className="form-grupo">
        <label className="form-label-cliente">Fecha de viaje</label>
        <input
          type="date"
          className="form-input-cliente"
          value={fecha}
          onChange={e => setFecha(e.target.value)}
          min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
        />
      </div>
      <button
        className="btn-primario"
        onClick={() => onAgregar(ruta.id, ruta, fecha)}
        disabled={cargando}
      >
        Agregar transporte al carrito
      </button>
    </article>
  );
}

function ServicioEnvioCard({ servicio, onVerDetalle }) {
  const fotoPrincipal = servicio.fotos?.[0]?.url_foto;

  return (
    <article className="envio-catalog-card">
      <div className="envio-card-image">
        {fotoPrincipal
          ? <img src={fotoPrincipal} alt={servicio.nombre_servicio} />
          : <img src={enviosIcon} alt="Servicio de envio" className="envio-card-placeholder" />}
        <span>{servicio.zona_cobertura}</span>
      </div>
      <div className="envio-card-body">
        <div className="envio-card-heading">
          <div>
            <h3>{servicio.nombre_servicio}</h3>
            <p>Por {servicio.operador}</p>
          </div>
          <strong>Q{servicio.precio_envio.toFixed(2)}</strong>
        </div>

        <p className="envio-card-description">{servicio.descripcion || "Servicio logistico disponible para tus envios."}</p>

        <div className="envio-card-metrics">
          <span><b>{servicio.calificacion_promedio.toFixed(1)} / 5</b>{servicio.total_calificaciones} calificaciones</span>
          <span><b>{servicio.capacidad_carga_kg} kg</b>Capacidad</span>
          <span><b>{servicio.tiempo_estimado_entrega || "Por confirmar"}</b>Entrega</span>
        </div>

        <button className="btn-primario" type="button" onClick={() => onVerDetalle(servicio)}>
          Ver detalles y programar
        </button>
      </div>
    </article>
  );
}

function DetalleEnvioModal({ servicio, onCerrar, onProgramar, cargando }) {
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const fechaMinima = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  return (
    <div className="modal-overlay shipment-detail-overlay">
      <div className="shipment-detail-modal">
        <div className="shipment-detail-header">
          <div><span>Detalle del servicio</span><h2>{servicio.nombre_servicio}</h2><p>Operado por {servicio.operador}</p></div>
          <button type="button" onClick={onCerrar} aria-label="Cerrar">x</button>
        </div>

        {servicio.fotos?.length > 0 && (
          <div className="shipment-gallery">
            {servicio.fotos.slice(0, 3).map((foto, indice) => <img src={foto.url_foto} alt={`${servicio.nombre_servicio} ${indice + 1}`} key={`${foto.url_foto}-${indice}`} />)}
          </div>
        )}

        <p className="shipment-detail-description">{servicio.descripcion || "Servicio logistico disponible para programar envios."}</p>
        <div className="shipment-detail-grid">
          <p><b>Zona de cobertura</b><span>{servicio.zona_cobertura}</span></p>
          <p><b>Precio</b><span>Q{servicio.precio_envio.toFixed(2)}</span></p>
          <p><b>Capacidad</b><span>{servicio.capacidad_carga_kg} kg</span></p>
          <p><b>Calificacion</b><span>{servicio.calificacion_promedio.toFixed(1)} / 5 ({servicio.total_calificaciones})</span></p>
          <p><b>Tiempo estimado</b><span>{servicio.tiempo_estimado_entrega || "Por confirmar"}</span></p>
          <p><b>Vehiculo</b><span>{servicio.tipo_vehiculo || "Por confirmar"}</span></p>
          <p className="shipment-detail-wide"><b>Horario disponible</b><span>{servicio.horario_disponible || "Coordinar con el operador"}</span></p>
        </div>

        <div className="shipment-schedule-box">
          <div><h3>Programa tu envio</h3><p>Selecciona un rango con al menos 24 horas de anticipacion.</p></div>
          <div className="envio-date-grid">
            <div><label htmlFor="detalle-fecha-inicio">Fecha de recoleccion</label><input id="detalle-fecha-inicio" type="date" value={fechaInicio} min={fechaMinima} onChange={(evento) => { setFechaInicio(evento.target.value); if (fechaFin && fechaFin < evento.target.value) setFechaFin(""); }} /></div>
            <div><label htmlFor="detalle-fecha-fin">Fecha de entrega</label><input id="detalle-fecha-fin" type="date" value={fechaFin} min={fechaInicio || fechaMinima} onChange={(evento) => setFechaFin(evento.target.value)} /></div>
          </div>
        </div>

        <div className="shipment-detail-actions">
          <button type="button" className="btn-secundario" onClick={onCerrar}>Cancelar</button>
          <button type="button" className="btn-primario" disabled={cargando} onClick={() => onProgramar(servicio, fechaInicio, fechaFin)}>{cargando ? "Validando disponibilidad..." : "Agregar envio al carrito"}</button>
        </div>
      </div>
    </div>
  );
}

function DashboardCliente() {
  const navigate = useNavigate();
  const [vista, setVista] = useState("inicio");
  const [cargando, setCargando] = useState(false);
  const [modal, setModal] = useState(null);
  const [alerta, setAlerta] = useState(null);

// ESTADOS PARA REPORTES
  const [reportes, setReportes] = useState([]);
  const [modalReporte, setModalReporte] = useState(null);
  const [formReporte, setFormReporte] = useState({ motivo: "", descripcion: "", archivo: null });
// ESTADOS PARA CALIFICACIONES
  const [modalCalificacion, setModalCalificacion] = useState(null);
  const [formCalificacion, setFormCalificacion] = useState({ puntuacion: 5, comentario: "" });


  const [carrito, setCarrito] = useState([]);
  const [totalCarrito, setTotalCarrito] = useState(0);
  const [metodosPago, setMetodosPago] = useState([]);
  const [metodoSeleccionado, setMetodoSeleccionado] = useState("");
  const [rutasDisponibles, setRutasDisponibles] = useState([]);
  const [destinoTransporte, setDestinoTransporte] = useState("");
  const [fechaTransporte, setFechaTransporte] = useState("");
  const [empresaTransporte, setEmpresaTransporte] = useState("");
  const [tipoTransporte, setTipoTransporte] = useState("");
  const [ordenTransporte, setOrdenTransporte] = useState("calificacion_desc");
  const [filtrosTransporte, setFiltrosTransporte] = useState({ empresas: [], tipos: [] });
  const [cargandoTransportes, setCargandoTransportes] = useState(false);
  const [errorTransportes, setErrorTransportes] = useState("");
  const [recomendaciones, setRecomendaciones] = useState(null);
  const [serviciosEnvio, setServiciosEnvio] = useState([]);
  const [busquedaEnvio, setBusquedaEnvio] = useState("");
  const [ordenEnvio, setOrdenEnvio] = useState("alfabetico");
  const [cargandoServiciosEnvio, setCargandoServiciosEnvio] = useState(false);
  const [errorServiciosEnvio, setErrorServiciosEnvio] = useState("");
  const [servicioDetalle, setServicioDetalle] = useState(null);
  const [reservaciones, setReservaciones] = useState([]);

  const [formTarjeta, setFormTarjeta] = useState({
    numero_tarjeta: "", nombre_tarjeta: "", fecha_vencimiento: "", cvv: ""
  });
  const [erroresTarjeta, setErroresTarjeta] = useState({});
  const [walletId, setWalletId] = useState("");

  const [perfil, setPerfil] = useState(null);
  const [formPerfil, setFormPerfil] = useState({
    nombre: "", apellido: "", telefono: "", direccion_origen: ""
  });
  const [mensajePerfil, setMensajePerfil] = useState("");

  const [cupones, setCupones] = useState([]);
  const [cuponAplicado, setCuponAplicado] = useState(null);
  const [totalConDescuento, setTotalConDescuento] = useState(0);

  const getToken = () => localStorage.getItem("token");

  const mostrarAlerta = (tipo, mensaje) => {
    setAlerta({ tipo, mensaje });
    setTimeout(() => setAlerta(null), 4000);
  };

  useEffect(() => {
    cargarRutasDisponibles();
    cargarCarrito();
    cargarMetodosPago();
    cargarReservaciones();
  }, []);

  useEffect(() => {
    if (vista === "carrito") cargarCarrito();
    if (vista === "historial") cargarReservaciones();
    if (vista === "pago") cargarMetodosPago();
    if (vista === "perfil") cargarPerfil();
    if (vista === "cupones") cargarCupones();
    if (vista === "reportes") cargarReportes();
  }, [vista]);

  useEffect(() => {
    if (vista !== "envios") return undefined;
    const temporizador = setTimeout(() => cargarServiciosEnvio(), 300);
    return () => clearTimeout(temporizador);
  }, [vista, busquedaEnvio, ordenEnvio]);

  useEffect(() => {
    if (vista !== "transporte") return undefined;
    const temporizador = setTimeout(() => cargarRutasDisponibles(), 300);
    return () => clearTimeout(temporizador);
  }, [vista, destinoTransporte, fechaTransporte, empresaTransporte, tipoTransporte, ordenTransporte]);

  const cargarRutasDisponibles = async () => {
    setCargandoTransportes(true);
    setErrorTransportes("");
    const parametros = new URLSearchParams({ orden: ordenTransporte });
    if (destinoTransporte.trim()) parametros.set("destino", destinoTransporte.trim());
    if (fechaTransporte) parametros.set("fecha", fechaTransporte);
    if (empresaTransporte) parametros.set("empresa_id", empresaTransporte);
    if (tipoTransporte) parametros.set("tipo", tipoTransporte);

    try {
      const res = await fetch(`http://localhost:3000/api/cliente/transportes?${parametros}`, {
        headers: { "Authorization": `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRutasDisponibles(data.data || []);
        setFiltrosTransporte(data.filtros || { empresas: [], tipos: [] });
      } else setErrorTransportes(data.message || "No se pudieron cargar las rutas disponibles.");
    } catch {
      setErrorTransportes("No se pudo conectar con el servidor.");
    } finally {
      setCargandoTransportes(false);
    }
  };

  const abrirDetalleEnvio = (servicio) => {
    setRecomendaciones(null);
    setServicioDetalle(servicio);
  };

  const cargarServiciosEnvio = async () => {
    setCargandoServiciosEnvio(true);
    setErrorServiciosEnvio("");
    const parametros = new URLSearchParams({ orden: ordenEnvio });
    if (busquedaEnvio.trim()) parametros.set("buscar", busquedaEnvio.trim());

    try {
      const res = await fetch(`http://localhost:3000/api/cliente/servicios-envio?${parametros}`, {
        headers: { "Authorization": `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (res.ok && data.success) setServiciosEnvio(data.data || []);
      else setErrorServiciosEnvio(data.message || "No se pudieron cargar los servicios de envio.");
    } catch {
      setErrorServiciosEnvio("No se pudo conectar con el servidor.");
    } finally {
      setCargandoServiciosEnvio(false);
    }
  };

  const cargarCarrito = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/carrito", {
        headers: { "Authorization": `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (data.success) { setCarrito(data.data); setTotalCarrito(data.total); }
    } catch { console.error("Error al cargar carrito"); }
  };

  const cargarMetodosPago = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/pagos/metodos", {
        headers: { "Authorization": `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (data.success) setMetodosPago(data.data);
    } catch { console.error("Error al cargar métodos"); }
  };

  const cargarReservaciones = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/pagos/mis-reservaciones", {
        headers: { "Authorization": `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (data.success) setReservaciones(data.data);
    } catch { console.error("Error al cargar reservaciones"); }
  };

  const cargarReportes = async () => {
    try {
      const clienteId = localStorage.getItem("id");
      const res = await fetch(`http://localhost:3000/api/reportes/cliente/${clienteId}`, {
        headers: { "Authorization": `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (data.success) setReportes(data.data);
    } catch { console.error("Error al cargar historial de reportes"); }
  };

  const enviarReporte = async (e) => {
    e.preventDefault();
    setCargando(true);

    const formData = new FormData();
    formData.append('cliente_id', localStorage.getItem("id"));
    formData.append('proveedor_id', modalReporte.empresa_id);
    formData.append('tipo_servicio', modalReporte.tipo_servicio);
    formData.append('reservacion_id', modalReporte.id);
    formData.append('motivo', formReporte.motivo);
    formData.append('descripcion', formReporte.descripcion);
    
    if (formReporte.archivo) {
      formData.append('evidencia', formReporte.archivo);
    }

    try {
      const res = await fetch('http://localhost:3000/api/reportes', {
        method: 'POST',
        headers: { "Authorization": `Bearer ${getToken()}` },
        body: formData
      });
      const data = await res.json();
      
      if (data.success) {
        mostrarAlerta("success", "Reporte enviado para su estudio.");
        setModalReporte(null);
        setFormReporte({ motivo: "", descripcion: "", archivo: null });
        cargarReservaciones();
      } else {
        mostrarAlerta("error", data.message);
      }
    } catch {
      mostrarAlerta("error", "Error al enviar el reporte.");
    } finally {
      setCargando(false);
    }
  };

  const enviarCalificacion = async (e) => {
    e.preventDefault();
    setCargando(true);

    try {
      const res = await fetch('http://localhost:3000/api/calificaciones', {
        method: 'POST',
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}` 
        },
        body: JSON.stringify({
          cliente_id: localStorage.getItem("id"),
          proveedor_id: modalCalificacion.empresa_id,
          reservacion_id: modalCalificacion.id,
          tipo_servicio: modalCalificacion.tipo_servicio,
          puntuacion: formCalificacion.puntuacion,
          comentario: formCalificacion.comentario
        })
      });
      const data = await res.json();
      
      if (data.success) {
        mostrarAlerta("success", "¡Gracias por tu calificación!");
        setModalCalificacion(null);
        setFormCalificacion({ puntuacion: 5, comentario: "" });
        cargarReservaciones();
        
      } else {
        mostrarAlerta("error", data.message);
      }
    } catch {
      mostrarAlerta("error", "Error al enviar la calificación.");
    } finally {
      setCargando(false);
    }
  };

const getBadgeReporte = (estadoRaw) => {
    const estadoLimpio = estadoRaw ? String(estadoRaw).toLowerCase().trim() : 'enviado';
    
    const colores = {
      'enviado': { bg: '#DBEAFE', text: '#1E40AF' },
      'en_revision': { bg: '#FEF3C7', text: '#92400E' },
      'aceptado': { bg: '#DCFCE7', text: '#166534' },
      'rechazado': { bg: '#FEE2E2', text: '#991B1B' }
    };

    const color = colores[estadoLimpio] || { bg: '#DBEAFE', text: '#1E40AF' };

    return (
      <span style={{ 
        backgroundColor: color.bg, 
        color: color.text, 
        padding: "4px 8px", 
        borderRadius: "12px", 
        fontSize: "11px", 
        fontWeight: "bold", 
        textTransform: "uppercase" 
      }}>
        {estadoLimpio.replace("_", " ")}
      </span>
    );
  };


  const validarLuhn = (numero) => {
    const digitos = numero.replace(/\D/g, '');
    if (digitos.length < 13 || digitos.length > 19) return false;
    let suma = 0; let esPar = false;
    for (let i = digitos.length - 1; i >= 0; i--) {
      let digito = parseInt(digitos.charAt(i), 10);
      if (esPar) { digito *= 2; if (digito > 9) digito -= 9; }
      suma += digito; esPar = !esPar;
    }
    return (suma % 10) === 0;
  };

  const recomendarEnviosParaDestino = async (destino, origen = "destino") => {
    const parametros = new URLSearchParams({ buscar: destino, orden: "calificacion" });
    try {
      const res = await fetch(`http://localhost:3000/api/cliente/servicios-envio?${parametros}`, {
        headers: { "Authorization": `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (data.success && data.data.length > 0) setRecomendaciones({ tipo: "envios", contexto: destino, origen, items: data.data.slice(0, 3) });
    } catch {
      console.error("No se pudieron cargar recomendaciones de envio.");
    }
  };

  const recomendarTransportesParaZona = async (zona) => {
    const parametros = new URLSearchParams({ destino: zona, orden: "calificacion_desc", limite: "3" });
    try {
      const res = await fetch(`http://localhost:3000/api/cliente/transportes?${parametros}`, {
        headers: { "Authorization": `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (data.success && data.data.length > 0) setRecomendaciones({ tipo: "transportes", contexto: zona, origen: "zona", items: data.data });
    } catch {
      console.error("No se pudieron cargar recomendaciones de transporte.");
    }
  };

  const agregarAlCarrito = async (rutaId, rutaData, fechaInput) => {
    if (!fechaInput) { mostrarAlerta("warning", "Debes seleccionar una fecha para el viaje."); return; }
    const esPrimerServicio = carrito.length === 0;
    setCargando(true);
    try {
      const res = await fetch("http://localhost:3000/api/carrito", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${getToken()}` },
        body: JSON.stringify({ servicio_id: rutaId, tipo_servicio: "transporte", fecha_inicio: fechaInput, precio_unitario: rutaData.precio })
      });
      const data = await res.json();
      if (data.success) {
        await cargarCarrito();
        mostrarAlerta("success", "Servicio agregado al carrito exitosamente.");
        if (esPrimerServicio) await recomendarEnviosParaDestino(rutaData.destino);
      }
      else mostrarAlerta("error", data.message || "Error al agregar al carrito.");
    } catch { mostrarAlerta("error", "Error de conexión. Intenta nuevamente."); }
    finally { setCargando(false); }
  };

  const agregarEnvioAlCarrito = async (servicio, fechaInicio, fechaFin) => {
    if (!fechaInicio || !fechaFin) {
      mostrarAlerta("warning", "Selecciona las fechas de recoleccion y entrega.");
      return;
    }
    if (fechaFin < fechaInicio) {
      mostrarAlerta("warning", "La fecha de entrega no puede ser anterior a la recoleccion.");
      return;
    }

    const esPrimerServicio = carrito.length === 0;
    setCargando(true);
    try {
      const res = await fetch("http://localhost:3000/api/carrito", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${getToken()}` },
        body: JSON.stringify({
          servicio_id: servicio.id,
          tipo_servicio: "envio",
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin
        })
      });
      const data = await res.json();
      if (data.success) {
        await cargarCarrito();
        setServicioDetalle(null);
        mostrarAlerta("success", "Servicio de envio agregado al carrito.");
        if (esPrimerServicio) await recomendarTransportesParaZona(servicio.zona_cobertura);
      } else mostrarAlerta("error", data.message || "No se pudo agregar el servicio.");
    } catch {
      mostrarAlerta("error", "Error de conexion. Intenta nuevamente.");
    } finally {
      setCargando(false);
    }
  };

  const confirmarEliminarItem = (id) => {
    setModal({
      titulo: "Eliminar del carrito",
      descripcion: "¿Estás seguro que deseas eliminar este servicio de tu carrito?",
      tipo: "peligro",
      onConfirmar: () => eliminarDelCarrito(id)
    });
  };

  const confirmarVaciarCarrito = () => {
    setModal({
      titulo: "Vaciar carrito",
      descripcion: "¿Estás seguro que deseas eliminar todos los servicios de tu carrito? Esta acción no se puede deshacer.",
      tipo: "peligro",
      onConfirmar: () => vaciarCarrito()
    });
  };

  const eliminarDelCarrito = async (carritoId) => {
    setModal(null);
    setCargando(true);
    try {
      const res = await fetch(`http://localhost:3000/api/carrito/${carritoId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (data.success) { cargarCarrito(); mostrarAlerta("success", "Servicio eliminado del carrito."); }
      else mostrarAlerta("error", data.message || "Error al eliminar.");
    } catch { mostrarAlerta("error", "Error de conexión."); }
    finally { setCargando(false); }
  };

  const vaciarCarrito = async () => {
    setModal(null);
    setCargando(true);
    try {
      const res = await fetch("http://localhost:3000/api/carrito", {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (data.success) { cargarCarrito(); mostrarAlerta("success", "Carrito vaciado exitosamente."); }
    } catch { mostrarAlerta("error", "Error al vaciar carrito."); }
    finally { setCargando(false); }
  };

  const validarFormTarjeta = () => {
    const errores = {};
    if (!validarLuhn(formTarjeta.numero_tarjeta)) errores.numero_tarjeta = "Número de tarjeta inválido (verificación Luhn fallida).";
    if (!formTarjeta.nombre_tarjeta.trim()) errores.nombre_tarjeta = "El nombre es requerido.";
    if (!/^\d{2}\/\d{4}$/.test(formTarjeta.fecha_vencimiento)) errores.fecha_vencimiento = "Formato inválido. Usa MM/YYYY.";
    if (!/^\d{3,4}$/.test(formTarjeta.cvv)) errores.cvv = "CVV debe tener 3 o 4 dígitos.";
    setErroresTarjeta(errores);
    return Object.keys(errores).length === 0;
  };

  const agregarTarjeta = async (e) => {
    e.preventDefault();
    if (!validarFormTarjeta()) return;
    setCargando(true);
    try {
      const res = await fetch("http://localhost:3000/api/pagos/metodo", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${getToken()}` },
        body: JSON.stringify({ tipo: "tarjeta", ...formTarjeta })
      });
      const data = await res.json();
      if (data.success) {
        mostrarAlerta("success", data.message);
        setFormTarjeta({ numero_tarjeta: "", nombre_tarjeta: "", fecha_vencimiento: "", cvv: "" });
        setErroresTarjeta({});
        cargarMetodosPago();
      } else mostrarAlerta("error", data.message);
    } catch { mostrarAlerta("error", "Error al agregar tarjeta."); }
    finally { setCargando(false); }
  };

  const agregarWallet = async (e) => {
    e.preventDefault();
    if (!walletId) { mostrarAlerta("warning", "Ingresa el ID de tu billetera virtual."); return; }
    setCargando(true);
    try {
      const res = await fetch("http://localhost:3000/api/pagos/metodo", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${getToken()}` },
        body: JSON.stringify({ tipo: "wallet", wallet_id: walletId })
      });
      const data = await res.json();
      if (data.success) { mostrarAlerta("success", data.message); setWalletId(""); cargarMetodosPago(); }
      else mostrarAlerta("error", data.message);
    } catch { mostrarAlerta("error", "Error al agregar wallet."); }
    finally { setCargando(false); }
  };

  const procesarPago = () => {
    if (!metodoSeleccionado) { mostrarAlerta("warning", "Selecciona un método de pago."); return; }
    if (carrito.length === 0) { mostrarAlerta("warning", "Tu carrito está vacío."); return; }
    setModal({
      titulo: "Confirmar pago",
      descripcion: `¿Confirmas el pago de Q${cuponAplicado ? totalConDescuento : totalCarrito} con el método seleccionado? Esta acción procesará tu reservación.`,
      tipo: "primario",
      onConfirmar: () => ejecutarPago()
    });
  };

const ejecutarPago = async () => {
  setModal(null);
  setCargando(true);
  try {
    const res = await fetch("http://localhost:3000/api/pagos/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${getToken()}` },
      body: JSON.stringify({ 
        metodo_pago_id: metodoSeleccionado,
        cupon_codigo: cuponAplicado ? cuponAplicado.codigo : null
      })
    });
    const data = await res.json();
    if (data.success) {
      mostrarAlerta("success", "Pago procesado exitosamente. Tu reservación está confirmada.");
      setCuponAplicado(null);
      setTotalConDescuento(0);
      cargarCarrito(); cargarMetodosPago(); cargarReservaciones();
    } else mostrarAlerta("error", data.message);
  } catch { mostrarAlerta("error", "Error de conexión al procesar el pago."); }
  finally { setCargando(false); }
};

  const confirmarCancelar = (id, fechaInicio) => {
    const fechaServicio = new Date(fechaInicio);
    const ahora = new Date();
    const horas = (fechaServicio - ahora) / (1000 * 60 * 60);
    if (horas < 24) { mostrarAlerta("error", "Solo puedes cancelar con al menos 24 horas de anticipación."); return; }
    setModal({
      titulo: "Cancelar reservación",
      descripcion: "¿Estás seguro que deseas cancelar esta reservación? Tu dinero será reembolsado automáticamente.",
      tipo: "peligro",
      onConfirmar: () => cancelarReservacion(id)
    });
  };

  const cancelarReservacion = async (id) => {
    setModal(null);
    setCargando(true);
    try {
      const res = await fetch(`http://localhost:3000/api/pagos/reservacion/${id}/cancelar`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (data.success) {
        mostrarAlerta("success", "Reservación cancelada. El reembolso se aplicó a tu método de pago.");
        cargarReservaciones(); cargarMetodosPago();
      } else mostrarAlerta("error", data.message);
    } catch { mostrarAlerta("error", "Error de red al cancelar."); }
    finally { setCargando(false); }
  };

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("rol");
    localStorage.removeItem("id");
    navigate("/");
  };

  const cargarPerfil = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/cliente/perfil", {
        headers: { "Authorization": `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (data.success) {
        setPerfil(data.data);
        setFormPerfil({
          nombre: data.data.nombre || "",
          apellido: data.data.apellido || "",
          telefono: data.data.telefono || "",
          direccion_origen: data.data.direccion_origen || ""
        });
      }
    } catch { console.error("Error al cargar perfil"); }
  };

  const cargarCupones = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/cliente/cupones", {
        headers: { "Authorization": `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (data.success) setCupones(data.data);
    } catch { console.error("Error al cargar cupones"); }
  };

  const guardarPerfil = () => {
    if (!formPerfil.nombre || !formPerfil.apellido || !formPerfil.telefono) {
      mostrarAlerta("warning", "Nombre, apellido y teléfono son requeridos.");
      return;
    }
    setModal({
      titulo: "Confirmar cambios de perfil",
      descripcion: "¿Estas seguro que deseas guardar los cambios en tu perfil?",
      tipo: "primario",
      onConfirmar: () => ejecutarGuardarPerfil()
    });
  };

  const ejecutarGuardarPerfil = async () => {
    setModal(null);
    setCargando(true);
    try {
      const res = await fetch("http://localhost:3000/api/cliente/perfil", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`
        },
        body: JSON.stringify(formPerfil)
      });
      const data = await res.json();
      if (data.success) {
        mostrarAlerta("success", data.message);
        cargarPerfil();
      } else mostrarAlerta("error", data.message);
    } catch { mostrarAlerta("error", "Error al guardar perfil."); }
    finally { setCargando(false); }
  };
  const getBadgeClass = (estado) => {
    const clases = { confirmado: "badge-confirmado", cancelado: "badge-cancelado", pendiente_pago: "badge-pendiente", en_transito: "badge-en_transito", entregado: "badge-entregado" };
    return `badge-estado ${clases[estado] || "badge-pendiente"}`;
  };

  const navItems = [
    { id: "inicio", label: "Inicio", icon: inicioIcon },
    { id: "envios", label: "Envios", icon: enviosIcon },
    { id: "transporte", label: "Transporte", icon: transporteIcon },
    { id: "carrito", label: "Carrito", icon: carritoIcon },
    { id: "historial", label: "Historial", icon: historialIcon },
    { id: "pago", label: "Métodos de Pago", icon: enviosIcon },
    { id: "cupones", label: "Cupones", icon: cuponesIcon },
    { id: "reportes", label: "Mis Reportes", icon: ayudaIcon },
    { id: "perfil", label: "Mi Perfil", icon: perfilIcon },
    { id: "ayuda", label: "Ayuda", icon: ayudaIcon },
  ];

  return (
    <div className="cliente-page">

      {/* SPINNER DE CARGA */}
      {cargando && (
        <div className="spinner-overlay">
          <div className="spinner"></div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN */}
      {modal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3 className="modal-titulo">{modal.titulo}</h3>
            <p className="modal-descripcion">{modal.descripcion}</p>
            <div className="modal-acciones">
              <button className="btn-secundario" onClick={() => setModal(null)}>Cancelar</button>
              <button
                className={modal.tipo === "peligro" ? "btn-peligro" : "btn-primario"}
                onClick={modal.onConfirmar}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {recomendaciones && (
        <div className="modal-overlay recommendation-overlay">
          <div className="recommendation-modal">
            <div className="recommendation-header">
              <div>
                <span>Completa tu reservacion</span>
                <h3>{recomendaciones.tipo === "transportes" ? "Transportes recomendados para la misma zona" : "Envios recomendados para tu destino"}</h3>
                <p>Seleccionamos las 3 opciones mejor calificadas relacionadas con {recomendaciones.contexto}.</p>
              </div>
              <button type="button" onClick={() => setRecomendaciones(null)} aria-label="Cerrar">x</button>
            </div>

            <div className="recommendation-grid">
              {recomendaciones.tipo === "envios"
                ? recomendaciones.items.map((servicio) => <ServicioEnvioCard key={servicio.id} servicio={servicio} onVerDetalle={abrirDetalleEnvio} />)
                : recomendaciones.items.map((ruta) => <RutaCard key={ruta.id} ruta={ruta} onAgregar={agregarAlCarrito} cargando={cargando} />)}
            </div>

            <div className="recommendation-actions">
              <button type="button" className="btn-secundario" onClick={() => setRecomendaciones(null)}>Seguir con mi carrito</button>
              <button type="button" className="btn-primario" onClick={() => {
                if (recomendaciones.tipo === "envios") {
                  setBusquedaEnvio(recomendaciones.contexto);
                  setVista("envios");
                } else {
                  setDestinoTransporte(recomendaciones.contexto);
                  setVista("transporte");
                }
                setRecomendaciones(null);
              }}>Ver todas las opciones</button>
            </div>
          </div>
        </div>
      )}

      {servicioDetalle && <DetalleEnvioModal servicio={servicioDetalle} onCerrar={() => setServicioDetalle(null)} onProgramar={agregarEnvioAlCarrito} cargando={cargando} />}

      {/* NAVBAR */}
      <nav className="navbar-cliente">
        <span className="navbar-brand-cliente">TrackFlow-HUB</span>
        <div className="navbar-nav-cliente">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-btn-cliente ${vista === item.id ? "active" : ""}`}
              onClick={() => setVista(item.id)}
            >
              <img src={item.icon} alt={item.label} />
              {item.label}
            </button>
          ))}
        </div>
        <button className="btn-logout-cliente" onClick={cerrarSesion}>
          <img src={logoutIcon} alt="Salir" />
          Cerrar Sesión
        </button>
      </nav>

      {/* ALERTA GLOBAL */}
      {alerta && (
        <div style={{ position: "fixed", top: "80px", right: "24px", zIndex: 9997, minWidth: "300px" }}>
          <div className={`cliente-alert ${alerta.tipo}`}>
            {alerta.tipo === "success" && ""}
            {alerta.tipo === "error" && "x"}
            {alerta.tipo === "warning" && ""}
            {alerta.tipo === "info" && "ℹ "}
            {alerta.mensaje}
          </div>
        </div>
      )}

      <div className="cliente-content">

        {/* INICIO */}
        {vista === "inicio" && (
          <div>
            <div className="cliente-card text-center" style={{ padding: "48px" }}>
              <h1 style={{ fontSize: "28px", fontWeight: "800", color: "var(--color-secundario)", marginBottom: "8px" }}>
                Bienvenido a TrackFlow-HUB
              </h1>
              <p style={{ color: "var(--color-texto-mutado)", marginBottom: "32px", fontSize: "15px" }}>
                Gestiona tus envíos y servicios de transporte desde un solo lugar.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px", maxWidth: "700px", margin: "0 auto" }}>
                {navItems.filter(n => n.id !== "inicio" && n.id !== "ayuda").map(item => (
                  <button
                    key={item.id}
                    onClick={() => setVista(item.id)}
                    style={{
                      padding: "20px 12px", borderRadius: "var(--radio)",
                      border: "1px solid #E2E8F0", background: "var(--color-fondo)",
                      cursor: "pointer", display: "flex", flexDirection: "column",
                      alignItems: "center", gap: "8px", transition: "all 0.2s"
                    }}
                    onMouseOver={e => e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)"}
                    onMouseOut={e => e.currentTarget.style.boxShadow = "none"}
                  >
                    <img src={item.icon} alt={item.label} style={{ width: "28px", height: "28px" }} />
                    <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--color-secundario)" }}>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
              <div className="cliente-card text-center">
                <h3 style={{ fontSize: "32px", fontWeight: "800", color: "var(--color-primario)" }}>{carrito.length}</h3>
                <p style={{ color: "var(--color-texto-mutado)", fontSize: "13px" }}>Servicios en carrito</p>
              </div>
              <div className="cliente-card text-center">
                <h3 style={{ fontSize: "32px", fontWeight: "800", color: "var(--color-primario)" }}>{reservaciones.filter(r => r.estado === "confirmado").length}</h3>
                <p style={{ color: "var(--color-texto-mutado)", fontSize: "13px" }}>Reservaciones activas</p>
              </div>
              <div className="cliente-card text-center">
                <h3 style={{ fontSize: "32px", fontWeight: "800", color: "var(--color-primario)" }}>{metodosPago.length}</h3>
                <p style={{ color: "var(--color-texto-mutado)", fontSize: "13px" }}>Métodos de pago</p>
              </div>
            </div>
          </div>
        )}

        {/* SERVICIOS DE ENVIO */}
        {vista === "envios" && (
          <div>
            <div className="cliente-card">
              <div className="envio-catalog-header">
                <div>
                  <h2 className="cliente-card-title">Servicios de envio</h2>
                  <p className="cliente-card-subtitle">Busca por nombre, zona de cobertura u operador logistico.</p>
                </div>
                <span>{serviciosEnvio.length} resultados</span>
              </div>

              <div className="envio-search-toolbar">
                <div className="envio-search-box">
                  <img src={buscarIcon} alt="" />
                  <input
                    type="search"
                    placeholder="Buscar por zona, operador o nombre..."
                    value={busquedaEnvio}
                    maxLength="100"
                    onChange={(evento) => setBusquedaEnvio(evento.target.value)}
                  />
                  {busquedaEnvio && <button type="button" onClick={() => setBusquedaEnvio("")} aria-label="Limpiar busqueda">x</button>}
                </div>
                <div className="envio-sort-box">
                  <label htmlFor="orden-envios">Ordenar por</label>
                  <select id="orden-envios" value={ordenEnvio} onChange={(evento) => setOrdenEnvio(evento.target.value)}>
                    <option value="alfabetico">Nombre A-Z</option>
                    <option value="calificacion">Mejor calificacion</option>
                    <option value="precio_asc">Precio: menor a mayor</option>
                    <option value="precio_desc">Precio: mayor a menor</option>
                    <option value="capacidad">Mayor capacidad</option>
                  </select>
                </div>
              </div>

              {errorServiciosEnvio && <div className="cliente-alert error">{errorServiciosEnvio}</div>}

              {cargandoServiciosEnvio ? (
                <div className="estado-vacio"><p>Cargando servicios de envio...</p></div>
              ) : serviciosEnvio.length === 0 ? (
                <div className="estado-vacio">
                  <img src={enviosIcon} alt="Sin servicios" style={{ width: "48px", opacity: 0.3 }} />
                  <p>No encontramos servicios que coincidan con tu busqueda.</p>
                </div>
              ) : (
                <div className="envio-catalog-grid">
                  {serviciosEnvio.map((servicio) => (
                    <ServicioEnvioCard key={servicio.id} servicio={servicio} onVerDetalle={abrirDetalleEnvio} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TRANSPORTE */}
        {vista === "transporte" && (
          <div>
            <div className="cliente-card">
              <div className="envio-catalog-header">
                <div>
                  <h2 className="cliente-card-title">Servicios de transporte</h2>
                  <p className="cliente-card-subtitle">Busca por destino, fecha, empresa y tipo de servicio.</p>
                </div>
                <span>{rutasDisponibles.length} resultados</span>
              </div>

              <div className="transport-filter-panel">
                <div className="transport-filter-main">
                  <div className="envio-search-box">
                    <img src={buscarIcon} alt="" />
                    <input type="search" maxLength="100" placeholder="Destino..." value={destinoTransporte} onChange={(evento) => setDestinoTransporte(evento.target.value)} />
                    {destinoTransporte && <button type="button" onClick={() => setDestinoTransporte("")} aria-label="Limpiar destino">x</button>}
                  </div>
                  <input type="date" className="transport-filter-input" min={new Date(Date.now() + 86400000).toISOString().split("T")[0]} value={fechaTransporte} onChange={(evento) => setFechaTransporte(evento.target.value)} aria-label="Fecha de viaje" />
                  <select className="transport-filter-input" value={empresaTransporte} onChange={(evento) => setEmpresaTransporte(evento.target.value)} aria-label="Empresa proveedora">
                    <option value="">Todas las empresas</option>
                    {filtrosTransporte.empresas.map((empresa) => <option value={empresa.id} key={empresa.id}>{empresa.nombre_empresa}</option>)}
                  </select>
                  <select className="transport-filter-input" value={tipoTransporte} onChange={(evento) => setTipoTransporte(evento.target.value)} aria-label="Tipo de servicio">
                    <option value="">Todos los tipos</option>
                    {filtrosTransporte.tipos.map((tipo) => <option value={tipo} key={tipo}>{tipo}</option>)}
                  </select>
                </div>

                <div className="transport-sort-row">
                  <label htmlFor="orden-transporte">Ordenar por</label>
                  <select id="orden-transporte" value={ordenTransporte} onChange={(evento) => setOrdenTransporte(evento.target.value)}>
                    <option value="hora_asc">Hora de inicio: temprana a tarde</option>
                    <option value="hora_desc">Hora de inicio: tarde a temprana</option>
                    <option value="empresa_asc">Empresa: A-Z</option>
                    <option value="empresa_desc">Empresa: Z-A</option>
                    <option value="tiempo_asc">Tiempo estimado: menor a mayor</option>
                    <option value="tiempo_desc">Tiempo estimado: mayor a menor</option>
                    <option value="precio_asc">Precio: menor a mayor</option>
                    <option value="precio_desc">Precio: mayor a menor</option>
                    <option value="calificacion_desc">Calificacion: mayor a menor</option>
                    <option value="calificacion_asc">Calificacion: menor a mayor</option>
                  </select>
                  <button type="button" onClick={() => {
                    setDestinoTransporte(""); setFechaTransporte(""); setEmpresaTransporte(""); setTipoTransporte(""); setOrdenTransporte("calificacion_desc");
                  }}>Limpiar filtros</button>
                </div>
              </div>

              {errorTransportes && <div className="cliente-alert error">{errorTransportes}</div>}

              {cargandoTransportes ? (
                <div className="estado-vacio"><p>Cargando servicios de transporte...</p></div>
              ) : rutasDisponibles.length === 0 ? (
                <div className="estado-vacio">
                  <img src={transporteIcon} alt="Sin rutas" style={{ width: "48px", opacity: 0.3 }} />
                  <p>No hay rutas que coincidan con los filtros seleccionados.</p>
                </div>
              ) : (
                <div className="transport-catalog-grid">
                  {rutasDisponibles.map(ruta => (
                    <RutaCard
                      key={ruta.id}
                      ruta={ruta}
                      onAgregar={agregarAlCarrito}
                      cargando={cargando}
                      fechaFiltro={fechaTransporte}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CARRITO */}
        {vista === "carrito" && (
          <div className="cliente-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h2 className="cliente-card-title">Mi Carrito</h2>
                <p className="cliente-card-subtitle">{carrito.length} servicio(s) agregado(s)</p>
              </div>
              {carrito.length > 0 && (
                <button className="btn-secundario" onClick={confirmarVaciarCarrito}>Vaciar carrito</button>
              )}
            </div>

            {carrito.length === 0 ? (
              <div className="estado-vacio">
                <img src={carritoIcon} alt="Carrito vacío" style={{ width: "48px", opacity: 0.3 }} />
                <p>Tu carrito está vacío. Agrega servicios de transporte.</p>
              </div>
            ) : (
              <>
                {carrito.map(item => (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderBottom: "1px solid #E2E8F0" }}>
                    <div>
                      <p style={{ fontWeight: "700", color: "var(--color-secundario)", marginBottom: "4px" }}>
                        {item.tipo_servicio === 'envio' ? item.nombre_envio : item.nombre_transporte}
                      </p>
                      <p style={{ fontSize: "13px", color: "var(--color-texto-mutado)" }}>
                        Fecha: {new Date(item.fecha_inicio).toLocaleDateString('es-GT', { timeZone: 'UTC' })}
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <span style={{ fontWeight: "700", color: "var(--color-primario)", fontSize: "16px" }}>Q{item.subtotal}</span>
                      <button className="btn-secundario" style={{ color: "#EF4444", borderColor: "#FECACA" }} onClick={() => confirmarEliminarItem(item.id)}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}

                <div style={{ marginTop: "20px", padding: "16px", backgroundColor: "var(--color-fondo)", borderRadius: "var(--radio)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                    <span style={{ fontWeight: "700", color: "var(--color-secundario)", fontSize: "18px" }}>Total:</span>
                    <div>
                      {cuponAplicado && (
                        <div style={{ textAlign: "right", marginBottom: "4px" }}>
                          <span style={{ textDecoration: "line-through", color: "var(--color-texto-mutado)", fontSize: "14px" }}>Q{totalCarrito}</span>
                          <span style={{ marginLeft: "8px", fontSize: "11px", fontWeight: "700", color: "#166534", backgroundColor: "#DCFCE7", padding: "2px 8px", borderRadius: "20px" }}>
                            {cuponAplicado.tipo_descuento === "porcentaje" ? `${cuponAplicado.valor_descuento}% OFF` : `Q${cuponAplicado.valor_descuento} OFF`}
                          </span>
                        </div>
                      )}
                      <span style={{ fontWeight: "800", color: "var(--color-primario)", fontSize: "20px" }}>
                        Q{cuponAplicado ? totalConDescuento : totalCarrito}
                      </span>
                    </div>
                  </div>
                  <div className="form-grupo">
                    <label className="form-label-cliente">Cupón de descuento</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="text"
                        className="form-input-cliente"
                        placeholder="Ingresa tu código de cupón"
                        id="input-cupon"
                        style={{ textTransform: "uppercase" }}
                      />
                      <button
                        className="btn-secundario"
                        style={{ whiteSpace: "nowrap" }}
                        onClick={async () => {
                          const codigo = document.getElementById("input-cupon").value.trim().toUpperCase();
                          if (!codigo) { mostrarAlerta("warning", "Ingresa un código de cupón."); return; }
                          try {
                            const res = await fetch(`http://localhost:3000/api/cliente/cupones/validar/${codigo}`, {
                              headers: { "Authorization": `Bearer ${getToken()}` }
                            });
                            const data = await res.json();
                            if (data.success) {
                              setCuponAplicado(data.data);
                              const descuento = data.data.tipo_descuento === "porcentaje"
                                ? totalCarrito * (data.data.valor_descuento / 100)
                                : parseFloat(data.data.valor_descuento);
                              const nuevoTotal = Math.max(0, totalCarrito - descuento).toFixed(2);
                              setTotalConDescuento(nuevoTotal);
                              mostrarAlerta("success", `Cupón aplicado: ${data.descuento}`);
                            } else {
                              mostrarAlerta("error", data.message);
                            }
                          } catch { mostrarAlerta("error", "Error al validar cupón."); }
                        }}
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>
                  <div className="form-grupo">
                    <label className="form-label-cliente">Método de pago</label>
                    <select
                      className="form-input-cliente"
                      value={metodoSeleccionado}
                      onChange={e => setMetodoSeleccionado(e.target.value)}
                    >
                      <option value="">-- Selecciona un método --</option>
                      {metodosPago.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.tipo === 'tarjeta' ? `Tarjeta: ${m.numero_tarjeta}` : `Wallet: ${m.wallet_id}`} (Saldo: Q{m.saldo})
                        </option>
                      ))}
                    </select>
                  </div>
                  <button className="btn-primario" style={{ width: "100%", padding: "14px", fontSize: "15px" }} onClick={procesarPago} disabled={cargando}>
                    Confirmar Pago
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* HISTORIAL */}
        {vista === "historial" && (
          <div className="cliente-card">
            <h2 className="cliente-card-title">Servicios contratados y completados</h2>
            <p className="cliente-card-subtitle">Consulta todos tus envios y transportes con su estado actual.</p>

            {reservaciones.length === 0 ? (
              <div className="estado-vacio">
                <img src={historialIcon} alt="Sin reservaciones" style={{ width: "48px", opacity: 0.3 }} />
                <p>Aún no has realizado ninguna reservación.</p>
              </div>
            ) : (
              reservaciones.map(res => (
                <div key={res.id} style={{ padding: "16px", marginBottom: "12px", border: "1px solid #E2E8F0", borderRadius: "var(--radio)" }}>
                  
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                    <div>
                      <p style={{ fontWeight: "700", color: "var(--color-secundario)", marginBottom: "4px" }}>
                        {res.tipo_servicio === 'envio' ? res.nombre_envio : res.nombre_transporte}
                      </p>
                      <p style={{ fontSize: "13px", color: "var(--color-texto-mutado)" }}>
                        Fecha: {new Date(res.fecha_inicio).toLocaleDateString('es-GT', { timeZone: 'UTC' })}
                      </p>
                      <p style={{ fontSize: "16px", fontWeight: "700", color: "var(--color-primario)", marginTop: "4px" }}>Q{res.precio_total}</p>
                    </div>
                    
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                      <span className={getBadgeClass(res.estado)}>{res.estado.replace("_", " ").toUpperCase()}</span>
                      
                      {res.estado === 'confirmado' && (
                        <button className="btn-secundario" style={{ color: "#EF4444", borderColor: "#FECACA", fontSize: "12px", padding: "6px 12px" }}
                          onClick={() => confirmarCancelar(res.id, res.fecha_inicio)}>
                          Cancelar
                        </button>
                      )}
                      
                      {res.estado === 'entregado' && (
                        <>
                          {res.ha_calificado ? (
                            <span style={{ 
                              backgroundColor: "#E0F2FE", color: "#0369A1", padding: "3px 10px", borderRadius: "20px", 
                              fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px", 
                              display: "inline-block", textAlign: "center"
                            }}>
                              Calificado
                            </span>
                          ) : (
                            <button className="btn-secundario" style={{ color: "#0369A1", borderColor: "#BAE6FD", fontSize: "12px", padding: "6px 12px" }}
                              onClick={() => setModalCalificacion({
                                  ...res,
                                  empresa_id: res.empresa_id || res.proveedor_id 
                              })}>
                              Calificar
                            </button>
                          )}
                          
                          {res.ha_reportado ? (
                            <span style={{ 
                              backgroundColor: "#FFEDD5", color: "#9A3412", padding: "4px 12px", borderRadius: "20px", 
                              fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px",
                              display: "inline-block", textAlign: "center"
                            }}>
                              Reportado
                            </span>
                          ) : (
                            <button className="btn-secundario" style={{ color: "#B45309", borderColor: "#FDE68A", fontSize: "12px", padding: "6px 12px" }}
                              onClick={() => {
                                const reporteConfigurado = {
                                  ...res,
                                  proveedor_id: res.tipo_servicio === 'envio' ? res.operador_id : res.empresa_id
                                };
                                setModalReporte(reporteConfigurado);
                              }}
                            >
                              Reportar Problema
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {res.ha_reportado && (
                    <div style={{ 
                      marginTop: "15px", 
                      padding: "12px", 
                      borderRadius: "6px", 
                      backgroundColor: "#F8FAFC", 
                      borderLeft: "4px solid #F59E0B" 
                    }}>

                      <span style={{ display: "block", fontSize: "12px", fontWeight: "bold", color: "#B45309", marginBottom: "4px" }}>
                        Estado de tu reporte: <span style={{ textTransform: "uppercase", color: "#9A3412" }}>
                          {res.estado_reporte ? res.estado_reporte.replace("_", " ") : "ENVIADO"}
                        </span>
                      </span>
                      
                      {res.respuesta_reporte ? (
                        <span style={{ fontSize: "13px", color: "#334155" }}>
                          <strong style={{ color: "#0284C7" }}>Respuesta de la empresa:</strong> {res.respuesta_reporte}
                        </span>
                      ) : (
                        <span style={{ fontSize: "13px", color: "#64748B", fontStyle: "italic" }}>
                          En breve estaremos respondiendo su reporte.
                        </span>
                      )}
                    </div>
                  )}

                </div>
              ))
            )}
          </div>
        )}

        {/* MÉTODOS DE PAGO */}
        {vista === "pago" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            <div className="cliente-card">
              <h2 className="cliente-card-title">Mis Métodos de Pago</h2>
              {metodosPago.length === 0 ? (
                <p style={{ color: "var(--color-texto-mutado)", fontSize: "14px" }}>No tienes métodos registrados.</p>
              ) : (
                metodosPago.map(m => (
                  <div key={m.id} style={{ padding: "14px", marginBottom: "10px", backgroundColor: "var(--color-fondo)", borderRadius: "var(--radio)", border: "1px solid #E2E8F0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: "700", color: "var(--color-secundario)" }}>
                        {m.tipo === 'tarjeta' ? ' Tarjeta' : ' Wallet'}
                      </span>
                      <span style={{ fontWeight: "700", color: "var(--color-primario)" }}>Q{m.saldo}</span>
                    </div>
                    <p style={{ fontSize: "13px", color: "var(--color-texto-mutado)", marginTop: "4px" }}>
                      {m.tipo === 'tarjeta' ? m.numero_tarjeta : m.wallet_id}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div>
              <div className="cliente-card" style={{ marginBottom: "24px" }}>
                <h2 className="cliente-card-title">Agregar Tarjeta</h2>
                <form onSubmit={agregarTarjeta}>
                  <div className="form-grupo">
                    <label className="form-label-cliente">Número de Tarjeta *</label>
                    <input type="text" className={`form-input-cliente ${erroresTarjeta.numero_tarjeta ? "error" : ""}`}
                      placeholder="1234 5678 9012 3456"
                      value={formTarjeta.numero_tarjeta}
                      onChange={e => setFormTarjeta({ ...formTarjeta, numero_tarjeta: e.target.value })} />
                    {erroresTarjeta.numero_tarjeta && <p className="form-error-msg">{erroresTarjeta.numero_tarjeta}</p>}
                  </div>
                  <div className="form-grupo">
                    <label className="form-label-cliente">Nombre en la Tarjeta *</label>
                    <input type="text" className={`form-input-cliente ${erroresTarjeta.nombre_tarjeta ? "error" : ""}`}
                      placeholder="Como aparece en la tarjeta"
                      value={formTarjeta.nombre_tarjeta}
                      onChange={e => setFormTarjeta({ ...formTarjeta, nombre_tarjeta: e.target.value })} />
                    {erroresTarjeta.nombre_tarjeta && <p className="form-error-msg">{erroresTarjeta.nombre_tarjeta}</p>}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div className="form-grupo">
                      <label className="form-label-cliente">Vencimiento *</label>
                      <input type="text" className={`form-input-cliente ${erroresTarjeta.fecha_vencimiento ? "error" : ""}`}
                        placeholder="MM/YYYY"
                        value={formTarjeta.fecha_vencimiento}
                        onChange={e => setFormTarjeta({ ...formTarjeta, fecha_vencimiento: e.target.value })} />
                      {erroresTarjeta.fecha_vencimiento && <p className="form-error-msg">{erroresTarjeta.fecha_vencimiento}</p>}
                    </div>
                    <div className="form-grupo">
                      <label className="form-label-cliente">CVV *</label>
                      <input type="password" className={`form-input-cliente ${erroresTarjeta.cvv ? "error" : ""}`}
                        placeholder="123" maxLength={4}
                        value={formTarjeta.cvv}
                        onChange={e => setFormTarjeta({ ...formTarjeta, cvv: e.target.value })} />
                      {erroresTarjeta.cvv && <p className="form-error-msg">{erroresTarjeta.cvv}</p>}
                    </div>
                  </div>
                  <button type="submit" className="btn-primario" style={{ width: "100%" }} disabled={cargando}>
                    Agregar Tarjeta
                  </button>
                </form>
              </div>

              <div className="cliente-card">
                <h2 className="cliente-card-title">Agregar Wallet</h2>
                <form onSubmit={agregarWallet}>
                  <div className="form-grupo">
                    <label className="form-label-cliente">ID de Billetera Virtual *</label>
                    <input type="text" className="form-input-cliente"
                      placeholder="usuario@wallet"
                      value={walletId}
                      onChange={e => setWalletId(e.target.value)} />
                  </div>
                  <button type="submit" className="btn-primario" style={{ width: "100%", backgroundColor: "#7C3AED" }} disabled={cargando}>
                    Vincular Wallet
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

{/* REPORTES */}
        {vista === "reportes" && (
          <div className="cliente-card">
            <h2 className="cliente-card-title">Mis Reportes</h2>
            <p className="cliente-card-subtitle">Historial y estado de los inconvenientes que has reportado.</p>

            {reportes.length === 0 ? (
              <div className="estado-vacio">
                <img src={ayudaIcon} alt="Sin reportes" style={{ width: "48px", opacity: 0.3 }} />
                <p>No tienes reportes emitidos.</p>
              </div>
            ) : (
              reportes.map(rep => (
                <div key={rep.id} style={{ padding: "16px", marginBottom: "12px", border: "1px solid #E2E8F0", borderRadius: "var(--radio)", backgroundColor: "#FAFAFA" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
                    <div>
                      <span style={{ fontSize: "12px", color: "var(--color-texto-mutado)", textTransform: "uppercase", fontWeight: "700" }}>
                        Servicio de {rep.tipo_servicio}
                      </span>
                      <div style={{ fontSize: "16px", fontWeight: "bold", color: "var(--color-secundario)", margin: "6px 0" }}>{rep.motivo}</div>
                      <p style={{ fontSize: "13px", color: "var(--color-texto-mutado)", margin: 0 }}>
                        Fecha: {rep.fecha_creacion ? new Date(rep.fecha_creacion).toLocaleDateString('es-GT', { timeZone: 'UTC' }) : 'Fecha no disponible'}
                      </p>
                    </div>
                    <div>
                      {getBadgeReporte(rep.estado)}
                    </div>
                  </div>
                  <div style={{ backgroundColor: "white", padding: "12px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                    <p style={{ fontSize: "14px", color: "var(--color-texto-mutado)", margin: 0, fontStyle: "italic" }}>"{rep.descripcion}"</p>
                  </div>
                  {rep.evidencia && (
                    <div style={{ marginTop: "12px" }}>
                      <a href={`http://localhost:3000${rep.evidencia}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", color: "#2563EB", textDecoration: "underline", fontWeight: "600" }}>
                        Ver evidencia adjunta
                      </a>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {modalReporte && (
          <div className="modal-overlay">
            <div className="modal-box" style={{ maxWidth: "500px" }}>
              <h3 className="modal-titulo">Reportar Inconveniente</h3>
              <p className="modal-descripcion mb-4">
                Servicio: {modalReporte.tipo_servicio === 'envio' ? modalReporte.nombre_envio : modalReporte.nombre_transporte}
              </p>
              
              <form onSubmit={enviarReporte}>
               <div className="form-grupo">
                  <label className="form-label-cliente">Motivo del reporte *</label>
                  <select 
                    className="form-input-cliente"
                    value={formReporte.motivo} 
                    onChange={(e) => setFormReporte({ ...formReporte, motivo: e.target.value })} 
                    required
                  >
                    <option value="">Seleccione un motivo...</option>
                    
                    {modalReporte.tipo_servicio === 'envio' ? (
                      <>
                        <option value="Operador no realizó la recolección a tiempo">Operador no realizó la recolección a tiempo</option>
                        <option value="Cobro no acordado">Cobro no acordado</option>
                        <option value="Daño al paquete">Daño al paquete</option>
                        <option value="Otros">Otros</option>
                      </>
                    ) : (
                      <>
                        <option value="Retrasos no justificados">Retrasos no justificados</option>
                        <option value="Cobros extra">Cobros extra</option>
                        <option value="Cancelaciones sin aviso">Cancelaciones sin aviso</option>
                        <option value="Otros">Otros</option>
                      </>
                    )}

                  </select>
                </div>

                <div className="form-grupo">
                  <label className="form-label-cliente">Descripción detallada *</label>
                  <textarea 
                    className="form-input-cliente"
                    rows="3" 
                    value={formReporte.descripcion} 
                    onChange={(e) => setFormReporte({ ...formReporte, descripcion: e.target.value })} 
                    required 
                  />
                </div>

                <div className="form-grupo">
                  <label className="form-label-cliente">Evidencia (Foto/Video)</label>
                  <input 
                    type="file" 
                    accept="image/*,video/*" 
                    onChange={(e) => setFormReporte({ ...formReporte, archivo: e.target.files[0] })} 
                    className="form-input-cliente"
                    style={{ padding: "8px" }}
                  />
                </div>

                <div className="modal-acciones mt-4">
                  <button type="button" className="btn-secundario" onClick={() => setModalReporte(null)}>Cancelar</button>
                  <button type="submit" className="btn-peligro" disabled={cargando}>
                    {cargando ? "Enviando..." : "Enviar Reporte"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL DE CALIFICACIÓN */}
        {modalCalificacion && (
          <div className="modal-overlay">
            <div className="modal-box" style={{ maxWidth: "450px", textAlign: "center" }}>
              <h3 className="modal-titulo">Calificar Servicio</h3>
              <p className="modal-descripcion mb-4">
                ¿Qué te pareció el viaje a <strong>{modalCalificacion.tipo_servicio === 'envio' ? modalCalificacion.nombre_envio : modalCalificacion.nombre_transporte}</strong>?
              </p>
              
              <form onSubmit={enviarCalificacion}>
                <div className="form-grupo" style={{ display: "flex", justifyContent: "center", gap: "12px", marginBottom: "20px" }}>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setFormCalificacion({ ...formCalificacion, puntuacion: num })}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        fontSize: "32px", color: formCalificacion.puntuacion >= num ? "#F59E0B" : "#E2E8F0",
                        transition: "color 0.2s"
                      }}
                    >
                      ★
                    </button>
                  ))}
                </div>

                <div className="form-grupo text-start">
                  <label className="form-label-cliente">Comentario (Opcional)</label>
                  <textarea 
                    className="form-input-cliente"
                    rows="3" 
                    placeholder="Cuéntanos tu experiencia..."
                    value={formCalificacion.comentario} 
                    onChange={(e) => setFormCalificacion({ ...formCalificacion, comentario: e.target.value })} 
                  />
                </div>

                <div className="modal-acciones mt-4">
                  <button type="button" className="btn-secundario" onClick={() => setModalCalificacion(null)}>Cancelar</button>
                  <button type="submit" className="btn-primario" disabled={cargando}>
                    {cargando ? "Enviando..." : "Enviar Calificación"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}


        {/* CUPONES */}
        {vista === "cupones" && (
          <div>
            <div className="cliente-card">
              <h2 className="cliente-card-title">Mis Cupones</h2>
              <p className="cliente-card-subtitle">Cupones recibidos de operadores y empresas de transporte.</p>

              {cupones.length === 0 ? (
                <div className="estado-vacio">
                  <img src={cuponesIcon} alt="Sin cupones" style={{ width: "48px", opacity: 0.3 }} />
                  <p>No tienes cupones disponibles en este momento.</p>
                </div>
              ) : (
                cupones.map((c) => (
                  <div key={c.id} className="p-3 mb-3" style={{
                    border: "1px solid #E2E8F0",
                    borderRadius: "var(--radio)",
                    padding: "16px",
                    marginBottom: "12px",
                    backgroundColor: c.canjeado ? "var(--color-fondo)" : "var(--color-blanco)"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
                      <div>
                        <h5 style={{ fontWeight: "800", color: "var(--color-primario)", letterSpacing: "1px", marginBottom: "2px" }}>{c.codigo}</h5>
                        <p style={{ fontSize: "13px", color: "var(--color-texto-mutado)", margin: 0 }}>{c.descripcion}</p>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                        <span style={{
                          fontSize: "11px", fontWeight: "700", textTransform: "uppercase",
                          padding: "3px 10px", borderRadius: "20px",
                          backgroundColor: c.canjeado ? "#F1F5F9" : c.estado === "activo" ? "#DBEAFE" : "#FEE2E2",
                          color: c.canjeado ? "var(--color-texto-mutado)" : c.estado === "activo" ? "#1D4ED8" : "#991B1B"
                        }}>
                          {c.canjeado ? "Canjeado" : c.estado}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "20px", fontSize: "13px", marginBottom: "8px" }}>
                      <span style={{ fontWeight: "700", color: "var(--color-secundario)" }}>
                        {c.tipo_descuento === "porcentaje" ? `${c.valor_descuento}% OFF` : `Q${c.valor_descuento} OFF`}
                      </span>
                      <span style={{ color: "var(--color-texto-mutado)" }}>
                        Valido: {new Date(c.fecha_inicio).toLocaleDateString()} - {new Date(c.fecha_fin).toLocaleDateString()}
                      </span>
                    </div>

                    {c.monto_minimo && (
                      <p style={{ fontSize: "12px", color: "var(--color-texto-mutado)", marginBottom: "4px" }}>
                        Monto minimo: Q{c.monto_minimo}
                      </p>
                    )}

                    {c.canjeado && c.fecha_canje && (
                      <p style={{ fontSize: "12px", color: "var(--color-texto-mutado)", marginTop: "8px" }}>
                        Canjeado el: {new Date(c.fecha_canje).toLocaleDateString()}
                      </p>
                    )}
                    {!c.canjeado && c.estado === "activo" && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(c.codigo);
                          mostrarAlerta("success", `Código ${c.codigo} copiado al portapapeles.`);
                        }}
                        className="btn-secundario"
                        style={{ marginTop: "8px", fontSize: "12px", padding: "6px 12px" }}
                      >
                        Copiar código
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* PERFIL */}
        {vista === "perfil" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px" }}>
            <div className="cliente-card text-center">
              <div style={{
                width: "100px", height: "100px", borderRadius: "50%",
                backgroundColor: "var(--color-fondo)", border: "2px solid #E2E8F0",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px auto", overflow: "hidden"
              }}>
                {perfil?.foto_perfil ? (
                  <img src={perfil.foto_perfil} alt="Foto de perfil" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <img src={perfilIcon} alt="Perfil" style={{ width: "48px", height: "48px", opacity: 0.4 }} />
                )}
              </div>
              <h3 style={{ fontWeight: "700", color: "var(--color-secundario)", marginBottom: "4px" }}>
                {perfil ? `${perfil.nombre} ${perfil.apellido}` : "Cargando..."}
              </h3>
              <p style={{ fontSize: "13px", color: "var(--color-texto-mutado)" }}>{perfil?.email}</p>

              <div style={{ marginTop: "20px", padding: "12px", backgroundColor: "var(--color-fondo)", borderRadius: "var(--radio)" }}>
                <p style={{ fontSize: "12px", color: "var(--color-texto-mutado)", fontWeight: "600", textTransform: "uppercase", marginBottom: "4px" }}>Telefono</p>
                <p style={{ fontWeight: "600", color: "var(--color-secundario)" }}>{perfil?.telefono || "No registrado"}</p>
              </div>

              <div style={{ marginTop: "12px", padding: "12px", backgroundColor: "var(--color-fondo)", borderRadius: "var(--radio)" }}>
                <p style={{ fontSize: "12px", color: "var(--color-texto-mutado)", fontWeight: "600", textTransform: "uppercase", marginBottom: "4px" }}>Direccion de origen</p>
                <p style={{ fontWeight: "600", color: "var(--color-secundario)", fontSize: "13px" }}>{perfil?.direccion_origen || "No registrada"}</p>
              </div>
            </div>

            <div className="cliente-card">
              <h2 className="cliente-card-title">Editar Perfil</h2>
              <p className="cliente-card-subtitle">El correo electronico no puede modificarse.</p>

              <div style={{ padding: "12px 16px", backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: "var(--radio)", marginBottom: "20px" }}>
                <p style={{ fontSize: "13px", color: "#1D4ED8", margin: 0 }}>
                  Correo: <strong>{perfil?.email}</strong>
                </p>
              </div>

              <div className="form-grupo">
                <label className="form-label-cliente">Nombre *</label>
                <input type="text" className="form-input-cliente"
                  value={formPerfil.nombre}
                  onChange={e => setFormPerfil({ ...formPerfil, nombre: e.target.value })}
                  placeholder="Tu nombre" />
              </div>

              <div className="form-grupo">
                <label className="form-label-cliente">Apellido *</label>
                <input type="text" className="form-input-cliente"
                  value={formPerfil.apellido}
                  onChange={e => setFormPerfil({ ...formPerfil, apellido: e.target.value })}
                  placeholder="Tu apellido" />
              </div>

              <div className="form-grupo">
                <label className="form-label-cliente">Telefono *</label>
                <input type="text" className="form-input-cliente"
                  value={formPerfil.telefono}
                  onChange={e => {
                    const valor = e.target.value.replace(/\D/g, "");
                    setFormPerfil({ ...formPerfil, telefono: valor });
                  }}
                  maxLength={8}
                  placeholder="44445555" />
              </div>

              <div className="form-grupo">
                <label className="form-label-cliente">Direccion de origen</label>
                <input type="text" className="form-input-cliente"
                  value={formPerfil.direccion_origen}
                  onChange={e => setFormPerfil({ ...formPerfil, direccion_origen: e.target.value })}
                  placeholder="Tu direccion principal" />
              </div>

              <button className="btn-primario" style={{ width: "100%", padding: "12px", fontSize: "15px" }}
                onClick={guardarPerfil} disabled={cargando}>
                Guardar Cambios
              </button>
            </div>
          </div>
        )}

        {/* AYUDA */}
        {vista === "ayuda" && (
          <div>
            <div className="cliente-card">
              <h2 className="cliente-card-title">Centro de Ayuda</h2>
              <p className="cliente-card-subtitle">Encuentra respuestas a tus preguntas más frecuentes.</p>

              {[
                { pregunta: "¿Cómo agrego un servicio al carrito?", respuesta: "Ve a la sección de Transporte, selecciona una fecha para tu viaje y haz clic en 'Agregar al Carrito'." },
                { pregunta: "¿Cómo pago mis reservaciones?", respuesta: "Ve a Mi Carrito, selecciona un método de pago registrado y haz clic en 'Confirmar Pago'." },
                { pregunta: "¿Puedo cancelar una reservación?", respuesta: "Sí, puedes cancelar hasta 24 horas antes de la fecha del servicio. Ve a Historial y haz clic en 'Cancelar'. El reembolso se aplica automáticamente." },
                { pregunta: "¿Cómo agrego una tarjeta de crédito?", respuesta: "Ve a Métodos de Pago, completa el formulario con los datos de tu tarjeta. El número es validado con el algoritmo de Luhn para mayor seguridad." },
                { pregunta: "¿Qué es una Wallet?", respuesta: "Es un método de pago alternativo tipo billetera virtual. Puedes vincularla con tu ID de usuario." },
                { pregunta: "¿Cómo uso un cupón de descuento?", respuesta: "Los cupones enviados por operadores o empresas aparecen en la sección de Cupones. Puedes aplicarlos al momento del pago." },
              ].map((item, i) => (
                <details key={i} style={{ marginBottom: "12px", border: "1px solid #E2E8F0", borderRadius: "var(--radio)", overflow: "hidden" }}>
                  <summary style={{ padding: "14px 16px", cursor: "pointer", fontWeight: "600", color: "var(--color-secundario)", backgroundColor: "var(--color-fondo)", listStyle: "none", display: "flex", justifyContent: "space-between" }}>
                    {item.pregunta}
                    <span style={{ color: "var(--color-primario)" }}>+</span>
                  </summary>
                  <p style={{ padding: "14px 16px", fontSize: "14px", color: "var(--color-texto-mutado)", lineHeight: "1.6", margin: 0 }}>
                    {item.respuesta}
                  </p>
                </details>
              ))}
            </div>

            <div className="cliente-card">
              <h2 className="cliente-card-title">¿Necesitas más ayuda?</h2>
              <p style={{ fontSize: "14px", color: "var(--color-texto-mutado)", marginBottom: "16px" }}>
                Si no encontraste la respuesta que buscabas, contáctanos directamente.
              </p>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <a
                  href="https://mail.google.com/mail/?view=cm&to=soporte@trackflowhub.com&su=Soporte TrackFlow-HUB"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primario"
                  style={{ textDecoration: "none" }}
                >
                  Enviar correo de soporte
                </a>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default DashboardCliente;
