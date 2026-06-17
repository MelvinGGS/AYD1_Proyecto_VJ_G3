function SolicitudesOperadores({
  operadores,
  puedeResolver,
  ejecutarAccion,
  abrirModalRechazo,
  renderEstado,
  accionando,
  cargando,
  API_URL,
  estadoTexto
}) {
  return (
    <section className="admin-table-panel">
      <div className="admin-table-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Foto</th>
              <th>Operador</th>
              <th>DPI/CUI</th>
              <th>Contacto</th>
              <th>Zona</th>
              <th>Estado</th>
              <th>Revision</th>
            </tr>
          </thead>
          <tbody>
            {operadores.map((operador) => (
              <tr key={operador.solicitud_id}>
                <td>
                  {operador.fotografia ? (
                    <a href={operador.fotografia} target="_blank" rel="noreferrer" className="admin-photo-link">
                      <img className="admin-photo" src={operador.fotografia} alt={`Foto de ${operador.nombre}`} />
                    </a>
                  ) : (
                    <span className="admin-photo-placeholder">Sin foto</span>
                  )}
                </td>
                <td>
                  <strong>{operador.nombre} {operador.apellido}</strong>
                  <small>{operador.email}</small>
                </td>
                <td>{operador.dpi_cui}</td>
                <td>
                  <strong>{operador.telefono}</strong>
                  <small>{operador.telefono_respaldo || "Sin respaldo"}</small>
                </td>
                <td>{operador.zona_operacion}</td>
                <td>
                  {renderEstado(operador.estado_solicitud)}
                  <small className="admin-account-state">Cuenta: {estadoTexto[operador.estado_usuario] || operador.estado_usuario}</small>
                </td>
                <td>
                  {puedeResolver(operador.estado_solicitud) ? (
                    <div className="admin-review-cell">
                      <button
                        type="button"
                        className="admin-button primary"
                        disabled={accionando === `aceptar-operador-${operador.solicitud_id}`}
                        onClick={() => ejecutarAccion(
                          `aceptar-operador-${operador.solicitud_id}`,
                          `${API_URL}/solicitudes/operadores/${operador.solicitud_id}/aceptar`
                        )}
                      >
                        Aprobar
                      </button>
                      <button
                        type="button"
                        className="admin-button danger"
                        disabled={accionando === `rechazar-operador-${operador.solicitud_id}`}
                        onClick={() => abrirModalRechazo("operador", operador)}
                      >
                        Rechazar
                      </button>
                    </div>
                  ) : (
                    <span className="admin-row-note">{operador.motivo_rechazo || "Solicitud resuelta"}</span>
                  )}
                </td>
              </tr>
            ))}
            {operadores.length === 0 && !cargando && (
              <tr>
                <td colSpan="7" className="admin-empty-cell">No hay operadores en este estado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default SolicitudesOperadores;
