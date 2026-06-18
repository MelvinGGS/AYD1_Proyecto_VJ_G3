const db = require("../config/db");

// Registrar una ruta manualmente
const registrarRutaManual = async (req, res) => {
  const {
    empresa_id, // ID del usuario (empresa) que está creando la ruta
    nombre_ruta,
    origen,
    destino,
    tipo_servicio,
    precio,
    tiempo_estimado,
    hora_salida,
    hora_llegada_estimada,
    dias_disponibles,
    capacidad_pasajeros
  } = req.body;

  // Campos obligatorios: empresa_id, nombre_ruta, origen, destino, tipo_servicio, precio
  if (!empresa_id || !nombre_ruta || !origen || !destino || !tipo_servicio || precio === undefined) {
    return res.status(400).json({
      success: false,
      message: "Faltan campos obligatorios (empresa_id, nombre_ruta, origen, destino, tipo_servicio, precio)."
    });
  }

  try {
    // Primero verificamos que la empresa de transporte exista
    const empresaCheck = await db.pool.query(
      "SELECT id FROM empresas_transporte WHERE id = $1",
      [empresa_id]
    );

    if (empresaCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "La empresa de transporte especificada no existe."
      });
    }

    // Luego insertamos la nueva ruta en la base de datos
    const insertQuery = `
      INSERT INTO rutas_transporte (
        empresa_id, nombre_ruta, origen, destino, tipo_servicio, 
        precio, tiempo_estimado, hora_salida, hora_llegada_estimada, 
        dias_disponibles, capacidad_pasajeros
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *;
    `;

    const valores = [
      empresa_id,
      nombre_ruta,
      origen,
      destino,
      tipo_servicio,
      precio,
      tiempo_estimado || null,
      hora_salida || null,
      hora_llegada_estimada || null,
      dias_disponibles || null,
      capacidad_pasajeros || null
    ];

    const result = await db.pool.query(insertQuery, valores);

    res.status(201).json({
      success: true,
      message: "Ruta registrada exitosamente.",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Error al registrar ruta manual:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor al registrar la ruta."
    });
  }
};

// Editar una ruta existente
const editarRuta = async (req, res) => {
  const { id } = req.params; // El ID de la ruta viene en la URL
  const {
    empresa_id, // Para validar que la empresa es dueña de la ruta
    nombre_ruta,
    tipo_servicio,
    precio,
    tiempo_estimado,
    hora_salida,
    hora_llegada_estimada,
    dias_disponibles,
    capacidad_pasajeros
  } = req.body;

  if (!empresa_id) {
    return res.status(400).json({ success: false, message: "Se requiere el ID de la empresa para autorizar el cambio." });
  }

  try {
    // Primero verificamos que la ruta exista y que pertenezca a la empresa que intenta editarla
    const rutaCheck = await db.pool.query(
      "SELECT id FROM rutas_transporte WHERE id = $1 AND empresa_id = $2",
      [id, empresa_id]
    );

    if (rutaCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ruta no encontrada o no tienes permisos para editarla."
      });
    }

    // Actualizamos solo los campos que se proporcionen 
    // (si no se proporciona un campo, se mantiene el valor actual) los campos origen y 
    // destino no se pueden editar si ya hay reservas asociadas a la ruta

    // Se usa COALESCE para mantener el valor actual si no se proporciona un nuevo valor 
    // en la solicitud
    const updateQuery = `
      UPDATE rutas_transporte 
      SET 
        nombre_ruta = COALESCE($1, nombre_ruta),
        tipo_servicio = COALESCE($2, tipo_servicio),
        precio = COALESCE($3, precio),
        tiempo_estimado = COALESCE($4, tiempo_estimado),
        hora_salida = COALESCE($5, hora_salida),
        hora_llegada_estimada = COALESCE($6, hora_llegada_estimada),
        dias_disponibles = COALESCE($7, dias_disponibles),
        capacidad_pasajeros = COALESCE($8, capacidad_pasajeros)
      WHERE id = $9
      RETURNING *;
    `;

    const valores = [
      nombre_ruta, tipo_servicio, precio, tiempo_estimado, 
      hora_salida, hora_llegada_estimada, dias_disponibles, 
      capacidad_pasajeros, id
    ];

    const result = await db.pool.query(updateQuery, valores);

    res.status(200).json({
      success: true,
      message: "Ruta actualizada exitosamente.",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Error al editar ruta:", error);
    res.status(500).json({
      success: false,
      message: "Error interno al actualizar la ruta."
    });
  }
};


module.exports = {
  registrarRutaManual,
  editarRuta
};