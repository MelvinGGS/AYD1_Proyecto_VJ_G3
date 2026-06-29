const pool = require('../config/db'); 

// Crear el reporte (Con Multer para la foto)
const crearReporte = async (req, res) => {
    const { cliente_id, proveedor_id, tipo_servicio, reservacion_id, motivo, descripcion } = req.body;
    
    let rutaEvidencia = null;
    if (req.file) {
        rutaEvidencia = `/.upload/${req.file.filename}`;
    }

    try {
        
        const existeReporte = await pool.query(
            "SELECT id FROM reportes WHERE reservacion_id = $1", 
            [reservacion_id]
        );
        if (existeReporte.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'Ya has reportado este servicio anteriormente.' });
        }
        let finalProveedorId = proveedor_id;
        let finalTipoServicio = tipo_servicio;

        const resQuery = await pool.query(`
            SELECT r.tipo_servicio, rt.empresa_id, se.operador_id 
            FROM reservaciones r
            LEFT JOIN rutas_transporte rt ON r.ruta_transporte_id = rt.id
            LEFT JOIN servicios_envio se ON r.servicio_envio_id = se.id
            WHERE r.id = $1
        `, [reservacion_id]);

        if (resQuery.rows.length > 0) {
            const reserva = resQuery.rows[0];
            finalTipoServicio = reserva.tipo_servicio;
            finalProveedorId = reserva.tipo_servicio === 'envio' ? reserva.operador_id : reserva.empresa_id;
        }

        if (!finalProveedorId) {
            return res.status(404).json({ success: false, message: 'No se pudo asociar el reporte a ningún proveedor u operador válido.' });
        }
        await pool.query(
            `INSERT INTO reportes (reportado_por, reportado_usuario, tipo_servicio, reservacion_id, motivo, descripcion, evidencia, estado) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'enviado')`,
            [cliente_id, finalProveedorId, finalTipoServicio, reservacion_id, motivo, descripcion, rutaEvidencia]
        );

        res.status(201).json({ success: true, message: 'Reporte enviado para su estudio.' });
    } catch (error) {

        console.error("Error crítico al procesar el reporte:", error);
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
            `SELECT 
                r.*, 
                u.email as cliente_email,
                res.fecha_inicio AS fecha_servicio,
                res.precio_total,
                rt.nombre_ruta AS nombre_transporte,
                se.nombre_servicio AS nombre_envio
             FROM reportes r 
             JOIN usuarios u ON r.reportado_por = u.id 
             JOIN reservaciones res ON r.reservacion_id = res.id
             LEFT JOIN rutas_transporte rt ON res.ruta_transporte_id = rt.id
             LEFT JOIN servicios_envio se ON res.servicio_envio_id = se.id
             WHERE r.reportado_usuario = $1 
             ORDER BY r.fecha_creacion DESC`,
            [empresa_id]
        );
        res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error("Error en SQL:", error);
        res.status(500).json({ success: false, message: 'Error al cargar los reportes.' });
    }
};


const actualizarEstadoReporte = async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;
    
    try {
        await pool.query(
            "UPDATE reportes SET estado = $1, updated_at = NOW() WHERE id = $2",
            [estado, id]
        );
        res.status(200).json({ success: true, message: "Estado actualizado correctamente." });
    } catch (error) {
        console.error("Error al actualizar reporte:", error);
        res.status(500).json({ success: false, message: "Error al actualizar estado." });
    }
};

const responderReporte = async (req, res) => {
    const { id } = req.params;
    const { respuesta } = req.body;
    
    try {
        await pool.query(
            "UPDATE reportes SET respuesta_empresa = $1, updated_at = NOW() WHERE id = $2",
            [respuesta, id]
        );
        res.status(200).json({ success: true, message: "Respuesta enviada exitosamente." });
    } catch (error) {
        console.error("Error al responder reporte:", error);
        res.status(500).json({ success: false, message: "Error al guardar la respuesta." });
    }
};

module.exports = { 
    crearReporte, 
    obtenerHistorialReportesCliente, 
    obtenerReportesContraEmpresa,
    actualizarEstadoReporte,
    responderReporte
};