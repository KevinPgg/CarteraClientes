// src/services/UserSessionState.js
import { useState } from "react";

let subscribers = [];
let session = {
  id: null,
  cardCode: "",
  cardName: "",
  tipo: "",
  usuario: "",
  email: [],
  notificacion: false,
  isAuthenticated: false,
  loginTime: null,
};

export function useUserSessionState() {
  const [state, setState] = useState(session);

  /**
   * Establece el usuario actual en la sesión
   * @param {Object} userData - Datos del usuario desde loginUser
   */
  const setUser = (userData) => {
    session = {
      id: userData.id,
      cardCode: userData.cardCode,
      cardName: userData.cardName,
      tipo: userData.tipo,
      usuario: userData.usuario,
      email: userData.email || [],
      notificacion: userData.notificacion,
      isAuthenticated: true,
      loginTime: new Date(),
    };
    setState({ ...session });
    subscribers.forEach((s) => s());
  };

  const logout = () => {
    session = {
      id: null,
      cardCode: "",
      cardName: "",
      tipo: "",
      usuario: "",
      email: [],
      notificacion: false,
      isAuthenticated: false,
      loginTime: null,
    };
    setState({ ...session });
    subscribers.forEach((s) => s());
  };

  const subscribe = (fn) => {
    subscribers.push(fn);
    return () => {
      subscribers = subscribers.filter((s) => s !== fn);
    };
  };

  return {
    ...state,
    setUser,
    logout,
    subscribe,
  };
}