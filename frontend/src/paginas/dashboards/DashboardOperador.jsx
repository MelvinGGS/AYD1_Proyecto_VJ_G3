import { useNavigate } from "react-router-dom";

function DashboardOperador() {
  const navigate = useNavigate();

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("rol");
    navigate("/");
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      backgroundColor: '#F1F5F9',
      width: '100vw',
      position: 'fixed',
      top: 0,
      left: 0
    }}>
      <button 
        onClick={cerrarSesion}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          padding: '10px 20px',
          backgroundColor: '#EF4444',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        Cerrar sesión
      </button>
      <h1 style={{ color: '#0F172A' }}>Dashboard Operador</h1>
    </div>
  );
}

export default DashboardOperador;