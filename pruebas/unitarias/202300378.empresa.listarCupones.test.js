jest.mock('../../backend/config/db', () => ({
  pool: { query: jest.fn() }
}));

const { listarCupones } = require('../../backend/controllers/empresaController');
const db = require('../../backend/config/db');

describe('202300378 - empresaController - listarCupones', () => {
  let req, res;

  beforeEach(() => {
    req = { usuario: { id: 'empresa-123' } };
    res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
  });

  test('Debería listar cupones de la empresa exitosamente - 202300378', async () => {
    const cuponesMock = [{ id: '1', codigo: 'DESC10' }];
    db.pool.query.mockResolvedValueOnce({ rows: cuponesMock });

    await listarCupones(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: cuponesMock
    });
  });
});
