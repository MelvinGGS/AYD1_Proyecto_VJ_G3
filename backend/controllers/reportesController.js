const pool = require('../config/db'); 

// Crear el reporte (Con Multer para la foto)
const crearReporte = async (req, res) => {
    const { cliente_id, proveedor_id, tipo_servicio, reservacion_id, motivo, descripcion } = req.body;
    
    let rutaEvidencia = null;
    if (req.file) {
        rutaEvidencia = `/.upload/${req.file.filename}`;
    }

    try {
        await pool.query(
            `INSERT INTO reportes (reportado_por, reportado_usuario, tipo_servicio, reservacion_id, motivo, descripcion, evidencia, estado) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'enviado')`,
            [cliente_id, proveedor_id, tipo_servicio, reservacion_id, motivo, descripcion, rutaEvidencia]
        );

        res.status(201).json({ success: true, message: 'Reporte enviado para su estudio.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al enviar el reporte.' });
    }
};

// Obtener el historial para la vista del Cliente
const obtenerHistorialReportesCliente = async (req, res) => {
    const { cliente_id } = req.params;
    try {
        const result = await pool.query(
            'SELECT * FROM reportes WHERE reportado_por = $1 ORDER BY fecha_creacion DESC',
            [cliente_id]
        );
        res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener historial.' });
    }
};

// Obtener los reportes para la vista de la Empresa de Transporte
const obtenerReportesContraEmpresa = async (req, res) => {
    const { empresa_id } = req.params;
    try {
        const result = await pool.query(
            `SELECT r.*, u.email as cliente_email 
             FROM reportes r 
             JOIN usuarios u ON r.reportado_por = u.id 
             WHERE r.reportado_usuario = $1 ORDER BY r.fecha_creacion DESC`,
            [empresa_id]
        );
        res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error("Error en SQL:", error);
        res.status(500).json({ success: false, message: 'Error al cargar los reportes.' });
    }
};

module.exports = { 
    crearReporte, 
    obtenerHistorialReportesCliente, 
    obtenerReportesContraEmpresa 
};