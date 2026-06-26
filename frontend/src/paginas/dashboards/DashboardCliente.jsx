import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function DashboardCliente() {
  const navigate = useNavigate();

  const [carrito, setCarrito] = useState([]);
  const [totalCarrito, setTotalCarrito] = useState(0);
  const [metodosPago, setMetodosPago] = useState([]);
  const [metodoSeleccionado, setMetodoSeleccionado] = useState("");
  const [cargando, setCargando] = useState(false);
  
  // ESTADOS NUEVOS
  const [rutasDisponibles, setRutasDisponibles] = useState([]);
  const [reservaciones, setReservaciones] = useState([]);

  const [formTarjeta, setFormTarjeta] = useState({
    numero_tarjeta: "", nombre_tarjeta: "", fecha_vencimiento: "", cvv: ""
  });
  const [walletId, setWalletId] = useState("");

  useEffect(() => {
    cargarCarrito();
    cargarMetodosPago();
    cargarRutasDisponibles();
    cargarReservaciones(); // Cargamos el historial de compras
  }, []);

  const getToken = () => localStorage.getItem("token");

  // --- CARGAS DE DATOS ---
  const cargarRutasDisponibles = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/rutas/activas");
      const data = await res.json();
      if (data.success) setRutasDisponibles(data.data);
    } catch (error) { console.error("Error al cargar rutas", error); }
  };

  const cargarCarrito = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/carrito", {
        headers: { "Authorization": `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (data.success) {
        setCarrito(data.data);
        setTotalCarrito(data.total);
      }
    } catch (error) { console.error("Error al cargar carrito", error); }
  };

  const cargarMetodosPago = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/pagos/metodos", {
        headers: { "Authorization": `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (data.success) setMetodosPago(data.data);
    } catch (error) { console.error("Error al cargar métodos", error); }
  };

  const cargarReservaciones = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/pagos/mis-reservaciones", {
        headers: { "Authorization": `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (data.success) setReservaciones(data.data);
    } catch (error) { console.error("Error al cargar reservaciones", error); }
  };

  // --- ALGORITMO LUHN ---
  const validarLuhn = (numero) => {
    const digitos = numero.replace(/\D/g, '');
    if (digitos.length < 13 || digitos.length > 19) return false;
    let suma = 0;
    let esPar = false;
    for (let i = digitos.length - 1; i >= 0; i--) {
      let digito = parseInt(digitos.charAt(i), 10);
      if (esPar) {
        digito *= 2;
        if (digito > 9) digito -= 9;
      }
      suma += digito;
      esPar = !esPar;
    }
    return (suma % 10) === 0;
  };

  // --- APIS DEL CARRITO ---
  const agregarAlCarrito = async (servicioId, tipoServicio, servicioData) => {
    setCargando(true);
    try {
      const res = await fetch("http://localhost:3000/api/carrito", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`
        },
        body: JSON.stringify({ 
          servicio_id: servicioId, 
          tipo_servicio: tipoServicio,
          fecha_inicio: servicioData.fecha_inicio,
          precio_unitario: servicioData.precio_unitario
        })
      });
      const data = await res.json();
      if (data.success) {
        cargarCarrito();
        alert("Servicio agregado al carrito");
      } else {
        alert(data.message || "Error al agregar al carrito");
      }
    } catch (error) { alert("Error al agregar al carrito"); } 
    finally { setCargando(false); }
  };

  const eliminarDelCarrito = async (carritoId) => {
    if (!window.confirm("¿Eliminar este item del carrito?")) return;
    setCargando(true);
    try {
      const res = await fetch(`http://localhost:3000/api/carrito/${carritoId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (data.success) {
        cargarCarrito();
      } else {
        alert(data.message || "Error al eliminar");
      }
    } catch (error) { alert("Error al eliminar"); } 
    finally { setCargando(false); }
  };

  const vaciarCarrito = async () => {
    if (!window.confirm("¿Vaciar todo el carrito?")) return;
    setCargando(true);
    try {
      const res = await fetch("http://localhost:3000/api/carrito", {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (data.success) {
        cargarCarrito();
      }
    } catch (error) { alert("Error al vaciar carrito"); } 
    finally { setCargando(false); }
  };

  // --- MÉTODOS DE PAGO Y CHECKOUT ---
  const agregarTarjeta = async (e) => {
    e.preventDefault();
    if (!validarLuhn(formTarjeta.numero_tarjeta)) {
      return alert("Error: El número de tarjeta es inválido según el algoritmo de Luhn.");
    }
    try {
      const res = await fetch("http://localhost:3000/api/pagos/metodo", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`
        },
        body: JSON.stringify({ tipo: "tarjeta", ...formTarjeta })
      });
      const data = await res.json();
      alert(data.message);
      if (data.success) {
        setFormTarjeta({ numero_tarjeta: "", nombre_tarjeta: "", fecha_vencimiento: "", cvv: "" });
        cargarMetodosPago();
      }
    } catch (error) { alert("Error al agregar tarjeta."); }
  };

  const agregarWallet = async (e) => {
    e.preventDefault();
    if (!walletId) return alert("Ingrese el ID de su Billetera Virtual.");
    try {
      const res = await fetch("http://localhost:3000/api/pagos/metodo", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`
        },
        body: JSON.stringify({ tipo: "wallet", wallet_id: walletId })
      });
      const data = await res.json();
      alert(data.message);
      if (data.success) {
        setWalletId("");
        cargarMetodosPago();
      }
    } catch (error) { alert("Error al agregar wallet."); }
  };

  const procesarPago = async () => {
    if (!metodoSeleccionado) return alert("Por favor, seleccione un método de pago.");
    if (carrito.length === 0) return alert("Tu carrito está vacío.");
    setCargando(true);
    try {
      const res = await fetch("http://localhost:3000/api/pagos/checkout", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`
        },
        body: JSON.stringify({ metodo_pago_id: metodoSeleccionado })
      });
      const data = await res.json();
      alert(data.message);
      if (data.success) {
        cargarCarrito();
        cargarMetodosPago(); // Refrescar saldos
        cargarReservaciones(); // Mostrar la nueva reserva en el historial
      }
    } catch (error) { alert("Error de conexión al procesar el pago."); } 
    finally { setCargando(false); }
  };

  // --- CANCELACIÓN Y REEMBOLSO ---
  const cancelarReservacion = async (reservacionId, fechaInicio) => {
    // 1. Validación visual rápida en el frontend de las 24 horas
    const fechaServicio = new Date(fechaInicio);
    const ahora = new Date();
    const diferenciaHoras = (fechaServicio - ahora) / (1000 * 60 * 60);

    if (diferenciaHoras < 24) {
      return alert("Política estricta: Solo puedes cancelar con al menos 24 horas de anticipación a la fecha de tu viaje.");
    }

    if (!window.confirm("¿Estás seguro de cancelar esta reservación? Tu dinero será reembolsado automáticamente a tu método de pago.")) return;

    setCargando(true);
    try {
      const res = await fetch(`http://localhost:3000/api/pagos/reservacion/${reservacionId}/cancelar`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${getToken()}` }
      });
      const data = await res.json();
      alert(data.message);
      
      if (data.success) {
        cargarReservaciones(); // Refrescar lista de reservas (ahora dirá "cancelado")
        cargarMetodosPago(); // Refrescar métodos de pago para ver el dinero devuelto
      }
    } catch (error) { alert("Error de red al cancelar reservación."); }
    finally { setCargando(false); }
  };

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("rol");
    localStorage.removeItem("id");
    navigate("/");
  };

  return (
    <div style={{ padding: "20px", backgroundColor: "#F1F5F9", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
        <h1>Panel de Cliente</h1>
        <button onClick={cerrarSesion} style={{ padding: "10px", backgroundColor: "#EF4444", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>Cerrar sesión</button>
      </div>

      {/* --- CATÁLOGO DE RUTAS --- */}
      <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", marginBottom: "20px" }}>
        <h2>Catálogo de Rutas de Transporte</h2>
        <p style={{ color: "#64748B", marginBottom: "15px" }}>Selecciona una fecha y agrega el viaje a tu carrito.</p>
        
        {rutasDisponibles.length === 0 ? (
          <p>No hay rutas disponibles en este momento.</p>
        ) : (
          <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
            {rutasDisponibles.map(ruta => (
              <div key={ruta.id} style={{ border: "1px solid #E2E8F0", padding: "15px", borderRadius: "8px", width: "280px" }}>
                <h4 style={{ margin: "0 0 10px 0", color: "#0F172A" }}>{ruta.nombre_ruta}</h4>
                <p style={{ margin: "5px 0", fontSize: "14px" }}><strong>Origen:</strong> {ruta.origen}</p>
                <p style={{ margin: "5px 0", fontSize: "14px" }}><strong>Destino:</strong> {ruta.destino}</p>
                <p style={{ margin: "5px 0", fontSize: "14px", color: "#10B981", fontWeight: "bold" }}>Precio: Q{ruta.precio}</p>
                
                <div style={{ marginTop: "15px" }}>
                  <label style={{ fontSize: "12px", color: "#64748B" }}>Fecha de viaje:</label>
                  <input 
                    type="date" 
                    id={`fecha-ruta-${ruta.id}`} 
                    style={{ width: "100%", padding: "8px", marginBottom: "10px", borderRadius: "5px", border: "1px solid #CBD5E1" }}
                  />
                  <button 
                    onClick={() => {
                      const fechaInput = document.getElementById(`fecha-ruta-${ruta.id}`).value;
                      if (!fechaInput) return alert("Debes seleccionar una fecha para el viaje.");
                      agregarAlCarrito(ruta.id, "transporte", { fecha_inicio: fechaInput, precio_unitario: ruta.precio });
                    }}
                    disabled={cargando}
                    style={{ width: "100%", padding: "8px", backgroundColor: "#0F172A", color: "white", border: "none", borderRadius: "5px", cursor: cargando ? "not-allowed" : "pointer" }}
                  >
                    Agregar al Carrito
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- MIS RESERVACIONES (NUEVO) --- */}
      <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", marginBottom: "20px" }}>
        <h2>Mis Reservaciones y Compras</h2>
        {reservaciones.length === 0 ? (
          <p style={{ color: "#64748B" }}>Aún no has realizado ninguna compra.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "2px solid #E2E8F0" }}>
                  <th style={{ padding: "12px" }}>Servicio</th>
                  <th style={{ padding: "12px" }}>Fecha</th>
                  <th style={{ padding: "12px" }}>Total</th>
                  <th style={{ padding: "12px" }}>Estado</th>
                  <th style={{ padding: "12px" }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {reservaciones.map(res => (
                  <tr key={res.id} style={{ borderBottom: "1px solid #E2E8F0" }}>
                    <td style={{ padding: "12px" }}><strong>{res.tipo_servicio === 'envio' ? res.nombre_envio : res.nombre_transporte}</strong></td>
                    <td style={{ padding: "12px" }}>{new Date(res.fecha_inicio).toLocaleDateString('es-GT', { timeZone: 'UTC' })}</td>
                    <td style={{ padding: "12px", color: "#10B981", fontWeight: "bold" }}>Q{res.precio_total}</td>
                    <td style={{ padding: "12px" }}>
                      <span style={{ 
                        padding: "4px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold",
                        backgroundColor: res.estado === 'confirmado' ? '#DCFCE7' : res.estado === 'cancelado' ? '#FEE2E2' : '#F1F5F9',
                        color: res.estado === 'confirmado' ? '#166534' : res.estado === 'cancelado' ? '#991B1B' : '#475569'
                      }}>
                        {res.estado.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: "12px" }}>
                      {res.estado === 'confirmado' && (
                        <button 
                          onClick={() => cancelarReservacion(res.id, res.fecha_inicio)}
                          disabled={cargando}
                          style={{ padding: "6px 12px", backgroundColor: "#EF4444", color: "white", border: "none", borderRadius: "5px", cursor: cargando ? "not-allowed" : "pointer" }}
                        >
                          Cancelar y Reembolsar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        
        {/* COLUMNA IZQUIERDA: CARRITO */}
        <div style={{ flex: "1 1 400px", backgroundColor: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
          <h2>Mi Carrito</h2>
          {carrito.length === 0 ? (
            <p>El carrito está vacío.</p>
          ) : (
            <div>
              {carrito.map(item => (
                <div key={item.id} style={{ borderBottom: "1px solid #ccc", padding: "10px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <strong>{item.tipo_servicio === 'envio' ? item.nombre_envio : item.nombre_transporte}</strong>
                    <p style={{ margin: "5px 0", fontSize: "0.9em", color: "#666" }}>Fecha: {new Date(item.fecha_inicio).toLocaleDateString('es-GT', { timeZone: 'UTC' })}</p>
                    <p style={{ margin: "5px 0", color: "#10B981", fontWeight: "bold" }}>Q{item.subtotal}</p>
                  </div>
                  <button 
                    onClick={() => eliminarDelCarrito(item.id)}
                    disabled={cargando}
                    style={{ padding: "5px 10px", backgroundColor: "#EF4444", color: "white", border: "none", borderRadius: "3px", cursor: cargando ? "not-allowed" : "pointer" }}
                  >
                    Eliminar
                  </button>
                </div>
              ))}
              
              <h3 style={{ marginTop: "20px", textAlign: "right" }}>Total: Q{totalCarrito}</h3>
              
              <button 
                onClick={vaciarCarrito}
                disabled={cargando}
                style={{ width: "100%", marginTop: "10px", padding: "10px", backgroundColor: "#F59E0B", color: "white", border: "none", borderRadius: "5px", cursor: cargando ? "not-allowed" : "pointer" }}
              >
                Vaciar Carrito
              </button>
              
              <div style={{ marginTop: "20px", padding: "15px", backgroundColor: "#F8FAFC", borderRadius: "5px" }}>
                <h4>Pagar Reservación</h4>
                <select 
                  style={{ width: "100%", padding: "10px", marginBottom: "15px" }}
                  value={metodoSeleccionado}
                  onChange={(e) => setMetodoSeleccionado(e.target.value)}
                  disabled={cargando}
                >
                  <option value="">-- Selecciona una tarjeta / wallet --</option>
                  {metodosPago.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.tipo === 'tarjeta' ? `Tarjeta: ${m.numero_tarjeta}` : `Wallet: ${m.wallet_id}`} (Saldo: Q{m.saldo})
                    </option>
                  ))}
                </select>
                <button 
                  onClick={procesarPago}
                  disabled={cargando}
                  style={{ width: "100%", padding: "12px", backgroundColor: "#3B82F6", color: "white", border: "none", borderRadius: "5px", fontWeight: "bold", cursor: cargando ? "not-allowed" : "pointer" }}
                >
                  {cargando ? "Procesando..." : "Confirmar Pago"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA: MÉTODOS DE PAGO */}
        <div style={{ flex: "1 1 400px", backgroundColor: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
          <h2>Mis Métodos de Pago</h2>
          
          <div style={{ marginBottom: "20px" }}>
            {metodosPago.length === 0 ? <p>No tienes métodos de pago registrados.</p> : (
              <ul style={{ listStyle: "none", padding: 0 }}>
                {metodosPago.map(m => (
                  <li key={m.id} style={{ marginBottom: "10px", padding: "10px", backgroundColor: "#F8FAFC", borderRadius: "5px" }}>
                    <strong>{m.tipo === 'tarjeta' ? 'Tarjeta' : 'Wallet'}</strong> - Saldo: <span style={{ color: "#10B981" }}>Q{m.saldo}</span>
                    <br />
                    <small>{m.tipo === 'tarjeta' ? m.numero_tarjeta : m.wallet_id}</small>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <hr style={{ margin: "20px 0" }}/>

          <h3>Agregar Tarjeta</h3>
          <form onSubmit={agregarTarjeta} style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "30px" }}>
            <input type="text" placeholder="Número de Tarjeta (16 dígitos)" required value={formTarjeta.numero_tarjeta} onChange={e => setFormTarjeta({...formTarjeta, numero_tarjeta: e.target.value})} disabled={cargando} style={{ padding: "8px" }}/>
            <input type="text" placeholder="Nombre en la Tarjeta" required value={formTarjeta.nombre_tarjeta} onChange={e => setFormTarjeta({...formTarjeta, nombre_tarjeta: e.target.value})} disabled={cargando} style={{ padding: "8px" }}/>
            <div style={{ display: "flex", gap: "10px" }}>
              <input type="text" placeholder="MM/YYYY" required value={formTarjeta.fecha_vencimiento} onChange={e => setFormTarjeta({...formTarjeta, fecha_vencimiento: e.target.value})} disabled={cargando} style={{ padding: "8px", flex: 1 }}/>
              <input type="password" placeholder="CVV" required value={formTarjeta.cvv} onChange={e => setFormTarjeta({...formTarjeta, cvv: e.target.value})} disabled={cargando} style={{ padding: "8px", flex: 1 }} maxLength={4}/>
            </div>
            <button type="submit" disabled={cargando} style={{ padding: "10px", backgroundColor: "#10B981", color: "white", border: "none", borderRadius: "5px", cursor: cargando ? "not-allowed" : "pointer" }}>Agregar Tarjeta</button>
          </form>

          <h3>Agregar Wallet Alternativa</h3>
          <form onSubmit={agregarWallet} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <input type="text" placeholder="ID de tu Billetera (Ej. user@wallet)" required value={walletId} onChange={e => setWalletId(e.target.value)} disabled={cargando} style={{ padding: "8px" }}/>
            <button type="submit" disabled={cargando} style={{ padding: "10px", backgroundColor: "#8B5CF6", color: "white", border: "none", borderRadius: "5px", cursor: cargando ? "not-allowed" : "pointer" }}>Vincular Wallet</button>
          </form>

        </div>
      </div>
    </div>
  );
}

export default DashboardCliente;