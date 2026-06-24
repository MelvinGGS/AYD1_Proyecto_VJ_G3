import { useState, useEffect } from "react";
const API_URL = "http://localhost:3000/api/admin";

function SolicitudesCambioPerfil({ token }) {
    const [solicitudes, setSolicitudes] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [mensaje, setMensaje] = useState("");
    const [error, setError] = useState("");
    const [modalRechazo, setModalRechazo] = useState(null);
    const [motivoRechazo, setMotivoRechazo] = useState("");
    const [filtro, setFiltro] = useState("pendiente");

    const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
    };

    const cargar = async () => {
        setCargando(true);
        setMensaje("");
        setError("");
        try {
            const res = await fetch(`${API_URL}/solicitudes/cambio-perfil`, { headers });
            const data = await res.json();
            if (data.success) setSolicitudes(data.data);
        } catch {
            setError("Error al cargar solicitudes.");
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => { cargar(); }, []);

    const resolver = async (id, accion, motivo) => {
        setMensaje("");
        setError("");
        try {
            const res = await fetch(`${API_URL}/solicitudes/cambio-perfil/${id}/resolver`, {
                method: "PATCH",
                headers,
                body: JSON.stringify({ accion, motivo_rechazo: motivo })
            });
            const data = await res.json();
            if (data.success) {
                setMensaje(data.message);
                cargar();
                setModalRechazo(null);
                setMotivoRechazo("");
            } else {
                setError(data.message);
            }
        } catch {
            setError("Error al resolver solicitud.");
        }
    };

    const filtradas = solicitudes.filter(s => {
        if (filtro === "pendiente") return s.estado === "pendiente";
        if (filtro === "aprobado") return s.estado === "aceptado";
        if (filtro === "rechazado") return s.estado === "rechazado";
        return true;
    });

    const colorEstado = (estado) => {
        if (estado === "pendiente") return { bg: "#FEF9C3", color: "#854D0E" };
        if (estado === "aceptado") return { bg: "#DCFCE7", color: "#166534" };
        return { bg: "#FEE2E2", color: "#991B1B" };
    };

    return (
        <div>
            {mensaje && (
                <div className="admin-alert success">{mensaje}</div>
            )}
            {error && (
                <div className="admin-alert error">{error}</div>
            )}

            <div className="admin-filter-row" style={{ marginBottom: "20px" }}>
                {["pendiente", "aprobado", "rechazado", "todos"].map(f => (
                    <button
                        key={f}
                        type="button"
                        className={filtro === f ? "active" : ""}
                        onClick={() => setFiltro(f)}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {cargando ? (
                <p style={{ color: "var(--color-texto-mutado)" }}>Cargando...</p>
            ) : filtradas.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--color-texto-mutado)" }}>
                    No hay solicitudes en este estado.
                </div>
            ) : (
                filtradas.map(s => {
                    const { bg, color } = colorEstado(s.estado);
                    return (
                        <div key={s.id} style={{
                            backgroundColor: "white",
                            border: "1px solid #E2E8F0",
                            borderRadius: "12px",
                            padding: "20px",
                            marginBottom: "16px"
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                                <div>
                                    <p style={{ fontSize: "12px", color: "var(--color-texto-mutado)", marginBottom: "2px" }}>
                                        {s.rol === "empresa_transporte" ? "Empresa de Transporte" : "Operador Logístico"}
                                    </p>
                                    <p style={{ fontWeight: "700", color: "var(--color-secundario)", margin: 0 }}>{s.email}</p>
                                    <p style={{ fontSize: "12px", color: "var(--color-texto-mutado)", marginTop: "4px" }}>
                                        {new Date(s.created_at).toLocaleDateString()} {new Date(s.created_at).toLocaleTimeString()}
                                    </p>
                                </div>
                                <span style={{
                                    fontSize: "11px", fontWeight: "700", textTransform: "uppercase",
                                    padding: "4px 12px", borderRadius: "20px",
                                    backgroundColor: bg, color
                                }}>
                                    {s.estado}
                                </span>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                                <div style={{ backgroundColor: "var(--color-fondo)", borderRadius: "8px", padding: "12px" }}>
                                    <p style={{ fontSize: "11px", fontWeight: "700", color: "var(--color-texto-mutado)", textTransform: "uppercase", marginBottom: "8px" }}>
                                        Datos Actuales
                                    </p>
                                    {s.campos_previos && Object.entries(s.campos_previos).map(([campo, valor]) => (
                                        <div key={campo} style={{ marginBottom: "4px" }}>
                                            <span style={{ fontSize: "12px", color: "var(--color-texto-mutado)" }}>{campo.replace(/_/g, " ")}: </span>
                                            <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--color-secundario)" }}>{valor || "—"}</span>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ backgroundColor: "#EFF6FF", borderRadius: "8px", padding: "12px", border: "1px solid #BFDBFE" }}>
                                    <p style={{ fontSize: "11px", fontWeight: "700", color: "#1D4ED8", textTransform: "uppercase", marginBottom: "8px" }}>
                                        Cambios Solicitados
                                    </p>
                                    {s.campos_nuevos && Object.entries(s.campos_nuevos).map(([campo, valor]) => (
                                        <div key={campo} style={{ marginBottom: "4px" }}>
                                            <span style={{ fontSize: "12px", color: "var(--color-texto-mutado)" }}>{campo.replace(/_/g, " ")}: </span>
                                            <span style={{ fontSize: "12px", fontWeight: "600", color: "#1D4ED8" }}>{valor || "—"}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {s.motivo_rechazo && (
                                <div style={{ backgroundColor: "#FEE2E2", borderRadius: "8px", padding: "10px", marginBottom: "12px" }}>
                                    <p style={{ fontSize: "12px", color: "#991B1B", margin: 0 }}>
                                        <strong>Motivo de rechazo:</strong> {s.motivo_rechazo}
                                    </p>
                                </div>
                            )}

                            {s.estado === "pendiente" && (
                                <div style={{ display: "flex", gap: "8px" }}>
                                    <button
                                        onClick={() => resolver(s.id, "aprobar")}
                                        style={{
                                            backgroundColor: "var(--color-primario)", color: "white",
                                            border: "none", borderRadius: "8px", padding: "8px 20px",
                                            fontWeight: "600", cursor: "pointer", fontSize: "13px"
                                        }}
                                    >
                                        Aprobar cambios
                                    </button>
                                    <button
                                        onClick={() => { setModalRechazo(s.id); setMotivoRechazo(""); }}
                                        style={{
                                            backgroundColor: "transparent", color: "var(--color-texto-mutado)",
                                            border: "1px solid #E2E8F0", borderRadius: "8px", padding: "8px 20px",
                                            fontWeight: "600", cursor: "pointer", fontSize: "13px"
                                        }}
                                    >
                                        Rechazar
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })
            )}

            {modalRechazo && (
                <div style={{
                    position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
                    backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999,
                    display: "flex", justifyContent: "center", alignItems: "center"
                }}>
                    <div style={{
                        backgroundColor: "white", borderRadius: "16px", padding: "28px",
                        width: "90%", maxWidth: "440px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)"
                    }}>
                        <h3 style={{ color: "var(--color-secundario)", marginBottom: "8px" }}>Rechazar solicitud</h3>
                        <p style={{ fontSize: "13px", color: "var(--color-texto-mutado)", marginBottom: "16px" }}>
                            El usuario recibirá una notificación con el motivo del rechazo.
                        </p>
                        <textarea
                            rows="4"
                            placeholder="Escribe el motivo de rechazo..."
                            value={motivoRechazo}
                            onChange={(e) => setMotivoRechazo(e.target.value)}
                            style={{
                                width: "100%", borderRadius: "8px", border: "1px solid #E2E8F0",
                                padding: "10px", fontSize: "13px", marginBottom: "16px", resize: "none"
                            }}
                        />
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                            <button
                                onClick={() => { setModalRechazo(null); setMotivoRechazo(""); }}
                                style={{
                                    backgroundColor: "transparent", border: "1px solid #E2E8F0",
                                    borderRadius: "8px", padding: "8px 16px", cursor: "pointer", fontWeight: "600"
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => resolver(modalRechazo, "rechazar", motivoRechazo)}
                                style={{
                                    backgroundColor: "var(--color-secundario)", color: "white",
                                    border: "none", borderRadius: "8px", padding: "8px 16px",
                                    cursor: "pointer", fontWeight: "600"
                                }}
                            >
                                Confirmar rechazo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SolicitudesCambioPerfil;