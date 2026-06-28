import { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import Swal from "sweetalert2";

function BitacoraLogs({ token }) {
  const [logs, setLogs] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const API_URL = "http://localhost:3000/api/admin/logs";

  const cargarLogs = async () => {
    setCargando(true);
    try {
      const response = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setLogs(data.data);
      } else {
        Swal.fire("Error", data.message || "No se pudieron obtener los logs", "error");
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
      cargarLogs();
    }
  }, [token]);

  const logsFiltrados = logs.filter((log) => {
    const term = busqueda.toLowerCase();
    return (
      (log.accion || "").toLowerCase().includes(term) ||
      (log.descripcion || "").toLowerCase().includes(term) ||
      (log.usuario_email || "").toLowerCase().includes(term)
    );
  });

  const descargarPDFLogs = () => {
    if (logsFiltrados.length === 0) return;

    // Crear PDF landscape idéntico a la lógica del operador
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
    doc.text("Bitacora de Logs de Registros, Vetos y Actividad", margin + 15, y + 27);
    
    doc.setTextColor(51, 65, 85);
    doc.setFont("helvetica", "normal");
    y += 60;

    // Agregar fecha de generación
    doc.setFontSize(9);
    doc.text(`Fecha de generacion: ${new Date().toLocaleString()}`, margin, y);
    y += 20;

    // Helper para tablas zebra
    const headers = ["Fecha", "Actor / Email", "Accion", "Descripcion", "Entidad Tipo", "Entidad ID"];
    const rows = logsFiltrados.map((log) => [
      new Date(log.created_at).toLocaleString(),
      log.usuario_email ? `${log.usuario_email} (${log.usuario_rol})` : "Sistema",
      log.accion,
      log.descripcion || "",
      log.entidad_tipo || "N/A",
      log.entidad_id || "N/A"
    ]);

    // Anchos de columna proporcionales
    const columnWidths = [110, 150, 90, 240, 80, 110];
    const rowHeight = 20;
    const cellLineHeight = 13;

    const drawHeader = () => {
      let x = margin;
      if (y + rowHeight > pageBottom) {
        doc.addPage();
        y = margin;
      }

      doc.setFillColor(30, 41, 59); // slate-800
      doc.rect(x, y, maxWidth, rowHeight, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);

      columnWidths.forEach((w, index) => {
        doc.text(headers[index], x + 6, y + 13);
        x += w;
      });
      y += rowHeight;
    };

    drawHeader();

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
        // Zebra
        doc.setFillColor(isEven ? 248 : 255, isEven ? 250 : 255, isEven ? 252 : 255);
        doc.rect(x, y, w, maxCellHeight, "F");
        
        // Border
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(1);
        doc.rect(x, y, w, maxCellHeight, "S");

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
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

    doc.save(`bitacora_logs_${new Date().toISOString().substring(0, 10)}.pdf`);
  };

  return (
    <div className="bitacora-logs-container">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <input
          type="text"
          className="form-control"
          placeholder="Buscar logs por accion, descripcion o usuario..."
          style={{ maxWidth: "400px", fontWeight: "600" }}
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <button
          type="button"
          className="btn btn-outline-dark"
          onClick={descargarPDFLogs}
          disabled={logsFiltrados.length === 0}
          style={{ fontWeight: "700" }}
        >
          Descargar Bitacora PDF
        </button>
      </div>

      {cargando ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-2 text-muted">Cargando bitacora de auditoria...</p>
        </div>
      ) : logsFiltrados.length === 0 ? (
        <div className="admin-table-panel p-4 text-center text-muted">
          No se encontraron registros de logs en la bitacora.
        </div>
      ) : (
        <div className="admin-table-panel">
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: "160px" }}>Fecha / Hora</th>
                  <th style={{ width: "200px" }}>Actor (Usuario)</th>
                  <th style={{ width: "150px" }}>Accion</th>
                  <th>Descripcion del Evento</th>
                  <th style={{ width: "120px" }}>Entidad Tipo</th>
                  <th style={{ width: "120px" }}>Entidad ID</th>
                </tr>
              </thead>
              <tbody>
                {logsFiltrados.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <strong>{new Date(log.created_at).toLocaleDateString()}</strong>
                      <small>{new Date(log.created_at).toLocaleTimeString()}</small>
                    </td>
                    <td>
                      {log.usuario_email ? (
                        <>
                          <strong>{log.usuario_email}</strong>
                          <small className="badge bg-secondary text-capitalize">{log.usuario_rol}</small>
                        </>
                      ) : (
                        <span className="text-muted">Sistema</span>
                      )}
                    </td>
                    <td>
                      <span className="badge bg-primary text-uppercase" style={{ fontSize: "0.75rem" }}>
                        {log.accion}
                      </span>
                    </td>
                    <td>
                      <p className="m-0 text-secondary" style={{ fontSize: "0.9rem", whiteSpace: "pre-wrap", minWidth: "250px" }}>
                        {log.descripcion}
                      </p>
                    </td>
                    <td>
                      <span className="text-capitalize text-dark">{log.entidad_tipo || "N/A"}</span>
                    </td>
                    <td>
                      <small className="text-muted">{log.entidad_id || "N/A"}</small>
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

export default BitacoraLogs;
