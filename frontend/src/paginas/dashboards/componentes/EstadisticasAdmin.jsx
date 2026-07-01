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

  // --- PDF Generation (landscape, same style as operator reports) ---
  const crearDocumentoPdf = (titulo) => {
    const doc = new jsPDF({ orientation: 'landscape', unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = 40;
    const margin = 30;
    const pageBottom = pageHeight - margin;
    const maxWidth = pageWidth - margin * 2;

    doc.setFillColor(15, 23, 42);
    doc.rect(margin, y, maxWidth, 45, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(titulo, margin + 15, y + 27);

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
        if (y + nextLineHeight > pageBottom) { doc.addPage(); y = margin; }
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
      if (y + heightTarjeta > pageBottom) { doc.addPage(); y = margin; }
      let currentX = margin;
      tarjetas.forEach((tarjeta) => {
        doc.setFillColor(248, 250, 252);
        doc.rect(currentX, y, widthTarjeta, heightTarjeta, "F");
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(1);
        doc.rect(currentX, y, widthTarjeta, heightTarjeta, "S");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(tarjeta.titulo, currentX + 10, y + 16);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text(tarjeta.valor, currentX + 10, y + 33);
        currentX += widthTarjeta + gap;
      });
      y += heightTarjeta + 15;
    };

    const dibujarTabla = (headers, rows, options = {}) => {
      let columnWidths = options.columnWidths || headers.map(() => Math.floor(maxWidth / headers.length));
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
        const headerLineHeight = 14;
        const headerLines = columnWidths.map((w, index) => {
          return doc.splitTextToSize(String(headers[index] || ""), Math.max(w - 12, 10));
        });
        const headerHeight = Math.max(...headerLines.map((lines) => Math.max(lines.length * headerLineHeight, rowHeight)), rowHeight);
        if (y + headerHeight > pageBottom) { doc.addPage(); y = margin; }
        doc.setFillColor(30, 41, 59);
        doc.rect(x, y, tableWidth, headerHeight, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        columnWidths.forEach((w, index) => {
          const lines = headerLines[index] || [""];
          let textY = y + 13;
          lines.forEach((line) => { doc.text(String(line), x + 6, textY); textY += headerLineHeight; });
          x += w;
        });
        y += headerHeight;
      };

      drawHeader();
      const cellLineHeight = 13;
      let isEven = false;
      rows.forEach((row) => {
        const cellLines = row.map((cell, index) => {
          return doc.splitTextToSize(String(cell || ""), Math.max((columnWidths[index] || 50) - 12, 10));
        });
        const maxCellHeight = Math.max(...cellLines.map((lines) => Math.max(lines.length * cellLineHeight, rowHeight)), rowHeight);
        if (y + maxCellHeight > pageBottom) { drawHeader(); }
        let x = margin;
        columnWidths.forEach((w, index) => {
          doc.setFillColor(isEven ? 248 : 255, isEven ? 250 : 255, isEven ? 252 : 255);
          doc.rect(x, y, w, maxCellHeight, "F");
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(1);
          doc.rect(x, y, w, maxCellHeight, "S");
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(51, 65, 85);
          const lines = cellLines[index] || [""];
          let textY = y + 13;
          lines.forEach((line) => { doc.text(String(line), x + 6, textY); textY += cellLineHeight; });
          x += w;
        });
        y += maxCellHeight;
        isEven = !isEven;
      });
      y += 15;
    };

    return { doc, agregarTexto, dibujarTarjetasResumen, dibujarTabla };
  };

  const descargarPDF = (tipo, tituloDoc) => {
    if (!datos) return;
    const { doc, agregarTexto, dibujarTarjetasResumen, dibujarTabla } = crearDocumentoPdf(tituloDoc);
    agregarTexto(`Fecha de generacion: ${new Date().toLocaleString()}`, { fontSize: 9 });
    agregarTexto(" ");

    if (tipo === "logs_registros_vetos") {
      dibujarTarjetasResumen([
        { titulo: "Operadores Activos", valor: String((datos.usuarios_estado || []).filter((u) => u.rol === "operador" && u.estado === "activo").reduce((a, c) => a + Number(c.total), 0)) },
        { titulo: "Empresas Activas", valor: String((datos.usuarios_estado || []).filter((u) => u.rol === "empresa_transporte" && u.estado === "activo").reduce((a, c) => a + Number(c.total), 0)) },
        { titulo: "Clientes Activos", valor: String((datos.usuarios_estado || []).filter((u) => u.rol === "cliente" && u.estado === "activo").reduce((a, c) => a + Number(c.total), 0)) },
        { titulo: "Usuarios Vetados", valor: String((datos.usuarios_estado || []).filter((u) => u.estado === "vetado").reduce((a, c) => a + Number(c.total), 0)) }
      ]);
      agregarTexto("Estado de Cuentas de Usuario", { fontSize: 11, fontWeight: "bold" });
      dibujarTabla(["Rol", "Estado", "Total"], datos.usuarios_estado.map((i) => [i.rol, i.estado, String(i.total)]), { columnWidths: [260, 260, 260] });
    } else if (tipo === "solicitudes_registro") {
      agregarTexto("Solicitudes de Registro por Tipo y Estado", { fontSize: 11, fontWeight: "bold" });
      dibujarTabla(["Rol", "Estado", "Cantidad"], datos.solicitudes_registro.map((i) => [i.rol, i.estado.toUpperCase(), String(i.total)]), { columnWidths: [260, 260, 260] });
    } else if (tipo === "zonas_envios") {
      agregarTexto("Volumen de Envios por Zona de Cobertura", { fontSize: 11, fontWeight: "bold" });
      dibujarTabla(["Zona", "Total Envios"], datos.zonas_envios.map((i) => [i.zona, String(i.total_envios)]), { columnWidths: [390, 390] });
    } else if (tipo === "transporte_mas_utilizados") {
      agregarTexto("Rutas de Transporte Mas Solicitadas", { fontSize: 11, fontWeight: "bold" });
      dibujarTabla(["Ruta", "Empresa", "Reservas"], datos.transporte_mas_utilizados.map((i) => [i.nombre_ruta, i.nombre_empresa, String(i.total_reservas)]), { columnWidths: [260, 260, 260] });
    } else if (tipo === "ingresos_plataforma") {
      const totalIng = datos.ingresos_plataforma.reduce((a, c) => a + Number(c.total_ingresos), 0);
      const totalCom = datos.ingresos_plataforma.reduce((a, c) => a + Number(c.total_comisiones), 0);
      dibujarTarjetasResumen([
        { titulo: "Ingresos Brutos", valor: `Q ${totalIng.toFixed(2)}` },
        { titulo: "Comision TrackFlow", valor: `Q ${totalCom.toFixed(2)}` }
      ]);
      agregarTexto("Desglose por Tipo de Servicio", { fontSize: 11, fontWeight: "bold" });
      dibujarTabla(["Tipo", "Ingresos", "Comisiones"], datos.ingresos_plataforma.map((i) => [i.tipo_servicio === "envio" ? "Envios" : "Transporte", `Q ${Number(i.total_ingresos).toFixed(2)}`, `Q ${Number(i.total_comisiones).toFixed(2)}`]), { columnWidths: [260, 260, 260] });
    } else if (tipo === "resumen_reportes") {
      agregarTexto("Resumen de Quejas y Reportes Emitidos", { fontSize: 11, fontWeight: "bold" });
      dibujarTabla(["Estado", "Cantidad"], datos.resumen_reportes.map((i) => [i.estado.toUpperCase(), String(i.total)]), { columnWidths: [390, 390] });
    } else if (tipo === "mayor_gasto") {
      agregarTexto("Ranking de Clientes con Mayor Gasto", { fontSize: 11, fontWeight: "bold" });
      dibujarTabla(["Cliente", "Email", "Gasto Total"], datos.mayor_gasto.map((i) => [`${i.nombre} ${i.apellido}`, i.email, `Q ${Number(i.total_gasto).toFixed(2)}`]), { columnWidths: [260, 260, 260] });
    } else if (tipo === "envios_realizados") {
      agregarTexto("Historial de Envios Realizados", { fontSize: 11, fontWeight: "bold" });
      dibujarTabla(["ID", "Cliente", "Operador", "Destino", "Monto"], datos.envios_realizados.map((i) => [i.id.substring(0, 8) + "...", `${i.cliente_nombre} ${i.cliente_apellido}`, `${i.operador_nombre} ${i.operador_apellido}`, i.direccion_destino, `Q ${Number(i.precio_total).toFixed(2)}`]), { columnWidths: [100, 160, 160, 260, 100] });
    } else if (tipo === "transporte_realizados") {
      agregarTexto("Historial de Servicios de Transporte", { fontSize: 11, fontWeight: "bold" });
      dibujarTabla(["ID", "Cliente", "Empresa", "Ruta", "Monto"], datos.transporte_realizados.map((i) => [i.id.substring(0, 8) + "...", `${i.cliente_nombre} ${i.cliente_apellido}`, i.nombre_empresa, `${i.nombre_ruta} (${i.destino})`, `Q ${Number(i.precio_total).toFixed(2)}`]), { columnWidths: [100, 160, 160, 260, 100] });
    } else if (tipo === "destinos_mas_frecuentes") {
      agregarTexto("Destinos Mas Frecuentes", { fontSize: 11, fontWeight: "bold" });
      const r10 = [];
      datos.destinos_envios.forEach((i) => r10.push(["Envio", i.destino, String(i.total)]));
      datos.destinos_transporte.forEach((i) => r10.push(["Transporte", i.destino, String(i.total)]));
      dibujarTabla(["Servicio", "Destino", "Viajes"], r10, { columnWidths: [200, 380, 200] });
    } else if (tipo === "uso_clientes") {
      agregarTexto("Perfil de Uso de Clientes", { fontSize: 11, fontWeight: "bold" });
      const u = datos.uso_clientes;
      dibujarTabla(["Categoria", "Clientes"], [
        ["Solo envios", String(u.solo_envios)],
        ["Solo transporte", String(u.solo_transporte)],
        ["Ambos servicios", String(u.ambos_servicios)]
      ], { columnWidths: [450, 330] });
    }

    doc.save(`reporte_${tipo}_${new Date().toISOString().substring(0, 10)}.pdf`);
  };

  // --- Guard clauses ---
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
        <p className="mt-2 text-muted">Cargando informacion...</p>
      </div>
    );
  }

  // --- Computed values ---
  const totalUsuariosSancionados = (datos.usuarios_estado || [])
    .filter((u) => u.estado === "vetado" || u.estado === "suspendido")
    .reduce((acc, curr) => acc + Number(curr.total), 0);

  const totalReportesActivos = (datos.resumen_reportes || [])
    .reduce((acc, curr) => acc + Number(curr.total), 0);

  const palette = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  // Helper: build grouped bar data for solicitudes graph
  const buildSolicitudesGraphData = () => {
    const roles = [...new Set(datos.solicitudes_registro.map((s) => s.rol))];
    return roles.map((rol) => {
      const aceptados = datos.solicitudes_registro.filter((s) => s.rol === rol && s.estado === "aceptado").reduce((a, c) => a + Number(c.total), 0);
      const rechazados = datos.solicitudes_registro.filter((s) => s.rol === rol && s.estado === "rechazado").reduce((a, c) => a + Number(c.total), 0);
      const pendientes = datos.solicitudes_registro.filter((s) => s.rol === rol && s.estado !== "aceptado" && s.estado !== "rechazado").reduce((a, c) => a + Number(c.total), 0);
      return { rol, aceptados, rechazados, pendientes };
    });
  };

  return (
    <div className="estadisticas-admin-container">
      {/* PDF Download Buttons */}
      <div className="admin-table-panel p-4 mb-4">
        <h4 className="mb-3 text-secondary" style={{ fontSize: "1.1rem", fontWeight: "800" }}>
          Descargar Reportes en PDF (11 Disponibles)
        </h4>
        <div className="d-flex flex-wrap gap-2">
          {[
            ["logs_registros_vetos", "1. Logs Registros y Vetos"],
            ["solicitudes_registro", "2. Aceptados/Rechazados por Tipo"],
            ["zonas_envios", "3. Zonas con mas Envios"],
            ["transporte_mas_utilizados", "4. Rutas mas Utilizadas"],
            ["ingresos_plataforma", "5. Ingresos Plataforma"],
            ["resumen_reportes", "6. Resumen de Reportes"],
            ["mayor_gasto", "7. Clientes de Mayor Gasto"],
            ["envios_realizados", "8. Historial de Envios"],
            ["transporte_realizados", "9. Historial de Transporte"],
            ["destinos_mas_frecuentes", "10. Destinos Frecuentes"],
            ["uso_clientes", "11. Uso de Clientes"]
          ].map(([key, label]) => (
            <button key={key} type="button" className="btn btn-outline-dark btn-sm" style={{ fontWeight: "700" }}
              onClick={() => descargarPDF(key, label.substring(label.indexOf(".") + 2))}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Metric Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card p-3 border-0 shadow-sm text-white" style={{ background: "linear-gradient(135deg, #4f46e5, #3b82f6)", borderRadius: "10px" }}>
            <span className="d-block small text-uppercase" style={{ opacity: "0.85", fontWeight: "700" }}>Sancionados Totales</span>
            <span className="d-block h2 m-0 mt-2" style={{ fontWeight: "800" }}>{totalUsuariosSancionados}</span>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card p-3 border-0 shadow-sm text-white" style={{ background: "linear-gradient(135deg, #10b981, #059669)", borderRadius: "10px" }}>
            <span className="d-block small text-uppercase" style={{ opacity: "0.85", fontWeight: "700" }}>Ingresos (Comision)</span>
            <span className="d-block h2 m-0 mt-2" style={{ fontWeight: "800" }}>
              Q {Number((datos.ingresos_plataforma || []).reduce((a, c) => a + Number(c.total_comisiones), 0)).toFixed(2)}
            </span>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card p-3 border-0 shadow-sm text-white" style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", borderRadius: "10px" }}>
            <span className="d-block small text-uppercase" style={{ opacity: "0.85", fontWeight: "700" }}>Quejas Emitidas</span>
            <span className="d-block h2 m-0 mt-2" style={{ fontWeight: "800" }}>{totalReportesActivos}</span>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card p-3 border-0 shadow-sm text-white" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", borderRadius: "10px" }}>
            <span className="d-block small text-uppercase" style={{ opacity: "0.85", fontWeight: "700" }}>Zonas de Cobertura</span>
            <span className="d-block h2 m-0 mt-2" style={{ fontWeight: "800" }}>{(datos.zonas_envios || []).length}</span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 6 REQUIRED SVG GRAPHS                                        */}
      {/* ============================================================ */}
      <div className="row g-4 mb-4">

        {/* GRAPH 1: Usuarios aceptados/rechazados por tipo (REQUIRED: "Grafica") */}
        <div className="col-md-6">
          <div className="admin-table-panel p-3 h-100">
            <h5 className="mb-3 text-secondary" style={{ fontSize: "1rem", fontWeight: "800" }}>
              Usuarios Aceptados / Rechazados por Tipo
            </h5>
            {(datos.solicitudes_registro || []).length === 0 ? (
              <p className="text-muted small">Sin solicitudes registradas</p>
            ) : (() => {
              const graphData = buildSolicitudesGraphData();
              const maxVal = Math.max(...graphData.map((d) => Math.max(d.aceptados, d.rechazados, d.pendientes)), 1);
              const barGroupWidth = 80;
              const svgWidth = 60 + graphData.length * barGroupWidth;
              return (
                <svg viewBox={`0 0 ${svgWidth} 240`} className="w-100">
                  <line x1="45" y1="10" x2="45" y2="200" stroke="#cbd5e1" strokeWidth="1.5" />
                  <line x1="45" y1="200" x2={svgWidth - 10} y2="200" stroke="#cbd5e1" strokeWidth="1.5" />
                  {graphData.map((item, idx) => {
                    const baseX = 55 + idx * barGroupWidth;
                    const hA = (item.aceptados / maxVal) * 160;
                    const hR = (item.rechazados / maxVal) * 160;
                    const hP = (item.pendientes / maxVal) * 160;
                    return (
                      <g key={item.rol}>
                        <rect x={baseX} y={200 - hA} width="18" height={hA} fill="#10b981" rx="3" />
                        {hA > 0 && <text x={baseX + 9} y={195 - hA} textAnchor="middle" fontSize="8" fontWeight="bold" fill="#334155">{item.aceptados}</text>}
                        <rect x={baseX + 20} y={200 - hR} width="18" height={hR} fill="#ef4444" rx="3" />
                        {hR > 0 && <text x={baseX + 29} y={195 - hR} textAnchor="middle" fontSize="8" fontWeight="bold" fill="#334155">{item.rechazados}</text>}
                        <rect x={baseX + 40} y={200 - hP} width="18" height={hP} fill="#f59e0b" rx="3" />
                        {hP > 0 && <text x={baseX + 49} y={195 - hP} textAnchor="middle" fontSize="8" fontWeight="bold" fill="#334155">{item.pendientes}</text>}
                        <text x={baseX + 29} y="215" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#64748b">
                          {item.rol === "operador" ? "Operador" : item.rol === "empresa_transporte" ? "Empresa" : item.rol}
                        </text>
                      </g>
                    );
                  })}
                  {/* Legend */}
                  <rect x={svgWidth - 150} y="5" width="8" height="8" fill="#10b981" rx="2" />
                  <text x={svgWidth - 138} y="12" fontSize="7" fill="#334155">Aceptados</text>
                  <rect x={svgWidth - 95} y="5" width="8" height="8" fill="#ef4444" rx="2" />
                  <text x={svgWidth - 83} y="12" fontSize="7" fill="#334155">Rechazados</text>
                  <rect x={svgWidth - 40} y="5" width="8" height="8" fill="#f59e0b" rx="2" />
                  <text x={svgWidth - 28} y="12" fontSize="7" fill="#334155">Pend.</text>
                </svg>
              );
            })()}
          </div>
        </div>

        {/* GRAPH 2: Zonas con mayor volumen de envios */}
        <div className="col-md-6">
          <div className="admin-table-panel p-3 h-100">
            <h5 className="mb-3 text-secondary" style={{ fontSize: "1rem", fontWeight: "800" }}>
              Zonas con Mayor Volumen de Envios
            </h5>
            {(datos.zonas_envios || []).length === 0 ? (
              <p className="text-muted small">Sin datos de envios</p>
            ) : (
              <svg viewBox="0 0 400 240" className="w-100">
                <line x1="45" y1="10" x2="45" y2="200" stroke="#cbd5e1" strokeWidth="1.5" />
                <line x1="45" y1="200" x2="380" y2="200" stroke="#cbd5e1" strokeWidth="1.5" />
                {(() => {
                  const maxVal = Math.max(...datos.zonas_envios.map((z) => Number(z.total_envios)), 1);
                  return datos.zonas_envios.slice(0, 6).map((item, idx) => {
                    const barHeight = (Number(item.total_envios) / maxVal) * 160;
                    const x = 55 + idx * 52;
                    const barY = 200 - barHeight;
                    return (
                      <g key={item.zona}>
                        <rect x={x} y={barY} width="32" height={barHeight} fill={palette[idx % palette.length]} rx="4" />
                        <text x={x + 16} y={barY - 5} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#334155">{item.total_envios}</text>
                        <text x={x + 16} y="215" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#64748b" transform={`rotate(-15, ${x + 16}, 215)`}>
                          {item.zona.substring(0, 10)}
                        </text>
                      </g>
                    );
                  });
                })()}
              </svg>
            )}
          </div>
        </div>

        {/* GRAPH 3: Servicios de transporte mas utilizados */}
        <div className="col-md-6">
          <div className="admin-table-panel p-3 h-100">
            <h5 className="mb-3 text-secondary" style={{ fontSize: "1rem", fontWeight: "800" }}>
              Servicios de Transporte Mas Utilizados
            </h5>
            {(datos.transporte_mas_utilizados || []).length === 0 ? (
              <p className="text-muted small">Sin datos de rutas</p>
            ) : (
              <svg viewBox="0 0 400 220" className="w-100">
                <line x1="45" y1="10" x2="45" y2="180" stroke="#cbd5e1" strokeWidth="1.5" />
                <line x1="45" y1="180" x2="380" y2="180" stroke="#cbd5e1" strokeWidth="1.5" />
                {(() => {
                  const maxVal = Math.max(...datos.transporte_mas_utilizados.map((t) => Number(t.total_reservas)), 1);
                  return datos.transporte_mas_utilizados.slice(0, 6).map((item, idx) => {
                    const barHeight = (Number(item.total_reservas) / maxVal) * 140;
                    const x = 55 + idx * 52;
                    const barY = 180 - barHeight;
                    return (
                      <g key={item.nombre_ruta + idx}>
                        <rect x={x} y={barY} width="32" height={barHeight} fill={palette[(idx + 2) % palette.length]} rx="4" />
                        <text x={x + 16} y={barY - 5} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#334155">{item.total_reservas}</text>
                        <text x={x + 16} y="195" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#64748b" transform={`rotate(-15, ${x + 16}, 195)`}>
                          {item.nombre_ruta.substring(0, 10)}
                        </text>
                      </g>
                    );
                  });
                })()}
              </svg>
            )}
          </div>
        </div>

        {/* GRAPH 4: Ingresos generados por la plataforma (donut) */}
        <div className="col-md-6">
          <div className="admin-table-panel p-3 h-100">
            <h5 className="mb-3 text-secondary" style={{ fontSize: "1rem", fontWeight: "800" }}>
              Ingresos Generados por la Plataforma
            </h5>
            {(datos.ingresos_plataforma || []).length === 0 ? (
              <p className="text-muted small">Sin datos de ingresos</p>
            ) : (
              <div className="d-flex align-items-center justify-content-around h-100 py-3 flex-wrap">
                <svg viewBox="0 0 160 160" style={{ width: "160px", height: "160px" }}>
                  {(() => {
                    const totalComision = datos.ingresos_plataforma.reduce((a, c) => a + Number(c.total_comisiones), 0);
                    let accAngle = 0;
                    return datos.ingresos_plataforma.map((item, idx) => {
                      if (totalComision === 0) return null;
                      const pct = Number(item.total_comisiones) / totalComision;
                      const angle = pct * 360;
                      const getCoords = (p) => [Math.cos(2 * Math.PI * p), Math.sin(2 * Math.PI * p)];
                      const [sx, sy] = getCoords(accAngle / 360);
                      accAngle += angle;
                      const [ex, ey] = getCoords(accAngle / 360);
                      const largeArc = pct > 0.5 ? 1 : 0;
                      const d = `M 80 80 L ${80 + sx * 70} ${80 + sy * 70} A 70 70 0 ${largeArc} 1 ${80 + ex * 70} ${80 + ey * 70} Z`;
                      return <path key={item.tipo_servicio} d={d} fill={idx === 0 ? "#4f46e5" : "#06b6d4"} />;
                    });
                  })()}
                  <circle cx="80" cy="80" r="35" fill="#ffffff" />
                </svg>
                <div className="d-flex flex-column gap-2">
                  {datos.ingresos_plataforma.map((item, idx) => (
                    <div key={item.tipo_servicio} className="d-flex align-items-center gap-2">
                      <span style={{ width: "12px", height: "12px", borderRadius: "3px", background: idx === 0 ? "#4f46e5" : "#06b6d4", display: "inline-block" }}></span>
                      <span className="small text-secondary text-capitalize" style={{ fontWeight: "700" }}>
                        {item.tipo_servicio === "envio" ? "Envios" : "Transporte"}: Q {Number(item.total_comisiones).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* GRAPH 5: Destinos mas frecuentes (horizontal bars) */}
        <div className="col-md-6">
          <div className="admin-table-panel p-3 h-100">
            <h5 className="mb-3 text-secondary" style={{ fontSize: "1rem", fontWeight: "800" }}>
              Destinos Mas Frecuentes
            </h5>
            {(datos.destinos_envios || []).length === 0 && (datos.destinos_transporte || []).length === 0 ? (
              <p className="text-muted small">Sin datos de destinos</p>
            ) : (
              <svg viewBox="0 0 400 200" className="w-100">
                {(() => {
                  const combined = [
                    ...datos.destinos_envios.slice(0, 3).map((d) => ({ ...d, tipo: "Envio" })),
                    ...datos.destinos_transporte.slice(0, 3).map((d) => ({ ...d, tipo: "Ruta" }))
                  ];
                  const maxVal = Math.max(...combined.map((d) => Number(d.total)), 1);
                  return combined.map((item, idx) => {
                    const barWidth = (Number(item.total) / maxVal) * 220;
                    const barY = 10 + idx * 30;
                    return (
                      <g key={item.destino + item.tipo}>
                        <text x="5" y={barY + 14} fontSize="7" fontWeight="bold" fill="#334155">
                          [{item.tipo}] {item.destino.substring(0, 18)}
                        </text>
                        <rect x="145" y={barY} width={barWidth} height="20" fill={item.tipo === "Envio" ? "#8b5cf6" : "#06b6d4"} rx="3" />
                        <text x={150 + barWidth} y={barY + 14} fontSize="9" fontWeight="bold" fill="#334155">{item.total}</text>
                      </g>
                    );
                  });
                })()}
              </svg>
            )}
          </div>
        </div>

        {/* GRAPH 6: Uso de clientes (solo envios, solo transporte, ambos) */}
        <div className="col-md-6">
          <div className="admin-table-panel p-3 h-100">
            <h5 className="mb-3 text-secondary" style={{ fontSize: "1rem", fontWeight: "800" }}>
              Uso de Clientes: Envios, Transporte o Ambos
            </h5>
            {(() => {
              const u = datos.uso_clientes || { solo_envios: 0, solo_transporte: 0, ambos_servicios: 0 };
              const totalC = Number(u.solo_envios) + Number(u.solo_transporte) + Number(u.ambos_servicios);
              if (totalC === 0) return <p className="text-muted small">Sin datos de clientes</p>;
              const maxVal = Math.max(Number(u.solo_envios), Number(u.solo_transporte), Number(u.ambos_servicios), 1);
              const hE = (Number(u.solo_envios) / maxVal) * 150;
              const hT = (Number(u.solo_transporte) / maxVal) * 150;
              const hA = (Number(u.ambos_servicios) / maxVal) * 150;
              return (
                <div className="d-flex align-items-center justify-content-around h-100 py-3">
                  <svg viewBox="0 0 280 200" style={{ width: "280px" }}>
                    <line x1="30" y1="10" x2="30" y2="170" stroke="#cbd5e1" strokeWidth="1" />
                    <line x1="30" y1="170" x2="260" y2="170" stroke="#cbd5e1" strokeWidth="1" />

                    <rect x="50" y={170 - hE} width="45" height={hE} fill="#10b981" rx="4" />
                    <text x="72" y={165 - hE} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#334155">{u.solo_envios}</text>
                    <text x="72" y="185" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#64748b">Solo Envios</text>

                    <rect x="120" y={170 - hT} width="45" height={hT} fill="#4f46e5" rx="4" />
                    <text x="142" y={165 - hT} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#334155">{u.solo_transporte}</text>
                    <text x="142" y="185" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#64748b">Solo Transp.</text>

                    <rect x="190" y={170 - hA} width="45" height={hA} fill="#f59e0b" rx="4" />
                    <text x="212" y={165 - hA} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#334155">{u.ambos_servicios}</text>
                    <text x="212" y="185" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#64748b">Ambos</text>
                  </svg>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 5 OBSERVABLE PANELS (tables/lists, not graphs per spec)       */}
      {/* ============================================================ */}
      <div className="row g-4">

        {/* PANEL 1: Logs de registros y vetos */}
        <div className="col-md-6">
          <div className="admin-table-panel p-3 h-100">
            <h5 className="mb-3 text-secondary" style={{ fontSize: "1rem", fontWeight: "800" }}>
              Logs de Registros y Vetos de Usuarios
            </h5>
            {(datos.usuarios_estado || []).length === 0 ? (
              <p className="text-muted small">Sin datos</p>
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
                    {datos.usuarios_estado.map((item, idx) => (
                      <tr key={idx} className="border-bottom">
                        <td className="text-capitalize">{item.rol.replace("_", " ")}</td>
                        <td>
                          <span className={`badge ${item.estado === "activo" ? "bg-success" : item.estado === "vetado" ? "bg-danger" : "bg-warning"}`}>
                            {item.estado.toUpperCase()}
                          </span>
                        </td>
                        <td className="text-end" style={{ fontWeight: "700" }}>{item.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* PANEL 2: Resumen de reportes emitidos */}
        <div className="col-md-6">
          <div className="admin-table-panel p-3 h-100">
            <h5 className="mb-3 text-secondary" style={{ fontSize: "1rem", fontWeight: "800" }}>
              Resumen de Reportes Emitidos y su Estado
            </h5>
            {(datos.resumen_reportes || []).length === 0 ? (
              <p className="text-muted small">Sin reportes emitidos</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm table-borderless m-0" style={{ fontSize: "0.85rem" }}>
                  <thead>
                    <tr className="border-bottom text-muted">
                      <th>Estado del Reporte</th>
                      <th className="text-end">Cantidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datos.resumen_reportes.map((item, idx) => (
                      <tr key={idx} className="border-bottom">
                        <td>
                          <span className={`badge ${item.estado === "aceptado" ? "bg-success" : item.estado === "rechazado" ? "bg-danger" : item.estado === "en_revision" ? "bg-info" : "bg-warning"}`}>
                            {item.estado.toUpperCase()}
                          </span>
                        </td>
                        <td className="text-end" style={{ fontWeight: "700" }}>{item.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* PANEL 3: Historial de usuarios con mayor gasto */}
        <div className="col-md-6">
          <div className="admin-table-panel p-3 h-100">
            <h5 className="mb-3 text-secondary" style={{ fontSize: "1rem", fontWeight: "800" }}>
              Historial: Clientes con Mayor Gasto
            </h5>
            {(datos.mayor_gasto || []).length === 0 ? (
              <p className="text-muted small">Sin datos de gasto</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm table-borderless m-0" style={{ fontSize: "0.85rem" }}>
                  <thead>
                    <tr className="border-bottom text-muted">
                      <th>Cliente</th>
                      <th>Email</th>
                      <th className="text-end">Gasto Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datos.mayor_gasto.slice(0, 10).map((item, idx) => (
                      <tr key={idx} className="border-bottom">
                        <td style={{ fontWeight: "700" }}>{item.nombre} {item.apellido}</td>
                        <td className="text-muted">{item.email}</td>
                        <td className="text-end text-success" style={{ fontWeight: "700" }}>Q {Number(item.total_gasto).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* PANEL 4: Historial de envios realizados */}
        <div className="col-md-6">
          <div className="admin-table-panel p-3 h-100">
            <h5 className="mb-3 text-secondary" style={{ fontSize: "1rem", fontWeight: "800" }}>
              Historial de Envios Realizados
            </h5>
            {(datos.envios_realizados || []).length === 0 ? (
              <p className="text-muted small">Sin envios registrados</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm table-borderless m-0" style={{ fontSize: "0.85rem" }}>
                  <thead>
                    <tr className="border-bottom text-muted">
                      <th>Cliente</th>
                      <th>Operador</th>
                      <th>Destino</th>
                      <th className="text-end">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datos.envios_realizados.slice(0, 10).map((item, idx) => (
                      <tr key={idx} className="border-bottom">
                        <td style={{ fontWeight: "700" }}>{item.cliente_nombre} {item.cliente_apellido}</td>
                        <td>{item.operador_nombre} {item.operador_apellido}</td>
                        <td className="text-muted">{item.direccion_destino}</td>
                        <td className="text-end text-success" style={{ fontWeight: "700" }}>Q {Number(item.precio_total).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* PANEL 5: Historial de servicios de transporte */}
        <div className="col-12">
          <div className="admin-table-panel p-3">
            <h5 className="mb-3 text-secondary" style={{ fontSize: "1rem", fontWeight: "800" }}>
              Historial de Servicios de Transporte
            </h5>
            {(datos.transporte_realizados || []).length === 0 ? (
              <p className="text-muted small">Sin servicios de transporte registrados</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm table-borderless m-0" style={{ fontSize: "0.85rem" }}>
                  <thead>
                    <tr className="border-bottom text-muted">
                      <th>Cliente</th>
                      <th>Empresa</th>
                      <th>Ruta</th>
                      <th>Destino</th>
                      <th className="text-end">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datos.transporte_realizados.slice(0, 10).map((item, idx) => (
                      <tr key={idx} className="border-bottom">
                        <td style={{ fontWeight: "700" }}>{item.cliente_nombre} {item.cliente_apellido}</td>
                        <td>{item.nombre_empresa}</td>
                        <td>{item.nombre_ruta}</td>
                        <td className="text-muted">{item.destino}</td>
                        <td className="text-end text-success" style={{ fontWeight: "700" }}>Q {Number(item.precio_total).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default EstadisticasAdmin;
