import { createContext, useContext, useEffect, useState } from "react";
import { authApi, subscriptionApi } from "../services/api";

const AuthContext = createContext(null);
const TOKEN_KEY = "linkea_token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
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

  useEffect(() => {
    let cancelled = false;
    if (!token || isGuest) { setSubscription(null); return undefined; }
    subscriptionApi.me(token)
      .then((response) => { if (!cancelled) setSubscription({ ...response.subscription, usage: response.usage }); })
      .catch(() => { if (!cancelled) setSubscription(null); });
    return () => { cancelled = true; };
  }, [token, isGuest]);

  async function refreshSubscription() {
    if (!token) return null;
    const response = await subscriptionApi.me(token);
    setSubscription({ ...response.subscription, usage: response.usage });
    return { ...response.subscription, usage: response.usage };
  }

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
    setSubscription(null);
  }

  async function refreshUser() {
    if (!token) return null;
    const response = await authApi.me(token);
    setUser(response.user);
    return response.user;
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, isGuest, subscription, enterGuest, login, register, logout, refreshUser, refreshSubscription }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe utilizarse dentro de AuthProvider.");
  return context;
}
