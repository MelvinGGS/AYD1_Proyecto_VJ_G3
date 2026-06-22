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
         c.id,
         c.codigo,
         c.descripcion,
         c.tipo_descuento,
         c.valor_descuento,
         c.monto_minimo,
         c.usos_maximos,
         c.usos_actuales,
         c.uso_por_cliente,
         TO_CHAR(c.fecha_inicio, 'YYYY-MM-DD') AS fecha_inicio,
         TO_CHAR(c.fecha_fin, 'YYYY-MM-DD') AS fecha_fin,
         c.estado,
         COUNT(cc.id)::int AS total_beneficiarios,
         COUNT(cc.id) FILTER (WHERE cc.canjeado)::int AS total_canjeados,
         COALESCE(
           JSON_AGG(
             JSON_BUILD_OBJECT(
               'id', cl.id,
               'nombre', cl.nombre || ' ' || cl.apellido,
               'email', u.email,
               'canjeado', cc.canjeado
             ) ORDER BY cl.nombre, cl.apellido
           ) FILTER (WHERE cc.id IS NOT NULL),
           '[]'::json
         ) AS beneficiarios
       FROM cupones c
       LEFT JOIN cupones_clientes cc ON cc.cupon_id = c.id
       LEFT JOIN clientes cl ON cl.id = cc.cliente_id
       LEFT JOIN usuarios u ON u.id = cl.id
       WHERE c.creado_por = $1 AND c.tipo_servicio = 'envio'
       GROUP BY c.id
       ORDER BY c.created_at DESC`,
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
    fecha_fin: fechaFin,
    cliente_ids: clienteIds
  } = req.body;

  const codigoNormalizado = typeof codigo === "string" ? codigo.trim().toUpperCase() : "";
  const descripcionNormalizada = typeof descripcion === "string" ? descripcion.trim() : "";
  const valor = Number(valorDescuento);
  const minimo = montoMinimo === "" || montoMinimo === null || montoMinimo === undefined ? null : Number(montoMinimo);
  const maximoUsos = usosMaximos === "" || usosMaximos === null || usosMaximos === undefined ? null : Number(usosMaximos);
  const clientesUnicos = Array.isArray(clienteIds) ? [...new Set(clienteIds)] : [];

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
  if (clientesUnicos.length === 0 || clientesUnicos.length > 100 || clientesUnicos.some((id) => !formatoUuid.test(id))) {
    return res.status(400).json({ success: false, message: "Selecciona entre 1 y 100 clientes beneficiarios validos." });
  }
  if (maximoUsos !== null && maximoUsos < clientesUnicos.length) {
    return res.status(400).json({ success: false, message: "El limite de usos no puede ser menor que la cantidad de beneficiarios." });
  }

  const client = await db.pool.connect();
  let beneficiarios = [];
  let cupon;

  try {
    await client.query("BEGIN");

    const clientesResultado = await client.query(
      `SELECT DISTINCT cl.id, cl.nombre, cl.apellido, u.email
       FROM reservaciones r
       INNER JOIN servicios_envio s ON s.id = r.servicio_envio_id
       INNER JOIN clientes cl ON cl.id = r.cliente_id
       INNER JOIN usuarios u ON u.id = cl.id
       WHERE s.operador_id = $1
         AND cl.id = ANY($2::uuid[])
         AND r.tipo_servicio = 'envio'
         AND r.estado IN ('confirmado', 'en_transito', 'entregado')`,
      [operadorId, clientesUnicos]
    );

    if (clientesResultado.rows.length !== clientesUnicos.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({ success: false, message: "Uno o mas clientes seleccionados no han contratado servicios de este operador." });
    }

    beneficiarios = clientesResultado.rows;
    const cuponResultado = await client.query(
      `INSERT INTO cupones (
         creado_por, codigo, descripcion, tipo_descuento, valor_descuento,
         monto_minimo, usos_maximos, uso_por_cliente, fecha_inicio, fecha_fin,
         estado, tipo_servicio
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, 1, $8, $9, 'activo', 'envio')
       RETURNING id, codigo, descripcion, tipo_descuento, valor_descuento, monto_minimo, usos_maximos, fecha_inicio, fecha_fin, estado`,
      [operadorId, codigoNormalizado, descripcionNormalizada || null, tipoDescuento, valor, minimo, maximoUsos, fechaInicio, fechaFin]
    );
    cupon = cuponResultado.rows[0];

    await client.query(
      `INSERT INTO cupones_clientes (cupon_id, cliente_id)
       SELECT $1, UNNEST($2::uuid[])`,
      [cupon.id, clientesUnicos]
    );

    const mensajeNotificacion = `Tienes un nuevo cupon ${codigoNormalizado} valido hasta ${fechaFin}.`;
    await client.query(
      `INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, entidad_tipo, entidad_id)
       SELECT UNNEST($1::uuid[]), 'cupon', 'Nuevo cupon de descuento', $2, 'cupon', $3`,
      [clientesUnicos, mensajeNotificacion, cupon.id]
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    if (error.code === "23505") {
      return res.status(409).json({ success: false, message: "Ya existe un cupon con ese codigo." });
    }
    console.error("Error al crear cupon del operador:", error);
    return res.status(500).json({ success: false, message: "Error al crear el cupon.", error: { code: "INTERNAL_ERROR", details: error.message } });
  } finally {
    client.release();
  }

  const descuentoTexto = tipoDescuento === "porcentaje" ? `${valor}%` : `Q${valor.toFixed(2)}`;
  const correos = await Promise.allSettled(beneficiarios.map((beneficiario) => enviarCorreo(
    beneficiario.email,
    "Tienes un cupon de descuento - TrackFlow-HUB",
    "Cupon especial para ti",
    `Hola ${escaparHtml(beneficiario.nombre)}. Un operador logistico te ha otorgado un descuento de <b>${descuentoTexto}</b>.<br><br><b>Codigo:</b> ${escaparHtml(codigoNormalizado)}<br><b>Valido del:</b> ${fechaInicio} al ${fechaFin}${descripcionNormalizada ? `<br><b>Detalle:</b> ${escaparHtml(descripcionNormalizada)}` : ""}`,
    codigoNormalizado
  )));
  const correosEnviados = correos.filter((resultado) => resultado.status === "fulfilled").length;

  res.status(201).json({
    success: true,
    message: `Cupon creado para ${beneficiarios.length} cliente${beneficiarios.length === 1 ? "" : "s"}.`,
    data: { ...cupon, total_beneficiarios: beneficiarios.length, correos_enviados: correosEnviados }
  });
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

module.exports = {
  listarClientesElegibles,
  listarCupones,
  crearCupon,
  desactivarCupon
};
