import { useEffect, useState } from "react";
import { likesApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import genericUser from "../assets/images/genericUser.png";

function LikesHistory() {
  const { token, isGuest } = useAuth();
  const [likes, setLikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadLikes() {
      if (!token || isGuest) { setLoading(false); return; }
      try {
        setLoading(true);
        setError("");
        const response = await likesApi.listSent(token);
        if (active) setLikes(response.likes || []);
      } catch (err) {
        if (active) setError(err.message || "No pudimos cargar tu historial de likes.");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadLikes();
    return () => { active = false; };
  }, [token, isGuest]);

  return (
    <section className="likes-history-section" id="mis-likes">
      <div className="likes-history-heading">
        <div>
          <p className="discover-eyebrow">Tus conexiones</p>
          <h2>Mis likes</h2>
          <p className="discover-subtitle">Perfiles a los que les diste Me gusta.</p>
        </div>
        {!loading && !error && <span className="discover-count">{likes.length} {likes.length === 1 ? "like" : "likes"}</span>}
      </div>
      {isGuest ? (
        <div className="discover-message"><h3>Iniciá sesión para ver tus likes</h3><p>Tu historial estará disponible cuando uses tu cuenta.</p></div>
      ) : loading ? (
        <p className="discover-status">Cargando tu historial...</p>
      ) : error ? (
        <p className="discover-status discover-error" role="alert">{error}</p>
      ) : likes.length === 0 ? (
        <div className="discover-message"><h3>Todavía no diste likes</h3><p>Cuando marques un perfil con ♥ Me gusta, lo vas a encontrar acá.</p></div>
      ) : (
        <div className="likes-history-grid">
          {likes.map((like) => {
            const person = like.toUser;
            const profile = person?.profile || {};
            return (
              <article className="likes-history-card" key={like.id}>
                <img src={profile.photoUrl || genericUser} alt={profile.displayName || person.username} loading="lazy" />
                <div className="likes-history-card-content">
                  <h3>{profile.displayName || person.username}</h3>
                  <p className="discover-username">@{person.username}</p>
                  {profile.city && <p className="discover-city">{profile.city}</p>}
                  {profile.vocalRegister && <span className="discover-vocal-register">{profile.vocalRegister}</span>}
                  <p className="likes-history-date">Like enviado el {new Date(like.createdAt).toLocaleDateString("es-AR")}</p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default LikesHistory;
