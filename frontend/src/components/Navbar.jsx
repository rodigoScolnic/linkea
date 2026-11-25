import { useCallback, useEffect, useState } from "react";
import { notificationsApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import "../styles/home.css";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const { user, isGuest, token } = useAuth();
  const isInstitution = user?.accountType === "INSTITUTION";
  const closeMenu = () => setMenuOpen(false);

  const loadUnreadNotifications = useCallback(async () => {
    if (!token || isGuest) {
      setHasUnreadNotifications(false);
      return;
    }
    try {
      const data = await notificationsApi.list(token);
      setHasUnreadNotifications((data.unreadCount || 0) > 0);
    } catch {
      // Keep navigation usable if notifications are temporarily unavailable.
    }
  }, [token, isGuest]);

  useEffect(() => {
    loadUnreadNotifications();
    const interval = window.setInterval(loadUnreadNotifications, 30000);
    const handleNotificationsChanged = () => loadUnreadNotifications();
    window.addEventListener("linkea:notifications-changed", handleNotificationsChanged);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("linkea:notifications-changed", handleNotificationsChanged);
    };
  }, [loadUnreadNotifications]);

  return (
    <nav className="navbar">
      <a href="/home" className="logo" onClick={closeMenu} aria-label="Linkea, inicio">
        <span className="logo-mark">L</span>
        <span>linkea</span>
      </a>
      <button
        className={`hamburger ${menuOpen ? "active" : ""}`}
        onClick={() => setMenuOpen((open) => !open)}
        aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={menuOpen}
        aria-controls="home-navigation"
        type="button"
      >
        <span></span><span></span><span></span>
      </button>
      <ul id="home-navigation" className={`nav-links ${menuOpen ? "open" : ""}`}>
        <li><a href="#mi-perfil" onClick={closeMenu}>Mi perfil</a></li>
        <li><a href="#descubrir" onClick={closeMenu}>Descubrir</a></li>
        <li>
          <a href={isInstitution ? "#favoritos" : "#mis-likes"} onClick={closeMenu}>
            {isInstitution ? "Talentos guardados" : "Mis likes"}
          </a>
        </li>
        {!isGuest && <li><a href="#contactos" onClick={closeMenu}>Contactos profesionales</a></li>}
        {!isGuest && <li><a href="#oportunidades" onClick={closeMenu}>Oportunidades</a></li>}
        {!isGuest && <li>
          <a href="#notificaciones" onClick={closeMenu} className="nav-notifications-link">
            Notificaciones
            {hasUnreadNotifications && <span className="nav-notification-indicator" aria-label="Tenés notificaciones sin leer" />}
          </a>
        </li>}
      </ul>
    </nav>
  );
}

export default Navbar;
