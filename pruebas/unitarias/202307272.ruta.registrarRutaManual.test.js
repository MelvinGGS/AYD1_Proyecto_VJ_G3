jest.mock('../../backend/config/db', () => ({
  pool: { query: jest.fn() }
}));

const { registrarRutaManual } = require('../../backend/controllers/rutaController');
const db = require('../../backend/config/db');

describe('202307272 - rutaController - registrarRutaManual', () => {
  let req, res;

  beforeEach(() => {
    req = { usuario: { id: 'empresa-123' }, body: {} };
    res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
  });

  test('Debería retornar 400 si faltan campos obligatorios - 202307272', async () => {
    await registrarRutaManual(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.status().json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
  });
});
