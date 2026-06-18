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

  // campos obligatorios: empresa_id, nombre_ruta, origen, destino, tipo_servicio, precio
  if (!empresa_id || !nombre_ruta || !origen || !destino || !tipo_servicio || precio === undefined) {
    return res.status(400).json({
      success: false,
      message: "Faltan campos obligatorios (empresa_id, nombre_ruta, origen, destino, tipo_servicio, precio)."
    });
  }

  try {
    // primero verificamos que la empresa de transporte exista
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

    // luego insertamos la nueva ruta en la base de datos
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

module.exports = {
  registrarRutaManual
};