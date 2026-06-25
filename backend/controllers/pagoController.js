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
    const { metodo_pago_id } = req.body;

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
        const totalPagar = carrito.rows.reduce((acc, item) => acc + parseFloat(item.subtotal), 0);

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

module.exports = {
    obtenerMetodosPago,
    agregarMetodoPago,
    procesarPago
};