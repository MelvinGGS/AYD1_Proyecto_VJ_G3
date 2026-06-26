const db = require("../config/db");

// Con esta funcion jalamos todos los elementos del carrito de compras de un cliente específico
const obtenerCarrito = async (req, res) => {
    // Tomamos el ID de forma segura desde el JWT validado
    const clienteId = req.usuario.id;

    try {
        const query = `
            SELECT 
                c.id, 
                c.tipo_servicio, 
                c.fecha_inicio, 
                c.fecha_fin, 
                c.cantidad, 
                c.precio_unitario, 
                c.subtotal, 
                c.descuento,
                se.id AS envio_id,
                se.nombre_servicio AS nombre_envio,
                rt.id AS transporte_id,
                rt.nombre_ruta AS nombre_transporte,
                rt.origen,
                rt.destino
            FROM carrito_compras c
            LEFT JOIN servicios_envio se ON c.servicio_envio_id = se.id
            LEFT JOIN rutas_transporte rt ON c.ruta_transporte_id = rt.id
            WHERE c.cliente_id = $1
            ORDER BY c.created_at DESC;
        `;

        const { rows } = await db.pool.query(query, [clienteId]);

        // Calculamos el gran total del carrito sumando todos los subtotales
        const total = rows.reduce((acc, item) => acc + parseFloat(item.subtotal), 0);

        res.status(200).json({
            success: true,
            data: rows,
            total: total.toFixed(2)
        });

    } catch (error) {
        console.error("Error al obtener el carrito:", error);
        res.status(500).json({ success: false, message: "Error al obtener el carrito de compras." });
    }
};

// Con esta funcion agregamos un servicio envío o transporte al carrito de compras de un cliente específico
const agregarAlCarrito = async (req, res) => {
    const clienteId = req.usuario.id;
    const { 
        tipo_servicio, // 'envio' o 'transporte'
        servicio_id,   // El ID del servicio o de la ruta
        fecha_inicio, 
        fecha_fin, 
        cantidad = 1, 
        precio_unitario 
    } = req.body;

    if (!tipo_servicio || !servicio_id || !fecha_inicio || !precio_unitario) {
        return res.status(400).json({ success: false, message: "Faltan datos obligatorios para agregar al carrito." });
    }

    if (!['envio', 'transporte'].includes(tipo_servicio)) {
        return res.status(400).json({ success: false, message: "El tipo de servicio debe ser 'envio' o 'transporte'." });
    }

    // Calculamos el subtotal
    const subtotal = (parseFloat(precio_unitario) * parseInt(cantidad)).toFixed(2);

    // Asignamos el ID al campo correspondiente según la tabla
    const servicioEnvioId = tipo_servicio === 'envio' ? servicio_id : null;
    const rutaTransporteId = tipo_servicio === 'transporte' ? servicio_id : null;

    try {
        const query = `
            INSERT INTO carrito_compras (
                cliente_id, tipo_servicio, servicio_envio_id, ruta_transporte_id, 
                fecha_inicio, fecha_fin, cantidad, precio_unitario, subtotal
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *;
        `;

        const valores = [
            clienteId, 
            tipo_servicio, 
            servicioEnvioId, 
            rutaTransporteId, 
            fecha_inicio, 
            fecha_fin || null, 
            cantidad, 
            precio_unitario, 
            subtotal
        ];

        const { rows } = await db.pool.query(query, valores);

        res.status(201).json({
            success: true,
            message: "Agregado al carrito exitosamente.",
            data: rows[0]
        });

    } catch (error) {
        console.error("Error al agregar al carrito:", error);
        res.status(500).json({ success: false, message: "Error interno al agregar elemento al carrito." });
    }
};

// Funcion para eliminar un elemento del carrito de compras de un cliente específico
const eliminarDelCarrito = async (req, res) => {
    const clienteId = req.usuario.id;
    const { id } = req.params; // ID del elemento en el carrito

    try {
        // Validamos que el elemento a eliminar pertenezca al cliente que hace la petición
        const { rows } = await db.pool.query(
            "DELETE FROM carrito_compras WHERE id = $1 AND cliente_id = $2 RETURNING id",
            [id, clienteId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Elemento no encontrado en tu carrito." });
        }

        res.status(200).json({ success: true, message: "Elemento eliminado del carrito." });

    } catch (error) {
        console.error("Error al eliminar del carrito:", error);
        res.status(500).json({ success: false, message: "Error interno al eliminar del carrito." });
    }
};

// Vaciar el carrito cuando se realiza el pago o cuando el cliente lo solicite
const vaciarCarrito = async (req, res) => {
    const clienteId = req.usuario.id;

    try {
        await db.pool.query("DELETE FROM carrito_compras WHERE cliente_id = $1", [clienteId]);
        res.status(200).json({ success: true, message: "El carrito ha sido vaciado." });
    } catch (error) {
        console.error("Error al vaciar el carrito:", error);
        res.status(500).json({ success: false, message: "Error interno al vaciar el carrito." });
    }
};

module.exports = {
    obtenerCarrito,
    agregarAlCarrito,
    eliminarDelCarrito,
    vaciarCarrito
};