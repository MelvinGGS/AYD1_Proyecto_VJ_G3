const db = require("../config/db");

const formatoFechaValido = /^\d{4}-\d{2}-\d{2}$/;
const formatoUuidValido = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const fechaEsValida = (valor) => {
  if (!formatoFechaValido.test(valor || "")) return false;
  const fecha = new Date(`${valor}T00:00:00Z`);
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor;
};

const obtenerCalendario = async (req, res) => {
  const operadorId = req.usuario.id;
  const { desde, hasta, servicio_id: servicioId } = req.query;

  if (!fechaEsValida(desde) || !fechaEsValida(hasta)) {
    return res.status(400).json({
      success: false,
      message: "Debes indicar un rango de fechas valido en formato YYYY-MM-DD.",
      error: { code: "VALIDATION_ERROR" }
    });
  }

  const inicio = new Date(`${desde}T00:00:00Z`);
  const fin = new Date(`${hasta}T00:00:00Z`);
  const diasSolicitados = (fin - inicio) / 86400000;

  if (fin < inicio || diasSolicitados > 62) {
    return res.status(400).json({
      success: false,
      message: "El rango debe estar ordenado y no puede superar 62 dias.",
      error: { code: "VALIDATION_ERROR" }
    });
  }

  if (servicioId && !formatoUuidValido.test(servicioId)) {
    return res.status(400).json({
      success: false,
      message: "El servicio seleccionado no es valido.",
      error: { code: "VALIDATION_ERROR" }
    });
  }

  try {
    if (servicioId) {
      const servicio = await db.pool.query(
        "SELECT id FROM servicios_envio WHERE id = $1 AND operador_id = $2 AND estado != 'eliminado'",
        [servicioId, operadorId]
      );

      if (servicio.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "El servicio no existe o no pertenece al operador.",
          error: { code: "SERVICE_NOT_FOUND" }
        });
      }
    }

    const parametros = [operadorId, desde, hasta];
    let filtroServicio = "";

    if (servicioId) {
      parametros.push(servicioId);
      filtroServicio = `AND s.id = $${parametros.length}`;
    }

    const [reservacionesResultado, serviciosResultado] = await Promise.all([
      db.pool.query(
        `SELECT
           r.id,
           TO_CHAR(r.fecha_inicio, 'YYYY-MM-DD') AS fecha_inicio,
           TO_CHAR(COALESCE(r.fecha_fin, r.fecha_inicio), 'YYYY-MM-DD') AS fecha_fin,
           r.estado,
           r.direccion_origen,
           r.direccion_destino,
           r.descripcion_paquete,
           r.peso_paquete_kg,
           r.precio_total,
           s.id AS servicio_id,
           s.nombre_servicio,
           cl.nombre AS cliente_nombre,
           cl.apellido AS cliente_apellido,
           cl.telefono AS cliente_telefono
         FROM reservaciones r
         INNER JOIN servicios_envio s ON s.id = r.servicio_envio_id
         INNER JOIN clientes cl ON cl.id = r.cliente_id
         WHERE s.operador_id = $1
           AND r.tipo_servicio = 'envio'
           AND r.estado IN ('confirmado', 'en_transito', 'entregado')
           AND r.fecha_inicio <= $3::date
           AND COALESCE(r.fecha_fin, r.fecha_inicio) >= $2::date
           ${filtroServicio}
         ORDER BY r.fecha_inicio ASC, s.nombre_servicio ASC`,
        parametros
      ),
      db.pool.query(
        `SELECT id, nombre_servicio
         FROM servicios_envio
         WHERE operador_id = $1 AND estado != 'eliminado'
         ORDER BY nombre_servicio ASC`,
        [operadorId]
      )
    ]);

    res.status(200).json({
      success: true,
      message: "Calendario obtenido exitosamente.",
      data: {
        reservaciones: reservacionesResultado.rows.map((reservacion) => ({
          ...reservacion,
          peso_paquete_kg: reservacion.peso_paquete_kg === null ? null : Number(reservacion.peso_paquete_kg),
          precio_total: Number(reservacion.precio_total),
          cliente: `${reservacion.cliente_nombre} ${reservacion.cliente_apellido}`.trim()
        })),
        servicios: serviciosResultado.rows
      }
    });
  } catch (error) {
    console.error("Error al obtener calendario del operador:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener el calendario de envios.",
      error: { code: "INTERNAL_ERROR", details: error.message }
    });
  }
};

module.exports = { obtenerCalendario };
