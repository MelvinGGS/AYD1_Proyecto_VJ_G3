jest.mock('../config/db', () => ({
  pool: { connect: jest.fn() }
}));
jest.mock('../utils/mailer', () => ({
  enviarCorreo: jest.fn()
}));

const { registrarOperador } = require('../controllers/registroOperadorController');
const db = require('../config/db');

describe('202300712 - registroOperadorController - registrarOperador', () => {
  let req, res, mockClient;

  beforeEach(() => {
    mockClient = { query: jest.fn(), release: jest.fn() };
    db.pool.connect.mockResolvedValue(mockClient);
    req = { body: { nombre: '' }, file: { filename: 'foto.jpg' } };
    res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
  });

  test('Debería retornar 400 si faltan campos obligatorios - 202300712', async () => {
    await registrarOperador(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.status().json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
  });
});
