jest.mock('../../backend/config/db', () => ({
  pool: { query: jest.fn() }
}));

const { solicitarCambioPerfil } = require('../../backend/controllers/operadorController');
const db = require('../../backend/config/db');

describe('202000576 - operadorController - solicitarCambioPerfil', () => {
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

  test('Debería retornar 400 cuando faltan campos obligatorios - 202000576', async () => {
    req.body = {
      nombre: 'Carlos',
      apellido: '',
      telefono: '',
      zona_operacion: '',
      genero: ''
    };

    await solicitarCambioPerfil(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.status().json).toHaveBeenCalledWith({
      success: false,
      message: 'Nombre, apellido, telefono, zona de operacion y genero son obligatorios.'
    });
    expect(db.pool.query).not.toHaveBeenCalled();
  });
});
