const db = require('../config/db');

const crearCalificacion = async (req, res) => {
    
    const { reservacion_id, puntuacion, comentario } = req.body;

    const cliente_id = req.usuario ? req.usuario.id : req.body.cliente_id;

    try {
        // Consultar los detalles de la reservación para saber a qué ruta pertenece
        const reservaQuery = await db.pool.query(
            "SELECT tipo_servicio, servicio_envio_id, ruta_transporte_id FROM reservaciones WHERE id = $1 AND cliente_id = $2",
            [reservacion_id, cliente_id]
        );

        if (reservaQuery.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Reservación no encontrada o no te pertenece." });
        }

        const reserva = reservaQuery.rows[0];

        // Insertar la calificación con los datos exactos que pide la tabla
        const insertQuery = `
            INSERT INTO calificaciones (
                cliente_id, reservacion_id, tipo_servicio, 
                servicio_envio_id, ruta_transporte_id, 
                puntuacion, comentario
            ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id;
        `;
        
        const valores = [
            cliente_id,
            reservacion_id,
            reserva.tipo_servicio,
            reserva.servicio_envio_id,
            reserva.ruta_transporte_id,
            puntuacion,
            comentario || ""
        ];

        await db.pool.query(insertQuery, valores);

        res.status(201).json({ success: true, message: "¡Calificación registrada con éxito!" });

    } catch (error) {
        // Manejo especial si el cliente intenta calificar el mismo viaje dos veces
        if (error.constraint === 'uq_calificacion_reservacion') {
            return res.status(400).json({ success: false, message: "Ya has calificado este servicio anteriormente." });
        }
        
        console.error("Error al guardar calificación:", error);
        res.status(500).json({ success: false, message: "Error interno al guardar la calificación." });
    }
};

module.exports = { crearCalificacion };