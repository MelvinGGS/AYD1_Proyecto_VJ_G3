const db = require("../config/db");
const { enviarCorreo } = require("../utils/mailer");

const formatoFecha = /^\d{4}-\d{2}-\d{2}$/;
const formatoUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const fechaValida = (valor) => {
  if (!formatoFecha.test(valor || "")) return false;
  const fecha = new Date(`${valor}T00:00:00Z`);
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor;
};

const escaparHtml = (valor) => String(valor || "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const listarClientesElegibles = async (req, res) => {
  try {
    const { rows } = await db.pool.query(
      `SELECT
         cl.id,
         cl.nombre,
         cl.apellido,
         u.email,
         COUNT(DISTINCT r.id)::int AS total_reservaciones,
         TO_CHAR(MAX(r.fecha_inicio), 'YYYY-MM-DD') AS ultima_reservacion
       FROM reservaciones r
       INNER JOIN servicios_envio s ON s.id = r.servicio_envio_id
       INNER JOIN clientes cl ON cl.id = r.cliente_id
       INNER JOIN usuarios u ON u.id = cl.id
       WHERE s.operador_id = $1
         AND r.tipo_servicio = 'envio'
         AND r.estado IN ('confirmado', 'en_transito', 'entregado')
       GROUP BY cl.id, cl.nombre, cl.apellido, u.email
       ORDER BY MAX(r.fecha_inicio) DESC, cl.nombre ASC, cl.apellido ASC`,
      [req.usuario.id]
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error al listar clientes elegibles para cupon:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener los clientes beneficiarios.",
      error: { code: "INTERNAL_ERROR", details: error.message }
    });
  }
};

const listarCupones = async (req, res) => {
  try {
    await db.pool.query(
      "UPDATE cupones SET estado = 'expirado', updated_at = NOW() WHERE creado_por = $1 AND estado = 'activo' AND fecha_fin < CURRENT_DATE",
      [req.usuario.id]
    );

    const { rows } = await db.pool.query(
      `SELECT
         id,
         codigo,
         descripcion,
         tipo_descuento,
         valor_descuento,
         monto_minimo,
         usos_maximos,
         usos_actuales,
         uso_por_cliente,
         TO_CHAR(fecha_inicio, 'YYYY-MM-DD') AS fecha_inicio,
         TO_CHAR(fecha_fin, 'YYYY-MM-DD') AS fecha_fin,
         estado
       FROM cupones
       WHERE creado_por = $1 AND tipo_servicio = 'envio'
       ORDER BY created_at DESC`,
      [req.usuario.id]
    );

    res.json({
      success: true,
      data: rows.map((cupon) => ({
        ...cupon,
        valor_descuento: Number(cupon.valor_descuento),
        monto_minimo: cupon.monto_minimo === null ? null : Number(cupon.monto_minimo)
      }))
    });
  } catch (error) {
    console.error("Error al listar cupones del operador:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener los cupones.",
      error: { code: "INTERNAL_ERROR", details: error.message }
    });
  }
};

