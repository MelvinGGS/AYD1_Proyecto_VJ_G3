const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir la carpeta 'uploads' como recursos estáticos
app.use("/uploads", express.static(path.join(__dirname, "./uploads")));

// Registrar rutas de autenticación
app.use("/api/auth", authRoutes);

// Ruta de estado base del servidor (Health Check)
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Servidor backend de TrackFlow-HUB corriendo activamente."
  });
});

// Levantar el servidor
app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
});
