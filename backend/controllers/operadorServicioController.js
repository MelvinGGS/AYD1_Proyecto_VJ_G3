const db = require("../config/db");

const crearServicio = async (req, res) => {
  const {
    nombre_servicio,
    descripcion,
    zona_cobertura,
    capacidad_carga_kg,
    precio_envio,
    horario_disponible
  } = req.body;

  const archivosFotos = req.files || [];

  if (!nombre_servicio || !zona_cobertura || !capacidad_carga_kg || !precio_envio || !horario_disponible) {
    return res.status(400).json({
      success: false,
      message: "Faltan campos obligatorios para registrar el servicio.",
      error: { code: "VALIDATION_ERROR" }
    });
  }

  if (archivosFotos.length < 3) {
    return res.status(400).json({
      success: false,
      message: "Se requiere subir al menos 3 fotografias para el vehiculo/bodega.",
      error: { code: "MIN_3_PHOTOS" }
    });
  }

  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    const insertServicioQuery = `
      INSERT INTO servicios_envio (
        operador_id, nombre_servicio, descripcion, zona_cobertura,
        capacidad_carga_kg, precio_envio, horario_disponible, estado
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'activo')
      RETURNING id, nombre_servicio, zona_cobertura, capacidad_carga_kg, precio_envio, estado, created_at, horario_disponible
    `;

    const servicioRes = await client.query(insertServicioQuery, [
      req.usuario.id,
      nombre_servicio,
      descripcion || null,
      zona_cobertura,
      parseFloat(capacidad_carga_kg),
      parseFloat(precio_envio),
      horario_disponible || null
    ]);

    const servicio = servicioRes.rows[0];
    const fotosInsertadas = [];

    for (let i = 0; i < archivosFotos.length; i++) {
      const file = archivosFotos[i];
      const urlFoto = `http://localhost:3000/uploads/${file.filename}`;
      const insertFotoQuery = `
        INSERT INTO fotos_servicio (servicio_id, url_foto, orden)
        VALUES ($1, $2, $3)
        RETURNING id, url_foto, orden
      `;
      const fotoRes = await client.query(insertFotoQuery, [servicio.id, urlFoto, i]);
      fotosInsertadas.push(fotoRes.rows[0]);
    }

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Servicio creado exitosamente.",
      data: {
        id: servicio.id,
        nombre_servicio: servicio.nombre_servicio,
        zona_cobertura: servicio.zona_cobertura,
        capacidad_carga_kg: parseFloat(servicio.capacidad_carga_kg),
        precio_envio: parseFloat(servicio.precio_envio),
        estado: servicio.estado,
        fotos: fotosInsertadas,
        created_at: servicio.created_at
      }
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error al crear servicio:", err);
    res.status(500).json({
      success: false,
      message: "Error al crear el servicio.",
      error: { code: "INTERNAL_ERROR", details: err.message }
    });
  } finally {
    client.release();
  }
};

const listarMisServicios = async (req, res) => {
  const estadoFiltro = req.query.estado || "activo";
  const pagina = parseInt(req.query.pagina || "1");
  const porPagina = parseInt(req.query.por_pagina || "10");
  const offset = (pagina - 1) * porPagina;

  try {
    const totalRes = await db.pool.query(
      "SELECT COUNT(*) FROM servicios_envio WHERE operador_id = $1 AND estado = $2",
      [req.usuario.id, estadoFiltro]
    );
    const totalItems = parseInt(totalRes.rows[0].count);
    const totalPaginas = Math.ceil(totalItems / porPagina) || 1;

    const query = `
      SELECT s.id, s.nombre_servicio, s.descripcion, s.zona_cobertura,
             s.capacidad_carga_kg, s.precio_envio, s.estado, s.created_at,
             s.horario_disponible,
             s.calificacion_promedio, s.total_calificaciones,
             (
               SELECT json_agg(json_build_object('url_foto', f.url_foto, 'orden', f.orden))
               FROM (
                 SELECT url_foto, orden FROM fotos_servicio
                 WHERE servicio_id = s.id
                 ORDER BY orden ASC
               ) f
             ) AS fotos
      FROM servicios_envio s
      WHERE s.operador_id = $1 AND s.estado = $2
      ORDER BY s.created_at DESC
      LIMIT $3 OFFSET $4
    `;

    const { rows } = await db.pool.query(query, [
      req.usuario.id,
      estadoFiltro,
      porPagina,
      offset
    ]);

    const items = rows.map(r => ({
      id: r.id,
      nombre_servicio: r.nombre_servicio,
      descripcion: r.descripcion,
      zona_cobertura: r.zona_cobertura,
      capacidad_carga_kg: parseFloat(r.capacidad_carga_kg),
      precio_envio: parseFloat(r.precio_envio),
      estado: r.estado,
      horario_disponible: r.horario_disponible,
      calificacion_promedio: parseFloat(r.calificacion_promedio || 0),
      total_calificaciones: parseInt(r.total_calificaciones || 0),
      fotos: r.fotos || [],
      created_at: r.created_at
    }));

    res.status(200).json({
      success: true,
      message: "Servicios obtenidos exitosamente.",
      data: {
        items,
        total: totalItems,
        pagina,
        por_pagina: porPagina,
        total_paginas: totalPaginas
      }
    });

  } catch (error) {
    console.error("Error al listar servicios:", error);
    res.status(500).json({
      success: false,
      message: "Error al mostrar los servicios.",
      error: { code: "INTERNAL_ERROR", details: error.message }
    });
  }
};

module.exports = {
  crearServicio,
  listarMisServicios
};
