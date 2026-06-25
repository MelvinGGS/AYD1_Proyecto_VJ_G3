module.exports = {
  rootDir: '../../',
  testEnvironment: 'node',
  verbose: true,
  coverageDirectory: '<rootDir>/pruebas/unitarias/coverage',
  collectCoverage: true,
  testMatch: ['<rootDir>/pruebas/unitarias/**/*.test.js'],
  collectCoverageFrom: [
    '<rootDir>/backend/controllers/operadorCalendarioController.js',
    '<rootDir>/backend/controllers/operadorCalificacionController.js',
    '<rootDir>/backend/controllers/operadorController.js',
    '<rootDir>/backend/controllers/operadorCuponController.js'
  ]
};
