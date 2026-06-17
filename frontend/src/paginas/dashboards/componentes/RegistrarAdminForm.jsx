function RegistrarAdminForm({
  adminForm,
  setAdminForm,
  registrarAdministrador,
  accionando
}) {
  return (
    <form className="admin-form-panel" onSubmit={registrarAdministrador}>
      <div className="admin-form-grid">
        <label>
          Nombre
          <input
            type="text"
            value={adminForm.nombre}
            onChange={(e) => setAdminForm({ ...adminForm, nombre: e.target.value })}
            required
          />
        </label>
        <label>
          Apellido
          <input
            type="text"
            value={adminForm.apellido}
            onChange={(e) => setAdminForm({ ...adminForm, apellido: e.target.value })}
            required
          />
        </label>
        <label>
          Telefono
          <input
            type="tel"
            value={adminForm.telefono}
            onChange={(e) => setAdminForm({ ...adminForm, telefono: e.target.value })}
          />
        </label>
        <label>
          Correo electronico
          <input
            type="email"
            value={adminForm.email}
            onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
            required
          />
        </label>
        <label>
          Contrasena
          <input
            type="password"
            minLength="8"
            value={adminForm.password}
            onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
            required
          />
        </label>
        <label>
          Confirmar contrasena
          <input
            type="password"
            minLength="8"
            value={adminForm.confirmar_password}
            onChange={(e) => setAdminForm({ ...adminForm, confirmar_password: e.target.value })}
            required
          />
        </label>
      </div>

      <button className="admin-button primary admin-submit" type="submit" disabled={accionando === "crear-admin"}>
        {accionando === "crear-admin" ? "Registrando..." : "Registrar administrador"}
      </button>
    </form>
  );
}

export default RegistrarAdminForm;
