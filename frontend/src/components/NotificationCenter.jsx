import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { notificationsApi } from "../services/api";
import { useAuth } from "../context/AuthContext";

function NotificationCenter() {
  const { token, isGuest } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNotifications = useCallback(async () => {
    if (!token || isGuest) return;
    try {
      const data = await notificationsApi.list(token);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
      setError("");
    } catch (err) {
      setError(err.message || "No pudimos cargar las notificaciones.");
    } finally {
      setLoading(false);
    }
  }, [token, isGuest]);

  useEffect(() => {
    loadNotifications();
    const interval = window.setInterval(loadNotifications, 30000);
    return () => window.clearInterval(interval);
  }, [loadNotifications]);

  function getNotificationDestination(notification) {
    const link = notification.link || "";
    if (link.startsWith("/home/")) return link;
    const section = link.replace(/^#/, "");
    const destinations = {
      contactos: "/home/contactos",
      oportunidades: "/home/oportunidades",
      mensajes: "/home/mensajes"
    };
    if (destinations[section]) return destinations[section];
    if (notification.type === "CHAT_MESSAGE") return "/home/mensajes";
    if (notification.type === "PROFESSIONAL_INVITATION" || notification.type === "INVITATION_RESPONSE") return "/home/contactos";
    if (notification.type === "NEW_OPPORTUNITY" || notification.type === "NEW_APPLICATION" || notification.type === "APPLICATION_UPDATE") return "/home/oportunidades";
    return "/home/perfil";
  }

  async function openNotification(notification) {
    if (!notification.readAt) {
      try {
        await notificationsApi.markRead(token, notification.id);
        setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item));
        setUnreadCount((count) => Math.max(0, count - 1));
        window.dispatchEvent(new Event("linkea:notifications-changed"));
      } catch (err) {
        setError(err.message || "No pudimos actualizar la notificación.");
        return;
      }
    }
    navigate(getNotificationDestination(notification));
  }

  async function markAllRead() {
    try {
      await notificationsApi.markAllRead(token);
      const now = new Date().toISOString();
      setNotifications((current) => current.map((item) => ({ ...item, readAt: item.readAt || now })));
      setUnreadCount(0);
      window.dispatchEvent(new Event("linkea:notifications-changed"));
    } catch (err) { setError(err.message || "No pudimos actualizar las notificaciones."); }
  }

  if (isGuest) return null;

  return (
    <section className="notification-center" id="notificaciones">
      <div className="notification-heading">
        <div><p className="discover-eyebrow">ACTIVIDAD</p><h2>Notificaciones {unreadCount > 0 && <span>{unreadCount}</span>}</h2><p>Enterate de las novedades de tu actividad en Linkea.</p></div>
        {unreadCount > 0 && <button type="button" onClick={markAllRead}>Marcar todas como leídas</button>}
      </div>
      {error && <p className="discover-status discover-error" role="alert">{error}</p>}
      {loading ? <p className="professional-empty">Cargando notificaciones...</p> : notifications.length === 0 ? (
        <div className="professional-empty"><strong>Estás al día</strong><p>Cuando haya novedades sobre tus invitaciones, oportunidades o postulaciones, las vas a encontrar acá.</p></div>
      ) : (
        <div className="notification-list">
          {notifications.map((item) => <button type="button" key={item.id} className={`notification-item notification-item-button ${item.readAt ? "is-read" : "is-unread"}`} onClick={() => openNotification(item)}>
            <span className="notification-dot" />
            <span className="notification-item-copy"><strong>{item.title}</strong><span>{item.message}</span><small>{new Date(item.createdAt).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}</small></span>
            <span className="notification-open-hint">Abrir →</span>
          </button>)}
        </div>
      )}
    </section>
  );
}

export default NotificationCenter;
