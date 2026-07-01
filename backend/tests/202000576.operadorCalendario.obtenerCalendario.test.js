jest.mock('../config/db', () => ({
  pool: { query: jest.fn() }
}));

const { obtenerCalendario } = require('../controllers/operadorCalendarioController');
const db = require('../config/db');

describe('202000576 - operadorCalendarioController - obtenerCalendario', () => {
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

  test('Debería retornar 400 para formato de fecha inválido - 202000576', async () => {
    req.query = { desde: '01-07-2026', hasta: '31-07-2026' };

    await obtenerCalendario(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.status().json).toHaveBeenCalledWith({
      success: false,
      message: 'Debes indicar un rango de fechas valido en formato YYYY-MM-DD.',
      error: { code: 'VALIDATION_ERROR' }
    });
    expect(db.pool.query).not.toHaveBeenCalled();
  });
});
