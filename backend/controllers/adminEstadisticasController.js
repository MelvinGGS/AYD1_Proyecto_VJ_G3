// backend/controllers/adminEstadisticasController.js
const db = require("../config/db");

const obtenerEstadisticasYLogs = async (req, res) => {
  try {
    // 1. Logs de registros y vetos (conteo por estados y roles)
    const logRegistroVetosPromise = db.pool.query(`
      SELECT 
        u.rol, 
        u.estado, 
        COUNT(*) AS total
      FROM usuarios u
      GROUP BY u.rol, u.estado
    `);

    // 1b. Solicitudes de registro por estado
    const solicitudesRegistroPromise = db.pool.query(`
      SELECT 
        u.rol, 
        sr.estado, 
        COUNT(*) AS total
      FROM solicitudes_registro sr
      INNER JOIN usuarios u ON u.id = sr.usuario_id
      GROUP BY u.rol, sr.estado
    `);

    // 2. Resumen de reportes emitidos y su estado
    const resumenReportesPromise = db.pool.query(`
      SELECT 
        estado, 
        COUNT(*) AS total
      FROM reportes
      GROUP BY estado
    `);

    // 3. Historial de usuarios con mayor gasto
    const mayorGastoPromise = db.pool.query(`
      SELECT 
        c.id, 
        c.nombre, 
        c.apellido, 
        u.email, 
        COALESCE(SUM(p.monto), 0) AS total_gasto
      FROM clientes c
      INNER JOIN usuarios u ON u.id = c.id
      LEFT JOIN pagos p ON p.cliente_id = c.id AND p.estado = 'completado'
      GROUP BY c.id, c.nombre, c.apellido, u.email
      ORDER BY total_gasto DESC
      LIMIT 20
    `);

    // 4. Historial de envíos realizados
    const enviosRealizadosPromise = db.pool.query(`
      SELECT 
        r.id, 
        r.created_at, 
        r.direccion_origen, 
        r.direccion_destino, 
        r.precio_total, 
        r.estado,
        c.nombre AS cliente_nombre, 
        c.apellido AS cliente_apellido,
        ol.nombre AS operador_nombre, 
        ol.apellido AS operador_apellido
      FROM reservaciones r
      INNER JOIN clientes c ON c.id = r.cliente_id
      INNER JOIN servicios_envio se ON se.id = r.servicio_envio_id
      INNER JOIN operadores_logisticos ol ON ol.id = se.operador_id
      WHERE r.tipo_servicio = 'envio'
      ORDER BY r.created_at DESC
      LIMIT 50
    `);

    // 5. Historial de servicios de transporte
    const transporteRealizadosPromise = db.pool.query(`
      SELECT 
        r.id, 
        r.created_at, 
        r.precio_total, 
        r.estado,
        c.nombre AS cliente_nombre, 
        c.apellido AS cliente_apellido,
        rt.nombre_ruta, 
        rt.origen, 
        rt.destino,
        et.nombre_empresa
      FROM reservaciones r
      INNER JOIN clientes c ON c.id = r.cliente_id
      INNER JOIN rutas_transporte rt ON rt.id = r.ruta_transporte_id
      INNER JOIN empresas_transporte et ON et.id = rt.empresa_id
      WHERE r.tipo_servicio = 'transporte'
      ORDER BY r.created_at DESC
      LIMIT 50
    `);

    // 6. Zonas con mayor volumen de envíos
    const zonasEnviosPromise = db.pool.query(`
      SELECT 
        se.zona_cobertura AS zona, 
        COUNT(r.id) AS total_envios
      FROM reservaciones r
      INNER JOIN servicios_envio se ON se.id = r.servicio_envio_id
      WHERE r.tipo_servicio = 'envio'
      GROUP BY se.zona_cobertura
      ORDER BY total_envios DESC
    `);

    // 7. Servicios de transporte más utilizados
    const transporteMasUtilizadosPromise = db.pool.query(`
      SELECT 
        rt.nombre_ruta, 
        et.nombre_empresa, 
        COUNT(r.id) AS total_reservas
      FROM reservaciones r
      INNER JOIN rutas_transporte rt ON rt.id = r.ruta_transporte_id
      INNER JOIN empresas_transporte et ON et.id = rt.empresa_id
      WHERE r.tipo_servicio = 'transporte'
      GROUP BY rt.id, rt.nombre_ruta, et.nombre_empresa
      ORDER BY total_reservas DESC
      LIMIT 10
    `);

    // 8. Ingresos generados por la plataforma
    const ingresosPlataformaPromise = db.pool.query(`
      SELECT 
        tipo_servicio, 
        SUM(precio_total) AS total_ingresos,
        SUM(comision_plataforma) AS total_comisiones
      FROM reservaciones
      WHERE estado = 'confirmado' OR estado = 'entregado'
      GROUP BY tipo_servicio
    `);

    // 9. Destinos más frecuentes (envíos)
    const destinosEnviosPromise = db.pool.query(`
      SELECT 
        direccion_destino AS destino, 
        COUNT(*) AS total
      FROM reservaciones
      WHERE tipo_servicio = 'envio' AND direccion_destino IS NOT NULL
      GROUP BY direccion_destino
      ORDER BY total DESC
      LIMIT 10
    `);

    // 10. Destinos más frecuentes (transporte)
    const destinosTransportePromise = db.pool.query(`
      SELECT 
        rt.destino AS destino, 
        COUNT(*) AS total
      FROM reservaciones r
      INNER JOIN rutas_transporte rt ON rt.id = r.ruta_transporte_id
      WHERE r.tipo_servicio = 'transporte'
      GROUP BY rt.destino
      ORDER BY total DESC
      LIMIT 10
    `);

    // 11. Uso de clientes
    const usoClientesPromise = db.pool.query(`
      WITH cliente_bookings AS (
        SELECT 
          cliente_id,
          COUNT(CASE WHEN tipo_servicio = 'envio' THEN 1 END) AS envios_count,
          COUNT(CASE WHEN tipo_servicio = 'transporte' THEN 1 END) AS transporte_count
        FROM reservaciones
        GROUP BY cliente_id
      )
      SELECT 
        COUNT(CASE WHEN envios_count > 0 AND transporte_count = 0 THEN 1 END) AS solo_envios,
        COUNT(CASE WHEN transporte_count > 0 AND envios_count = 0 THEN 1 END) AS solo_transporte,
        COUNT(CASE WHEN envios_count > 0 AND transporte_count > 0 THEN 1 END) AS ambos_servicios
      FROM cliente_bookings
    `);

    // Ejecutar todas las promesas concurrentemente
    const [
      logRegistroVetos,
      solicitudesRegistro,
      resumenReportes,
      mayorGasto,
      enviosRealizados,
      transporteRealizados,
      zonasEnvios,
      transporteMasUtilizados,
      ingresosPlataforma,
      destinosEnvios,
      destinosTransporte,
      usoClientes
    ] = await Promise.all([
      logRegistroVetosPromise,
      solicitudesRegistroPromise,
      resumenReportesPromise,
      mayorGastoPromise,
      enviosRealizadosPromise,
      transporteRealizadosPromise,
      zonasEnviosPromise,
      transporteMasUtilizadosPromise,
      ingresosPlataformaPromise,
      destinosEnviosPromise,
      destinosTransportePromise,
      usoClientesPromise
    ]);

    res.json({
      success: true,
      data: {
        usuarios_estado: logRegistroVetos.rows,
        solicitudes_registro: solicitudesRegistro.rows,
        resumen_reportes: resumenReportes.rows,
        mayor_gasto: mayorGasto.rows,
        envios_realizados: enviosRealizados.rows,
        transporte_realizados: transporteRealizados.rows,
        zonas_envios: zonasEnvios.rows,
        transporte_mas_utilizados: transporteMasUtilizados.rows,
        ingresos_plataforma: ingresosPlataforma.rows,
        destinos_envios: destinosEnvios.rows,
        destinos_transporte: destinosTransporte.rows,
        uso_clientes: usoClientes.rows[0] || { solo_envios: 0, solo_transporte: 0, ambos_servicios: 0 }
      }
    });
  } catch (error) {
    console.error("Error al obtener estadisticas de administrador:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener estadisticas y reportes.",
      error: { code: "INTERNAL_ERROR", details: error.message }
    });
  }
};

const listarLogs = async (req, res) => {
  try {
    const query = `
      SELECT l.*, u.email AS usuario_email, u.rol AS usuario_rol
      FROM log_actividad l
      LEFT JOIN usuarios u ON u.id = l.usuario_id
      ORDER BY l.created_at DESC
      LIMIT 100
    `;
    const { rows } = await db.pool.query(query);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error al listar logs de actividad:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener logs de actividad.",
      error: { code: "INTERNAL_ERROR", details: error.message }
    });
  }
};

module.exports = {
  obtenerEstadisticasYLogs,
  listarLogs
};