const crearCupon = async (req, res) => {
  const operadorId = req.usuario.id;
  const {
    codigo,
    descripcion,
    tipo_descuento: tipoDescuento,
    valor_descuento: valorDescuento,
    monto_minimo: montoMinimo,
    usos_maximos: usosMaximos,
    fecha_inicio: fechaInicio,
    fecha_fin: fechaFin
  } = req.body;

  const codigoNormalizado = typeof codigo === "string" ? codigo.trim().toUpperCase() : "";
  const descripcionNormalizada = typeof descripcion === "string" ? descripcion.trim() : "";
  const valor = Number(valorDescuento);
  const minimo = montoMinimo === "" || montoMinimo === null || montoMinimo === undefined ? null : Number(montoMinimo);
  const maximoUsos = usosMaximos === "" || usosMaximos === null || usosMaximos === undefined ? null : Number(usosMaximos);

  if (!/^[A-Z0-9_-]{4,30}$/.test(codigoNormalizado)) {
    return res.status(400).json({ success: false, message: "El codigo debe tener entre 4 y 30 caracteres y solo puede usar letras, numeros, guion o guion bajo." });
  }
  if (!['porcentaje', 'monto_fijo'].includes(tipoDescuento) || !Number.isFinite(valor) || valor <= 0) {
    return res.status(400).json({ success: false, message: "El tipo y valor del descuento no son validos." });
  }
  if (tipoDescuento === "porcentaje" && valor > 100) {
    return res.status(400).json({ success: false, message: "El descuento porcentual no puede superar el 100%." });
  }
  if (valor > 99999999 || descripcionNormalizada.length > 500) {
    return res.status(400).json({ success: false, message: "El valor del descuento o la descripcion superan el limite permitido." });
  }
  if ((minimo !== null && (!Number.isFinite(minimo) || minimo < 0)) || (maximoUsos !== null && (!Number.isInteger(maximoUsos) || maximoUsos < 1))) {
    return res.status(400).json({ success: false, message: "El monto minimo o el limite de usos no son validos." });
  }
  if (!fechaValida(fechaInicio) || !fechaValida(fechaFin) || fechaFin < fechaInicio) {
    return res.status(400).json({ success: false, message: "La vigencia del cupon no es valida." });
  }

  try {
    const { rows } = await db.pool.query(
      `INSERT INTO cupones (
         creado_por, codigo, descripcion, tipo_descuento, valor_descuento,
         monto_minimo, usos_maximos, uso_por_cliente, fecha_inicio, fecha_fin,
         estado, tipo_servicio
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, 1, $8, $9, 'activo', 'envio')
       RETURNING id, codigo, descripcion, tipo_descuento, valor_descuento, monto_minimo, usos_maximos, fecha_inicio, fecha_fin, estado`,
      [operadorId, codigoNormalizado, descripcionNormalizada || null, tipoDescuento, valor, minimo, maximoUsos, fechaInicio, fechaFin]
    );

    res.status(201).json({
      success: true,
      message: "Cupón creado exitosamente.",
      data: rows[0]
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ success: false, message: "Ya existe un cupon con ese codigo." });
    }
    console.error("Error al crear cupon del operador:", error);
    return res.status(500).json({ success: false, message: "Error al crear el cupon.", error: { code: "INTERNAL_ERROR", details: error.message } });
  }
};

const desactivarCupon = async (req, res) => {
  if (!formatoUuid.test(req.params.id)) {
    return res.status(400).json({ success: false, message: "El cupon seleccionado no es valido." });
  }

  try {
    const { rows } = await db.pool.query(
      `UPDATE cupones
       SET estado = 'expirado', updated_at = NOW()
       WHERE id = $1 AND creado_por = $2 AND tipo_servicio = 'envio' AND estado = 'activo'
       RETURNING id`,
      [req.params.id, req.usuario.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: "Cupon activo no encontrado." });
    res.json({ success: true, message: "Cupon desactivado exitosamente." });
  } catch (error) {
    console.error("Error al desactivar cupon del operador:", error);
    res.status(500).json({ success: false, message: "Error al desactivar el cupon.", error: { code: "INTERNAL_ERROR", details: error.message } });
  }
};

const enviarCuponPorCorreo = async (req, res) => {
  const operadorId = req.usuario.id;
  const { id } = req.params;
  const { correo_cliente } = req.body;

  if (!correo_cliente) {
    return res.status(400).json({ success: false, message: "El correo del cliente es requerido." });
  }

  try {
    const { rows } = await db.pool.query(
      `SELECT * FROM cupones WHERE id = $1 AND creado_por = $2 AND estado = 'activo' AND tipo_servicio = 'envio'`,
      [id, operadorId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Cupón no encontrado o inactivo." });
    }

    const cupon = rows[0];
    const descuentoTexto = cupon.tipo_descuento === "porcentaje" ? `${cupon.valor_descuento}%` : `Q${Number(cupon.valor_descuento).toFixed(2)}`;

    await enviarCorreo(
      correo_cliente,
      `¡Tienes un cupón de descuento! - TrackFlow-HUB`,
      "Cupón de Descuento",
      `Hemos recibido un cupón especial para ti de un operador logístico. Usa el siguiente código al momento de realizar tu reservación:
      <br><br>
      <b>Código:</b> ${cupon.codigo}<br>
      <b>Descuento:</b> ${descuentoTexto}<br>
      <b>Válido hasta:</b> ${new Date(cupon.fecha_fin).toLocaleDateString()}<br>
      ${cupon.descripcion ? `<b>Descripción:</b> ${cupon.descripcion}` : ""}`,
      cupon.codigo
    );

    res.json({ success: true, message: `Cupón enviado exitosamente a ${correo_cliente}.` });
  } catch (error) {
    console.error("Error al enviar cupón:", error);
    res.status(500).json({ success: false, message: "Error al enviar cupón.", error: { details: error.message } });
  }
};

module.exports = {
  listarClientesElegibles,
  listarCupones,
  crearCupon,
  desactivarCupon,
  enviarCuponPorCorreo
};
