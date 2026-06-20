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

const actualizarServicio = async (req, res) => {
  const { id } = req.params;
  const {
    nombre_servicio,
    descripcion,
    zona_cobertura,
    capacidad_carga_kg,
    precio_envio,
    horario_disponible
  } = req.body;

  try {
    const checkRes = await db.pool.query(
      "SELECT id, operador_id FROM servicios_envio WHERE id = $1",
      [id]
    );

    if (checkRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Servicio no encontrado.",
        error: { code: "SERVICE_NOT_FOUND" }
      });
    }

    const servicioDb = checkRes.rows[0];
    if (servicioDb.operador_id !== req.usuario.id) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para modificar este servicio.",
        error: { code: "FORBIDDEN" }
      });
    }

    const fieldsToUpdate = [];
    const values = [];
    let paramIndex = 1;

    if (nombre_servicio !== undefined) {
      if (!nombre_servicio) {
        return res.status(400).json({
          success: false,
          message: "El nombre del servicio es obligatorio.",
          error: { code: "VALIDATION_ERROR" }
        });
      }
      fieldsToUpdate.push(`nombre_servicio = $${paramIndex++}`);
      values.push(nombre_servicio);
    }
    if (descripcion !== undefined) {
      fieldsToUpdate.push(`descripcion = $${paramIndex++}`);
      values.push(descripcion);
    }
    if (zona_cobertura !== undefined) {
      if (!zona_cobertura) {
        return res.status(400).json({
          success: false,
          message: "La zona de cobertura es obligatoria.",
          error: { code: "VALIDATION_ERROR" }
        });
      }
      fieldsToUpdate.push(`zona_cobertura = $${paramIndex++}`);
      values.push(zona_cobertura);
    }
    if (capacidad_carga_kg !== undefined) {
      if (capacidad_carga_kg === "" || isNaN(parseFloat(capacidad_carga_kg))) {
        return res.status(400).json({
          success: false,
          message: "La capacidad de carga debe ser un numero valido.",
          error: { code: "VALIDATION_ERROR" }
        });
      }
      fieldsToUpdate.push(`capacidad_carga_kg = $${paramIndex++}`);
      values.push(parseFloat(capacidad_carga_kg));
    }
    if (precio_envio !== undefined) {
      if (precio_envio === "" || isNaN(parseFloat(precio_envio))) {
        return res.status(400).json({
          success: false,
          message: "El precio de envio debe ser un numero valido.",
          error: { code: "VALIDATION_ERROR" }
        });
      }
      fieldsToUpdate.push(`precio_envio = $${paramIndex++}`);
      values.push(parseFloat(precio_envio));
    }
    if (horario_disponible !== undefined) {
      if (!horario_disponible) {
        return res.status(400).json({
          success: false,
          message: "El horario disponible es obligatorio.",
          error: { code: "VALIDATION_ERROR" }
        });
      }
      fieldsToUpdate.push(`horario_disponible = $${paramIndex++}`);
      values.push(horario_disponible);
    }

    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No se enviaron campos para actualizar.",
        error: { code: "VALIDATION_ERROR" }
      });
    }

    values.push(id);
    const updateQuery = `
      UPDATE servicios_envio
      SET ${fieldsToUpdate.join(", ")}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING id, nombre_servicio, descripcion, zona_cobertura, capacidad_carga_kg, precio_envio, horario_disponible, estado, created_at, updated_at
    `;

    const updateRes = await db.pool.query(updateQuery, values);
    const servicioActualizado = updateRes.rows[0];

    res.status(200).json({
      success: true,
      message: "Servicio modificado exitosamente.",
      data: {
        id: servicioActualizado.id,
        nombre_servicio: servicioActualizado.nombre_servicio,
        descripcion: servicioActualizado.descripcion,
        zona_cobertura: servicioActualizado.zona_cobertura,
        capacidad_carga_kg: parseFloat(servicioActualizado.capacidad_carga_kg),
        precio_envio: parseFloat(servicioActualizado.precio_envio),
        horario_disponible: servicioActualizado.horario_disponible,
        estado: servicioActualizado.estado,
        created_at: servicioActualizado.created_at,
        updated_at: servicioActualizado.updated_at
      }
    });

  } catch (error) {
    console.error("Error al actualizar servicio:", error);
    res.status(500).json({
      success: false,
      message: "Error interno al modificar el servicio.",
      error: { code: "INTERNAL_ERROR", details: error.message }
    });
  }
};

const eliminarServicio = async (req, res) => {
  const { id } = req.params;

  try {
    const checkRes = await db.pool.query(
      "SELECT id, operador_id FROM servicios_envio WHERE id = $1",
      [id]
    );

    if (checkRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Servicio no encontrado.",
        error: { code: "SERVICE_NOT_FOUND" }
      });
    }

    const servicioDb = checkRes.rows[0];
    if (servicioDb.operador_id !== req.usuario.id) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para eliminar este servicio.",
        error: { code: "FORBIDDEN" }
      });
    }

    // Verificar si tiene reservaciones activas
    const activeBookingsRes = await db.pool.query(
      "SELECT COUNT(*) FROM reservaciones WHERE servicio_envio_id = $1 AND estado IN ('pendiente_pago', 'confirmado', 'en_transito')",
      [id]
    );

    if (parseInt(activeBookingsRes.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: "No se puede eliminar el servicio porque tiene reservaciones activas en proceso.",
        error: { code: "HAS_ACTIVE_BOOKINGS" }
      });
    }

    // Verificar si tiene alguna reservacion histórica
    const anyBookingsRes = await db.pool.query(
      "SELECT COUNT(*) FROM reservaciones WHERE servicio_envio_id = $1",
      [id]
    );
    const hasAnyBookings = parseInt(anyBookingsRes.rows[0].count) > 0;

    if (hasAnyBookings) {
      // Eliminación lógica
      await db.pool.query(
        "UPDATE servicios_envio SET estado = 'eliminado', updated_at = NOW() WHERE id = $1",
        [id]
      );
    } else {
      // Eliminación física (limpia fotos automáticamente por ON DELETE CASCADE en fotos_servicio)
      await db.pool.query(
        "DELETE FROM servicios_envio WHERE id = $1",
        [id]
      );
    }

    res.status(200).json({
      success: true,
      message: "Servicio eliminado exitosamente."
    });

  } catch (error) {
    console.error("Error al eliminar servicio:", error);
    res.status(500).json({
      success: false,
      message: "Error interno al eliminar el servicio.",
      error: { code: "INTERNAL_ERROR", details: error.message }
    });
  }
};

module.exports = {
  crearServicio,
  listarMisServicios,
  actualizarServicio,
  eliminarServicio
};
