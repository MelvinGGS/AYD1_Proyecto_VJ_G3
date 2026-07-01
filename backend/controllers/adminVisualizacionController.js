const db = require("../config/db");

const visualizarServicios = async (req, res) => {
  const { ordenar_por } = req.query;

  let orderByClause = "rt.created_at DESC";
  if (ordenar_por === "zona_geografica") {
    orderByClause = "rt.origen ASC, rt.destino ASC";
  } else if (ordenar_por === "empresa") {
    orderByClause = "et.nombre_empresa ASC";
  }

  try {
    const query = `
      SELECT rt.*, et.nombre_empresa, et.telefono, et.nit, et.logo
      FROM rutas_transporte rt
      INNER JOIN empresas_transporte et ON et.id = rt.empresa_id
      ORDER BY ${orderByClause}
    `;
    const { rows } = await db.pool.query(query);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error al visualizar servicios:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener servicios de transporte.",
      error: { code: "INTERNAL_ERROR", details: error.message }
    });
  }
};

const visualizarEnvios = async (req, res) => {
  const { ordenar_por } = req.query;

  let orderByClause = "r.created_at DESC";
  if (ordenar_por === "destino") {
    orderByClause = "r.direccion_destino ASC";
  } else if (ordenar_por === "operador") {
    orderByClause = "ol.nombre ASC, ol.apellido ASC";
  }

  try {
    const query = `
      SELECT r.*, se.nombre_servicio, se.precio_envio, se.zona_cobertura,
             ol.nombre AS operador_nombre, ol.apellido AS operador_apellido, ol.telefono AS operador_telefono,
             u_op.email AS operador_email,
             c.nombre AS cliente_nombre, c.apellido AS cliente_apellido
      FROM reservaciones r
      INNER JOIN servicios_envio se ON se.id = r.servicio_envio_id
      INNER JOIN operadores_logisticos ol ON ol.id = se.operador_id
      INNER JOIN usuarios u_op ON u_op.id = ol.id
      INNER JOIN clientes c ON c.id = r.cliente_id
      WHERE r.tipo_servicio = 'envio'
      ORDER BY ${orderByClause}
    `;
    const { rows } = await db.pool.query(query);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error al visualizar envios:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener envios registrados.",
      error: { code: "INTERNAL_ERROR", details: error.message }
    });
  }
};

module.exports = {
  visualizarServicios,
  visualizarEnvios
};
