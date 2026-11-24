import { useEffect, useState } from "react";
import { discoveryApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import genericUser from "../assets/images/genericUser.png";

function DiscoverPeople() {
  const { token, isGuest } = useAuth();
  const [people, setPeople] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadPeople() {
      if (!token || isGuest) {
        setLoading(false);
        return;
      }

      try {
        setError("");
        const response = await discoveryApi.list(token);
        if (active) setPeople(response.users || []);
      } catch (err) {
        if (active) setError(err.message || "No pudimos cargar los perfiles.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPeople();
    return () => { active = false; };
  }, [token, isGuest]);

  return (
    <section className="discover-section" id="descubrir">
      <div className="discover-heading">
        <div>
          <p className="discover-eyebrow">Conocé gente nueva</p>
          <h2>Descubrí perfiles</h2>
          <p className="discover-subtitle">Personas que ya forman parte de Linkea.</p>
        </div>
        {!loading && !error && (
          <span className="discover-count">{people.length} {people.length === 1 ? "perfil" : "perfiles"}</span>
        )}
      </div>

      {isGuest ? (
        <div className="discover-message">
          <h3>Creá tu cuenta para descubrir personas</h3>
          <p>Registrate o iniciá sesión para ver perfiles y empezar a conectar.</p>
        </div>
      ) : loading ? (
        <p className="discover-status">Buscando perfiles...</p>
      ) : error ? (
        <p className="discover-status discover-error" role="alert">{error}</p>
      ) : people.length === 0 ? (
        <div className="discover-message">
          <h3>Por ahora no hay más perfiles</h3>
          <p>Cuando se sumen nuevas personas, vas a poder descubrirlas acá.</p>
        </div>
      ) : (
        <div className="discover-grid">
          {people.map((person) => {
            const profile = person.profile || {};
            const name = profile.displayName || person.username;
            return (
              <article className="discover-card" key={person.id}>
                <img
                  className="discover-card-photo"
                  src={profile.photoUrl || genericUser}
                  alt={`Foto de ${name}`}
                  loading="lazy"
                />
                <div className="discover-card-content">
                  <h3>{name}</h3>
                  <p className="discover-username">@{person.username}</p>
                  {profile.city && <p className="discover-city">{profile.city}</p>}
                  {profile.bio && <p className="discover-bio">{profile.bio}</p>}
                  {profile.interests?.length > 0 && (
                    <div className="discover-interests">
                      {profile.interests.slice(0, 3).map((interest) => (
                        <span key={interest}>{interest}</span>
                      ))}
                    </div>
                  )}
                  <button type="button" className="discover-view-button" onClick={() => setSelectedPerson(person)}>
                    Ver perfil
                  </button>
                </div>
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
            aria-labelledby="discover-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button className="discover-modal-close" type="button" onClick={() => setSelectedPerson(null)} aria-label="Cerrar">
              ×
            </button>
            <img
              className="discover-modal-photo"
              src={selectedPerson.profile?.photoUrl || genericUser}
              alt={`Foto de ${selectedPerson.profile?.displayName || selectedPerson.username}`}
            />
            <p className="discover-eyebrow">Perfil de Linkea</p>
            <h2 id="discover-modal-title">{selectedPerson.profile?.displayName || selectedPerson.username}</h2>
            <p className="discover-username">@{selectedPerson.username}</p>
            {selectedPerson.profile?.city && <p className="discover-city">{selectedPerson.profile.city}</p>}
            {selectedPerson.profile?.bio && <p className="discover-modal-bio">{selectedPerson.profile.bio}</p>}
            {selectedPerson.profile?.interests?.length > 0 && (
              <div className="discover-interests discover-modal-interests">
                {selectedPerson.profile.interests.map((interest) => <span key={interest}>{interest}</span>)}
              </div>
            )}
          </section>
        </div>
      )}
    </section>
  );
}

export default DiscoverPeople;
