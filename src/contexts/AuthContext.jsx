// src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState({
    cardCode: "",
    cardName: "",
    tipo: "",
    isAuthenticated: false,
    loginTime: null,
  });

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
          isAuthenticated: true,
          loginTime: new Date(data.loginTime || Date.now()),
        });
      } catch (err) {
        console.error("Error loading session:", err);
      }
    }
  }, []);

  const login = (cardCode, cardName, tipo) => {
    const newSession = {
      cardCode,
      cardName,
      tipo,
      isAuthenticated: true,
      loginTime: new Date(),
    };
    
    sessionStorage.setItem(
      "demoecommerce_auth",
      JSON.stringify({
        cardCode,
        cardName,
        tipo,
        userName: cardName,
        loginTime: newSession.loginTime.toISOString(),
      })
    );
    
    setSession(newSession);
  };

  const logout = () => {
    sessionStorage.removeItem("demoecommerce_auth");
    setSession({
      cardCode: "",
      cardName: "",
      tipo: "C",
      isAuthenticated: false,
      loginTime: null,
    });
  };

  const value = {
    ...session,
    login,
    logout,
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
