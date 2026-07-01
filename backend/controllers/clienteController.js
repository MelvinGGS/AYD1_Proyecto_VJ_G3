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

const obtenerTransportes = async (req, res) => {
  const { destino, fecha, empresa_id, tipo, orden } = req.query;
  try {
    let query = `
      SELECT rt.*, et.nombre_empresa, COALESCE(rt.calificacion_promedio, 0) AS calificacion_empresa
      FROM rutas_transporte rt
      INNER JOIN empresas_transporte et ON et.id = rt.empresa_id
      WHERE rt.estado = 'activa'
    `;
    const params = [];
    let paramIndex = 1;

    if (destino && destino.trim()) {
      query += ` AND rt.destino ILIKE $${paramIndex}`;
      params.push(`%${destino.trim()}%`);
      paramIndex++;
    }

    if (fecha) {
      const diasSemana = ['D', 'L', 'M', 'Mi', 'J', 'V', 'S'];
      const diaAbreviatura = diasSemana[new Date(fecha).getUTCDay()];
      query += ` AND rt.dias_disponibles ILIKE $${paramIndex}`;
      params.push(`%${diaAbreviatura}%`);
      paramIndex++;
    }

    if (empresa_id) {
      query += ` AND rt.empresa_id = $${paramIndex}`;
      params.push(empresa_id);
      paramIndex++;
    }

    if (tipo) {
      query += ` AND rt.tipo_servicio = $${paramIndex}`;
      params.push(tipo);
      paramIndex++;
    }

    // Sorting
    if (orden === 'precio_asc') {
      query += " ORDER BY rt.precio ASC";
    } else if (orden === 'precio_desc') {
      query += " ORDER BY rt.precio DESC";
    } else if (orden === 'calificacion_desc' || orden === 'calificacion') {
      query += " ORDER BY rt.calificacion_promedio DESC NULLS LAST";
    } else if (orden === 'calificacion_asc') {
      query += " ORDER BY rt.calificacion_promedio ASC NULLS LAST";
    } else if (orden === 'tiempo_asc') {
      query += " ORDER BY rt.tiempo_estimado ASC NULLS LAST";
    } else if (orden === 'tiempo_desc') {
      query += " ORDER BY rt.tiempo_estimado DESC NULLS LAST";
    } else if (orden === 'hora_asc') {
      query += " ORDER BY rt.hora_salida ASC NULLS LAST";
    } else if (orden === 'hora_desc') {
      query += " ORDER BY rt.hora_salida DESC NULLS LAST";
    } else if (orden === 'empresa_asc') {
      query += " ORDER BY et.nombre_empresa ASC";
    } else if (orden === 'empresa_desc') {
      query += " ORDER BY et.nombre_empresa DESC";
    } else {
      query += " ORDER BY rt.created_at DESC";
    }

    const { rows } = await db.pool.query(query, params);

    // Get filters
    const empresasRes = await db.pool.query(
      `SELECT DISTINCT et.id, et.nombre_empresa 
       FROM empresas_transporte et 
       INNER JOIN rutas_transporte rt ON rt.empresa_id = et.id 
       WHERE rt.estado = 'activa'`
    );

    const tiposRes = await db.pool.query(
      `SELECT DISTINCT tipo_servicio FROM rutas_transporte WHERE estado = 'activa'`
    );

    res.json({
      success: true,
      data: rows,
      filtros: {
        empresas: empresasRes.rows,
        tipos: tiposRes.rows.map(r => r.tipo_servicio)
      }
    });

  } catch (error) {
    console.error("Error al obtener transportes:", error);
    res.status(500).json({ success: false, message: "Error al obtener transportes disponibles." });
  }
};

const obtenerServiciosEnvio = async (req, res) => {
  const { buscar, orden } = req.query;
  try {
    let query = `
      SELECT se.*, (ol.nombre || ' ' || ol.apellido) AS operador, COALESCE(se.calificacion_promedio, 0) AS calificacion_promedio
      FROM servicios_envio se
      INNER JOIN operadores_logisticos ol ON ol.id = se.operador_id
      WHERE se.estado = 'activo'
    `;
    const params = [];
    let paramIndex = 1;

    if (buscar && buscar.trim()) {
      query += ` AND (se.nombre_servicio ILIKE $${paramIndex} OR se.descripcion ILIKE $${paramIndex} OR se.zona_cobertura ILIKE $${paramIndex} OR (ol.nombre || ' ' || ol.apellido) ILIKE $${paramIndex})`;
      params.push(`%${buscar.trim()}%`);
      paramIndex++;
    }

    if (orden === 'alfabetico') {
      query += " ORDER BY se.nombre_servicio ASC";
    } else if (orden === 'calificacion') {
      query += " ORDER BY se.calificacion_promedio DESC NULLS LAST";
    } else if (orden === 'precio_asc') {
      query += " ORDER BY se.precio_envio ASC";
    } else if (orden === 'precio_desc') {
      query += " ORDER BY se.precio_envio DESC";
    } else if (orden === 'capacidad') {
      query += " ORDER BY se.capacidad_carga_kg DESC";
    } else {
      query += " ORDER BY se.created_at DESC";
    }

    const { rows } = await db.pool.query(query, params);

    // Retrieve all photos for active services to embed them
    const serviceIds = rows.map(r => r.id);
    let photos = [];
    if (serviceIds.length > 0) {
      const photosRes = await db.pool.query(
        `SELECT id, servicio_id, url_foto, descripcion, orden 
         FROM fotos_servicio 
         WHERE servicio_id = ANY($1) 
         ORDER BY orden ASC`,
        [serviceIds]
      );
      photos = photosRes.rows;
    }

    const servicesWithPhotos = rows.map(service => {
      service.fotos = photos.filter(p => p.servicio_id === service.id);
      service.precio_envio = parseFloat(service.precio_envio);
      service.calificacion_promedio = parseFloat(service.calificacion_promedio);
      return service;
    });

    res.json({
      success: true,
      data: servicesWithPhotos
    });

  } catch (error) {
    console.error("Error al obtener servicios de envio:", error);
    res.status(500).json({ success: false, message: "Error al obtener servicios de envio." });
  }
};

module.exports = { obtenerPerfil, editarPerfil, listarCupones, validarCupon, obtenerTransportes, obtenerServiciosEnvio };