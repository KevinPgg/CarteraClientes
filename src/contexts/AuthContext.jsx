// src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState({
    cardCode: "",
    cardName: "",
    tipo: "",
    usuario: "",
    email: [],
    notificacion: false,
    isAuthenticated: false,
    userSelected: "",
    loginTime: null,
  });

  const setUserSelected = (value) => {
    setSession((prev) => ({ ...prev, userSelected: value }));
  };

  // Cargar sesión desde sessionStorage al iniciar
  useEffect(() => {
    const stored = sessionStorage.getItem("demoecommerce_auth");
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setSession({
          cardCode: data.cardCode,
          cardName: data.cardName ?? data.userName,
          tipo: data.tipo || "C",
          usuario: data.usuario || "",
          email: data.email || [],
          notificacion: data.notificacion || false,
          isAuthenticated: !!data.isAuthenticated,
          userSelected: data.userSelected || "",
          loginTime: new Date(data.loginTime || Date.now()),
        });
      } catch (err) {
        console.error("Error loading session:", err);
      }
    }
  }, []);

  // Sincronizar sesión en almacenamiento solo si está autenticado
  useEffect(() => {
    if (session.isAuthenticated) {
      sessionStorage.setItem("demoecommerce_auth", JSON.stringify(session));
    }
  }, [session]);

  /**
   * Inicia sesión con los datos del usuario desde loginUser
   * @param {Object} userData - Datos del usuario completos
   */
  const login = (userData) => {
    const newSession = {
      cardCode: userData.cardCode,
      cardName: userData.cardName,
      tipo: userData.tipo,
      usuario: userData.usuario,
      email: userData.email || [],
      notificacion: userData.notificacion || false,
      userSelected: "",
      isAuthenticated: true,
      loginTime: new Date(),
    };

    console.log("🔒 Nueva sesión:", newSession);
    setSession(newSession);
    // Persistir inmediatamente tras login
    sessionStorage.setItem("demoecommerce_auth", JSON.stringify(newSession));
    console.log("🔒 AuthContext.login completado");
  };

  const logout = () => {
    sessionStorage.removeItem("demoecommerce_auth");
    setSession({
      cardCode: "",
      cardName: "",
      tipo: "C",
      usuario: "",
      email: [],
      notificacion: false,
      isAuthenticated: false,
      userSelected: "",
      loginTime: null,
    });
  };

  const value = {
    ...session,
    login,
    logout,
    setUserSelected,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}