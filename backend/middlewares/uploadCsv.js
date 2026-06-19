const multer = require("multer");
const path = require("path");
const fs = require("fs");

const dirUploads = path.join(__dirname, "../uploads");
if (!fs.existsSync(dirUploads)) {
  fs.mkdirSync(dirUploads, { recursive: true });
}

const almacenamiento = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, dirUploads);
  },
  filename: (req, file, cb) => {
    const sufijoUnico = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, sufijoUnico + ".csv"); // Forzamos extensión .csv
  },
});

const filtroArchivo = (req, file, cb) => {
  // Aceptamos solo archivos csv o mime type de texto csv
  if (file.mimetype === 'text/csv' || path.extname(file.originalname).toLowerCase() === '.csv') {
    return cb(null, true);
  }
  cb(new Error("Formato de archivo inválido. Solo se admiten archivos CSV."));
};

const uploadCsv = multer({
  storage: almacenamiento,
  limits: { fileSize: 2 * 1024 * 1024 }, // Máximo 2MB para archivos CSV
  fileFilter: filtroArchivo,
});

module.exports = uploadCsv;