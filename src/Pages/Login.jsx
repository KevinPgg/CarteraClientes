// src/Pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../Services/AuthService";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const auth = useAuth();
  const navigate = useNavigate();

  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await loginUser(user, password);
      if (result) {
        auth.login(result.cardCode, result.cardName, result.tipo);
        navigate("/account");
      } else {
        setError("Usuario o contraseña incorrectos");
      }
    } catch (err) {
      setError("Error al intentar iniciar sesión");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (auth.isAuthenticated) {
    return (
      <div className="login-page">
        <div className="login-container">
          <h1>Ya estás conectado</h1>
          <p>Hola, {auth.cardName}!</p>
          <button onClick={() => navigate("/account")}>Ir a Mi Cuenta</button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>Iniciar Sesión</h1>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Usuario:</label>
            <input
              type="text"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Contraseña:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? "Conectando..." : "Iniciar Sesión"}
          </button>
        </form>

        <div className="test-credentials">
          <p><strong>Credenciales de prueba:</strong></p>
          <ul>
            <li>user0916 / CUser*0916</li>
            <li>user9925 / CUser*9925</li>
            <li>user0049 / CUser*0049</li>
          </ul>
        </div>
      </div>
    </div>
  );
}