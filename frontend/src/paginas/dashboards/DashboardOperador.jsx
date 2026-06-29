import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { jsPDF } from "jspdf";
import "../../estilos/topNavbar.css";
import CuponesOperador from "./CuponesOperador";

const formatearHora12 = (hora24) => {
  if (!hora24) return "";
  const [horasStr, minutosStr] = hora24.split(":");
  let horas = parseInt(horasStr);
  const ampm = horas >= 12 ? "pm" : "am";
  horas = horas % 12;
  horas = horas ? horas : 12;
  return `${horas}:${minutosStr} ${ampm}`;
};

const formatearFecha = (fecha) => new Intl.DateTimeFormat("es-GT", {
  day: "2-digit",
  month: "long",
  year: "numeric"
}).format(new Date(fecha));

const claveFechaLocal = (fecha) => [
  fecha.getFullYear(),
  String(fecha.getMonth() + 1).padStart(2, "0"),
  String(fecha.getDate()).padStart(2, "0")
].join("-");

const fechaDesdeClave = (clave) => {
  const [anio, mes, dia] = clave.split("-").map(Number);
  return new Date(anio, mes - 1, dia);
};

const obtenerCeldasMes = (mesActual) => {
  const anio = mesActual.getFullYear();
  const mes = mesActual.getMonth();
  const primerDia = new Date(anio, mes, 1);
  const ultimoDia = new Date(anio, mes + 1, 0).getDate();
  const espaciosIniciales = (primerDia.getDay() + 6) % 7;
  const totalCeldas = Math.ceil((espaciosIniciales + ultimoDia) / 7) * 7;

  return Array.from({ length: totalCeldas }, (_, indice) => {
    const numeroDia = indice - espaciosIniciales + 1;
    return numeroDia > 0 && numeroDia <= ultimoDia
      ? new Date(anio, mes, numeroDia)
      : null;
  });
};

const agruparEnviosPorDia = (reservaciones, mesActual) => {
  const eventos = {};
  const inicioMes = new Date(mesActual.getFullYear(), mesActual.getMonth(), 1);
  const finMes = new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 0);

  reservaciones.forEach((reservacion) => {
    const inicioReserva = fechaDesdeClave(reservacion.fecha_inicio);
    const finReserva = fechaDesdeClave(reservacion.fecha_fin);
    const inicio = inicioReserva < inicioMes ? inicioMes : inicioReserva;
    const fin = finReserva > finMes ? finMes : finReserva;

    for (let fecha = new Date(inicio); fecha <= fin; fecha.setDate(fecha.getDate() + 1)) {
      const clave = claveFechaLocal(fecha);
      let tipo = "en_curso";
      if (clave === reservacion.fecha_inicio && clave === reservacion.fecha_fin) tipo = "recoleccion_entrega";
      else if (clave === reservacion.fecha_inicio) tipo = "recoleccion";
      else if (clave === reservacion.fecha_fin) tipo = "entrega";

      eventos[clave] = [...(eventos[clave] || []), { ...reservacion, tipo_evento: tipo }];
    }
  });

  return eventos;
};


