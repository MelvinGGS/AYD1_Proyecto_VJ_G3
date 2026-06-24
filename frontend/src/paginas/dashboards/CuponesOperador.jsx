import { useState, useEffect } from "react";
import Swal from "sweetalert2";

const claveFechaLocal = (fecha) => [
  fecha.getFullYear(),
  String(fecha.getMonth() + 1).padStart(2, "0"),
  String(fecha.getDate()).padStart(2, "0")
].join("-");

const formularioCuponInicial = () => {
  const hoy = new Date();
  const fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, hoy.getDate());
  return {
    codigo: "",
    descripcion: "",
    tipo_descuento: "porcentaje",
    valor_descuento: "",
    usos_maximos: "",
    fecha_inicio: claveFechaLocal(hoy),
    fecha_fin: claveFechaLocal(fin)
  };
};

export default function CuponesOperador({ token }) {
  const [cupones, setCupones] = useState([]);
  const [formCupon, setFormCupon] = useState(formularioCuponInicial);
  const [cargandoCupones, setCargandoCupones] = useState(false);
  const [mensajeCupon, setMensajeCupon] = useState("");

  const cargarCupones = async () => {
    setCargandoCupones(true);
    setMensajeCupon("");
    try {
      const res = await fetch("http://localhost:3000/api/operador/cupones", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCupones(data.data || []);
      } else {
        setMensajeCupon(data.message || "Error al listar cupones.");
      }
    } catch {
      setMensajeCupon("Error al conectar con el servidor.");
    } finally {
      setCargandoCupones(false);
    }
  };

  useEffect(() => {
    cargarCupones();
  }, []);

  const crearCupon = async (e) => {
    e.preventDefault();
    if (!formCupon.codigo || !formCupon.valor_descuento || !formCupon.fecha_inicio || !formCupon.fecha_fin) {
      setMensajeCupon("Completa todos los campos obligatorios.");
      return;
    }

    setMensajeCupon("");
    try {
      const res = await fetch("http://localhost:3000/api/operador/cupones", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          codigo: formCupon.codigo.toUpperCase(),
          descripcion: formCupon.descripcion,
          tipo_descuento: formCupon.tipo_descuento,
          valor_descuento: formCupon.valor_descuento,
          fecha_inicio: formCupon.fecha_inicio,
          fecha_fin: formCupon.fecha_fin,
          usos_maximos: formCupon.usos_maximos || null
        })
      });
      const data = await res.json();
      setMensajeCupon(data.message);

      if (res.ok && data.success) {
        setFormCupon(formularioCuponInicial());
        cargarCupones();
      }
    } catch {
      setMensajeCupon("Error al crear cupón.");
    }
  };

  const desactivarCupon = async (id) => {
    const confirmacion = await Swal.fire({
      title: "Desactivar cupón",
      text: "El código de cupón dejará de estar disponible.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Desactivar",
      cancelButtonText: "Cancelar"
    });

    if (!confirmacion.isConfirmed) return;

    try {
      const res = await fetch(`http://localhost:3000/api/operador/cupones/${id}/desactivar`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        cargarCupones();
      } else {
        setMensajeCupon(data.message || "Error al desactivar cupón.");
      }
    } catch {
      setMensajeCupon("Error al conectar con el servidor.");
    }
  };

  return (
    <div className="row">
      <div className="col-md-5">
        <div className="dashboard-card-custom">
          <h2 className="dashboard-card-title">Crear Cupón</h2>

          <form onSubmit={crearCupon}>
            <div className="mb-3">
              <label className="form-label fw-semibold" style={{ color: "var(--color-secundario)" }}>
                Código <span style={{ color: "var(--color-primario)" }}>*</span>
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Ej. VERANO2026"
                value={formCupon.codigo}
                onChange={(e) => setFormCupon({ ...formCupon, codigo: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "") })}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold" style={{ color: "var(--color-secundario)" }}>Descripción</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ej. Descuento de temporada"
                value={formCupon.descripcion}
                onChange={(e) => setFormCupon({ ...formCupon, descripcion: e.target.value })}
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold" style={{ color: "var(--color-secundario)" }}>
                Tipo de Descuento <span style={{ color: "var(--color-primario)" }}>*</span>
              </label>
              <select
                className="form-select"
                value={formCupon.tipo_descuento}
                onChange={(e) => setFormCupon({ ...formCupon, tipo_descuento: e.target.value })}
              >
                <option value="porcentaje">Porcentaje (%)</option>
                <option value="monto_fijo">Monto Fijo (Q)</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold" style={{ color: "var(--color-secundario)" }}>
                Valor <span style={{ color: "var(--color-primario)" }}>*</span>
              </label>
              <input
                type="number"
                className="form-control"
                min="0.01"
                step="0.01"
                placeholder={formCupon.tipo_descuento === "porcentaje" ? "Ej. 10" : "Ej. 25"}
                value={formCupon.valor_descuento}
                onChange={(e) => setFormCupon({ ...formCupon, valor_descuento: e.target.value })}
                required
              />
            </div>

            <div className="row">
              <div className="col-6 mb-3">
                <label className="form-label fw-semibold" style={{ color: "var(--color-secundario)" }}>
                  Fecha Inicio <span style={{ color: "var(--color-primario)" }}>*</span>
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={formCupon.fecha_inicio}
                  onChange={(e) => setFormCupon({ ...formCupon, fecha_inicio: e.target.value })}
                  required
                />
              </div>
              <div className="col-6 mb-3">
                <label className="form-label fw-semibold" style={{ color: "var(--color-secundario)" }}>
                  Fecha Fin <span style={{ color: "var(--color-primario)" }}>*</span>
                </label>
                <input
                  type="date"
                  className="form-control"
                  min={formCupon.fecha_inicio}
                  value={formCupon.fecha_fin}
                  onChange={(e) => setFormCupon({ ...formCupon, fecha_fin: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold" style={{ color: "var(--color-secundario)" }}>Usos Máximos</label>
              <input
                type="number"
                className="form-control"
                min="1"
                placeholder="Dejar vacío para ilimitado"
                value={formCupon.usos_maximos}
                onChange={(e) => setFormCupon({ ...formCupon, usos_maximos: e.target.value })}
              />
            </div>

            {mensajeCupon && (
              <div className="p-3 rounded mb-3" style={{
                backgroundColor: mensajeCupon.includes("exitosamente") ? "#F0FDF4" : "#FEF2F2",
                border: `1px solid ${mensajeCupon.includes("exitosamente") ? "#BBF7D0" : "#FECACA"}`,
                color: mensajeCupon.includes("exitosamente") ? "#166534" : "#991B1B",
                fontSize: "14px"
              }}>
                {mensajeCupon}
              </div>
            )}

            <button
              type="submit"
              style={{
                width: "100%",
                backgroundColor: "var(--color-primario)",
                color: "white",
                border: "none",
                borderRadius: "var(--radio)",
                padding: "12px",
                fontWeight: "600",
                cursor: "pointer",
                fontSize: "15px"
              }}
            >
              Crear Cupón
            </button>
          </form>
        </div>
      </div>

      <div className="col-md-7">
        <div className="dashboard-card-custom">
          <h2 className="dashboard-card-title">Mis Cupones</h2>
          {cargandoCupones ? (
            <div className="text-center py-5">
              <p style={{ color: "var(--color-texto-mutado)", fontSize: "14px" }}>Cargando cupones...</p>
            </div>
          ) : cupones.length === 0 ? (
            <div className="text-center py-5">
              <p style={{ color: "var(--color-texto-mutado)", fontSize: "14px" }}>No hay cupones creados aún.</p>
            </div>
          ) : (
            cupones.map((c) => (
              <div key={c.id} className="p-3 mb-3 rounded" style={{ border: "1px solid #E2E8F0", backgroundColor: c.estado === "activo" ? "var(--color-blanco)" : "var(--color-fondo)" }}>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <h5 className="mb-0 fw-bold" style={{ color: "var(--color-primario)", letterSpacing: "1px" }}>{c.codigo}</h5>
                    <p className="mb-0" style={{ fontSize: "13px", color: "var(--color-texto-mutado)" }}>{c.descripcion}</p>
                  </div>
                  <span style={{
                    fontSize: "11px", fontWeight: "700", textTransform: "uppercase",
                    padding: "3px 10px", borderRadius: "20px",
                    backgroundColor: c.estado === "activo" ? "#DBEAFE" : "#F1F5F9",
                    color: c.estado === "activo" ? "#1D4ED8" : "var(--color-texto-mutado)"
                  }}>
                    {c.estado}
                  </span>
                </div>

                <div className="d-flex gap-3 mb-2" style={{ fontSize: "13px" }}>
                  <span style={{ color: "var(--color-secundario)", fontWeight: "600" }}>
                    {c.tipo_descuento === "porcentaje" ? `${c.valor_descuento}% OFF` : `Q${c.valor_descuento} OFF`}
                  </span>
                  <span style={{ color: "var(--color-texto-mutado)" }}>
                    {new Date(c.fecha_inicio).toLocaleDateString()} --- {new Date(c.fecha_fin).toLocaleDateString()}
                  </span>
                </div>

                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <span style={{ fontSize: "12px", color: "var(--color-texto-mutado)" }}>
                    Usos: {c.usos_actuales} / {c.usos_maximos || "Ilimitado"}
                  </span>
                  {c.estado === "activo" && (
                    <div className="mt-2">
                      <div className="d-flex gap-2 mb-2">
                        <input
                          type="email"
                          className="form-control form-control-sm"
                          placeholder="Correo del cliente"
                          id={`correo-cupon-${c.id}`}
                          style={{ borderRadius: "8px", fontSize: "12px", width: "160px" }}
                        />
                        <button
                          onClick={async () => {
                            const correo = document.getElementById(`correo-cupon-${c.id}`).value;
                            if (!correo) return;
                            try {
                              const res = await fetch(`http://localhost:3000/api/operador/cupones/${c.id}/enviar`, {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                  Authorization: `Bearer ${token}`
                                },
                                body: JSON.stringify({ correo_cliente: correo })
                              });
                              const data = await res.json();
                              setMensajeCupon(data.message);
                              document.getElementById(`correo-cupon-${c.id}`).value = "";
                            } catch {
                              setMensajeCupon("Error al enviar cupón.");
                            }
                          }}
                          style={{
                            backgroundColor: "var(--color-primario)",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            padding: "4px 12px",
                            fontSize: "12px",
                            cursor: "pointer",
                            fontWeight: "600",
                            whiteSpace: "nowrap"
                          }}
                        >
                          Enviar
                        </button>
                      </div>
                      <div className="text-end">
                        <button
                          onClick={() => desactivarCupon(c.id)}
                          style={{
                            backgroundColor: "transparent",
                            color: "#EF4444",
                            border: "none",
                            fontSize: "12px",
                            cursor: "pointer",
                            fontWeight: "600",
                            padding: "0"
                          }}
                        >
                          Desactivar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
