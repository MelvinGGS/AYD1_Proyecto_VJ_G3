const db = require("../config/db");
const bcrypt = require("bcrypt");

// Funcion para obetener todos los métodos de pago de un cliente específico
const obtenerMetodosPago = async (req, res) => {
    const clienteId = req.usuario.id;
    try {
        const { rows } = await db.pool.query(
            "SELECT id, tipo, numero_tarjeta, nombre_tarjeta, fecha_vencimiento, wallet_id, saldo, es_predeterminado FROM metodos_pago WHERE cliente_id = $1 AND activo = TRUE ORDER BY created_at DESC",
            [clienteId]
        );
        // Enmascarar número de tarjeta por seguridad visual
        const metodos = rows.map(m => {
            if (m.tipo === 'tarjeta' && m.numero_tarjeta) {
                m.numero_tarjeta = `**** **** **** ${m.numero_tarjeta.slice(-4)}`;
            }
            return m;
        });
        res.status(200).json({ success: true, data: metodos });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al obtener métodos de pago." });
    }
};

// Funcion para agregar un método de pago (tarjeta o wallet) a un cliente específico
const agregarMetodoPago = async (req, res) => {
    const clienteId = req.usuario.id;
    const { tipo, numero_tarjeta, nombre_tarjeta, fecha_vencimiento, cvv, wallet_id } = req.body;

    if (!tipo || !['tarjeta', 'wallet'].includes(tipo)) {
        return res.status(400).json({ success: false, message: "Tipo de pago inválido." });
    }

    try {
        let query = "";
        let valores = [];

        if (tipo === 'tarjeta') {
            if (!numero_tarjeta || !nombre_tarjeta || !fecha_vencimiento || !cvv) {
                return res.status(400).json({ success: false, message: "Faltan datos de la tarjeta." });
            }
            const cvvHash = await bcrypt.hash(cvv, 10);
            query = `
                INSERT INTO metodos_pago (cliente_id, tipo, numero_tarjeta, nombre_tarjeta, fecha_vencimiento, cvv_hash, saldo)
                VALUES ($1, $2, $3, $4, $5, $6, 1000.00) RETURNING id, tipo, saldo;
            `;
            valores = [clienteId, tipo, numero_tarjeta, nombre_tarjeta, fecha_vencimiento, cvvHash];
        } else if (tipo === 'wallet') {
            if (!wallet_id) return res.status(400).json({ success: false, message: "Falta el ID de la wallet." });
            query = `
                INSERT INTO metodos_pago (cliente_id, tipo, wallet_id, saldo)
                VALUES ($1, $2, $3, 1000.00) RETURNING id, tipo, saldo;
            `;
            valores = [clienteId, tipo, wallet_id];
        }

        const { rows } = await db.pool.query(query, valores);
        res.status(201).json({
            success: true,
            message: "Método de pago agregado con Q1,000.00 de saldo simulado.",
            data: rows[0]
        });

    } catch (error) {
        res.status(500).json({ success: false, message: "Error al agregar método de pago." });
    }
};

