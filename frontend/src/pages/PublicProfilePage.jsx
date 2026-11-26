import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { discoveryApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import genericUser from "../assets/images/genericUser.png";

function PublicProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [galleryPage, setGalleryPage] = useState(0);

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      setLoading(true);
      setError("");
      try {
        const response = await discoveryApi.get(token, id);
        if (active) setPerson(response.user);
      } catch (err) {
        if (active) setError(err.message || "No pudimos cargar este perfil.");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadProfile();
    return () => { active = false; };
  }, [token, id]);

  if (loading) return <section className="public-profile-page"><p className="professional-empty">Cargando perfil...</p></section>;
  if (error || !person) return <section className="public-profile-page"><button className="public-profile-back" onClick={() => navigate(-1)}>← Volver</button><p className="discover-status discover-error">{error || "Perfil no encontrado."}</p></section>;

  const profile = person.profile || {};
  const institution = person.institutionProfile || {};
  const isInstitution = person.accountType === "INSTITUTION";
  const name = isInstitution ? institution.name : profile.displayName || person.username;
  const media = profile.media || [];
  const pageSize = 4;
  const pageCount = Math.max(1, Math.ceil(media.length / pageSize));
  const visibleMedia = media.slice(galleryPage * pageSize, (galleryPage + 1) * pageSize);

  return (
    <section className="public-profile-page">
      <div className="public-profile-heading">
        <button className="public-profile-back" type="button" onClick={() => navigate(-1)}>← Volver</button>
        <span className="discover-eyebrow">PERFIL DE LINKEA</span>
      </div>
      <article className="public-profile-card">
        <div className="public-profile-details">
          <img className="public-profile-avatar" src={isInstitution ? institution.logoUrl || genericUser : profile.photoUrl || genericUser} alt={`Foto de ${name}`} />
          <h1>{name}</h1>
          <p className="discover-username">@{person.username}</p>
          {isInstitution ? (
            <>
              {institution.type && <p className="public-profile-meta">{institution.type}</p>}
              {institution.city && <p className="public-profile-meta">{[institution.city, institution.country].filter(Boolean).join(", ")}</p>}
              {institution.description && <p className="public-profile-bio">{institution.description}</p>}
              {institution.website && <a className="public-profile-website" href={institution.website} target="_blank" rel="noreferrer">Visitar sitio web</a>}
              {institution.specialties?.length > 0 && <div className="discover-interests">{institution.specialties.map((item) => <span key={item}>{item}</span>)}</div>}
            </>
          ) : (
            <>
              {profile.city && <p className="public-profile-meta">{profile.city}</p>}
              {profile.vocalRegister && <p className="public-profile-meta">Registro vocal: <strong>{profile.vocalRegister}</strong></p>}
              {profile.bio && <p className="public-profile-bio">{profile.bio}</p>}
              {profile.gender && <p className="public-profile-meta">Género: {profile.gender}</p>}
              {profile.experience && <p className="public-profile-meta">Experiencia: {profile.experience}</p>}
              {profile.languages?.length > 0 && <p className="public-profile-meta">Idiomas: {profile.languages.join(", ")}</p>}
              {profile.repertoire?.length > 0 && <div className="public-profile-meta"><strong>Repertorio</strong><p>{profile.repertoire.join(" · ")}</p></div>}
              {profile.interests?.length > 0 && <div className="discover-interests">{profile.interests.map((item) => <span key={item}>{item}</span>)}</div>}
            </>
          )}
        </div>
        {!isInstitution && <section className="public-profile-gallery">
          <div className="public-profile-gallery-heading"><h2>Galería</h2><span>{media.length} archivos</span></div>
          {media.length ? <div className="public-profile-gallery-grid">{visibleMedia.map((item) => <div className="profile-gallery-item" key={item.id}>
            {item.type === "video" ? <video src={item.url} controls preload="metadata" /> : <img src={item.url} alt={item.fileName || "Imagen de la galería"} loading="lazy" />}
          </div>)}</div> : <p className="profile-gallery-empty">Este perfil todavía no tiene fotos ni videos.</p>}
          {media.length > pageSize && <div className="profile-gallery-pagination">
            <button type="button" onClick={() => setGalleryPage((page) => Math.max(0, page - 1))} disabled={galleryPage === 0}>Anterior</button>
            <span>{galleryPage + 1} / {pageCount}</span>
            <button type="button" onClick={() => setGalleryPage((page) => Math.min(pageCount - 1, page + 1))} disabled={galleryPage >= pageCount - 1}>Siguiente</button>
          </div>}
        </section>}
      </article>
    </section>
  );
}

export default PublicProfilePage;
