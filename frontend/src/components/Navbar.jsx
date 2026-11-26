import { useCallback, useEffect, useRef, useState } from "react";
import { NavLink } from "react-router";
import { conversationsApi, notificationsApi, profileApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import gUser from "../assets/images/genericUser.png";
import notificationSound from "../assets/notificationSound";
import "../styles/home.css";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const photoInputRef = useRef(null);
  const notificationAudioRef = useRef(null);
  const previousUnreadCountRef = useRef(null);
  const { user, isGuest, token, refreshUser } = useAuth();
  const isInstitution = user?.accountType === "INSTITUTION";
  const closeMenu = () => setMenuOpen(false);

  async function handlePhotoChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setPhotoError("Elegí una imagen JPG, PNG o WEBP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("La foto no puede superar los 5 MB.");
      return;
    }
    setPhotoError("");
    setUploadingPhoto(true);
    try {
      await profileApi.uploadPhoto(token, file);
      await refreshUser();
    } catch (error) {
      setPhotoError(error.message || "No se pudo actualizar la foto.");
    } finally {
      setUploadingPhoto(false);
    }
  }

  const loadUnreadNotifications = useCallback(async () => {
    if (!token || isGuest) {
      setHasUnreadNotifications(false);
      setHasUnreadMessages(false);
      return;
    }
    try {
      const [data, conversationsData] = await Promise.all([
        notificationsApi.list(token),
        conversationsApi.list(token)
      ]);
      const nextUnreadCount = data.unreadCount || 0;
      if (previousUnreadCountRef.current !== null && nextUnreadCount > previousUnreadCountRef.current) {
        const audio = notificationAudioRef.current;
        if (audio) { audio.currentTime = 0; audio.play().catch(() => {}); }
      }
      previousUnreadCountRef.current = nextUnreadCount;
      setHasUnreadNotifications(nextUnreadCount > 0);
      setHasUnreadMessages((conversationsData.conversations || []).some((conversation) => conversation.unreadCount > 0));
    } catch {
      // Keep navigation usable if notifications are temporarily unavailable.
    }
  }, [token, isGuest]);

  useEffect(() => {
    const audio = new Audio(notificationSound);
    audio.preload = "auto";
    notificationAudioRef.current = audio;
    return () => { audio.pause(); notificationAudioRef.current = null; };
  }, []);

  useEffect(() => {
    loadUnreadNotifications();
    const interval = window.setInterval(loadUnreadNotifications, 10000);
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
      { to: "/home/mensajes", label: "Mensajes", messages: true },
      { to: "/home/oportunidades", label: isInstitution ? "Mis convocatorias" : "Oportunidades" },
      { to: "/home/notificaciones", label: "Notificaciones", notifications: true }
    ] : [])
  ];

  return (
    <nav className="navbar">
      <div className="navbar-brand-area">
        {user && !isGuest ? (
          <>
            <button className="navbar-profile-avatar" type="button" onClick={() => photoInputRef.current?.click()} disabled={uploadingPhoto} aria-label="Cambiar foto de perfil" title={uploadingPhoto ? "Subiendo foto..." : "Cambiar foto de perfil"}>
              <img src={user.profile?.photoUrl || gUser} alt="Tu foto de perfil" />
              <span aria-hidden="true">{uploadingPhoto ? "…" : "＋"}</span>
            </button>
            <input ref={photoInputRef} className="profile-photo-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} aria-label="Seleccionar nueva foto de perfil" />
            {photoError && <span className="navbar-photo-error" role="alert">{photoError}</span>}
          </>
        ) : (
          <NavLink to="/home/perfil" className="logo" onClick={closeMenu} aria-label="Linkea, inicio">
            <span className="logo-mark">L</span><span>linkea</span>
          </NavLink>
        )}
      </div>
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
                link.notifications || link.messages ? "nav-notifications-link" : ""
              ].filter(Boolean).join(" ")}
            >
              {link.label}
              {link.messages && hasUnreadMessages && (
                <span className="nav-notification-indicator" aria-label="Tenés mensajes sin leer" />
              )}
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
