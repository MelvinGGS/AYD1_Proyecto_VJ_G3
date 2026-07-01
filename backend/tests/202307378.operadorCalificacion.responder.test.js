jest.mock('../config/db', () => ({
  pool: { query: jest.fn() }
}));

const { responderCalificacion } = require('../controllers/operadorCalificacionController');
const db = require('../config/db');

describe('202307378 - operadorCalificacionController - responderCalificacion', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      usuario: { id: 'a1b2c3d4-e5f6-1a2b-9c8d-a1b2c3d4e5f6', email: 'test@test.com', rol: 'operador', estado: 'activo' },
      body: {},
      params: { id: 'f1e2d3c4-b5a6-1f2e-9d8c-f1e2d3c4b5a6' },
      query: {}
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
  });

  test('Debería retornar 400 cuando la respuesta está vacía - 202307378', async () => {
    req.body = { respuesta: '' };

    await responderCalificacion(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.status().json).toHaveBeenCalledWith({
      success: false,
      message: 'La respuesta no puede estar vacia.',
      error: { code: 'VALIDATION_ERROR' }
    });
    expect(db.pool.query).not.toHaveBeenCalled();
  });
});

