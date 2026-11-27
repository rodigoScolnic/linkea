import { useEffect, useState } from "react";
import { likesApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import genericUser from "../assets/images/genericUser.png";

function LikesHistory() {
  const { token, isGuest } = useAuth();
  const [selectedPerson, setSelectedPerson] = useState(null);
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
              <article className="likes-history-card likes-tinder-card" key={like.id}>
                <button
                  type="button"
                  className="profile-card-link likes-profile-link likes-tinder-profile-link"
                  onClick={() => setSelectedPerson(person)}
                  aria-label={`Ver perfil de ${profile.displayName || person.username}`}
                >
                  <img className="likes-card-photo" src={profile.photoUrl || genericUser} alt="" loading="lazy" />
                  <span className="likes-card-shade" aria-hidden="true" />
                  <div className="likes-history-card-content">
                    <div className="likes-card-tags">
                      {profile.vocalRegister && <span>{profile.vocalRegister}</span>}
                      {profile.city && <span>{profile.city}</span>}
                    </div>
                    <h3>{profile.displayName || person.username}</h3>
                    <p className="likes-card-username">@{person.username}</p>
                    {profile.bio && <p className="likes-card-bio">{profile.bio}</p>}
                    <span className="likes-history-date">♥ Like enviado el {new Date(like.createdAt).toLocaleDateString("es-AR")}</span>
                    <span className="likes-card-hint">Ver perfil <span aria-hidden="true">→</span></span>
                  </div>
                </button>
              </article>
            );
          })}
        </div>
      )}

      {selectedPerson && (
        <div className="discover-modal-backdrop" role="presentation" onClick={() => setSelectedPerson(null)}>
          <section
            className="discover-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="likes-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button className="discover-modal-close" type="button" onClick={() => setSelectedPerson(null)} aria-label="Cerrar">×</button>
            <img
              className="discover-modal-photo"
              src={selectedPerson.profile?.photoUrl || genericUser}
              alt={`Foto de ${selectedPerson.profile?.displayName || selectedPerson.username}`}
            />
            <p className="discover-eyebrow">Perfil de Linkea</p>
            <h2 id="likes-modal-title">{selectedPerson.profile?.displayName || selectedPerson.username}</h2>
            <p className="discover-username">@{selectedPerson.username}</p>
            {selectedPerson.profile?.city && <p className="discover-city">{selectedPerson.profile.city}</p>}
            {selectedPerson.profile?.vocalRegister && <p className="discover-vocal-register">{selectedPerson.profile.vocalRegister}</p>}
            {selectedPerson.profile?.bio && <p className="discover-modal-bio">{selectedPerson.profile.bio}</p>}
            {selectedPerson.profile?.gender && <p className="discover-city">Género: {selectedPerson.profile.gender}</p>}
            {selectedPerson.profile?.experience && <p className="discover-city">Experiencia: {selectedPerson.profile.experience}</p>}
            {selectedPerson.profile?.languages?.length > 0 && <p className="discover-city">Idiomas: {selectedPerson.profile.languages.join(", ")}</p>}
            {selectedPerson.profile?.repertoire?.length > 0 && (
              <div className="discover-modal-repertoire">
                <strong>Repertorio</strong>
                <p>{selectedPerson.profile.repertoire.join(" · ")}</p>
              </div>
            )}
            {selectedPerson.profile?.interests?.length > 0 && (
              <div className="discover-interests discover-modal-interests">
                {selectedPerson.profile.interests.map((interest) => <span key={interest}>{interest}</span>)}
              </div>
            )}
            {selectedPerson.profile?.media?.length > 0 && (
              <div className="discover-public-gallery">
                <h3>Galería</h3>
                <div className="profile-gallery-grid">
                  {selectedPerson.profile.media.map((item) => (
                    <div className="profile-gallery-item" key={item.id}>
                      {item.type === "video"
                        ? <video src={item.url} controls preload="metadata" />
                        : <img src={item.url} alt={item.fileName || "Imagen de la galería"} loading="lazy" />}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <p className="discover-like-notice likes-modal-confirmation">
              ♥ Ya le diste Me gusta a este perfil
            </p>
          </section>
        </div>
      )}
    </section>
  );
}

export default LikesHistory;
