jest.mock('../config/db', () => ({
  pool: { connect: jest.fn() }
}));
jest.mock('../utils/mailer', () => ({
  enviarCorreo: jest.fn()
}));

const { registrarEmpresa } = require('../controllers/registroEmpresaController');
const db = require('../config/db');

describe('202307272 - registroEmpresaController - registrarEmpresa', () => {
  let req, res, mockClient;

  beforeEach(() => {
    mockClient = { query: jest.fn(), release: jest.fn() };
    db.pool.connect.mockResolvedValue(mockClient);
    req = { body: { nit: '' } };
    res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
  });

  test('Debería retornar 400 si faltan campos obligatorios - 202307272', async () => {
    await registrarEmpresa(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.status().json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
  });
});
