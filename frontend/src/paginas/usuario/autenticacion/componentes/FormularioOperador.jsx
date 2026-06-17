function FormularioOperador({
  nombre,
  setNombre,
  apellido,
  setApellido,
  email,
  setEmail,
  telefono,
  setTelefono,
  dpiCui,
  setDpiCui,
  genero,
  setGenero,
  telefonoRespaldo,
  setTelefonoRespaldo,
  zonaOperacion,
  setZonaOperacion,
  manejarCambioArchivo
}) {
  return (
    <>
      {/* Nombre */}
      <div className="col-md-6 mb-3">
        <label className="form-label">Nombre</label>
        <input
          type="text"
          className="form-control"
          placeholder="Ej. Carlos"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
        <div className="invalid-feedback">Ingresa tu nombre.</div>
      </div>

      {/* Apellido */}
      <div className="col-md-6 mb-3">
        <label className="form-label">Apellido</label>
        <input
          type="text"
          className="form-control"
          placeholder="Ej. García"
          value={apellido}
          onChange={(e) => setApellido(e.target.value)}
          required
        />
        <div className="invalid-feedback">Ingresa tu apellido.</div>
      </div>

      {/* Correo Electrónico */}
      <div className="col-md-12 mb-3">
        <label className="form-label">Correo Electrónico</label>
        <input
          type="email"
          className="form-control"
          placeholder="usuario@correo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div className="invalid-feedback">Ingresa un correo válido.</div>
      </div>

      {/* Teléfono */}
      <div className="col-md-6 mb-3">
        <label className="form-label">Teléfono</label>
        <input
          type="tel"
          className="form-control"
          placeholder="55551234"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          required
        />
        <div className="invalid-feedback">Teléfono requerido.</div>
      </div>

      {/* DPI / CUI */}
      <div className="col-md-6 mb-3">
        <label className="form-label">DPI / CUI</label>
        <input
          type="text"
          className="form-control"
          placeholder="13 dígitos"
          value={dpiCui}
          onChange={(e) => setDpiCui(e.target.value.replace(/\D/g, ""))}
          maxLength="13"
          minLength="13"
          required
        />
        <div className="invalid-feedback">DPI requerido (13 dígitos).</div>
      </div>

      {/* Género */}
      <div className="col-md-6 mb-3">
        <label className="form-label">Género</label>
        <select
          className="form-control"
          value={genero}
          onChange={(e) => setGenero(e.target.value)}
          required
        >
          <option value="">Selecciona...</option>
          <option value="masculino">Masculino</option>
          <option value="femenino">Femenino</option>
          <option value="otro">Otro</option>
          <option value="prefiero_no_decir">Prefiero no decir</option>
        </select>
        <div className="invalid-feedback">Selecciona un género.</div>
      </div>

      {/* Teléfono de Respaldo */}
      <div className="col-md-6 mb-3">
        <label className="form-label">Teléfono Respaldo (Opcional)</label>
        <input
          type="tel"
          className="form-control"
          placeholder="55554321"
          value={telefonoRespaldo}
          onChange={(e) => setTelefonoRespaldo(e.target.value)}
        />
      </div>

      {/* Zona de Operación */}
      <div className="col-md-12 mb-3">
        <label className="form-label">Zona de Operación</label>
        <input
          type="text"
          className="form-control"
          placeholder="Ej. Zona 10, Ciudad de Guatemala"
          value={zonaOperacion}
          onChange={(e) => setZonaOperacion(e.target.value)}
          required
        />
        <div className="invalid-feedback">Ingresa tu zona de operación.</div>
      </div>

      {/* Fotografía */}
      <div className="col-md-12 mb-3">
        <label className="form-label">Fotografía de Perfil (JPG/PNG)</label>
        <input
          type="file"
          className="form-control"
          accept="image/jpeg,image/png"
          onChange={manejarCambioArchivo}
          required
        />
        <div className="invalid-feedback">Sube tu fotografía de perfil.</div>
      </div>
    </>
  );
}

export default FormularioOperador;
