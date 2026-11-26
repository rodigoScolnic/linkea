import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { favoritesApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import genericUser from "../assets/images/genericUser.png";

function InstitutionFavorites() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState("");

  useEffect(() => {
    let active = true;
    async function loadFavorites() {
      if (!token || user?.accountType !== "INSTITUTION") {
        setLoading(false);
        return;
      }
      try {
        const response = await favoritesApi.list(token);
        if (active) setFavorites(response.favorites || []);
      } catch (err) {
        if (active) setError(err.message || "No pudimos cargar tus favoritos.");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadFavorites();
    const handleFavoritesChanged = () => loadFavorites();
    window.addEventListener("linkea:favorites-changed", handleFavoritesChanged);
    return () => {
      active = false;
      window.removeEventListener("linkea:favorites-changed", handleFavoritesChanged);
    };
  }, [token, user?.accountType]);

  async function removeFavorite(talentId) {
    setRemovingId(talentId);
    setError("");
    try {
      await favoritesApi.remove(token, talentId);
      setFavorites((current) => current.filter((item) => item.talentId !== talentId));
    } catch (err) {
      setError(err.message || "No pudimos quitar el talento de favoritos.");
    } finally {
      setRemovingId("");
    }
  }

  return (
    <section className="institution-favorites-section" id="favoritos">
      <div className="institution-favorites-heading">
        <div>
          <p className="discover-eyebrow">Tu selección privada</p>
          <h2>Talentos guardados</h2>
          <p>Perfiles que tu institución quiere tener a mano.</p>
        </div>
        {!loading && <span className="discover-count">{favorites.length} {favorites.length === 1 ? "talento" : "talentos"}</span>}
      </div>
      {error && <p className="discover-status discover-error" role="alert">{error}</p>}
      {loading ? <p className="discover-status">Cargando favoritos...</p> : favorites.length === 0 ? (
        <div className="discover-message">
          <h3>Todavía no guardaste talentos</h3>
          <p>Explorá el directorio y seleccioná “Guardar talento” en los perfiles que te interesen.</p>
        </div>
      ) : (
        <div className="institution-favorites-grid">
          {favorites.map(({ talent, talentId }) => {
            const profile = talent.profile || {};
            const name = profile.displayName || talent.username;
            return (
              <article className="institution-favorite-card" key={talentId}>
                <button type="button" className="profile-card-link" onClick={() => navigate(`/home/talento/${talentId}`)}>
                  <img src={profile.photoUrl || genericUser} alt="" loading="lazy" />
                  <div className="institution-favorite-card-content">
                    <h3>{name}</h3>
                    <p className="discover-username">@{talent.username}</p>
                    {profile.vocalRegister && <span className="discover-vocal-register">{profile.vocalRegister}</span>}
                    {profile.city && <p className="discover-city">{profile.city}</p>}
                    <span className="profile-card-link-hint">Ver perfil →</span>
                  </div>
                </button>
                <button type="button" onClick={() => removeFavorite(talentId)} disabled={removingId === talentId}>
                  {removingId === talentId ? "Quitando..." : "Quitar de favoritos"}
                </button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default InstitutionFavorites;
