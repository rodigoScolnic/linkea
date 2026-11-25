import { useCallback, useEffect, useState } from "react";
import { notificationsApi } from "../services/api";
import { useAuth } from "../context/AuthContext";

function NotificationCenter() {
  const { token, isGuest } = useAuth();
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

  async function markRead(notification) {
    if (notification.readAt) return;
    try {
      await notificationsApi.markRead(token, notification.id);
      setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item));
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (err) { setError(err.message || "No pudimos actualizar la notificación."); }
  }

  async function markAllRead() {
    try {
      await notificationsApi.markAllRead(token);
      const now = new Date().toISOString();
      setNotifications((current) => current.map((item) => ({ ...item, readAt: item.readAt || now })));
      setUnreadCount(0);
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
          {notifications.map((item) => <article key={item.id} className={`notification-item ${item.readAt ? "is-read" : "is-unread"}`} onClick={() => markRead(item)}>
            <span className="notification-dot" />
            <div><strong>{item.title}</strong><p>{item.message}</p><small>{new Date(item.createdAt).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}</small></div>
          </article>)}
        </div>
      )}
    </section>
  );
}

export default NotificationCenter;
