function SolicitudesEmpresas({
  empresas,
  puedeResolver,
  ejecutarAccion,
  abrirModalRechazo,
  abrirModalReunion,
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
              <th>Empresa</th>
              <th>NIT</th>
              <th>Licencia</th>
              <th>Contacto</th>
              <th>Reunion</th>
              <th>Estado</th>
              <th>Revision</th>
            </tr>
          </thead>
          <tbody>
            {empresas.map((empresa) => (
              <tr key={empresa.solicitud_id}>
                <td>
                  <strong>{empresa.nombre_empresa}</strong>
                  <small>{empresa.email}</small>
                </td>
                <td>{empresa.nit}</td>
                <td>{empresa.numero_licencia_operativa}</td>
                <td>
                  <strong>{empresa.telefono}</strong>
                  <small>{empresa.telefono_respaldo || "Sin respaldo"}</small>
                </td>
                <td>
                  {empresa.reunion_agendada ? (
                    <div className="admin-meeting-summary">
                      <strong>{new Date(empresa.reunion_fecha).toLocaleString()}</strong>
                      <a href={empresa.reunion_enlace} target="_blank" rel="noreferrer">Abrir enlace</a>
                    </div>
                  ) : (
                    <span className="admin-row-note">Sin reunion</span>
                  )}
                </td>
                <td>
                  {renderEstado(empresa.estado_solicitud)}
                  <small className="admin-account-state">Cuenta: {estadoTexto[empresa.estado_usuario] || empresa.estado_usuario}</small>
                </td>
                <td>
                  {puedeResolver(empresa.estado_solicitud) ? (
                    <div className="admin-review-cell wide">
                      <div className="admin-action-inline">
                        <button
                          type="button"
                          className="admin-button secondary"
                          disabled={accionando === `reunion-${empresa.solicitud_id}`}
                          onClick={() => abrirModalReunion(empresa)}
                        >
                          Agendar reunion
                        </button>
                        <button
                          type="button"
                          className="admin-button primary"
                          disabled={accionando === `aceptar-empresa-${empresa.solicitud_id}`}
                          onClick={() => ejecutarAccion(
                            `aceptar-empresa-${empresa.solicitud_id}`,
                            `${API_URL}/solicitudes/empresas/${empresa.solicitud_id}/aceptar`
                          )}
                        >
                          Aprobar
                        </button>
                        <button
                          type="button"
                          className="admin-button danger"
                          disabled={accionando === `rechazar-empresa-${empresa.solicitud_id}`}
                          onClick={() => abrirModalRechazo("empresa", empresa)}
                        >
                          Rechazar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <span className="admin-row-note">{empresa.motivo_rechazo || "Solicitud resuelta"}</span>
                  )}
                </td>
              </tr>
            ))}
            {empresas.length === 0 && !cargando && (
              <tr>
                <td colSpan="7" className="admin-empty-cell">No hay empresas en este estado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default SolicitudesEmpresas;
