const { Pool } = require("pg");
require("dotenv").config();

// Configurar conexión a PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

pool.on("connect", () => {
  console.log("Conectado con éxito a la base de datos PostgreSQL.");
});

pool.on("error", (err) => {
  console.error("Error inesperado en el cliente de base de datos:", err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
