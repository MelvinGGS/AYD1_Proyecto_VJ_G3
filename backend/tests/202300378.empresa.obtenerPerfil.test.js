jest.mock('../config/db', () => ({
  pool: { query: jest.fn() }
}));

const { obtenerPerfil } = require('../controllers/empresaController');
const db = require('../config/db');

describe('202300378 - empresaController - obtenerPerfil', () => {
  let req, res;

  beforeEach(() => {
    req = { usuario: { id: 'empresa-123' } };
    res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
  });

  test('Debería retornar el perfil de empresa exitosamente - 202300378', async () => {
    const perfilMock = { nombre_empresa: 'Transporte Test' };
    db.pool.query.mockResolvedValueOnce({ rows: [perfilMock] });

    await obtenerPerfil(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: perfilMock
    });
  });
});
