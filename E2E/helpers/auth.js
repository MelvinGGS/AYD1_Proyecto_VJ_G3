const { Client } = require('pg');

/**
 * Recupera el código 2FA de la base de datos para el administrador.
 */
async function getAdmin2FAToken(email) {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'admin',
    password: 'Admin123',
    database: 'trackflow_db',
  });
  await client.connect();
  const res = await client.query('SELECT token_2fa FROM usuarios WHERE LOWER(email) = $1', [email.toLowerCase().trim()]);
  await client.end();
  return res.rows[0]?.token_2fa;
}

/**
 * Helper para autenticación como Operador.
 */
async function loginComoOperador(page, email, password) {
  const response = await page.request.post('http://localhost:3000/api/auth/login', {
    data: { email, password }
  });
  
  const body = await response.json();
  
  if (!body.success || !body.token) {
    throw new Error(`Login failed: ${body.message || 'No token received'}`);
  }
  
  await page.goto('/');
  await page.evaluate((data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('rol', data.rol);
    localStorage.setItem('id', data.id);
  }, { token: body.token, rol: body.rol, id: body.data ? body.data.id : '' });
  
  await page.goto('/dashboard/operador');
  await page.waitForLoadState('networkidle');
}

/**
 * Helper para autenticación como Empresa de Transporte.
 */
async function loginComoEmpresa(page, email, password) {
  const response = await page.request.post('http://localhost:3000/api/auth/login', {
    data: { email, password }
  });
  
  const body = await response.json();
  
  if (!body.success || !body.token) {
    throw new Error(`Login failed: ${body.message || 'No token received'}`);
  }
  
  await page.goto('/');
  await page.evaluate((data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('rol', data.rol);
    localStorage.setItem('id', data.id);
  }, { token: body.token, rol: body.rol, id: body.data ? body.data.id : '' });
  
  await page.goto('/dashboard/empresa');
  await page.waitForLoadState('networkidle');
}

/**
 * Helper para autenticación como Administrador (con 2FA).
 */
async function loginComoAdmin(page, email, password) {
  // 1. Intentar login
  const loginRes = await page.request.post('http://localhost:3000/api/auth/login', {
    data: { email, password }
  });
  
  const loginBody = await loginRes.json();
  
  if (loginRes.status() !== 202 || !loginBody.requiere_2fa) {
    throw new Error(`Admin login failed: ${loginBody.message || 'Expected 2FA prompt'}`);
  }
  
  // Esperar un instante para que el token se inserte en la base de datos
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 2. Obtener token 2FA de la base de datos
  const token2fa = await getAdmin2FAToken(email);
  if (!token2fa) {
    throw new Error('No se pudo encontrar el token 2FA en la base de datos.');
  }
  
  // 3. Verificar código 2FA
  const verifyRes = await page.request.post('http://localhost:3000/api/auth/login/admin/verificar', {
    data: { email, token_2fa: token2fa }
  });
  
  const verifyBody = await verifyRes.json();
  if (!verifyRes.ok() || !verifyBody.data?.token) {
    throw new Error(`Admin 2FA verification failed: ${verifyBody.message || 'Invalid token'}`);
  }
  
  // 4. Inyectar token en localStorage
  await page.goto('/');
  await page.evaluate((data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('rol', data.rol);
  }, { token: verifyBody.data.token, rol: verifyBody.data.rol });
  
  // 5. Navegar al dashboard del administrador
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
}

module.exports = { 
  loginComoOperador,
  loginComoEmpresa,
  loginComoAdmin
};
