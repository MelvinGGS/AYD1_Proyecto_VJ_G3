import { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import Swal from "sweetalert2";

function EstadisticasAdmin({ token }) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(false);

  const API_URL = "http://localhost:3000/api/admin/estadisticas";

  const cargarEstadisticas = async () => {
    setCargando(true);
    try {
      const response = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const resData = await response.json();
      if (resData.success) {
        setDatos(resData.data);
      } else {
        Swal.fire("Error", resData.message || "No se pudieron cargar las estadisticas", "error");
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
      cargarEstadisticas();
    }
  }, [token]);

  const descargarPDF = (tipo, tituloDoc) => {
    if (!datos) return;

    // Crear PDF landscape idéntico al de los operadores
    const doc = new jsPDF({ orientation: 'landscape', unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 30;
    const pageBottom = pageHeight - margin;
    const maxWidth = pageWidth - margin * 2;
    let y = 40;

    // Accent banner (slate-900)
    doc.setFillColor(15, 23, 42);
    doc.rect(margin, y, maxWidth, 45, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(tituloDoc, margin + 15, y + 27);
    
    doc.setTextColor(51, 65, 85);
    doc.setFont("helvetica", "normal");
    y += 60;

    const agregarTexto = (texto, opciones = {}) => {
      const lineas = doc.splitTextToSize(texto, maxWidth);
      doc.setFont("helvetica", opciones.fontWeight || "normal");
      doc.setFontSize(opciones.fontSize || 10);
      doc.setTextColor(51, 65, 85);
      
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
        doc.setFillColor(248, 250, 252);
        doc.rect(currentX, y, widthTarjeta, heightTarjeta, "F");
        
        // Border
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(1);
        doc.rect(currentX, y, widthTarjeta, heightTarjeta, "S");

        // Title
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(tarjeta.titulo, currentX + 10, y + 16);

        // Value
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
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
        doc.setTextColor(255, 255, 255);

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
          doc.setFillColor(isEven ? 248 : 255, isEven ? 250 : 255, isEven ? 252 : 255);
          doc.rect(x, y, w, maxCellHeight, "F");
          
          // Border
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(1);
          doc.rect(x, y, w, maxCellHeight, "S");

          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(51, 65, 85);

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

      y += 15;
    };

    // Agregar fecha arriba
    agregarTexto(`Fecha de generacion: ${new Date().toLocaleString()}`, { fontSize: 9, lineHeight: 14 });
    agregarTexto(" ");

    // Llenar datos dinámicos según el tipo de reporte
    if (tipo === "logs_registros_vetos") {
      dibujarTarjetasResumen([
        { titulo: "Total Operadores Activos", valor: String((datos.usuarios_estado || []).filter((u) => u.rol === "operador" && u.estado === "activo").reduce((acc, curr) => acc + Number(curr.total), 0)) },
        { titulo: "Total Empresas Activas", valor: String((datos.usuarios_estado || []).filter((u) => u.rol === "empresa_transporte" && u.estado === "activo").reduce((acc, curr) => acc + Number(curr.total), 0)) },
        { titulo: "Total Clientes Activos", valor: String((datos.usuarios_estado || []).filter((u) => u.rol === "cliente" && u.estado === "activo").reduce((acc, curr) => acc + Number(curr.total), 0)) },
        { titulo: "Usuarios Vetados", valor: String((datos.usuarios_estado || []).filter((u) => u.estado === "vetado").reduce((acc, curr) => acc + Number(curr.total), 0)) }
      ]);

      agregarTexto("Estado Actual de las Cuentas de Usuario", { fontSize: 11, fontWeight: "bold" });
      const h1 = ["Rol del Usuario", "Estado de la Cuenta", "Total Cuentas"];
      const r1 = datos.usuarios_estado.map((item) => [item.rol, item.estado, String(item.total)]);
      dibujarTabla(h1, r1, { columnWidths: [260, 260, 260] });
    }

    else if (tipo === "solicitudes_registro") {
      agregarTexto("Auditoria de las Solicitudes de Registro Recibidas", { fontSize: 11, fontWeight: "bold" });
      const h2 = ["Rol del Solicitante", "Estado de Solicitud", "Cantidad Total"];
      const r2 = datos.solicitudes_registro.map((item) => [item.rol, item.estado.toUpperCase(), String(item.total)]);
      dibujarTabla(h2, r2, { columnWidths: [260, 260, 260] });
    }

    else if (tipo === "zonas_envios") {
      agregarTexto("Volumen de Envios Distribuidos por Zonas de Cobertura", { fontSize: 11, fontWeight: "bold" });
      const h3 = ["Zona Geografica / Cobertura", "Cantidad Total de Envios"];
      const r3 = datos.zonas_envios.map((item) => [item.zona, String(item.total_envios)]);
      dibujarTabla(h3, r3, { columnWidths: [390, 390] });
    }

    else if (tipo === "transporte_mas_utilizados") {
      agregarTexto("Rutas de Transporte Mas Solicitadas por Clientes", { fontSize: 11, fontWeight: "bold" });
      const h4 = ["Nombre de la Ruta", "Empresa Proveedora", "Total Reservaciones"];
      const r4 = datos.transporte_mas_utilizados.map((item) => [item.nombre_ruta, item.nombre_empresa, String(item.total_reservas)]);
      dibujarTabla(h4, r4, { columnWidths: [260, 260, 260] });
    }

    else if (tipo === "ingresos_plataforma") {
      const totalIngresos = datos.ingresos_plataforma.reduce((acc, curr) => acc + Number(curr.total_ingresos), 0);
      const totalComisiones = datos.ingresos_plataforma.reduce((acc, curr) => acc + Number(curr.total_comisiones), 0);

      dibujarTarjetasResumen([
        { titulo: "Ingresos Brutos de Ventas", valor: `Q ${totalIngresos.toFixed(2)}` },
        { titulo: "Comision TrackFlow (Ganancia)", valor: `Q ${totalComisiones.toFixed(2)}` }
      ]);

      agregarTexto("Desglose Financiero por Tipo de Servicio", { fontSize: 11, fontWeight: "bold" });
      const h5 = ["Tipo de Servicio", "Ingreso Bruto de Ventas", "Comisiones TrackFlow (Ganancia)"];
      const r5 = datos.ingresos_plataforma.map((item) => [
        item.tipo_servicio === "envio" ? "Envios de Paquetes" : "Transporte Terrestre",
        `Q ${Number(item.total_ingresos).toFixed(2)}`,
        `Q ${Number(item.total_comisiones).toFixed(2)}`
      ]);
      dibujarTabla(h5, r5, { columnWidths: [260, 260, 260] });
    }

    else if (tipo === "resumen_reportes") {
      agregarTexto("Resumen de las Denuncias o Quejas Emitidas por los Usuarios", { fontSize: 11, fontWeight: "bold" });
      const h6 = ["Estado de Moderacion", "Cantidad Emitida"];
      const r6 = datos.resumen_reportes.map((item) => [item.estado.toUpperCase(), String(item.total)]);
      dibujarTabla(h6, r6, { columnWidths: [390, 390] });
    }

    else if (tipo === "mayor_gasto") {
      agregarTexto("Ranking de Clientes con Mayor Consumo en la Plataforma", { fontSize: 11, fontWeight: "bold" });
      const h7 = ["Nombre del Cliente", "Correo Electronico", "Monto Total Invertido"];
      const r7 = datos.mayor_gasto.map((item) => [
        `${item.nombre} ${item.apellido}`,
        item.email,
        `Q ${Number(item.total_gasto).toFixed(2)}`
      ]);
      dibujarTabla(h7, r7, { columnWidths: [260, 260, 260] });
    }

    else if (tipo === "envios_realizados") {
      agregarTexto("Historial Detallado de Envios Registrados", { fontSize: 11, fontWeight: "bold" });
      const h8 = ["ID Envio", "Cliente", "Operador Asignado", "Direccion de Destino", "Monto Pagado"];
      const r8 = datos.envios_realizados.map((item) => [
        item.id.substring(0, 8) + "...",
        `${item.cliente_nombre} ${item.cliente_apellido}`,
        `${item.operador_nombre} ${item.operador_apellido}`,
        item.direccion_destino,
        `Q ${Number(item.precio_total).toFixed(2)}`
      ]);
      dibujarTabla(h8, r8, { columnWidths: [100, 160, 160, 260, 100] });
    }

    else if (tipo === "transporte_realizados") {
      agregarTexto("Historial Detallado de Boletos de Transporte Terrestre", { fontSize: 11, fontWeight: "bold" });
      const h9 = ["ID Reserva", "Cliente", "Empresa Proveedora", "Nombre de Ruta", "Monto Pagado"];
      const r9 = datos.transporte_realizados.map((item) => [
        item.id.substring(0, 8) + "...",
        `${item.cliente_nombre} ${item.cliente_apellido}`,
        item.nombre_empresa,
        `${item.nombre_ruta} (${item.destino})`,
        `Q ${Number(item.precio_total).toFixed(2)}`
      ]);
      dibujarTabla(h9, r9, { columnWidths: [100, 160, 160, 260, 100] });
    }

    else if (tipo === "destinos_mas_frecuentes") {
      agregarTexto("Frecuencia de Destinos de Envio y Rutas Terrestres", { fontSize: 11, fontWeight: "bold" });
      const h10 = ["Servicio", "Direccion / Destino", "Volumen de Viajes"];
      const r10 = [];
      datos.destinos_envios.forEach((item) => {
        r10.push(["Envio de Paquetes", item.destino, String(item.total)]);
      });
      datos.destinos_transporte.forEach((item) => {
        r10.push(["Ruta de Transporte", item.destino, String(item.total)]);
      });
      dibujarTabla(h10, r10, { columnWidths: [200, 380, 200] });
    }

    else if (tipo === "uso_clientes") {
      agregarTexto("Analisis del Consumo de Servicios por Cliente", { fontSize: 11, fontWeight: "bold" });
      const h11 = ["Categoria de Uso del Cliente", "Cantidad de Clientes Registrados"];
      const u = datos.uso_clientes;
      const r11 = [
        ["Clientes que solo contratan envios de paqueteria", String(u.solo_envios)],
        ["Clientes que solo compran boletos de rutas de transporte", String(u.solo_transporte)],
        ["Clientes que consumen ambos servicios (Envíos y Rutas)", String(u.ambos_servicios)]
      ];
      dibujarTabla(h11, r11, { columnWidths: [450, 330] });
    }

    doc.save(`reporte_${tipo}_${new Date().toISOString().substring(0,10)}.pdf`);
  };

  if (cargando) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2 text-muted">Cargando estadisticas y reportes...</p>
      </div>
    );
  }

  if (!datos) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-secondary" role="status"></div>
        <p className="mt-2 text-muted">Cargando informacion de estadisticas...</p>
      </div>
    );
  }

  const totalUsuariosSancionados = (datos.usuarios_estado || [])
    .filter((u) => u.estado === "vetado" || u.estado === "suspendido")
    .reduce((acc, curr) => acc + Number(curr.total), 0);

  const totalReportesActivos = (datos.resumen_reportes || [])
    .reduce((acc, curr) => acc + Number(curr.total), 0);

  const palette = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  return (
    <div className="estadisticas-admin-container">
      <div className="admin-table-panel p-4 mb-4">
        <h4 className="mb-3 text-secondary font-weight-bold" style={{ fontSize: "1.1rem" }}>
          Descargar Reportes Oficiales en PDF (11 Disponibles)
        </h4>
        <div className="d-flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-outline-dark btn-sm"
            onClick={() => descargarPDF("logs_registros_vetos", "Logs de Registros y Vetos de Usuarios")}
            style={{ fontWeight: "700" }}
          >
            1. Logs Registros y Vetos
          </button>
          <button
            type="button"
            className="btn btn-outline-dark btn-sm"
            onClick={() => descargarPDF("solicitudes_registro", "Solicitudes de Registro Aceptadas/Rechazadas")}
            style={{ fontWeight: "700" }}
          >
            2. Aceptados/Rechazados por Tipo
          </button>
          <button
            type="button"
            className="btn btn-outline-dark btn-sm"
            onClick={() => descargarPDF("zonas_envios", "Zonas con Mayor Volumen de Envios")}
            style={{ fontWeight: "700" }}
          >
            3. Zonas con mas Envios
          </button>
          <button
            type="button"
            className="btn btn-outline-dark btn-sm"
            onClick={() => descargarPDF("transporte_mas_utilizados", "Servicios de Transporte mas Utilizados")}
            style={{ fontWeight: "700" }}
          >
            4. Rutas mas Utilizadas
          </button>
          <button
            type="button"
            className="btn btn-outline-dark btn-sm"
            onClick={() => descargarPDF("ingresos_plataforma", "Reporte de Ingresos de la Plataforma")}
            style={{ fontWeight: "700" }}
          >
            5. Ingresos Plataforma
          </button>
          <button
            type="button"
            className="btn btn-outline-dark btn-sm"
            onClick={() => descargarPDF("resumen_reportes", "Resumen de Reportes Emitidos y Estado")}
            style={{ fontWeight: "700" }}
          >
            6. Resumen de Reportes
          </button>
          <button
            type="button"
            className="btn btn-outline-dark btn-sm"
            onClick={() => descargarPDF("mayor_gasto", "Clientes con Mayor Gasto en la Plataforma")}
            style={{ fontWeight: "700" }}
          >
            7. Clientes de Mayor Gasto
          </button>
          <button
            type="button"
            className="btn btn-outline-dark btn-sm"
            onClick={() => descargarPDF("envios_realizados", "Historial de Envios de Paqueteria")}
            style={{ fontWeight: "700" }}
          >
            8. Historial de Envios
          </button>
          <button
            type="button"
            className="btn btn-outline-dark btn-sm"
            onClick={() => descargarPDF("transporte_realizados", "Historial de Boletos de Transporte")}
            style={{ fontWeight: "700" }}
          >
            9. Historial de Transporte
          </button>
          <button
            type="button"
            className="btn btn-outline-dark btn-sm"
            onClick={() => descargarPDF("destinos_mas_frecuentes", "Destinos mas Frecuentados")}
            style={{ fontWeight: "700" }}
          >
            10. Destinos Frecuentes
          </button>
          <button
            type="button"
            className="btn btn-outline-dark btn-sm"
            onClick={() => descargarPDF("uso_clientes", "Perfil de Uso de Clientes Registrados")}
            style={{ fontWeight: "700" }}
          >
            11. Uso de Clientes
          </button>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card p-3 border-0 shadow-sm text-white" style={{ background: "linear-gradient(135deg, #4f46e5, #3b82f6)", borderRadius: "10px" }}>
            <span className="d-block small text-uppercase font-weight-bold" style={{ opacity: "0.85" }}>Sancionados Totales</span>
            <span className="d-block h2 m-0 font-weight-bold mt-2">{totalUsuariosSancionados}</span>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card p-3 border-0 shadow-sm text-white" style={{ background: "linear-gradient(135deg, #10b981, #059669)", borderRadius: "10px" }}>
            <span className="d-block small text-uppercase font-weight-bold" style={{ opacity: "0.85" }}>Ingresos Totales (Comision)</span>
            <span className="d-block h2 m-0 font-weight-bold mt-2">
              Q {Number((datos.ingresos_plataforma || []).reduce((acc, curr) => acc + Number(curr.total_comisiones), 0)).toFixed(2)}
            </span>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card p-3 border-0 shadow-sm text-white" style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", borderRadius: "10px" }}>
            <span className="d-block small text-uppercase font-weight-bold" style={{ opacity: "0.85" }}>Quejas Totales Emitidas</span>
            <span className="d-block h2 m-0 font-weight-bold mt-2">{totalReportesActivos}</span>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card p-3 border-0 shadow-sm text-white" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", borderRadius: "10px" }}>
            <span className="d-block small text-uppercase font-weight-bold" style={{ opacity: "0.85" }}>Zonas de Cobertura Activas</span>
            <span className="d-block h2 m-0 font-weight-bold mt-2">{datos.zonas_envios.length}</span>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-md-6">
          <div className="admin-table-panel p-3 h-100">
            <h5 className="mb-3 text-secondary font-weight-bold" style={{ fontSize: "1rem" }}>
              Volumen de Envios por Zona
            </h5>
            {datos.zonas_envios.length === 0 ? (
              <p className="text-muted small">Sin datos de envios</p>
            ) : (
              <svg viewBox="0 0 400 240" className="w-100">
                <line x1="45" y1="10" x2="45" y2="200" stroke="#cbd5e1" strokeWidth="1.5" />
                <line x1="45" y1="200" x2="380" y2="200" stroke="#cbd5e1" strokeWidth="1.5" />
                
                {(() => {
                  const maxVal = Math.max(...datos.zonas_envios.map((z) => Number(z.total_envios)), 1);
                  return datos.zonas_envios.slice(0, 5).map((item, idx) => {
                    const barHeight = (Number(item.total_envios) / maxVal) * 160;
                    const x = 60 + idx * 60;
                    const y = 200 - barHeight;
                    return (
                      <g key={item.zona}>
                        <rect
                          x={x}
                          y={y}
                          width="35"
                          height={barHeight}
                          fill={palette[idx % palette.length]}
                          rx="4"
                        />
                        <text
                          x={x + 17}
                          y={y - 5}
                          textAnchor="middle"
                          fontSize="9"
                          fontWeight="bold"
                          fill="#334155"
                        >
                          {item.total_envios}
                        </text>
                        <text
                          x={x + 17}
                          y="215"
                          textAnchor="middle"
                          fontSize="8"
                          fontWeight="bold"
                          fill="#64748b"
                          transform={`rotate(-15, ${x + 17}, 215)`}
                        >
                          {item.zona.substring(0, 8)}
                        </text>
                      </g>
                    );
                  });
                })()}
              </svg>
            )}
          </div>
        </div>

        <div className="col-md-6">
          <div className="admin-table-panel p-3 h-100">
            <h5 className="mb-3 text-secondary font-weight-bold" style={{ fontSize: "1rem" }}>
              Ingresos por Tipo de Servicio (Quetzales)
            </h5>
            {datos.ingresos_plataforma.length === 0 ? (
              <p className="text-muted small">Sin datos de ingresos</p>
            ) : (
              <div className="d-flex align-items-center justify-content-around h-100 py-3 flex-wrap">
                <svg viewBox="0 0 160 160" style={{ width: "160px", height: "160px" }}>
                  {(() => {
                    const totalComision = datos.ingresos_plataforma.reduce((acc, curr) => acc + Number(curr.total_comisiones), 0);
                    let accAngle = 0;
                    return datos.ingresos_plataforma.map((item, idx) => {
                      if (totalComision === 0) return null;
                      const percentage = Number(item.total_comisiones) / totalComision;
                      const angle = percentage * 360;
                      
                      const getCoordinatesForPercent = (percent) => {
                        const x = Math.cos(2 * Math.PI * percent);
                        const y = Math.sin(2 * Math.PI * percent);
                        return [x, y];
                      };

                      const [startX, startY] = getCoordinatesForPercent(accAngle / 360);
                      accAngle += angle;
                      const [endX, endY] = getCoordinatesForPercent(accAngle / 360);

                      const largeArcFlag = percentage > 0.5 ? 1 : 0;
                      const pathData = [
                        `M 80 80`,
                        `L ${80 + startX * 70} ${80 + startY * 70}`,
                        `A 70 70 0 ${largeArcFlag} 1 ${80 + endX * 70} ${80 + endY * 70}`,
                        `Z`
                      ].join(" ");

                      return (
                        <path
                          key={item.tipo_servicio}
                          d={pathData}
                          fill={idx === 0 ? "#4f46e5" : "#06b6d4"}
                        />
                      );
                    });
                  })()}
                  <circle cx="80" cy="80" r="35" fill="#ffffff" />
                </svg>
                <div className="d-flex flex-column gap-2">
                  {datos.ingresos_plataforma.map((item, idx) => (
                    <div key={item.tipo_servicio} className="d-flex align-items-center gap-2">
                      <span style={{ width: "12px", height: "12px", borderRadius: "3px", background: idx === 0 ? "#4f46e5" : "#06b6d4", display: "inline-block" }}></span>
                      <span className="small font-weight-bold text-secondary text-capitalize">
                        {item.tipo_servicio === "envio" ? "Envios" : "Transporte"}: Q {Number(item.total_comisiones).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="col-md-6">
          <div className="admin-table-panel p-3 h-100">
            <h5 className="mb-3 text-secondary font-weight-bold" style={{ fontSize: "1rem" }}>
              Servicios de Transporte Mas Utilizados (Reservas)
            </h5>
            {datos.transporte_mas_utilizados.length === 0 ? (
              <p className="text-muted small">Sin datos de rutas</p>
            ) : (
              <svg viewBox="0 0 400 220" className="w-100">
                <line x1="45" y1="10" x2="45" y2="180" stroke="#cbd5e1" strokeWidth="1.5" />
                <line x1="45" y1="180" x2="380" y2="180" stroke="#cbd5e1" strokeWidth="1.5" />

                {(() => {
                  const maxVal = Math.max(...datos.transporte_mas_utilizados.map((t) => Number(t.total_reservas)), 1);
                  return datos.transporte_mas_utilizados.slice(0, 5).map((item, idx) => {
                    const barHeight = (Number(item.total_reservas) / maxVal) * 140;
                    const x = 60 + idx * 60;
                    const y = 180 - barHeight;
                    return (
                      <g key={item.nombre_ruta + idx}>
                        <rect
                          x={x}
                          y={y}
                          width="35"
                          height={barHeight}
                          fill={palette[(idx + 2) % palette.length]}
                          rx="4"
                        />
                        <text
                          x={x + 17}
                          y={y - 5}
                          textAnchor="middle"
                          fontSize="9"
                          fontWeight="bold"
                          fill="#334155"
                        >
                          {item.total_reservas}
                        </text>
                        <text
                          x={x + 17}
                          y="195"
                          textAnchor="middle"
                          fontSize="8"
                          fontWeight="bold"
                          fill="#64748b"
                          transform={`rotate(-15, ${x + 17}, 195)`}
                        >
                          {item.nombre_ruta.substring(0, 8)}
                        </text>
                      </g>
                    );
                  });
                })()}
              </svg>
            )}
          </div>
        </div>

        <div className="col-md-6">
          <div className="admin-table-panel p-3 h-100">
            <h5 className="mb-3 text-secondary font-weight-bold" style={{ fontSize: "1rem" }}>
              Uso de la Plataforma por Clientes
            </h5>
            {(() => {
              const u = datos.uso_clientes;
              const totalC = Number(u.solo_envios) + Number(u.solo_transporte) + Number(u.ambos_servicios);
              if (totalC === 0) return <p className="text-muted small">Sin datos de clientes registrados</p>;
              
              const hSoloEnvio = totalC > 0 ? (Number(u.solo_envios) / totalC) * 150 : 0;
              const hSoloTrans = totalC > 0 ? (Number(u.solo_transporte) / totalC) * 150 : 0;
              const hAmbos = totalC > 0 ? (Number(u.ambos_servicios) / totalC) * 150 : 0;

              return (
                <div className="d-flex align-items-center justify-content-around h-100 py-3 flex-wrap">
                  <svg viewBox="0 0 240 180" style={{ width: "240px" }}>
                    <rect x="20" y={170 - hSoloEnvio} width="40" height={hSoloEnvio} fill="#10b981" rx="3" />
                    <text x="40" y={165 - hSoloEnvio} textAnchor="middle" fontSize="9" fontWeight="bold">{u.solo_envios}</text>
                    <text x="40" y="180" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#64748b">Solo Envios</text>

                    <rect x="100" y={170 - hSoloTrans} width="40" height={hSoloTrans} fill="#4f46e5" rx="3" />
                    <text x="120" y={165 - hSoloTrans} textAnchor="middle" fontSize="9" fontWeight="bold">{u.solo_transporte}</text>
                    <text x="120" y="180" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#64748b">Solo Transp.</text>

                    <rect x="180" y={170 - hAmbos} width="40" height={hAmbos} fill="#f59e0b" rx="3" />
                    <text x="200" y={165 - hAmbos} textAnchor="middle" fontSize="9" fontWeight="bold">{u.ambos_servicios}</text>
                    <text x="200" y="180" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#64748b">Ambos</text>
                  </svg>
                </div>
              );
            })()}
          </div>
        </div>

        <div className="col-md-6">
          <div className="admin-table-panel p-3 h-100">
            <h5 className="mb-3 text-secondary font-weight-bold" style={{ fontSize: "1rem" }}>
              Solicitudes Aceptadas vs Rechazadas (Historico)
            </h5>
            {datos.solicitudes_registro.length === 0 ? (
              <p className="text-muted small">Sin solicitudes registradas</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm table-borderless m-0" style={{ fontSize: "0.85rem" }}>
                  <thead>
                    <tr className="border-bottom text-muted">
                      <th>Rol</th>
                      <th>Estado</th>
                      <th className="text-end">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datos.solicitudes_registro.map((s, idx) => (
                      <tr key={idx} className="border-bottom">
                        <td className="text-capitalize">{s.rol.replace("_", " ")}</td>
                        <td>
                          <span className={`badge ${s.estado === "aceptado" ? "bg-success" : s.estado === "rechazado" ? "bg-danger" : "bg-warning"}`}>
                            {s.estado.toUpperCase()}
                          </span>
                        </td>
                        <td className="text-end font-weight-bold">{s.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="col-md-6">
          <div className="admin-table-panel p-3 h-100">
            <h5 className="mb-3 text-secondary font-weight-bold" style={{ fontSize: "1rem" }}>
              Destinos Mas Frecuentes en Envios
            </h5>
            {datos.destinos_envios.length === 0 ? (
              <p className="text-muted small">Sin datos de envios</p>
            ) : (
              <svg viewBox="0 0 400 180" className="w-100">
                {(() => {
                  const maxVal = Math.max(...datos.destinos_envios.map((d) => Number(d.total)), 1);
                  return datos.destinos_envios.slice(0, 5).map((item, idx) => {
                    const barWidth = (Number(item.total) / maxVal) * 260;
                    const y = 15 + idx * 32;
                    return (
                      <g key={item.destino}>
                        <text
                          x="10"
                          y={y + 12}
                          fontSize="8"
                          fontWeight="bold"
                          fill="#334155"
                        >
                          {item.destino.substring(0, 15)}
                        </text>
                        <rect
                          x="110"
                          y={y}
                          width={barWidth}
                          height="18"
                          fill="#8b5cf6"
                          rx="3"
                        />
                        <text
                          x={115 + barWidth}
                          y={y + 12}
                          fontSize="9"
                          fontWeight="bold"
                          fill="#334155"
                        >
                          {item.total}
                        </text>
                      </g>
                    );
                  });
                })()}
              </svg>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default EstadisticasAdmin;
