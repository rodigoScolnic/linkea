import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { likesApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import genericUser from "../assets/images/genericUser.png";

function ReceivedLikes() {
  const { token, subscription } = useAuth();
  const navigate = useNavigate();
  const [likes, setLikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    likesApi.listReceived(token)
      .then((data) => { if (active) setLikes(data.likes || []); })
      .catch((err) => { if (active) setError(err.message || "No pudimos cargar los likes recibidos."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  if (!subscription?.isPremium) {
    return (
      <section className="likes-history-section premium-locked-section">
        <div className="premium-lock-card">
          <span className="premium-lock-icon">✦</span>
          <p className="discover-eyebrow">LINK​​EA PREMIUM</p>
          <h2>Descubrí quién está interesado en vos</h2>
          <p>Con Premium podés ver quién te dio Me gusta y empezar a conectar con nuevas oportunidades.</p>
          <button type="button" className="opportunity-primary-button" onClick={() => navigate("/home/plan")}>Conocer Premium</button>
        </div>
      </section>
    );
  }

  return (
    <section className="likes-history-section">
      <div className="likes-history-heading">
        <div><p className="discover-eyebrow">Tus conexiones</p><h2>Likes recibidos</h2><p className="discover-subtitle">Personas e instituciones que mostraron interés en tu perfil.</p></div>
        {!loading && !error && <span className="discover-count">{likes.length} {likes.length === 1 ? "like" : "likes"}</span>}
      </div>
      {loading ? <p className="discover-status">Cargando likes recibidos...</p>
        : error ? <p className="discover-status discover-error" role="alert">{error}</p>
        : likes.length === 0 ? <div className="discover-message"><h3>Todavía no recibiste likes</h3><p>Cuando alguien se interese en tu perfil, vas a verlo acá.</p></div>
        : <div className="likes-history-grid">{likes.map((like) => {
          const person = like.fromUser;
          const profile = person?.profile || {};
          const name = person?.institutionProfile?.name || profile.displayName || person?.username || "Contacto";
          const photo = person?.institutionProfile?.logoUrl || profile.photoUrl || genericUser;
          return <article className="likes-history-card likes-tinder-card" key={like.id}>
            <div className="likes-tinder-profile-link">
              <img className="likes-card-photo" src={photo} alt="" loading="lazy" />
              <span className="likes-card-shade" aria-hidden="true" />
              <div className="likes-history-card-content">
                <div className="likes-card-tags">{person?.accountType === "INSTITUTION" && <span>Institución</span>}{profile.vocalRegister && <span>{profile.vocalRegister}</span>}{(person?.institutionProfile?.city || profile.city) && <span>{person?.institutionProfile?.city || profile.city}</span>}</div>
                <h3>{name}</h3><p className="likes-card-username">@{person?.username}</p>
                <span className="likes-history-date">♥ Te dio Me gusta el {new Date(like.createdAt).toLocaleDateString("es-AR")}</span>
              </div>
            </div>
          </article>;
        })}</div>}
    </section>
  );
}
export default ReceivedLikes;
