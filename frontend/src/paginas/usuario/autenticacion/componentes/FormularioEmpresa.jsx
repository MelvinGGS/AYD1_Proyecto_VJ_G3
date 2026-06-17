function FormularioEmpresa({
  nombreEmpresa,
  setNombreEmpresa,
  nit,
  setNit,
  email,
  setEmail,
  telefono,
  setTelefono,
  numeroLicenciaOperativa,
  setNumeroLicenciaOperativa,
  telefonoRespaldo,
  setTelefonoRespaldo
}) {
  return (
    <>
      {/* Nombre de la Empresa */}
      <div className="col-md-6 mb-3">
        <label className="form-label">Nombre de la Empresa</label>
        <input
          type="text"
          className="form-control"
          placeholder="Transportes Rápidos GT"
          value={nombreEmpresa}
          onChange={(e) => setNombreEmpresa(e.target.value)}
          required
        />
        <div className="invalid-feedback">Nombre de empresa requerido.</div>
      </div>

      {/* NIT */}
      <div className="col-md-6 mb-3">
        <label className="form-label">NIT</label>
        <input
          type="text"
          className="form-control"
          placeholder="Ej. 12345678-9"
          value={nit}
          onChange={(e) => setNit(e.target.value)}
          required
        />
        <div className="invalid-feedback">NIT requerido.</div>
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

      {/* Licencia Operativa */}
      <div className="col-md-6 mb-3">
        <label className="form-label">Licencia Operativa</label>
        <input
          type="text"
          className="form-control"
          placeholder="LIC-OP-001-2026"
          value={numeroLicenciaOperativa}
          onChange={(e) => setNumeroLicenciaOperativa(e.target.value)}
          required
        />
        <div className="invalid-feedback">Licencia requerida.</div>
      </div>

      {/* Teléfono Respaldo */}
      <div className="col-md-12 mb-3">
        <label className="form-label">Teléfono Respaldo (Opcional)</label>
        <input
          type="tel"
          className="form-control"
          placeholder="55554321"
          value={telefonoRespaldo}
          onChange={(e) => setTelefonoRespaldo(e.target.value)}
        />
      </div>
    </>
  );
}

export default FormularioEmpresa;