// Funcion para procesar el pago (Checkout)
const procesarPago = async (req, res) => {
    const clienteId = req.usuario.id;
    const { metodo_pago_id, cupon_codigo } = req.body;

    if (!metodo_pago_id) return res.status(400).json({ success: false, message: "Debe seleccionar un método de pago." });

    const client = await db.pool.connect();

    try {
        await client.query("BEGIN");

        // Obtenemos todos los elementos del carrito del cliente
        const carrito = await client.query("SELECT * FROM carrito_compras WHERE cliente_id = $1", [clienteId]);
        if (carrito.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(400).json({ success: false, message: "El carrito está vacío." });
        }

        // Calculamos el total a pagar sumando los subtotales de cada ítem
        let totalPagar = carrito.rows.reduce((acc, item) => acc + parseFloat(item.subtotal), 0);

        if (cupon_codigo) {
            const cuponRes = await client.query(
                `SELECT c.*, cc.id AS cc_id FROM cupones c
     INNER JOIN cupones_clientes cc ON cc.cupon_id = c.id
     WHERE c.codigo = $1 AND cc.cliente_id = $2 AND cc.canjeado = false AND c.estado = 'activo'`,
                [cupon_codigo.toUpperCase(), clienteId]
            );

            if (cuponRes.rows.length > 0) {
                const cupon = cuponRes.rows[0];
                const descuento = cupon.tipo_descuento === "porcentaje"
                    ? totalPagar * (parseFloat(cupon.valor_descuento) / 100)
                    : parseFloat(cupon.valor_descuento);
                totalPagar = Math.max(0, totalPagar - descuento);

                await client.query(
                    `UPDATE cupones_clientes SET canjeado = true, fecha_canje = NOW()
       WHERE id = $1`,
                    [cupon.cc_id]
                );

                await client.query(
                    `UPDATE cupones SET usos_actuales = usos_actuales + 1 WHERE id = $1`,
                    [cupon.id]
                );
            }
        }

        // C. Verificar saldo simulado
        const metodo = await client.query("SELECT id, saldo FROM metodos_pago WHERE id = $1 AND cliente_id = $2 AND activo = TRUE", [metodo_pago_id, clienteId]);
        if (metodo.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ success: false, message: "Método de pago no encontrado o inactivo." });
        }

        const saldoActual = parseFloat(metodo.rows[0].saldo);
        if (saldoActual < totalPagar) {
            await client.query("ROLLBACK");
            return res.status(400).json({ success: false, message: `Saldo insuficiente. Saldo disponible: Q${saldoActual.toFixed(2)}` });
        }

        // Descontamos el total del saldo del método de pago simulado
        await client.query("UPDATE metodos_pago SET saldo = saldo - $1 WHERE id = $2", [totalPagar, metodo_pago_id]);

        // Procesamos cada ítem del carrito: creamos reservaciones y registramos pagos
        for (const item of carrito.rows) {
            // Regla de negocio: 20% comisión envíos, 10% transporte
            const comisionPorcentaje = item.tipo_servicio === 'envio' ? 0.20 : 0.10;
            const gananciaPorcentaje = item.tipo_servicio === 'envio' ? 0.80 : 0.90;

            const comision = (parseFloat(item.subtotal) * comisionPorcentaje).toFixed(2);
            const ganancia = (parseFloat(item.subtotal) * gananciaPorcentaje).toFixed(2);

            const resReserva = await client.query(`
                INSERT INTO reservaciones (
                    cliente_id, tipo_servicio, servicio_envio_id, ruta_transporte_id, estado,
                    fecha_inicio, fecha_fin, precio_total, comision_plataforma, ganancia_proveedor
                ) VALUES ($1, $2, $3, $4, 'confirmado', $5, $6, $7, $8, $9) RETURNING id
            `, [
                clienteId, item.tipo_servicio, item.servicio_envio_id, item.ruta_transporte_id,
                item.fecha_inicio, item.fecha_fin, item.subtotal, comision, ganancia
            ]);

            const reservaId = resReserva.rows[0].id;
            const referencia = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

            await client.query(`
                INSERT INTO pagos (reservacion_id, cliente_id, metodo_pago_id, monto, estado, referencia)
                VALUES ($1, $2, $3, $4, 'completado', $5)
            `, [reservaId, clienteId, metodo_pago_id, item.subtotal, referencia]);
        }

        // Vaciar el carrito del cliente después de procesar el pago
        await client.query("DELETE FROM carrito_compras WHERE cliente_id = $1", [clienteId]);

        await client.query("COMMIT");
        res.status(200).json({ success: true, message: "Pago procesado exitosamente. ¡Reservaciones confirmadas!" });

    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error al procesar el pago:", error);
        res.status(500).json({ success: false, message: "Error interno al procesar el pago." });
    } finally {
        client.release();
    }
};

