// src/pages/Home.jsx
import { useAuth } from "../contexts/AuthContext";

export default function Home() {
  const auth = useAuth();

  return (
    <div className="home-page">
      <div className="hero">
        <h1>🍌 Bienvenido a Cartera de Clientes</h1>
        <p className="lead">
          Portal de gestión para distribuidores de snacks premium de plátano.
          Consulta tu cartera, histórico de pedidos y gestiona tus pagos de forma sencilla.
        </p>
        {auth.isAuthenticated ? (
          <div>
            <h3>Hola, {auth.cardName}!</h3>
            <p>Accede a tu cuenta para ver tu información detallada.</p>
            <a className="button" href="/account">
              Ver Mi Cuenta
            </a>
          </div>
        ) : (
          <a className="button" href="/login">
            Iniciar Sesión
          </a>
        )}
      </div>

      <div className="info-section" style={{ marginTop: 'var(--spacing-xl)' }}>
        <h2>Nuestros Productos</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: 'var(--spacing-lg)',
          marginTop: 'var(--spacing-lg)'
        }}>
          <div className="card">
            <h3>🥔 Chifles Tradicionales</h3>
            <p>Láminas extra finas de plátano verde, crujientes y deliciosas con un toque de sal marina.</p>
          </div>
          <div className="card">
            <h3>🌶️ Chifles Picantes</h3>
            <p>Nuestra versión más picante con ají habanero y especias seleccionadas de la Amazonía.</p>
          </div>
          <div className="card">
            <h3>🍯 Chips de Plátano Maduro</h3>
            <p>Dulces y crujientes, elaborados con plátanos maduros en su punto perfecto.</p>
          </div>
        </div>
      </div>

      <div className="features-section" style={{ 
        marginTop: 'var(--spacing-2xl)',
        padding: 'var(--spacing-xl)',
        background: 'var(--color-bg-secondary)',
        borderRadius: 'var(--radius-lg)'
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
          ¿Por qué elegirnos?
        </h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: 'var(--spacing-lg)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem' }}>🌱</div>
            <h4>100% Gluten-Free</h4>
            <p>Productos como Platano, Yuca y Camote</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem' }}>✡️</div>
            <h4>Dieta Kosher</h4>
            <p>Certificado y siguiendo estrictas normas alimentarias</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem' }}>🇪🇨</div>
            <h4>Producto 100% Ecuatoriano</h4>
            <p>Elaborado con ingredientes locales de la mejor calidad</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem' }}>📦</div>
            <h4>Gestión Fácil</h4>
            <p>Consulta tu cartera y pedidos en tiempo real</p>
          </div>
        </div>
      </div>
    </div>
  );
}