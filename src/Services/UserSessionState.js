// src/services/UserSessionState.js
import { useState } from "react";

let subscribers = [];
let session = {
  cardCode: "",
  cardName: "",
  isAuthenticated: false,
  loginTime: null,
};

export function useUserSessionState() {
  const [state, setState] = useState(session);

  const setUser = (code, name) => {
    session = {
      cardCode: code,
      cardName: name,
      isAuthenticated: true,
      loginTime: new Date(),
    };
    setState({ ...session });
    subscribers.forEach((s) => s());
  };

  const logout = () => {
    session = {
      cardCode: "",
      cardName: "",
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