// Cancelar reservación y aplicar mecanismo de reembolso
const cancelarReservacion = async (req, res) => {
    const clienteId = req.usuario.id;
    const { reservacion_id } = req.params;

    const client = await db.pool.connect();
    try {
        await client.query("BEGIN");

        // 1. Obtener la reserva y validar que exista
        const reservaRes = await client.query(
            "SELECT * FROM reservaciones WHERE id = $1 AND cliente_id = $2",
            [reservacion_id, clienteId]
        );

        if (reservaRes.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ success: false, message: "Reservación no encontrada." });
        }

        const reserva = reservaRes.rows[0];

        if (reserva.estado === 'cancelado' || reserva.estado === 'reembolsado') {
            await client.query("ROLLBACK");
            return res.status(400).json({ success: false, message: "La reservación ya fue cancelada o reembolsada anteriormente." });
        }

        // 2. Mecanismo de validación: 24 horas de anticipación
        const fechaServicio = new Date(reserva.fecha_inicio);
        const ahora = new Date();
        const diferenciaHoras = (fechaServicio - ahora) / (1000 * 60 * 60);

        if (diferenciaHoras < 24) {
            await client.query("ROLLBACK");
            return res.status(400).json({
                success: false,
                message: "Política de cancelación: Solo se permite cancelar con al menos 24 horas de anticipación a la fecha del servicio."
            });
        }

        // 3. Actualizar el estado de la reservación a 'cancelado'
        await client.query(
            "UPDATE reservaciones SET estado = 'cancelado', fecha_cancelacion = NOW(), motivo_cancelacion = 'Cancelación voluntaria del cliente' WHERE id = $1",
            [reservacion_id]
        );

        // 4. Buscar el pago original para ejecutar el reembolso
        const pagoRes = await client.query(
            "SELECT * FROM pagos WHERE reservacion_id = $1 AND estado = 'completado'",
            [reservacion_id]
        );

        if (pagoRes.rows.length > 0) {
            const pago = pagoRes.rows[0];

            // A. Devolver el dinero al saldo de la tarjeta/wallet
            await client.query(
                "UPDATE metodos_pago SET saldo = saldo + $1 WHERE id = $2",
                [pago.monto, pago.metodo_pago_id]
            );

            // B. Actualizar el estado del pago a 'reembolsado'
            await client.query(
                "UPDATE pagos SET estado = 'reembolsado', monto_reembolso = $1, fecha_reembolso = NOW() WHERE id = $2",
                [pago.monto, pago.id]
            );
        }

        await client.query("COMMIT");
        res.status(200).json({ success: true, message: "Reservación cancelada y dinero reembolsado exitosamente a tu método de pago." });

    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error al cancelar reservación:", error);
        res.status(500).json({ success: false, message: "Error interno al procesar el reembolso." });
    } finally {
        client.release();
    }
};

const obtenerMisReservaciones = async (req, res) => {
    const clienteId = req.usuario.id;
    try {
        const { rows } = await db.pool.query(`
            SELECT 
                r.id, r.estado, r.fecha_inicio, r.precio_total, r.tipo_servicio,
                rt.nombre_ruta AS nombre_transporte,
                rt.empresa_id,
                se.nombre_servicio AS nombre_envio,
                se.operador_id,
                EXISTS (SELECT 1 FROM calificaciones c WHERE c.reservacion_id = r.id) AS ha_calificado,
                EXISTS (SELECT 1 FROM reportes rep WHERE rep.reservacion_id = r.id) AS ha_reportado,
                (SELECT estado FROM reportes rep WHERE rep.reservacion_id = r.id LIMIT 1) AS estado_reporte,
                (SELECT respuesta_empresa FROM reportes rep WHERE rep.reservacion_id = r.id LIMIT 1) AS respuesta_reporte
            FROM reservaciones r
            LEFT JOIN rutas_transporte rt ON r.ruta_transporte_id = rt.id
            LEFT JOIN servicios_envio se ON r.servicio_envio_id = se.id
            WHERE r.cliente_id = $1
            ORDER BY r.created_at DESC
        `, [clienteId]);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al obtener reservaciones." });
    }
};

module.exports = {
    obtenerMetodosPago,
    agregarMetodoPago,
    procesarPago,
    cancelarReservacion,
    obtenerMisReservaciones
};