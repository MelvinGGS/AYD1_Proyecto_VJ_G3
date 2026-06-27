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

module.exports = { obtenerPerfil, editarPerfil };