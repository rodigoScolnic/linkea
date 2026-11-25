import { useEffect, useState } from "react";
import { discoveryApi, favoritesApi, likesApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import genericUser from "../assets/images/genericUser.png";

const initialFilters = { vocalRegister: "", minAge: "", maxAge: "", city: "" };

function DiscoverPeople() {
  const { token, isGuest, user } = useAuth();
  const isInstitution = user?.accountType === "INSTITUTION";
  const [people, setPeople] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [likeError, setLikeError] = useState("");
  const [notice, setNotice] = useState("");
  const [likingIds, setLikingIds] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [favoriteBusyIds, setFavoriteBusyIds] = useState([]);

  useEffect(() => {
    let active = true;
    async function loadFavorites() {
      if (!isInstitution || !token) {
        setFavoriteIds([]);
        return;
      }
      try {
        const response = await favoritesApi.list(token);
        if (active) setFavoriteIds((response.favorites || []).map((item) => item.talentId));
      } catch (err) {
        if (active) setError(err.message || "No pudimos cargar tus favoritos.");
      }
    }
    loadFavorites();
    return () => { active = false; };
  }, [token, isInstitution]);

  useEffect(() => {
    let active = true;
    async function loadPeople() {
      if (!token || isGuest) { setLoading(false); return; }
      try {
        if (offset === 0) setLoading(true);
        else setLoadingMore(true);
        setError("");
        const response = await discoveryApi.list(token, 50, appliedFilters, offset);
        if (!active) return;
        setPeople((current) => offset === 0
          ? (response.users || [])
          : [...current, ...(response.users || [])]);
        setHasMore(Boolean(response.hasMore));
      } catch (err) {
        if (active) setError(err.message || "No pudimos cargar los perfiles.");
      } finally {
        if (active) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    }
    loadPeople();
    return () => { active = false; };
  }, [token, isGuest, appliedFilters, offset]);

  function updateFilter(event) {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function applyFilters(event) {
    event.preventDefault();
    setError("");
    setOffset(0);
    setAppliedFilters({ ...filters });
  }

  function clearFilters() {
    setFilters(initialFilters);
    setOffset(0);
    setAppliedFilters(initialFilters);
  }

  async function toggleFavorite(person) {
    if (!token || favoriteBusyIds.includes(person.id)) return;
    const alreadySaved = favoriteIds.includes(person.id);
    setFavoriteBusyIds((current) => [...current, person.id]);
    setError("");
    try {
      if (alreadySaved) {
        await favoritesApi.remove(token, person.id);
        setFavoriteIds((current) => current.filter((id) => id !== person.id));
      } else {
        await favoritesApi.add(token, person.id);
        setFavoriteIds((current) => [...current, person.id]);
      }
    } catch (err) {
      setError(err.message || "No pudimos actualizar tus favoritos.");
    } finally {
      setFavoriteBusyIds((current) => current.filter((id) => id !== person.id));
    }
  }

  async function handleLike(person) {
    if (!token || likingIds.includes(person.id)) return;
    try {
      setLikeError("");
      setNotice("");
      setLikingIds((current) => [...current, person.id]);
      const response = await likesApi.like(token, person.id);
      setPeople((current) => current.filter((item) => item.id !== person.id));
      setSelectedPerson(null);
      setNotice(response.matched
        ? `¡Es un match con @${person.username}! Ya pueden empezar a conversar.`
        : `¡Le diste like a @${person.username}!`);
    } catch (err) {
      setLikeError(err.message || "No pudimos enviar el like. Intentá nuevamente.");
    } finally {
      setLikingIds((current) => current.filter((id) => id !== person.id));
    }
  }

  return (
    <section className="discover-section" id="descubrir">
      <div className="discover-heading">
        <div>
          <p className="discover-eyebrow">{isInstitution ? "Búsqueda de talentos" : "Conocé gente nueva"}</p>
          <h2>{isInstitution ? "Descubrí artistas" : "Descubrí perfiles"}</h2>
          <p className="discover-subtitle">{isInstitution
            ? "Explorá los perfiles de cantantes y artistas que forman parte de Linkea."
            : "Personas que ya forman parte de Linkea."}</p>
        </div>
        {!loading && !error && <span className="discover-count">{people.length} {people.length === 1 ? "perfil" : "perfiles"}</span>}
      </div>

      {!isGuest && (
        <form className="discover-filters" onSubmit={applyFilters}>
          <div className="discover-filters-heading">
            <h3>Filtrar talentos</h3>
            <span>Combiná criterios para encontrar el perfil que buscás</span>
          </div>
          <div className="discover-filter-fields">
            <label>
              Registro vocal
              <select name="vocalRegister" value={filters.vocalRegister} onChange={updateFilter}>
                <option value="">Todos los registros</option>
                {["Tenor", "Barítono", "Bajo", "Soprano", "Mezzo", "Contralto"].map((register) => <option key={register} value={register}>{register}</option>)}
              </select>
            </label>
            <label>
              Edad mínima
              <input name="minAge" type="number" min="18" max="100" placeholder="Desde" value={filters.minAge} onChange={updateFilter} />
            </label>
            <label>
              Edad máxima
              <input name="maxAge" type="number" min="18" max="100" placeholder="Hasta" value={filters.maxAge} onChange={updateFilter} />
            </label>
            <label>
              Ciudad o localidad
              <input name="city" type="text" maxLength="80" placeholder="Ej. San Martín" value={filters.city} onChange={updateFilter} />
            </label>
          </div>
          <div className="discover-filter-actions">
            <button type="submit" className="discover-filter-apply">Aplicar filtros</button>
            <button type="button" className="discover-filter-clear" onClick={clearFilters}>Limpiar</button>
          </div>
        </form>
      )}

      {notice && <p className="discover-like-notice" role="status">{notice}</p>}
      {likeError && !selectedPerson && <p className="discover-status discover-error" role="alert">{likeError}</p>}

      {isGuest ? (
        <div className="discover-message"><h3>Creá tu cuenta para descubrir personas</h3><p>Registrate o iniciá sesión para ver perfiles y empezar a conectar.</p></div>
      ) : loading ? (
        <p className="discover-status">Buscando perfiles...</p>
      ) : error ? (
        <p className="discover-status discover-error" role="alert">{error}</p>
      ) : people.length === 0 ? (
        <div className="discover-message"><h3>No encontramos perfiles con esos filtros</h3><p>Probá cambiar los criterios o limpiar los filtros para ver más personas.</p></div>
      ) : (
        <div className="discover-grid">
          {people.map((person) => {
            const profile = person.profile || {};
            const name = profile.displayName || person.username;
            const isLiking = likingIds.includes(person.id);
            const age = profile.birthDate ? Math.floor((Date.now() - new Date(profile.birthDate).getTime()) / 31557600000) : null;
            return (
              <article className="discover-card" key={person.id}>
                <img className="discover-card-photo" src={profile.photoUrl || genericUser} alt={`Foto de ${name}`} loading="lazy" />
                <div className="discover-card-content">
                  <h3>{name}</h3>
                  <p className="discover-username">@{person.username}</p>
                  {age !== null && <p className="discover-city">{age} años</p>}
                  {profile.city && <p className="discover-city">{profile.city}</p>}
                  {profile.vocalRegister && <p className="discover-vocal-register">{profile.vocalRegister}</p>}
                  {profile.bio && <p className="discover-bio">{profile.bio}</p>}
                  {profile.interests?.length > 0 && <div className="discover-interests">{profile.interests.slice(0, 3).map((interest) => <span key={interest}>{interest}</span>)}</div>}
                  <button type="button" className="discover-view-button" onClick={() => { setLikeError(""); setSelectedPerson(person); }}>Ver perfil</button>
                  {isInstitution ? (
                    <button type="button" className={`institution-favorite-button ${favoriteIds.includes(person.id) ? "is-saved" : ""}`} onClick={() => toggleFavorite(person)} disabled={favoriteBusyIds.includes(person.id)}>
                      {favoriteBusyIds.includes(person.id) ? "Guardando..." : favoriteIds.includes(person.id) ? "★ Guardado" : "☆ Guardar talento"}
                    </button>
                  ) : <button type="button" className="discover-like-button" onClick={() => handleLike(person)} disabled={isLiking}>{isLiking ? "Enviando..." : "♥ Me gusta"}</button>}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {!loading && !error && hasMore && (
        <div className="discover-load-more-wrap">
          <button type="button" className="discover-load-more" onClick={() => setOffset((current) => current + 50)} disabled={loadingMore}>
            {loadingMore ? "Cargando perfiles..." : "Cargar más perfiles"}
          </button>
        </div>
      )}

      {selectedPerson && (
        <div className="discover-modal-backdrop" role="presentation" onClick={() => setSelectedPerson(null)}>
          <section className="discover-modal" role="dialog" aria-modal="true" aria-labelledby="discover-modal-title" onClick={(event) => event.stopPropagation()}>
            <button className="discover-modal-close" type="button" onClick={() => setSelectedPerson(null)} aria-label="Cerrar">×</button>
            <img className="discover-modal-photo" src={selectedPerson.profile?.photoUrl || genericUser} alt={`Foto de ${selectedPerson.profile?.displayName || selectedPerson.username}`} />
            <p className="discover-eyebrow">Perfil de Linkea</p>
            <h2 id="discover-modal-title">{selectedPerson.profile?.displayName || selectedPerson.username}</h2>
            <p className="discover-username">@{selectedPerson.username}</p>
            {selectedPerson.profile?.city && <p className="discover-city">{selectedPerson.profile.city}</p>}
            {selectedPerson.profile?.vocalRegister && <p className="discover-vocal-register">{selectedPerson.profile.vocalRegister}</p>}
            {selectedPerson.profile?.bio && <p className="discover-modal-bio">{selectedPerson.profile.bio}</p>}
            {selectedPerson.profile?.gender && <p className="discover-city">Género: {selectedPerson.profile.gender}</p>}
            {selectedPerson.profile?.experience && <p className="discover-city">Experiencia: {selectedPerson.profile.experience}</p>}
            {selectedPerson.profile?.languages?.length > 0 && <p className="discover-city">Idiomas: {selectedPerson.profile.languages.join(", ")}</p>}
            {selectedPerson.profile?.repertoire?.length > 0 && <div className="discover-modal-repertoire"><strong>Repertorio</strong><p>{selectedPerson.profile.repertoire.join(" · ")}</p></div>}
            {selectedPerson.profile?.interests?.length > 0 && <div className="discover-interests discover-modal-interests">{selectedPerson.profile.interests.map((interest) => <span key={interest}>{interest}</span>)}</div>}
            {selectedPerson.profile?.media?.length > 0 && <div className="discover-public-gallery"><h3>Galería</h3><div className="profile-gallery-grid">{selectedPerson.profile.media.map((item) => <div className="profile-gallery-item" key={item.id}>{item.type === "video" ? <video src={item.url} controls preload="metadata" /> : <img src={item.url} alt={item.fileName || "Imagen de la galería"} loading="lazy" />}</div>)}</div></div>}
            {likeError && <p className="discover-status discover-error" role="alert">{likeError}</p>}
            {isInstitution ? (
              <button type="button" className={`institution-favorite-button discover-modal-favorite-button ${favoriteIds.includes(selectedPerson.id) ? "is-saved" : ""}`} onClick={() => toggleFavorite(selectedPerson)} disabled={favoriteBusyIds.includes(selectedPerson.id)}>
                {favoriteBusyIds.includes(selectedPerson.id) ? "Guardando..." : favoriteIds.includes(selectedPerson.id) ? "★ Guardado en favoritos" : "☆ Guardar en favoritos"}
              </button>
            ) : <button type="button" className="discover-like-button discover-modal-like-button" onClick={() => handleLike(selectedPerson)} disabled={likingIds.includes(selectedPerson.id)}>{likingIds.includes(selectedPerson.id) ? "Enviando..." : "♥ Me gusta"}</button>}
          </section>
        </div>
      )}
    </section>
  );
}

export default DiscoverPeople;
