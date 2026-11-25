import { useCallback, useEffect, useState } from "react";
import { NavLink } from "react-router";
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

  const links = [
    { to: "/home/perfil", label: "Mi perfil" },
    { to: "/home/descubrir", label: isInstitution ? "Descubrir talentos" : "Descubrir" },
    ...(!isGuest ? [{ to: isInstitution ? "/home/favoritos" : "/home/likes", label: isInstitution ? "Talentos guardados" : "Mis likes" }] : []),
    ...(!isGuest ? [
      { to: "/home/contactos", label: "Contactos profesionales" },
      { to: "/home/oportunidades", label: isInstitution ? "Mis convocatorias" : "Oportunidades" },
      { to: "/home/notificaciones", label: "Notificaciones", notifications: true }
    ] : [])
  ];

  return (
    <nav className="navbar">
      <NavLink to="/home/perfil" className="logo" onClick={closeMenu} aria-label="Linkea, inicio">
        <span className="logo-mark">L</span>
        <span>linkea</span>
      </NavLink>
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
        {links.map((link) => (
          <li key={link.to}>
            <NavLink
              to={link.to}
              onClick={closeMenu}
              className={({ isActive }) => [
                isActive ? "active" : "",
                link.notifications ? "nav-notifications-link" : ""
              ].filter(Boolean).join(" ")}
            >
              {link.label}
              {link.notifications && hasUnreadNotifications && (
                <span className="nav-notification-indicator" aria-label="Tenés notificaciones sin leer" />
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default Navbar;
