function FormularioCliente({
  nombre,
  setNombre,
  apellido,
  setApellido,
  email,
  setEmail,
  telefono,
  setTelefono,
  direccionOrigen,
  setDireccionOrigen,
  password,
  setPassword,
  confirmarPassword,
  setConfirmarPassword
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

      {/* Dirección Origen */}
      <div className="col-md-6 mb-3">
        <label className="form-label">Dirección Origen (Opcional)</label>
        <input
          type="text"
          className="form-control"
          placeholder="Ej. Zona 1, Guatemala"
          value={direccionOrigen}
          onChange={(e) => setDireccionOrigen(e.target.value)}
        />
      </div>

      {/* Contraseña */}
      <div className="col-md-6 mb-3">
        <label className="form-label">Contraseña</label>
        <input
          type="password"
          className="form-control"
          placeholder="********"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength="8"
          required
        />
        <div className="invalid-feedback">Requerida (mín 8 chars).</div>
      </div>

      {/* Confirmar Contraseña */}
      <div className="col-md-6 mb-3">
        <label className="form-label">Confirmar Contraseña</label>
        <input
          type="password"
          className="form-control"
          placeholder="********"
          value={confirmarPassword}
          onChange={(e) => setConfirmarPassword(e.target.value)}
          minLength="8"
          required
        />
        <div className="invalid-feedback">Confirma la contraseña.</div>
      </div>
    </>
  );
}

export default FormularioCliente;
