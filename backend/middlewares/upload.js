const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Asegurar que la carpeta 'uploads' exista en la raíz del proyecto
const dirUploads = path.join(__dirname, "../uploads");
if (!fs.existsSync(dirUploads)) {
  fs.mkdirSync(dirUploads, { recursive: true });
}

// Configuración de almacenamiento en disco
const almacenamiento = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, dirUploads);
  },
  filename: (req, file, cb) => {
    // Nombre único: timestamp + extensión original
    const sufijoUnico = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, sufijoUnico + path.extname(file.originalname));
  },
});

// Filtro de tipos de archivo (JPG y PNG)
const filtroArchivo = (req, file, cb) => {
  const extensionesPermitidas = /jpeg|jpg|png/;
  const mimetypePermitido = extensionesPermitidas.test(file.mimetype);
  const extnamePermitido = extensionesPermitidas.test(
    path.extname(file.originalname).toLowerCase()
  );

  if (mimetypePermitido && extnamePermitido) {
    return cb(null, true);
  }
  cb(new Error("Formato de imagen inválido. Solo se admiten archivos JPG, JPEG y PNG."));
};

// Middleware configurado
const upload = multer({
  storage: almacenamiento,
  limits: {
    fileSize: 5 * 1024 * 1024, // Máximo 5MB
  },
  fileFilter: filtroArchivo,
});

module.exports = upload;
