import { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "../services/api";

const AuthContext = createContext(null);
const TOKEN_KEY = "linkea_token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(() => sessionStorage.getItem("linkea_guest") === "true");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await authApi.me(token);
        if (!cancelled) setUser(response.user);
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        if (!cancelled) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSession();
    return () => {
      cancelled = true;
    };
  }, [token]);

  function saveSession(response) {
    sessionStorage.removeItem("linkea_guest");
    setIsGuest(false);
    localStorage.setItem(TOKEN_KEY, response.token);
    setUser(response.user);
    setToken(response.token);
  }

  async function login(identifier, password) {
    const response = await authApi.login(identifier, password);
    saveSession(response);
    return response.user;
  }

  async function register(userData) {
    const response = await authApi.register(userData);
    saveSession(response);
    return response.user;
  }

  function enterGuest() {
    sessionStorage.setItem("linkea_guest", "true");
    setIsGuest(true);
  }

  function logout() {
    sessionStorage.removeItem("linkea_guest");
    setIsGuest(false);
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }

  async function refreshUser() {
    if (!token) return null;
    const response = await authApi.me(token);
    setUser(response.user);
    return response.user;
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, isGuest, enterGuest, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe utilizarse dentro de AuthProvider.");
  return context;
}
