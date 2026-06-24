jest.mock('../../backend/config/db', () => ({
  pool: { connect: jest.fn() }
}));
jest.mock('../../backend/utils/mailer', () => ({
  enviarCorreo: jest.fn()
}));

const { agendarReunionEmpresa } = require('../../backend/controllers/adminController');
const db = require('../../backend/config/db');

describe('202300712 - adminController - agendarReunionEmpresa', () => {
  let req, res, mockClient;

  beforeEach(() => {
    mockClient = { query: jest.fn(), release: jest.fn() };
    db.pool.connect.mockResolvedValue(mockClient);
    req = { params: { id: '1' }, body: { reunion_enlace: '' } };
    res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
  });

  test('Debería retornar 400 si falta el enlace de reunión - 202300712', async () => {
    await agendarReunionEmpresa(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.status().json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
  });
});