function DashboardOperador() {
  const navigate = useNavigate();
  const [vista, setVista] = useState("inicio");
  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [calificaciones, setCalificaciones] = useState([]);
  const [resumenCalificaciones, setResumenCalificaciones] = useState({
    promedio: 0,
    total: 0,
    pendientes_respuesta: 0
  });
  const [respuestas, setRespuestas] = useState({});
  const [cargandoCalificacionesTab, setCargandoCalificacionesTab] = useState(false);
  const [errorCalificacionesTab, setErrorCalificacionesTab] = useState("");
  const [respondiendoId, setRespondiendoId] = useState(null);
  const [mesCalendario, setMesCalendario] = useState(() => {
    const hoy = new Date();
    return new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  });
  const [reservacionesCalendario, setReservacionesCalendario] = useState([]);
  const [serviciosCalendario, setServiciosCalendario] = useState([]);
  const [servicioCalendario, setServicioCalendario] = useState("");
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [cargandoCalendario, setCargandoCalendario] = useState(false);
  const [errorCalendario, setErrorCalendario] = useState("");

  const [editandoId, setEditandoId] = useState(null);
  const [nombreServicio, setNombreServicio] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [zonaCobertura, setZonaCobertura] = useState("");
  const [capacidadCarga, setCapacidadCarga] = useState("");
  const [precioEnvio, setPrecioEnvio] = useState("");
  const [diasSeleccionados, setDiasSeleccionados] = useState([]);
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");

  const [perfil, setPerfil] = useState(null);
  const [solicitudesCambio, setSolicitudesCambio] = useState([]);
  const [mensajePerfil, setMensajePerfil] = useState("");

  const [pestañaReporte, setPestañaReporte] = useState("ganancias");

  const [reportes, setReportes] = useState([]);
  const [cargandoReportes, setCargandoReportes] = useState(false);
  const [reporteAResponder, setReporteAResponder] = useState(null);
  const [textoRespuesta, setTextoRespuesta] = useState("");

  const cargarReportes = async () => {
    setCargandoReportes(true);
    try {
      const operadorId = localStorage.getItem("usuario_id") || localStorage.getItem("id");

      const res = await fetch(`http://localhost:3000/api/reportes/empresa/${operadorId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setReportes(data.data);
    } catch (error) {
      console.error("Error al cargar reportes", error);
    } finally {
      setCargandoReportes(false);
    }
  };

  const cambiarEstadoReporte = async (reporteId, nuevoEstado) => {
    try {
      const res = await fetch(`http://localhost:3000/api/reportes/${reporteId}/estado`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ estado: nuevoEstado })
      });
      const data = await res.json();
      if (data.success) {
        cargarReportes(); 
      } else {
        Swal.fire({ title: "Error", text: data.message, icon: "error" });
      }
    } catch (error) {
      console.error("Error al cambiar estado del reporte", error);
    }
  };

  const enviarRespuestaReporte = async (reporteId) => {
    if (!textoRespuesta.trim()) return; 
    try {
      const res = await fetch(`http://localhost:3000/api/reportes/${reporteId}/responder`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ respuesta: textoRespuesta })
      });
      const data = await res.json();
      if (data.success) {
        setReporteAResponder(null);
        setTextoRespuesta("");
        cargarReportes(); 
      }
    } catch (error) {
      console.error("Error al enviar la respuesta:", error);
    }
  };
  
  const [reporteGananciasOperador, setReporteGananciasOperador] = useState({
    data: [],
    totales: {
      total_reservaciones: 0,
      ingresos_totales: 0,
      ganancias_operador: 0,
      comision_plataforma: 0
    }
  });
  const [cargandoReporteGanancias, setCargandoReporteGanancias] = useState(false);
  const [errorReporteGanancias, setErrorReporteGanancias] = useState("");

  const [historialClientes, setHistorialClientes] = useState([]);
  const [cargandoClientes, setCargandoClientes] = useState(false);
  const [errorClientes, setErrorClientes] = useState("");

  const [reporteCalificaciones, setReporteCalificaciones] = useState([]);
  const [cargandoCalificaciones, setCargandoCalificaciones] = useState(false);
  const [errorCalificaciones, setErrorCalificaciones] = useState("");

  const [formPerfil, setFormPerfil] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    telefono_respaldo: "",
    zona_operacion: "",
    genero: "masculino"
  });

  const token = localStorage.getItem("token");

  const cargarPerfil = async () => {
    try {
      const respuesta = await fetch("http://localhost:3000/api/operador/perfil", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await respuesta.json();
      if (data.success) {
        setPerfil(data.data);
        setFormPerfil({
          nombre: data.data.nombre || "",
          apellido: data.data.apellido || "",
          telefono: data.data.telefono || "",
          telefono_respaldo: data.data.telefono_respaldo || "",
          zona_operacion: data.data.zona_operacion || "",
          genero: data.data.genero || "masculino"
        });
      }
    } catch (error) {
      console.error("Error al cargar perfil", error);
    }
  };

  const cargarSolicitudesCambio = async () => {
    try {
      const respuesta = await fetch("http://localhost:3000/api/operador/perfil/solicitudes", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await respuesta.json();
      if (data.success) {
        setSolicitudesCambio(data.data);
      }
    } catch (error) {
      console.error("Error al cargar solicitudes de cambio", error);
    }
  };

  const cargarCalificaciones = async () => {
    setCargandoCalificacionesTab(true);
    setErrorCalificacionesTab("");

    try {
      const respuesta = await fetch("http://localhost:3000/api/operador/calificaciones", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await respuesta.json();

      if (!respuesta.ok) {
        setErrorCalificacionesTab(data.message || "No se pudieron cargar las calificaciones.");
        return;
      }

      setCalificaciones(data.data.items || []);
      setResumenCalificaciones(data.data.resumen || {
        promedio: 0,
        total: 0,
        pendientes_respuesta: 0
      });
    } catch {
      setErrorCalificacionesTab("No se pudo conectar con el servidor.");
    } finally {
      setCargandoCalificacionesTab(false);
    }
  };

  const responderCalificacion = async (calificacionId) => {
    const textoRespuesta = (respuestas[calificacionId] || "").trim();

    if (!textoRespuesta) {
      setErrorCalificacionesTab("Escribe una respuesta antes de publicarla.");
      return;
    }

    setRespondiendoId(calificacionId);
    setErrorCalificacionesTab("");

    try {
      const respuesta = await fetch(
        `http://localhost:3000/api/operador/calificaciones/${calificacionId}/respuesta`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ respuesta: textoRespuesta })
        }
      );
      const data = await respuesta.json();

      if (!respuesta.ok) {
        setErrorCalificacionesTab(data.message || "No se pudo publicar la respuesta.");
        return;
      }

      setRespuestas((actuales) => ({ ...actuales, [calificacionId]: "" }));
      await cargarCalificaciones();
      await Swal.fire({
        title: "Respuesta publicada",
        text: "Tu respuesta quedo guardada junto a la resena.",
        confirmButtonText: "Aceptar"
      });
    } catch {
      setErrorCalificacionesTab("No se pudo conectar con el servidor.");
    } finally {
      setRespondiendoId(null);
    }
  };

  const cargarCalendario = async () => {
    const inicioMes = new Date(mesCalendario.getFullYear(), mesCalendario.getMonth(), 1);
    const finMes = new Date(mesCalendario.getFullYear(), mesCalendario.getMonth() + 1, 0);
    const parametros = new URLSearchParams({
      desde: claveFechaLocal(inicioMes),
      hasta: claveFechaLocal(finMes)
    });

    if (servicioCalendario) parametros.set("servicio_id", servicioCalendario);

    setCargandoCalendario(true);
    setErrorCalendario("");

    try {
      const respuesta = await fetch(`http://localhost:3000/api/operador/calendario?${parametros}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await respuesta.json();

      if (!respuesta.ok) {
        setErrorCalendario(data.message || "No se pudo cargar el calendario.");
        return;
      }

      const reservaciones = data.data.reservaciones || [];
      const eventos = agruparEnviosPorDia(reservaciones, mesCalendario);
      const hoy = claveFechaLocal(new Date());
      const prefijoMes = claveFechaLocal(inicioMes).slice(0, 7);

      setReservacionesCalendario(reservaciones);
      setServiciosCalendario(data.data.servicios || []);
      setDiaSeleccionado((actual) => {
        if (actual?.startsWith(prefijoMes)) return actual;
        if (hoy.startsWith(prefijoMes)) return hoy;
        return Object.keys(eventos).sort()[0] || claveFechaLocal(inicioMes);
      });
    } catch {
      setErrorCalendario("No se pudo conectar con el servidor.");
    } finally {
      setCargandoCalendario(false);
    }
  };

  const cambiarMesCalendario = (cantidad) => {
    setMesCalendario((actual) => new Date(actual.getFullYear(), actual.getMonth() + cantidad, 1));
  };



  const cargarReporteGananciasOperador = async () => {
    setCargandoReporteGanancias(true);
    setErrorReporteGanancias("");
    try {
      const respuesta = await fetch("http://localhost:3000/api/operador/reportes/ganancias", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await respuesta.json();
      if (respuesta.ok && data.success) {
        setReporteGananciasOperador({
          data: data.data || [],
          totales: data.totales || {
            total_reservaciones: 0,
            ingresos_totales: 0,
            ganancias_operador: 0,
            comision_plataforma: 0
          }
        });
      } else {
        setErrorReporteGanancias(data.message || "Error al cargar reporte de ganancias.");
      }
    } catch (error) {
      setErrorReporteGanancias("Error de conexión al servidor.");
    } finally {
      setCargandoReporteGanancias(false);
    }
  };

  const cargarHistorialClientes = async () => {
    setCargandoClientes(true);
    setErrorClientes("");
    try {
      const respuesta = await fetch("http://localhost:3000/api/operador/reportes/historial-clientes", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await respuesta.json();
      if (respuesta.ok && data.success) {
        setHistorialClientes(data.data || []);
      } else {
        setErrorClientes(data.message || "Error al cargar historial de clientes.");
      }
    } catch (error) {
      setErrorClientes("Error de conexión al servidor.");
    } finally {
      setCargandoClientes(false);
    }
  };

  const cargarReporteCalificaciones = async () => {
    setCargandoCalificaciones(true);
    setErrorCalificaciones("");
    try {
      const respuesta = await fetch("http://localhost:3000/api/operador/reportes/calificaciones", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await respuesta.json();
      if (respuesta.ok && data.success) {
        setReporteCalificaciones(data.data || []);
      } else {
        setErrorCalificaciones(data.message || "Error al cargar reporte de calificaciones.");
      }
    } catch (error) {
      setErrorCalificaciones("Error de conexión al servidor.");
    } finally {
      setCargandoCalificaciones(false);
    }
  };

  const crearDocumentoPdf = (titulo) => {
    const doc = new jsPDF({ orientation: 'landscape', unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = 40;
    const margin = 30;
    const pageBottom = pageHeight - margin;
    const maxWidth = pageWidth - margin * 2;

    // Accent header banner on page 1
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(margin, y, maxWidth, 45, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(titulo, margin + 15, y + 27);
    
    // Reset defaults
    doc.setTextColor(51, 65, 85); // slate-700
    doc.setFont("helvetica", "normal");
    y += 60;

    const agregarTexto = (texto, opciones = {}) => {
      const ancho = maxWidth;
      const lineas = doc.splitTextToSize(texto, ancho);
      doc.setFont("helvetica", opciones.fontWeight || "normal");
      doc.setFontSize(opciones.fontSize || 10);
      doc.setTextColor(opciones.textColor ? opciones.textColor.r : 51, opciones.textColor ? opciones.textColor.g : 65, opciones.textColor ? opciones.textColor.b : 85);
      
      lineas.forEach((linea) => {
        const nextLineHeight = opciones.lineHeight || 14;
        if (y + nextLineHeight > pageBottom) {
          doc.addPage();
          y = margin;
        }
        doc.text(linea, margin, y);
        y += nextLineHeight;
      });
    };

    const dibujarTarjetasResumen = (tarjetas) => {
      const numTarjetas = tarjetas.length;
      const gap = 12;
      const totalGapWidth = gap * (numTarjetas - 1);
      const widthTarjeta = (maxWidth - totalGapWidth) / numTarjetas;
      const heightTarjeta = 45;

      if (y + heightTarjeta > pageBottom) {
        doc.addPage();
        y = margin;
      }

      let currentX = margin;
      tarjetas.forEach((tarjeta) => {
        // Background
        doc.setFillColor(248, 250, 252); // slate-50
        doc.rect(currentX, y, widthTarjeta, heightTarjeta, "F");
        
        // Border
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.setLineWidth(1);
        doc.rect(currentX, y, widthTarjeta, heightTarjeta, "S");

        // Title
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text(tarjeta.titulo, currentX + 10, y + 16);

        // Value
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42); // slate-900
        doc.text(tarjeta.valor, currentX + 10, y + 33);

        currentX += widthTarjeta + gap;
      });

      y += heightTarjeta + 15;
    };

    const dibujarTabla = (headers, rows, options = {}) => {
      let columnWidths = options.columnWidths || [120, 90, 70, 55, 70, 70, 70];
      const rowHeight = options.rowHeight || 20;
      columnWidths = columnWidths.slice(0, headers.length);
      let tableWidth = columnWidths.reduce((sum, w) => sum + w, 0);

      if (tableWidth > maxWidth) {
        const scale = maxWidth / tableWidth;
        columnWidths = columnWidths.map((w) => Math.floor(w * scale));
        tableWidth = columnWidths.reduce((s, w) => s + w, 0);
      }

      const drawHeader = () => {
        let x = margin;
        const headerLineHeight = options.lineHeight || 14;
        const headerLines = columnWidths.map((w, index) => {
          const maxTextWidth = Math.max(w - 12, 10);
          return doc.splitTextToSize(String(headers[index] || ""), maxTextWidth);
        });
        const headerHeights = headerLines.map((lines) => Math.max(lines.length * headerLineHeight, rowHeight));
        const headerHeight = Math.max(...headerHeights, rowHeight);

        if (y + headerHeight > pageBottom) {
          doc.addPage();
          y = margin;
        }

        doc.setFillColor(30, 41, 59); // slate-800
        doc.rect(x, y, tableWidth, headerHeight, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255); // White text

        columnWidths.forEach((w, index) => {
          const lines = headerLines[index] || [""];
          let textY = y + 13;
          lines.forEach((line) => {
            doc.text(String(line), x + 6, textY);
            textY += headerLineHeight;
          });
          x += w;
        });

        y += headerHeight;
      };

      drawHeader();

      const cellLineHeight = options.lineHeight || 13;
      let isEven = false;
      
      rows.forEach((row) => {
        const cellLines = row.map((cell, index) => {
          const text = String(cell || "");
          const colWidth = columnWidths[index] || 50;
          const maxTextWidth = Math.max(colWidth - 12, 10);
          return doc.splitTextToSize(text, maxTextWidth);
        });

        const cellHeights = cellLines.map((lines) => Math.max(lines.length * cellLineHeight, rowHeight));
        const maxCellHeight = Math.max(...cellHeights, rowHeight);

        if (y + maxCellHeight > pageBottom) {
          drawHeader();
        }

        let x = margin;
        columnWidths.forEach((w, index) => {
          // Zebra background
          if (isEven) {
            doc.setFillColor(248, 250, 252); // slate-50
          } else {
            doc.setFillColor(255, 255, 255); // white
          }
          doc.rect(x, y, w, maxCellHeight, "F");
          
          // Border
          doc.setDrawColor(226, 232, 240); // slate-200
          doc.setLineWidth(1);
          doc.rect(x, y, w, maxCellHeight, "S");

          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(51, 65, 85); // slate-700

          const lines = cellLines[index] || [""];
          let textY = y + 13;
          lines.forEach((line) => {
            doc.text(String(line), x + 6, textY);
            textY += cellLineHeight;
          });
          x += w;
        });

        y += maxCellHeight;
        isEven = !isEven;
      });

      y += 10;
    };

    return { doc, agregarTexto, dibujarTabla, dibujarTarjetasResumen, yRef: () => y, setY: (valor) => { y = valor; } };
  };

  const generarPDF = (mode = "general") => {
    try {
      const { data, totales } = reporteGananciasOperador;
      const title = `Reporte de Ganancias - ${perfil?.email || ""}`;
      const { doc, agregarTexto, dibujarTabla, dibujarTarjetasResumen } = crearDocumentoPdf(title);

      agregarTexto(`Generado: ${new Date().toLocaleString()}`, { fontSize: 10, lineHeight: 16 });
      agregarTexto(" ");

      dibujarTarjetasResumen([
        { titulo: "Reservaciones", valor: String(totales.total_reservaciones) },
        { titulo: "Ingresos", valor: `Q${parseFloat(totales.ingresos_totales || 0).toFixed(2)}` },
        { titulo: "Ganancias (80%)", valor: `Q${parseFloat(totales.ganancias_operador || 0).toFixed(2)}` },
        { titulo: "Comisión (20%)", valor: `Q${parseFloat(totales.comision_plataforma || 0).toFixed(2)}` }
      ]);

      agregarTexto("Detalle por Servicio", { fontSize: 12, lineHeight: 16 });

      const rows = data.map((s) => [
        s.nombre_servicio || "",
        s.zona_cobertura || "",
        s.estado || "",
        s.total_reservaciones || 0,
        `Q${parseFloat(s.ingresos_totales || 0).toFixed(2)}`,
        `Q${parseFloat(s.ganancias_operador || 0).toFixed(2)}`,
        `Q${parseFloat(s.comision_plataforma || 0).toFixed(2)}`
      ]);

      dibujarTabla([
        "Servicio",
        "Zona",
        "Estado",
        "Reservaciones",
        "Ingresos",
        "Ganancias",
        "Comisión"
      ], rows, { columnWidths: [170, 115, 80, 115, 100, 100, 100] });

      if (mode === "por_servicio") {
        data.forEach((s) => {
          agregarTexto(" ");
          agregarTexto(`Detalle del servicio: ${s.nombre_servicio || ""}`, { fontSize: 12, fontWeight: "bold", lineHeight: 16 });
          agregarTexto(`Descripción: ${s.descripcion || "Sin descripción"}`);
          agregarTexto(" ");

          dibujarTabla([
            "Zona Cobertura",
            "Estado",
            "Horario Disponible",
            "Capacidad",
            "Precio Envío"
          ], [
            [
              s.zona_cobertura || "N/A",
              s.estado || "N/A",
              s.horario_disponible || "N/A",
              `${parseFloat(s.capacidad_carga_kg || 0).toFixed(2)} kg`,
              `Q${parseFloat(s.precio_envio || 0).toFixed(2)}`
            ]
          ], { columnWidths: [155, 100, 220, 155, 150] });

          agregarTexto(" ");

          const servicioRows = (s.reservaciones || []).map((r) => [
            `${r.cliente_nombre || ""} ${r.cliente_apellido || ""}`,
            `${r.fecha_inicio || ""}${r.fecha_fin ? ` - ${r.fecha_fin}` : ""}`,
            r.direccion_origen || "",
            r.direccion_destino || "",
            `${parseFloat(r.peso_paquete_kg || 0).toFixed(2)} kg`,
            `Q${parseFloat(r.precio_total || 0).toFixed(2)}`,
            `Q${parseFloat(r.ganancia_proveedor || 0).toFixed(2)}`,
            `Q${parseFloat(r.comision_plataforma || 0).toFixed(2)}`,
            r.estado_reservacion || ""
          ]);

          if (servicioRows.length > 0) {
            dibujarTabla([
              "Cliente",
              "Fecha",
              "Origen",
              "Destino",
              "Peso",
              "Precio",
              "Ganancia",
              "Comisión",
              "Estado"
            ], servicioRows, { columnWidths: [120, 135, 100, 100, 50, 60, 75, 70, 70] });
          } else {
            agregarTexto("No hay reservaciones disponibles.");
          }
        });
      }

      doc.save(`reporte_ganancias.pdf`);
    } catch (err) {
      console.error("Error generando PDF:", err);
      alert("No se pudo generar el PDF.");
    }
  };

  const generarPDFClientes = () => {
    try {
      const title = `Historial de Clientes - ${perfil?.email || ""}`;
      const { doc, agregarTexto, dibujarTabla, dibujarTarjetasResumen } = crearDocumentoPdf(title);

      agregarTexto(`Generado: ${new Date().toLocaleString()}`, { fontSize: 10, lineHeight: 16 });
      agregarTexto(" ");

      // Calculate stats
      const totalClientes = historialClientes.length;
      const totalServicios = historialClientes.reduce((acc, c) => acc + parseInt(c.total_reservaciones || 0), 0);
      const clienteFrecuente = totalClientes > 0 ? `${historialClientes[0].nombre} ${historialClientes[0].apellido}` : "N/A";

      dibujarTarjetasResumen([
        { titulo: "Total de Clientes", valor: String(totalClientes) },
        { titulo: "Servicios Brindados", valor: String(totalServicios) },
        { titulo: "Cliente Frecuente", valor: clienteFrecuente }
      ]);

      agregarTexto("Detalle de Clientes", { fontSize: 12, lineHeight: 16 });

      const rows = historialClientes.map((c) => [
        `${c.nombre || ""} ${c.apellido || ""}`,
        c.email || "",
        c.telefono || "",
        c.total_reservaciones || "0",
        `Q${parseFloat(c.total_gastado || 0).toFixed(2)}`,
        c.ultima_reservacion ? new Date(c.ultima_reservacion).toLocaleDateString() : "N/A"
      ]);

      dibujarTabla([
        "Cliente",
        "Correo Electrónico",
        "Teléfono",
        "Servicios",
        "Total Invertido",
        "Último Servicio"
      ], rows, { columnWidths: [160, 200, 100, 100, 110, 110] });

      doc.save(`historial_clientes.pdf`);
    } catch (err) {
      console.error("Error generando PDF clientes:", err);
      alert("No se pudo generar el PDF.");
    }
  };

  const generarPDFCalificaciones = () => {
    try {
      const title = `Reporte de Calificaciones - ${perfil?.email || ""}`;
      const { doc, agregarTexto, dibujarTabla, dibujarTarjetasResumen } = crearDocumentoPdf(title);

      agregarTexto(`Generado: ${new Date().toLocaleString()}`, { fontSize: 10, lineHeight: 16 });
      agregarTexto(" ");

      // Calculate stats
      const totalReseñas = reporteCalificaciones.length;
      const promedioReseñas = totalReseñas > 0
        ? (reporteCalificaciones.reduce((acc, c) => acc + c.puntuacion, 0) / totalReseñas).toFixed(1)
        : "0.0";
      const reseñas5Estrellas = reporteCalificaciones.filter(c => c.puntuacion === 5).length;

      dibujarTarjetasResumen([
        { titulo: "Total de Reseñas", valor: String(totalReseñas) },
        { titulo: "Promedio General", valor: `${promedioReseñas} / 5.0` },
        { titulo: "Reseñas 5 Estrellas", valor: String(reseñas5Estrellas) }
      ]);

      agregarTexto("Detalle de Calificaciones", { fontSize: 12, lineHeight: 16 });

      const rows = reporteCalificaciones.map((c) => [
        `${c.cliente_nombre || ""} ${c.cliente_apellido || ""}`,
        c.nombre_servicio || "",
        c.fecha ? new Date(c.fecha).toLocaleDateString() : "N/A",
        <div style={{ display: "flex", gap: "2px" }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            style={{
              fontSize: "20px", 
              color: star <= c.puntuacion ? "#F59E0B" : "#E2E8F0", 
              lineHeight: "1"
            }}
          >
            ★
          </span>
        ))}
      </div>,
        c.comentario || "Sin comentario"
      ]);

      dibujarTabla([
        "Cliente",
        "Servicio",
        "Fecha",
        "Calificación",
        "Comentario"
      ], rows, { columnWidths: [135, 145, 90, 90, 320] });

      doc.save(`reporte_calificaciones.pdf`);
    } catch (err) {
      console.error("Error generando PDF calificaciones:", err);
      alert("No se pudo generar el PDF.");
    }
  };

  const cargarReporteServicioDetalle = async (servicioId) => {
    try {
      const respuesta = await fetch(`http://localhost:3000/api/operador/reportes/servicio/${servicioId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await respuesta.json();
      if (!respuesta.ok || !data.success) {
        throw new Error(data.message || 'No se pudo obtener el detalle del servicio.');
      }
      return data.data;
    } catch (error) {
      console.error('Error cargando reporte por servicio:', error);
      Swal.fire({
        title: 'Error',
        text: error.message || 'No se pudo cargar el reporte por servicio.',
        icon: 'error'
      });
      return null;
    }
  };

  const generarPDFServicio = async (servicioId) => {
    const servicio = await cargarReporteServicioDetalle(servicioId);
    if (!servicio) return;

    try {
      const title = `Reporte Detallado - ${servicio.nombre_servicio || ''}`;
      const nombreLimpio = (servicio.nombre_servicio || "servicio").toLowerCase().replace(/[^a-z0-9]/g, "_");
      const pdfName = `reporte_servicio_${nombreLimpio}.pdf`;
      const { doc, agregarTexto, dibujarTabla } = crearDocumentoPdf(title);

      agregarTexto(`Generado: ${new Date().toLocaleString()}`, { fontSize: 10, lineHeight: 16 });
      agregarTexto(' ');
      agregarTexto(`Servicio: ${servicio.nombre_servicio || ''}`, { fontSize: 12, fontWeight: "bold", lineHeight: 18 });
      agregarTexto(`Descripción: ${servicio.descripcion || 'N/A'}`);
      agregarTexto(' ');

      dibujarTabla([
        "Zona Cobertura",
        "Estado",
        "Horario Disponible",
        "Capacidad de Carga",
        "Precio por Envío"
      ], [
        [
          servicio.zona_cobertura || 'N/A',
          servicio.estado || 'N/A',
          servicio.horario_disponible || 'N/A',
          `${parseFloat(servicio.capacidad_carga_kg || 0).toFixed(2)} kg`,
          `Q${parseFloat(servicio.precio_envio || 0).toFixed(2)}`
        ]
      ], { columnWidths: [155, 100, 220, 155, 150] });

      agregarTexto(' ');
      agregarTexto('Reservaciones del servicio', { fontSize: 12, lineHeight: 18 });

      const rows = (servicio.reservaciones || []).map((r) => [
        `${r.cliente_nombre || ''} ${r.cliente_apellido || ''}`,
        `${r.fecha_inicio || ''}${r.fecha_fin ? ` - ${r.fecha_fin}` : ''}`,
        r.direccion_origen || '',
        r.direccion_destino || '',
        `${parseFloat(r.peso_paquete_kg || 0).toFixed(2)} kg`,
        `Q${parseFloat(r.precio_total || 0).toFixed(2)}`,
        `Q${parseFloat(r.ganancia_proveedor || 0).toFixed(2)}`,
        `Q${parseFloat(r.comision_plataforma || 0).toFixed(2)}`,
        r.estado_reservacion || ''
      ]);

      if (rows.length > 0) {
        dibujarTabla([
          'Cliente',
          'Fecha',
          'Origen',
          'Destino',
          'Peso',
          'Precio',
          'Ganancia',
          'Comisión',
          'Estado'
        ], rows, {
          columnWidths: [120, 135, 100, 100, 50, 60, 75, 70, 70]
        });
      } else {
        agregarTexto('No hay reservaciones para este servicio.');
      }

      doc.save(pdfName);
    } catch (err) {
      console.error('Error generando PDF por servicio:', err);
      alert('No se pudo generar el PDF por servicio.');
    }
  };


  const solicitarCambioPerfil = async () => {
    if (!formPerfil.nombre || !formPerfil.apellido || !formPerfil.telefono || !formPerfil.zona_operacion || !formPerfil.genero) {
      setMensajePerfil("Todos los campos obligatorios son requeridos.");
      return;
    }
    try {
      const respuesta = await fetch("http://localhost:3000/api/operador/perfil/solicitar-cambio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formPerfil)
      });
      const data = await respuesta.json();
      setMensajePerfil(data.message);
      if (data.success) {
        cargarSolicitudesCambio();
      }
    } catch (error) {
      setMensajePerfil("Error al enviar la solicitud.");
    }
  };

  const convertirHora24 = (hora12) => {
    if (!hora12) return "";
    const [time, ampm] = hora12.trim().split(" ");
    if (!time || !ampm) return "";
    let [horasStr, minutosStr] = time.split(":");
    let horas = parseInt(horasStr);
    if (ampm.toLowerCase() === "pm" && horas < 12) {
      horas += 12;
    }
    if (ampm.toLowerCase() === "am" && horas === 12) {
      horas = 0;
    }
    const horasStrPad = horas.toString().padStart(2, "0");
    const minutosStrPad = minutosStr.padStart(2, "0");
    return `${horasStrPad}:${minutosStrPad}`;
  };

  const limpiarFormulario = () => {
    setEditandoId(null);
    setNombreServicio("");
    setDescripcion("");
    setZonaCobertura("");
    setCapacidadCarga("");
    setPrecioEnvio("");
    setDiasSeleccionados([]);
    setHoraInicio("");
    setHoraFin("");
  };

  const iniciarEdicion = (serv) => {
    setError("");
    setExito("");
    setEditandoId(serv.id);
    setNombreServicio(serv.nombre_servicio);
    setDescripcion(serv.descripcion || "");
    setZonaCobertura(serv.zona_cobertura);
    setCapacidadCarga(serv.capacidad_carga_kg.toString());
    setPrecioEnvio(serv.precio_envio.toString());

    try {
      if (serv.horario_disponible && serv.horario_disponible.includes(" de ") && serv.horario_disponible.includes(" a ")) {
        const [diasPart, horasPart] = serv.horario_disponible.split(" de ");
        const dias = diasPart.split(", ").map(d => d.trim());
        const [hInicio12, hFin12] = horasPart.split(" a ");
        
        setDiasSeleccionados(dias);
        setHoraInicio(convertirHora24(hInicio12));
        setHoraFin(convertirHora24(hFin12));
      } else {
        setDiasSeleccionados([]);
        setHoraInicio("");
        setHoraFin("");
      }
    } catch (e) {
      setDiasSeleccionados([]);
      setHoraInicio("");
      setHoraFin("");
    }
  };

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
    if (vista === "inicio") {
      cargarPerfil();
      cargarServicios();
      cargarCalificaciones();
      cargarReporteGananciasOperador();
    } else if (vista === "servicios") {
      cargarServicios();
    } else if (vista === "calendario") {
      cargarCalendario();
    } else if (vista === "calificaciones") {
      cargarReportes();
    } else if (vista === "cupones") {
      // Cargado por CuponesOperador
    } else if (vista === "perfil") {
      cargarPerfil();
      cargarSolicitudesCambio();
    } else if (vista === "reportes") {
      cargarPerfil();
      if (pestañaReporte === "ganancias") {
        cargarReporteGananciasOperador();
      } else if (pestañaReporte === "clientes") {
        cargarHistorialClientes();
      } else if (pestañaReporte === "calificaciones") {
        cargarReporteCalificaciones();
      }
    }
  }, [vista, mesCalendario, servicioCalendario, pestañaReporte]);

  const manejarRegistroServicio = async (e) => {
    e.preventDefault();
    setError("");
    setExito("");

    if (diasSeleccionados.length === 0) {
      setError("Debes seleccionar al menos un día de la semana.");
      return;
    }

    if (!horaInicio || !horaFin) {
      setError("Debes ingresar la hora de inicio y de fin.");
      return;
    }

    const diasStr = diasSeleccionados.join(", ");
    const horaInicio12 = formatearHora12(horaInicio);
    const horaFin12 = formatearHora12(horaFin);
    const horarioDisponible = `${diasStr} de ${horaInicio12} a ${horaFin12}`;

    setCargando(true);
    try {
      if (editandoId) {
        const payload = {
          nombre_servicio: nombreServicio,
          descripcion,
          zona_cobertura: zonaCobertura,
          capacidad_carga_kg: parseFloat(capacidadCarga),
          precio_envio: parseFloat(precioEnvio),
          horario_disponible: horarioDisponible
        };

        const respuesta = await fetch(`http://localhost:3000/api/operador/servicios/${editandoId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        const data = await respuesta.json();
        if (respuesta.ok) {
          setExito("Servicio modificado exitosamente.");
          limpiarFormulario();
          cargarServicios();
        } else {
          setError(data.message || "Error al modificar el servicio.");
        }
      } else {
        const formData = new FormData();
        formData.append("nombre_servicio", nombreServicio);
        formData.append("zona_cobertura", zonaCobertura);
        formData.append("capacidad_carga_kg", capacidadCarga);
        formData.append("precio_envio", precioEnvio);
        formData.append("descripcion", descripcion);
        formData.append("horario_disponible", horarioDisponible);

        const inputFotos = e.target.fotos;
        if (inputFotos.files.length < 3) {
          setError("Debes seleccionar al menos 3 fotografias.");
          setCargando(false);
          return;
        }

        for (let i = 0; i < inputFotos.files.length; i++) {
          formData.append("fotos", inputFotos.files[i]);
        }

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
          limpiarFormulario();
          e.target.reset();
          cargarServicios();
        } else {
          setError(data.message || "Error al registrar el servicio.");
        }
      }
    } catch (err) {
      setError("Error al conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  };

  const manejarEliminarServicio = async (servicioId) => {
    const confirmacion = await Swal.fire({
      title: "¿Estás seguro?",
      text: "No podrás revertir esto. Si el servicio tiene reservaciones pasadas se desactivará, si no, se borrará permanentemente.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#64748B",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar"
    });

    if (!confirmacion.isConfirmed) {
      return;
    }

    setCargando(true);
    setError("");
    setExito("");
    try {
      const respuesta = await fetch(`http://localhost:3000/api/operador/servicios/${servicioId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await respuesta.json();
      if (respuesta.ok) {
        setExito("Servicio eliminado exitosamente.");
        cargarServicios();
        if (editandoId === servicioId) {
          limpiarFormulario();
        }
      } else {
        setError(data.message || "Error al eliminar el servicio.");
        Swal.fire({
          title: "Error",
          text: data.message || "No se pudo eliminar el servicio.",
          icon: "error"
        });
      }
    } catch (err) {
      setError("Error al conectar con el servidor.");
      Swal.fire({
        title: "Error",
        text: "Error al conectar con el servidor.",
        icon: "error"
      });
    } finally {
      setCargando(false);
    }
  };

  const manejarCambioEstadoServicio = async (servicioId, estadoActual) => {
    const esSuspender = estadoActual === "activo";

    let motivo = "";
    if (esSuspender) {
      const { value: text, isDismissed } = await Swal.fire({
        title: "Suspender servicio",
        input: "textarea",
        inputLabel: "Escribe el motivo de la suspensión (obligatorio)",
        inputPlaceholder: "Ej. Mantenimiento del vehículo, vacaciones...",
        showCancelButton: true,
        confirmButtonColor: "#F59E0B",
        cancelButtonColor: "#64748B",
        confirmButtonText: "Suspender",
        cancelButtonText: "Cancelar",
        inputValidator: (value) => {
          if (!value || !value.trim()) {
            return "Debes escribir un motivo para suspender el servicio.";
          }
        }
      });

      if (isDismissed || !text) {
        return;
      }
      motivo = text;
    } else {
      const confirmacion = await Swal.fire({
        title: "¿Reactivar servicio?",
        text: "El servicio volverá a estar visible para los clientes.",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#10B981",
        cancelButtonColor: "#64748B",
        confirmButtonText: "Sí, reactivar",
        cancelButtonText: "Cancelar"
      });

      if (!confirmacion.isConfirmed) {
        return;
      }
    }

    setCargando(true);
    setError("");
    setExito("");
    try {
      const respuesta = await fetch(`http://localhost:3000/api/operador/servicios/${servicioId}/estado`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          estado: esSuspender ? "suspendido" : "activo",
          motivo: esSuspender ? motivo : undefined
        })
      });

      const data = await respuesta.json();
      if (respuesta.ok) {
        setExito(`Servicio ${esSuspender ? "suspendido" : "activado"} exitosamente.`);
        cargarServicios();
        if (editandoId === servicioId) {
          limpiarFormulario();
        }
      } else {
        setError(data.message || "Error al cambiar el estado del servicio.");
        Swal.fire({
          title: "Error",
          text: data.message || "No se pudo cambiar el estado del servicio.",
          icon: "error"
        });
      }
    } catch (err) {
      setError("Error al conectar con el servidor.");
      Swal.fire({
        title: "Error",
        text: "Error al conectar con el servidor.",
        icon: "error"
      });
    } finally {
      setCargando(false);
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("rol");
    navigate("/");
  };

  const celdasCalendario = obtenerCeldasMes(mesCalendario);
  const eventosCalendario = agruparEnviosPorDia(reservacionesCalendario, mesCalendario);
  const enviosDiaSeleccionado = diaSeleccionado ? eventosCalendario[diaSeleccionado] || [] : [];
  const nombreMesCalendario = new Intl.DateTimeFormat("es-GT", {
    month: "long",
    year: "numeric"
  }).format(mesCalendario);
  const tituloDiaSeleccionado = diaSeleccionado
    ? new Intl.DateTimeFormat("es-GT", {
      weekday: "long",
      day: "numeric",
      month: "long"
    }).format(fechaDesdeClave(diaSeleccionado))
    : "Selecciona un dia";

  const etiquetaEvento = {
    recoleccion: "Recoleccion",
    entrega: "Entrega",
    en_curso: "En curso",
    recoleccion_entrega: "Recoleccion y entrega"
  };

  const totalReseñas = reporteCalificaciones.length;
  const promedioReseñas = totalReseñas > 0
    ? (reporteCalificaciones.reduce((acc, c) => acc + c.puntuacion, 0) / totalReseñas).toFixed(1)
    : "0.0";
  const reseñas5Estrellas = reporteCalificaciones.filter(c => c.puntuacion === 5).length;

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
                  Reportes Recibidos
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
                      <h3 className="fw-bold text-primary">
                        Q{(reporteGananciasOperador?.totales?.ganancias_operador || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </h3>
                      <span className="text-muted">Mis Ganancias (80%)</span>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="p-3 border rounded bg-light">
                      <h3 className="fw-bold text-success">
                        {servicios.filter(s => s.estado === "activo").length}
                      </h3>
                      <span className="text-muted">Servicios Activos</span>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="p-3 border rounded bg-light">
                      <h3 className="fw-bold text-warning">
                        {resumenCalificaciones?.total > 0 ? `${resumenCalificaciones.promedio.toFixed(1)} / 5` : "0.0 / 5"}
                      </h3>
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
                <h2 className="dashboard-card-title">
                  {editandoId ? "Editar Servicio" : "Crear Nuevo Servicio"}
                </h2>
                
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
                      value={nombreServicio}
                      onChange={(e) => setNombreServicio(e.target.value)}
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
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Zona de Cobertura</label>
                    <input
                      type="text"
                      name="zona_cobertura"
                      className="form-control"
                      placeholder="Ej. Zona 10, 15, 16"
                      value={zonaCobertura}
                      onChange={(e) => setZonaCobertura(e.target.value)}
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
                        value={capacidadCarga}
                        onChange={(e) => setCapacidadCarga(e.target.value)}
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
                        value={precioEnvio}
                        onChange={(e) => setPrecioEnvio(e.target.value)}
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
                                checked={diasSeleccionados.includes(dia)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setDiasSeleccionados([...diasSeleccionados, dia]);
                                  } else {
                                    setDiasSeleccionados(diasSeleccionados.filter(d => d !== dia));
                                  }
                                }}
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
                            value={horaInicio}
                            onChange={(e) => setHoraInicio(e.target.value)}
                            required
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label text-muted" style={{ fontSize: "12px" }}>Hora Fin (Hasta)</label>
                          <input
                            type="time"
                            name="horario_hora_fin"
                            className="form-control"
                            value={horaFin}
                            onChange={(e) => setHoraFin(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  {!editandoId && (
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
                  )}
                  <button type="submit" className="btn btn-primary w-100" disabled={cargando}>
                    {cargando ? (editandoId ? "Guardando..." : "Publicando...") : (editandoId ? "Guardar Cambios" : "Publicar Servicio")}
                  </button>
                  {editandoId && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary w-100 mt-2"
                      onClick={limpiarFormulario}
                      disabled={cargando}
                    >
                      Cancelar Edición
                    </button>
                  )}
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
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => iniciarEdicion(serv)}
                          >
                            Editar
                          </button>
                          <button
                            className={`btn btn-sm ${serv.estado === "activo" ? "btn-outline-warning" : "btn-outline-success"}`}
                            onClick={() => manejarCambioEstadoServicio(serv.id, serv.estado)}
                            disabled={cargando}
                          >
                            {serv.estado === "activo" ? "Suspender temporalmente" : "Reactivar"}
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => manejarEliminarServicio(serv.id)}
                            disabled={cargando}
                          >
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
                <div className="calendar-header">
                  <div>
                    <h2 className="dashboard-card-title mb-1">Calendario de envios programados</h2>
                    <p className="text-muted mb-0">Consulta las recolecciones, envios en curso y entregas de todos tus servicios.</p>
                  </div>
                  <div className="calendar-filter">
                    <label htmlFor="servicio-calendario">Vista por servicio</label>
                    <select
                      id="servicio-calendario"
                      className="form-select form-select-sm"
                      value={servicioCalendario}
                      onChange={(evento) => setServicioCalendario(evento.target.value)}
                    >
                      <option value="">Todos mis servicios</option>
                      {serviciosCalendario.map((servicio) => (
                        <option value={servicio.id} key={servicio.id}>{servicio.nombre_servicio}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {errorCalendario && <div className="alert alert-danger mt-3" role="alert">{errorCalendario}</div>}

                <div className="calendar-toolbar">
                  <button type="button" className="calendar-nav-button" onClick={() => cambiarMesCalendario(-1)} aria-label="Mes anterior">‹</button>
                  <h3>{nombreMesCalendario}</h3>
                  <button type="button" className="calendar-nav-button" onClick={() => cambiarMesCalendario(1)} aria-label="Mes siguiente">›</button>
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm calendar-today-button"
                    onClick={() => {
                      const hoy = new Date();
                      setMesCalendario(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
                      setDiaSeleccionado(claveFechaLocal(hoy));
                    }}
                  >
                    Hoy
                  </button>
                </div>

                <div className={`calendar-month ${cargandoCalendario ? "calendar-loading" : ""}`}>
                  {["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"].map((dia) => (
                    <div className="calendar-weekday" key={dia}>{dia}</div>
                  ))}

                  {celdasCalendario.map((fecha, indice) => {
                    if (!fecha) return <div className="calendar-day calendar-day-empty" key={`vacio-${indice}`} />;

                    const clave = claveFechaLocal(fecha);
                    const eventos = eventosCalendario[clave] || [];
                    const esHoy = clave === claveFechaLocal(new Date());
                    const estaSeleccionado = clave === diaSeleccionado;

                    return (
                      <button
                        type="button"
                        className={`calendar-day ${esHoy ? "is-today" : ""} ${estaSeleccionado ? "is-selected" : ""}`}
                        key={clave}
                        onClick={() => setDiaSeleccionado(clave)}
                      >
                        <span className="calendar-day-number">{fecha.getDate()}</span>
                        <span className="calendar-events">
                          {eventos.slice(0, 3).map((evento) => (
                            <span className={`calendar-event event-${evento.tipo_evento}`} key={`${evento.id}-${evento.tipo_evento}`}>
                              <b>{etiquetaEvento[evento.tipo_evento]}</b>
                              <span>{evento.nombre_servicio}</span>
                            </span>
                          ))}
                          {eventos.length > 3 && <span className="calendar-more">+{eventos.length - 3} mas</span>}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="calendar-legend">
                  <span><i className="legend-pickup" /> Recoleccion</span>
                  <span><i className="legend-progress" /> En curso</span>
                  <span><i className="legend-delivery" /> Entrega</span>
                </div>

                <section className="calendar-day-detail">
                  <div className="calendar-day-detail-header">
                    <div>
                      <span>Agenda del dia</span>
                      <h3>{tituloDiaSeleccionado}</h3>
                    </div>
                    <strong>{enviosDiaSeleccionado.length} {enviosDiaSeleccionado.length === 1 ? "envio" : "envios"}</strong>
                  </div>

                  {cargandoCalendario ? (
                    <div className="rating-empty-state">Cargando agenda...</div>
                  ) : enviosDiaSeleccionado.length === 0 ? (
                    <div className="rating-empty-state">No hay envios programados para este dia.</div>
                  ) : (
                    <div className="calendar-detail-list">
                      {enviosDiaSeleccionado.map((envio) => (
                        <article className="calendar-shipment-card" key={`${envio.id}-${envio.tipo_evento}`}>
                          <div className="calendar-shipment-top">
                            <div>
                              <span className={`shipment-type event-${envio.tipo_evento}`}>{etiquetaEvento[envio.tipo_evento]}</span>
                              <h4>{envio.nombre_servicio}</h4>
                            </div>
                            <span className={`shipment-status status-${envio.estado}`}>{envio.estado.replace("_", " ")}</span>
                          </div>
                          <div className="calendar-shipment-grid">
                            <p><b>Cliente</b><span>{envio.cliente}</span></p>
                            <p><b>Telefono</b><span>{envio.cliente_telefono}</span></p>
                            <p><b>Origen</b><span>{envio.direccion_origen || "Sin especificar"}</span></p>
                            <p><b>Destino</b><span>{envio.direccion_destino || "Sin especificar"}</span></p>
                            <p><b>Paquete</b><span>{envio.descripcion_paquete || "Sin descripcion"}</span></p>
                            <p><b>Peso</b><span>{envio.peso_paquete_kg === null ? "Sin especificar" : `${envio.peso_paquete_kg} kg`}</span></p>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </div>
          </div>
        )}

        {vista === "calificaciones" && (
          <div className="row">
            <div className="col-12">
              <div className="dashboard-card-custom">
                <h2 className="dashboard-card-title">Reportes Recibidos de Clientes</h2>
                <p style={{ fontSize: "13px", color: "var(--color-texto-mutado)", marginBottom: "20px" }}>
                  Gestiona las quejas y anomalías reportadas por tus clientes sobre los servicios de envío.
                </p>
                
                {cargandoReportes ? (
                  <div className="text-center py-5">
                    <p style={{ color: "var(--color-texto-mutado)" }}>Cargando reportes...</p>
                  </div>
                ) : reportes.length === 0 ? (
                  <div className="text-center py-5">
                    <p style={{ color: "var(--color-texto-mutado)" }}>No hay reportes recibidos.</p>
                  </div>
                ) : (
                  reportes.map((r) => (
                    <div key={r.id} className="p-3 mb-3 rounded" style={{ border: "1px solid #E2E8F0" }}>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <p style={{ fontSize: "12px", color: "var(--color-texto-mutado)", marginBottom: "2px", textTransform: "uppercase", fontWeight: "700" }}>
                            Cliente: <strong>{r.cliente_email}</strong>
                          </p>
                          
                          
                          <p style={{ fontSize: "12px", color: "#64748B", marginBottom: "8px", textTransform: "uppercase", fontWeight: "600" }}>
                            Servicio implicado: <span style={{ color: "#0284C7" }}>
                              {r.tipo_servicio === 'envio' ? r.nombre_envio : r.nombre_transporte}
                            </span>
                            <span className="ms-3">
                              Fecha: <span style={{ color: "#0F172A" }}>
                                {r.fecha_servicio ? new Date(r.fecha_servicio).toLocaleDateString('es-GT', { timeZone: 'UTC' }) : 'N/A'}
                              </span>
                            </span>
                            <span className="ms-3">
                              Monto: <span style={{ color: "#0F172A" }}>Q{r.precio_total || '0.00'}</span>
                            </span>
                          </p>
                          

                          <h5 className="fw-bold mb-0" style={{ color: "var(--color-secundario)", fontSize: "16px" }}>{r.motivo}</h5>
                        </div>
                        <span style={{
                          fontSize: "11px", fontWeight: "700", textTransform: "uppercase",
                          padding: "4px 10px", borderRadius: "20px",
                          backgroundColor: r.estado === "enviado" ? "#DBEAFE" : r.estado === "en_revision" ? "#FEF9C3" : r.estado === "aceptado" ? "#DCFCE7" : "#FEE2E2",
                          color: r.estado === "enviado" ? "#1D4ED8" : r.estado === "en_revision" ? "#854D0E" : r.estado === "aceptado" ? "#166534" : "#991B1B"
                        }}>
                          {r.estado ? r.estado.replace("_", " ") : "ENVIADO"}
                        </span>
                      </div>
                      
                      <div style={{ backgroundColor: "#F8FAFC", padding: "12px", borderRadius: "6px", border: "1px solid #E2E8F0", marginTop: "12px", marginBottom: "12px" }}>
                        <p style={{ fontSize: "13px", color: "var(--color-secundario)", margin: 0, fontStyle: "italic" }}>"{r.descripcion}"</p>
                      </div>

                      <div className="d-flex justify-content-between align-items-center mt-2">
                        <small style={{ color: "var(--color-texto-mutado)", fontSize: "12px" }}>
                          Fecha: {r.fecha_creacion ? new Date(r.fecha_creacion).toLocaleDateString('es-GT', { timeZone: 'UTC' }) : 'Fecha no disponible'}
                        </small>
                        {r.evidencia && (
                          <a href={`http://localhost:3000${r.evidencia}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", color: "#2563EB", textDecoration: "underline", fontWeight: "600" }}>
                            Ver evidencia adjunta
                          </a>
                        )}
                      </div>

                    
                      <div className="d-flex gap-2 mt-3 pt-2" style={{ borderTop: "1px dashed #E2E8F0" }}>
                        {r.estado === 'enviado' && (
                          <button
                            className="btn btn-sm"
                            style={{ backgroundColor: "#FEF9C3", color: "#854D0E", border: "1px solid #FDE047", fontWeight: "600" }}
                            onClick={() => cambiarEstadoReporte(r.id, "en_revision")}
                          >
                            Poner en Estudio
                          </button>
                        )}
                        {(r.estado === 'enviado' || r.estado === 'en_revision') && (
                          <>
                            <button
                              className="btn btn-sm"
                              style={{ backgroundColor: "#DCFCE7", color: "#166534", border: "1px solid #BBF7D0", fontWeight: "600" }}
                              onClick={() => cambiarEstadoReporte(r.id, "aceptado")}
                            >
                              Aceptar
                            </button>
                            <button
                              className="btn btn-sm"
                              style={{ backgroundColor: "#FEE2E2", color: "#991B1B", border: "1px solid #FECACA", fontWeight: "600" }}
                              onClick={() => cambiarEstadoReporte(r.id, "rechazado")}
                            >
                              Rechazar
                            </button>

                            <button 
                              className="btn btn-sm ms-2" 
                              style={{ backgroundColor: "#BAE6FD", color: "#0369A1", fontWeight: "600", border: "none" }}
                              onClick={() => {
                                setReporteAResponder(reporteAResponder === r.id ? null : r.id);
                                setTextoRespuesta(r.respuesta_empresa || ''); 
                              }}
                            >
                              Responder
                            </button>
                          </>
                        )}
                      </div> 

                      {reporteAResponder === r.id && (
                        <div className="mt-3 p-3 rounded w-100" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                          <p style={{ fontSize: "12px", fontWeight: "bold", color: "#475569", marginBottom: "8px" }}>Tu respuesta al cliente:</p>
                          <textarea 
                            className="form-control mb-2" 
                            rows="2" 
                            style={{ fontSize: "13px", resize: "none" }}
                            placeholder="Escribe los detalles de la resolución aquí..."
                            value={textoRespuesta}
                            onChange={(e) => setTextoRespuesta(e.target.value)}
                          ></textarea>
                          <div className="text-end">
                            <button 
                              className="btn btn-sm" 
                              style={{ backgroundColor: "#0284C7", color: "white", fontSize: "12px" }}
                              onClick={() => enviarRespuestaReporte(r.id)}
                            >
                              Enviar Respuesta
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {vista === "reportes" && (
          <div className="row">
            <div className="col-12 mb-4">
              
              {/* === NAVEGACIÓN POR PESTAÑAS === */}
              <ul className="nav nav-pills mb-4 p-2 bg-white border shadow-sm rounded gap-2">
                <li className="nav-item">
                  <button 
                    className={`nav-link ${pestañaReporte === "ganancias" ? "active" : ""}`} 
                    onClick={() => setPestañaReporte("ganancias")}
                  >
                    Reporte de Ganancias
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${pestañaReporte === "clientes" ? "active" : ""}`} 
                    onClick={() => setPestañaReporte("clientes")}
                  >
                    Historial de Clientes
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${pestañaReporte === "calificaciones" ? "active" : ""}`} 
                    onClick={() => setPestañaReporte("calificaciones")}
                  >
                    Reporte de Calificaciones
                  </button>
                </li>
              </ul>

              {/* PESTAÑA 1: REPORTE DE GANANCIAS */}
              {pestañaReporte === "ganancias" && (
                <div className="dashboard-card-custom">
                  <h2 className="dashboard-card-title">Reporte de Ganancias</h2>
                  <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                    <p className="text-muted mb-0">Resumen de ingresos y ganancias por servicio.</p>
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={cargarReporteGananciasOperador}
                        disabled={cargandoReporteGanancias}
                      >
                        {cargandoReporteGanancias ? "Actualizando..." : "Actualizar"}
                      </button>
                      <button className="btn btn-sm btn-outline-secondary" onClick={generarPDF}>
                        Descargar .PDF general
                      </button>
                    </div>
                  </div>
                  {errorReporteGanancias && (
                    <div className="alert alert-danger py-2">{errorReporteGanancias}</div>
                  )}
                  {cargandoReporteGanancias ? (
                    <p className="text-muted">Cargando datos...</p>
                  ) : reporteGananciasOperador.data.length === 0 ? (
                    <p className="text-muted">No hay datos de ganancias disponibles.</p>
                  ) : (
                    <>
                      <div className="row mb-3 text-center">
                        <div className="col-md-3 mb-2">
                          <div className="p-3 rounded bg-light border">
                            <div className="text-muted" style={{ fontSize: "12px" }}>Reservaciones</div>
                            <div className="fs-5 fw-bold">{reporteGananciasOperador.totales.total_reservaciones}</div>
                          </div>
                        </div>
                        <div className="col-md-3 mb-2">
                          <div className="p-3 rounded bg-light border">
                            <div className="text-muted" style={{ fontSize: "12px" }}>Ingresos</div>
                            <div className="fs-5 fw-bold">Q{reporteGananciasOperador.totales.ingresos_totales.toFixed(2)}</div>
                          </div>
                        </div>
                        <div className="col-md-3 mb-2">
                          <div className="p-3 rounded bg-light border">
                            <div className="text-muted" style={{ fontSize: "12px" }}>Ganancias</div>
                            <div className="fs-5 fw-bold">Q{reporteGananciasOperador.totales.ganancias_operador.toFixed(2)}</div>
                          </div>
                        </div>
                        <div className="col-md-3 mb-2">
                          <div className="p-3 rounded bg-light border">
                            <div className="text-muted" style={{ fontSize: "12px" }}>Comisión</div>
                            <div className="fs-5 fw-bold">Q{reporteGananciasOperador.totales.comision_plataforma.toFixed(2)}</div>
                          </div>
                        </div>
                      </div>
                      <div className="table-responsive">
                        <table className="table table-sm table-hover">
                          <thead className="table-light">
                            <tr>
                              <th>Servicio</th>
                              <th>Zona</th>
                              <th>Estado</th>
                              <th className="text-end">Reservaciones</th>
                              <th className="text-end">Ingresos</th>
                              <th className="text-end">Ganancias</th>
                              <th className="text-end">Comisión</th>
                              <th className="text-end">Exportar</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reporteGananciasOperador.data.map((serv) => (
                              <tr key={serv.id}>
                                <td>{serv.nombre_servicio}</td>
                                <td>{serv.zona_cobertura}</td>
                                <td>{serv.estado}</td>
                                <td className="text-end">{serv.total_reservaciones || 0}</td>
                                <td className="text-end">Q{parseFloat(serv.ingresos_totales || 0).toFixed(2)}</td>
                                <td className="text-end">Q{parseFloat(serv.ganancias_operador || 0).toFixed(2)}</td>
                                <td className="text-end">Q{parseFloat(serv.comision_plataforma || 0).toFixed(2)}</td>
                                <td className="text-end">
                                  <button
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={() => generarPDFServicio(serv.id)}
                                  >
                                  .PDF detallado
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* PESTAÑA 2: HISTORIAL DE CLIENTES */}
              {pestañaReporte === "clientes" && (
                <div className="dashboard-card-custom">
                  <h2 className="dashboard-card-title">Historial de Clientes</h2>
                  <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                    <p className="text-muted mb-0">Listado de personas que han utilizado tus servicios.</p>
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={cargarHistorialClientes}
                        disabled={cargandoClientes}
                      >
                        {cargandoClientes ? "Actualizando..." : "Actualizar"}
                      </button>
                      <button className="btn btn-sm btn-outline-secondary" onClick={generarPDFClientes}>
                        Descargar .PDF de Historial
                      </button>
                    </div>
                  </div>
                  {errorClientes && (
                    <div className="alert alert-danger py-2">{errorClientes}</div>
                  )}
                  {cargandoClientes ? (
                    <p className="text-muted">Cargando datos de clientes...</p>
                  ) : historialClientes.length === 0 ? (
                    <p className="text-muted">No hay clientes registrados en el historial.</p>
                  ) : (
                    <>
                      <div className="row mb-3 text-center">
                        <div className="col-md-4 mb-2">
                          <div className="p-3 rounded bg-light border">
                            <div className="text-muted" style={{ fontSize: "12px" }}>Total de Clientes</div>
                            <div className="fs-5 fw-bold">{historialClientes.length}</div>
                          </div>
                        </div>
                        <div className="col-md-4 mb-2">
                          <div className="p-3 rounded bg-light border">
                            <div className="text-muted" style={{ fontSize: "12px" }}>Servicios Brindados</div>
                            <div className="fs-5 fw-bold">
                              {historialClientes.reduce((acc, c) => acc + parseInt(c.total_reservaciones), 0)}
                            </div>
                          </div>
                        </div>
                        <div className="col-md-4 mb-2">
                          <div className="p-3 rounded bg-light border">
                            <div className="text-muted" style={{ fontSize: "12px" }}>Cliente Frecuente</div>
                            <div className="fs-5 fw-bold" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {historialClientes.length > 0 ? `${historialClientes[0].nombre} ${historialClientes[0].apellido}` : "Ninguno"}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="table-responsive">
                        <table className="table table-sm table-hover">
                          <thead className="table-light">
                            <tr>
                              <th>Cliente</th>
                              <th>Correo Electrónico</th>
                              <th>Teléfono</th>
                              <th className="text-end">Servicios Contratados</th>
                              <th className="text-end">Total Invertido</th>
                              <th className="text-end">Último Servicio</th>
                            </tr>
                          </thead>
                          <tbody>
                            {historialClientes.map((cliente) => (
                              <tr key={cliente.id}>
                                <td className="fw-semibold text-dark">{cliente.nombre} {cliente.apellido}</td>
                                <td>{cliente.email}</td>
                                <td>{cliente.telefono}</td>
                                <td className="text-end">{cliente.total_reservaciones}</td>
                                <td className="text-end fw-semibold text-success">Q{parseFloat(cliente.total_gastado || 0).toFixed(2)}</td>
                                <td className="text-end text-muted">
                                  {new Date(cliente.ultima_reservacion).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* PESTAÑA 3: REPORTE DE CALIFICACIONES */}
              {pestañaReporte === "calificaciones" && (
                <div className="dashboard-card-custom">
                  <h2 className="dashboard-card-title">Reporte de Calificaciones y Comentarios</h2>
                  <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                    <p className="text-muted mb-0">Resumen de la retroalimentación recibida por parte de tus clientes.</p>
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={cargarReporteCalificaciones}
                        disabled={cargandoCalificaciones}
                      >
                        {cargandoCalificaciones ? "Actualizando..." : "Actualizar"}
                      </button>
                      <button className="btn btn-sm btn-outline-secondary" onClick={generarPDFCalificaciones}>
                        Descargar .PDF de Calificaciones
                      </button>
                    </div>
                  </div>
                  
                  {errorCalificaciones && (
                    <div className="alert alert-danger py-2">{errorCalificaciones}</div>
                  )}
                  
                  {cargandoCalificaciones ? (
                    <p className="text-muted">Cargando reseñas...</p>
                  ) : reporteCalificaciones.length === 0 ? (
                    <p className="text-muted">No has recibido calificaciones todavía.</p>
                  ) : (
                    <>
                      {/* TARJETAS RESUMEN DE CALIFICACIONES */}
                      <div className="row mb-4 text-center">
                        <div className="col-md-4 mb-2">
                          <div className="p-3 rounded bg-light border">
                            <div className="text-muted" style={{ fontSize: "12px" }}>Total de Reseñas</div>
                            <div className="fs-5 fw-bold">{totalReseñas}</div>
                          </div>
                        </div>
                        <div className="col-md-4 mb-2">
                          <div className="p-3 rounded bg-light border">
                            <div className="text-muted" style={{ fontSize: "12px" }}>Promedio General</div>
                            <div className="fs-5 fw-bold text-warning">{promedioReseñas} / 5.0</div>
                          </div>
                        </div>
                        <div className="col-md-4 mb-2">
                          <div className="p-3 rounded bg-light border">
                            <div className="text-muted" style={{ fontSize: "12px" }}>Reseñas de 5 Estrellas</div>
                            <div className="fs-5 fw-bold text-success">{reseñas5Estrellas}</div>
                          </div>
                        </div>
                      </div>

                      {/* LISTADO DE COMENTARIOS */}
                      <div className="row">
                        {reporteCalificaciones.map((calif) => (
                          <div className="col-12 mb-3" key={calif.calificacion_id}>
                            <div className="p-3 border rounded bg-white shadow-sm">
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                  <h6 className="fw-bold mb-0 text-dark">
                                    {calif.cliente_nombre} {calif.cliente_apellido}
                                  </h6>
                                  <small className="text-muted" style={{ fontSize: "12px" }}>
                                    Servicio: {calif.nombre_servicio} | {new Date(calif.fecha).toLocaleDateString()}
                                  </small>
                                </div>
                                <div className="text-warning fs-6" title={`${calif.puntuacion} de 5 estrellas`}>
                                  <div style={{ display: "flex", gap: "2px" }}>
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <span
                                      key={star}
                                      style={{
                                        fontSize: "20px", 
                                        color: star <= calif.puntuacion ? "#F59E0B" : "#E2E8F0", 
                                        lineHeight: "1"
                                      }}
                                    >
                                      ★
                                    </span>
                                  ))}
                                </div>
                                </div>
                              </div>
                              <p className="mb-0" style={{ fontSize: "14px", color: "#334155" }}>
                                "{calif.comentario || "El cliente no dejó ningún comentario escrito."}"
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

            </div>


          </div>
        )}

        {vista === "cupones" && (
          <CuponesOperador token={token} />
        )}

        {vista === "perfil" && (
          <div className="row">
            <div className="col-md-8">
              <div className="dashboard-card-custom">
                <h2 className="dashboard-card-title">Perfil del Operador Logístico</h2>

                {perfil && (
                  <div className="row mb-4">
                    <div className="col-md-3">
                      <div className="text-center p-3 rounded bg-white border">
                        <img 
                          src={perfil.fotografia || "https://via.placeholder.com/150"} 
                          alt="Foto de perfil" 
                          className="rounded border" 
                          style={{ width: "100px", height: "100px", objectFit: "cover" }} 
                        />
                      </div>
                    </div>
                    <div className="col-md-9 row g-3">
                      <div className="col-md-6 mt-0">
                        <div className="p-3 rounded bg-light" style={{ border: "1px solid #E2E8F0" }}>
                          <p className="mb-1" style={{ fontSize: "12px", color: "var(--color-texto-mutado)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Email</p>
                          <p className="mb-0 fw-bold" style={{ color: "var(--color-secundario)", wordBreak: "break-all" }}>{perfil.email}</p>
                        </div>
                      </div>
                      <div className="col-md-6 mt-0">
                        <div className="p-3 rounded bg-light" style={{ border: "1px solid #E2E8F0" }}>
                          <p className="mb-1" style={{ fontSize: "12px", color: "var(--color-texto-mutado)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>DPI / CUI</p>
                          <p className="mb-0 fw-bold" style={{ color: "var(--color-secundario)" }}>{perfil.dpi_cui}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ height: "1px", backgroundColor: "#E2E8F0", marginBottom: "20px" }}></div>

                <p style={{ fontSize: "13px", color: "var(--color-texto-mutado)", marginBottom: "16px" }}>
                  Puedes solicitar cambios en los siguientes campos de tu perfil. El administrador revisará y resolverá tu solicitud.
                </p>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold" style={{ color: "var(--color-secundario)" }}>Nombre</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formPerfil.nombre}
                      onChange={(e) => setFormPerfil({ ...formPerfil, nombre: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold" style={{ color: "var(--color-secundario)" }}>Apellido</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formPerfil.apellido}
                      onChange={(e) => setFormPerfil({ ...formPerfil, apellido: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold" style={{ color: "var(--color-secundario)" }}>Teléfono</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formPerfil.telefono}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setFormPerfil({ ...formPerfil, telefono: val });
                      }}
                      maxLength={8}
                      placeholder="Ej. 44445555"
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold" style={{ color: "var(--color-secundario)" }}>Teléfono de Respaldo</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formPerfil.telefono_respaldo}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setFormPerfil({ ...formPerfil, telefono_respaldo: val });
                      }}
                      maxLength={8}
                      placeholder="Ej. 44445555"
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold" style={{ color: "var(--color-secundario)" }}>Zona de Operación</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formPerfil.zona_operacion}
                      onChange={(e) => setFormPerfil({ ...formPerfil, zona_operacion: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold" style={{ color: "var(--color-secundario)" }}>Género</label>
                    <select
                      className="form-select"
                      value={formPerfil.genero}
                      onChange={(e) => setFormPerfil({ ...formPerfil, genero: e.target.value })}
                      required
                    >
                      <option value="masculino">Masculino</option>
                      <option value="femenino">Femenino</option>
                      <option value="otro">Otro</option>
                      <option value="prefiero_no_decir">Prefiero no decir</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 rounded mb-3" style={{ backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE" }}>
                  <p className="mb-0" style={{ fontSize: "13px", color: "#1D4ED8" }}>
                    El DPI/CUI y el correo electrónico no pueden modificarse. Los cambios solicitados requieren aprobación del administrador.
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

                <div className="d-flex gap-2">
                  <button
                    onClick={solicitarCambioPerfil}
                    className="btn btn-primary"
                  >
                    Solicitar Cambios
                  </button>
                  <button className="btn btn-secondary" disabled>Descargar Reporte PDF Ganancias</button>
                </div>
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
                          backgroundColor: s.estado === "pendiente" ? "#FEF9C3" : s.estado === "aceptado" ? "#DCFCE7" : "#FEE2E2",
                          color: s.estado === "pendiente" ? "#854D0E" : s.estado === "aceptado" ? "#166534" : "#991B1B"
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
    </div>
  );
}

export default DashboardOperador;
