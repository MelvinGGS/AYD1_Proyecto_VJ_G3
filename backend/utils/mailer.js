// backend/utils/mailer.js
const nodemailer = require("nodemailer");

// Configuración con las variables de entorno
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const enviarCorreo = async (destinatario, asunto, titulo, mensaje, token) => {
  // Lógica para mostrar la caja del código SOLAMENTE si el token no viene vacío
  const cuadroTokenHtml = token 
    ? `<div style="text-align: center; margin: 30px 0;">
         <span style="display: inline-block; font-size: 24px; font-weight: bold; background: #f4f4f4; padding: 10px 20px; border-radius: 5px; letter-spacing: 5px;">
           ${token}
         </span>
       </div>`
    : ``; // Si el token es "", no dibuja nada

  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #2c3e50; text-align: center;">TrackFlow-HUB</h2>
      <h3 style="color: #34495e;">${titulo}</h3>
      <p style="font-size: 16px; color: #555;">${mensaje}</p>
      ${cuadroTokenHtml}
      <p style="font-size: 14px; color: #999; text-align: center; margin-top: 20px;">Si no solicitaste este correo, por favor ignóralo.</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"TrackFlow-HUB" <${process.env.EMAIL_USER}>`,
    to: destinatario,
    subject: asunto,
    html: htmlTemplate,
  });
};

// ESTA ES LA LÍNEA CRÍTICA QUE ARREGLA TU ERROR:
module.exports = { enviarCorreo };