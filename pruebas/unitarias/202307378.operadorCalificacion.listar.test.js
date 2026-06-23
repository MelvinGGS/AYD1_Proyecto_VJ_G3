jest.mock('../../backend/config/db', () => ({
  pool: { query: jest.fn() }
}));

const { listarCalificaciones } = require('../../backend/controllers/operadorCalificacionController');
const db = require('../../backend/config/db');

describe('202307378 - operadorCalificacionController - listarCalificaciones', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      usuario: { id: 'a1b2c3d4-e5f6-1a2b-9c8d-a1b2c3d4e5f6', email: 'test@test.com', rol: 'operador', estado: 'activo' },
      body: {},
      params: {},
      query: {}
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
  });

  test('Debería retornar calificaciones con resumen (promedio, total, pendientes_respuesta) - 202307378', async () => {
    const calificacionesMock = [
      {
        id: 'cal-001',
        puntuacion: '4',
        comentario: 'Buen servicio',
        created_at: '2026-06-01T10:00:00Z',
        servicio_id: 'serv-001',
        nombre_servicio: 'Envío Express',
        cliente_nombre: 'Juan',
        cliente_apellido: 'Pérez',
        respuesta_id: 'resp-001',
        respuesta: 'Gracias por tu opinión',
        respuesta_created_at: '2026-06-02T10:00:00Z'
      },
      {
        id: 'cal-002',
        puntuacion: '5',
        comentario: 'Excelente',
        created_at: '2026-06-05T10:00:00Z',
        servicio_id: 'serv-001',
        nombre_servicio: 'Envío Express',
        cliente_nombre: 'María',
        cliente_apellido: 'López',
        respuesta_id: null,
        respuesta: null,
        respuesta_created_at: null
      }
    ];

    db.pool.query.mockResolvedValueOnce({ rows: calificacionesMock });

    await listarCalificaciones(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.status().json).toHaveBeenCalledWith({
      success: true,
      message: 'Calificaciones obtenidas exitosamente.',
      data: {
        items: [
          { ...calificacionesMock[0], puntuacion: 4, cliente: 'Juan Pérez' },
          { ...calificacionesMock[1], puntuacion: 5, cliente: 'María López' }
        ],
        resumen: {
          promedio: 4.5,
          total: 2,
          pendientes_respuesta: 1
        }
      }
    });
  });
});
