const db = require("../config/db");

const obtenerPerfil = async (req, res) => {
  const clienteId = req.usuario.id;
  try {
    const { rows } = await db.pool.query(
      `SELECT c.nombre, c.apellido, c.telefono, c.direccion_origen, c.foto_perfil, u.email
       FROM clientes c
       INNER JOIN usuarios u ON u.id = c.id
       WHERE c.id = $1`,
      [clienteId]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: "Cliente no encontrado." });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("Error al obtener perfil:", error);
    res.status(500).json({ success: false, message: "Error al obtener perfil.", error: { details: error.message } });
  }
};

const editarPerfil = async (req, res) => {
  const clienteId = req.usuario.id;
  const { nombre, apellido, telefono, direccion_origen } = req.body;

  if (!nombre || !apellido || !telefono) {
    return res.status(400).json({ success: false, message: "Nombre, apellido y teléfono son requeridos." });
  }

  try {
    const { rows } = await db.pool.query(
      `UPDATE clientes SET nombre = $1, apellido = $2, telefono = $3, direccion_origen = $4
       WHERE id = $5 RETURNING nombre, apellido, telefono, direccion_origen`,
      [nombre, apellido, telefono, direccion_origen || null, clienteId]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: "Cliente no encontrado." });
    res.json({ success: true, message: "Perfil actualizado exitosamente.", data: rows[0] });
  } catch (error) {
    console.error("Error al editar perfil:", error);
    res.status(500).json({ success: false, message: "Error al editar perfil.", error: { details: error.message } });
  }
};

const listarCupones = async (req, res) => {
  const clienteId = req.usuario.id;
  try {
    const { rows } = await db.pool.query(
      `SELECT 
        cc.id,
        cc.canjeado,
        cc.fecha_canje,
        cc.created_at,
        c.codigo,
        c.descripcion,
        c.tipo_descuento,
        c.valor_descuento,
        c.fecha_inicio,
        c.fecha_fin,
        c.estado,
        c.monto_minimo,
        c.uso_por_cliente
       FROM cupones_clientes cc
       INNER JOIN cupones c ON c.id = cc.cupon_id
       WHERE cc.cliente_id = $1
       ORDER BY cc.created_at DESC`,
      [clienteId]
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error al listar cupones:", error);
    res.status(500).json({ success: false, message: "Error al obtener cupones.", error: { details: error.message } });
  }
};

const validarCupon = async (req, res) => {
  const clienteId = req.usuario.id;
  const { codigo } = req.params;

  try {
    const { rows } = await db.pool.query(
      `SELECT 
        c.id, c.codigo, c.tipo_descuento, c.valor_descuento,
        c.fecha_inicio, c.fecha_fin, c.estado, c.monto_minimo,
        cc.canjeado
       FROM cupones c
       INNER JOIN cupones_clientes cc ON cc.cupon_id = c.id
       WHERE c.codigo = $1 AND cc.cliente_id = $2`,
      [codigo.toUpperCase(), clienteId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Cupón no encontrado o no asignado a tu cuenta." });
    }

    const cupon = rows[0];

    if (cupon.canjeado) {
      return res.status(400).json({ success: false, message: "Este cupón ya fue canjeado." });
    }

    if (cupon.estado !== "activo") {
      return res.status(400).json({ success: false, message: "Este cupón no está activo." });
    }

    const hoy = new Date();
    if (hoy < new Date(cupon.fecha_inicio) || hoy > new Date(cupon.fecha_fin)) {
      return res.status(400).json({ success: false, message: "Este cupón está fuera de su fecha de vigencia." });
    }

    const descuento = cupon.tipo_descuento === "porcentaje"
      ? `${cupon.valor_descuento}% de descuento`
      : `Q${cupon.valor_descuento} de descuento`;

    res.json({ success: true, data: cupon, descuento, message: `Cupón válido: ${descuento}` });
  } catch (error) {
    console.error("Error al validar cupón:", error);
    res.status(500).json({ success: false, message: "Error al validar cupón.", error: { details: error.message } });
  }
};

module.exports = { obtenerPerfil, editarPerfil, listarCupones, validarCupon};