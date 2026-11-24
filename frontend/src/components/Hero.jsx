import { useRef, useState } from "react";
import gUser from "../assets/images/genericUser.png";
import { useAuth } from "../context/AuthContext";
import { profileApi } from "../services/api";

const emptyForm = { displayName: "", bio: "", city: "", vocalRegister: "", gender: "", languages: "", experience: "", repertoire: "", interests: "" };
const splitList = (value) => value.split(",").map((item) => item.trim()).filter(Boolean);

const Hero = ({ user }) => {
  const { token, refreshUser } = useAuth();
  const fileInputRef = useRef(null);
  const mediaInputRef = useRef(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [mediaError, setMediaError] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileNotice, setProfileNotice] = useState("");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [deletingMedia, setDeletingMedia] = useState("");

  if (!user) return (
    <section className="hero" id="mi-perfil"><article className="profile-preview guest-preview">
      <img className="profile-avatar" src={gUser} alt="Perfil de visitante" />
      <div className="profile-content"><p className="profile-eyebrow">Modo visitante</p><h1>¡Bienvenido a Linkea!</h1>
        <p className="profile-bio">Estás explorando Linkea como visitante. Creá una cuenta o iniciá sesión para completar tu perfil y empezar a conectar.</p>
      </div>
    </article></section>
  );

  const profile = user.profile || {};
  const displayName = profile.displayName || user.username || "Tu perfil";
  const media = profile.media || [];

  function startEditing() {
    setForm({
      displayName: profile.displayName || user.username || "", bio: profile.bio || "", city: profile.city || "",
      vocalRegister: profile.vocalRegister || "", gender: profile.gender || "",
      languages: (profile.languages || []).join(", "), experience: profile.experience || "",
      repertoire: (profile.repertoire || []).join(", "), interests: (profile.interests || []).join(", ")
    });
    setProfileError(""); setProfileNotice(""); setEditing(true);
  }
  function updateField(event) { setForm((current) => ({ ...current, [event.target.name]: event.target.value })); }

  async function saveProfile(event) {
    event.preventDefault(); setProfileError(""); setProfileNotice("");
    try {
      await profileApi.update(token, {
        displayName: form.displayName.trim(), bio: form.bio.trim() || null, city: form.city.trim() || null,
        vocalRegister: form.vocalRegister || null, gender: form.gender || null,
        languages: splitList(form.languages), experience: form.experience || null,
        repertoire: splitList(form.repertoire), interests: splitList(form.interests)
      });
      await refreshUser(); setEditing(false); setProfileNotice("Tu perfil se actualizó correctamente.");
    } catch (error) { setProfileError(error.message || "No pudimos guardar los cambios."); }
  }

  async function handlePhotoChange(event) {
    const file = event.target.files?.[0]; event.target.value = ""; if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return setPhotoError("Elegí una imagen JPG, PNG o WEBP.");
    if (file.size > 5 * 1024 * 1024) return setPhotoError("La foto no puede superar los 5 MB.");
    setPhotoError(""); setUploadingPhoto(true);
    try { await profileApi.uploadPhoto(token, file); await refreshUser(); }
    catch (error) { setPhotoError(error.message || "No se pudo subir la foto."); }
    finally { setUploadingPhoto(false); }
  }

  async function handleMediaChange(event) {
    const selected = Array.from(event.target.files || []); event.target.value = ""; if (!selected.length) return;
    const valid = selected.filter((file) => (["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"].includes(file.type)) && file.size <= 50 * 1024 * 1024);
    setMediaError(valid.length !== selected.length ? "Se aceptan JPG, PNG, WEBP, MP4 y WEBM de hasta 50 MB cada uno." : "");
    if (!valid.length) return;
    setUploadingMedia(true);
    try { for (const file of valid) await profileApi.uploadMedia(token, file); await refreshUser(); }
    catch (error) { setMediaError(error.message || "No se pudo subir el archivo."); }
    finally { setUploadingMedia(false); }
  }

  async function removeMedia(item) {
    if (!window.confirm("¿Querés eliminar este archivo de tu galería?")) return;
    setDeletingMedia(item.id); setMediaError("");
    try { await profileApi.deleteMedia(token, item.id); await refreshUser(); }
    catch (error) { setMediaError(error.message || "No se pudo eliminar el archivo."); }
    finally { setDeletingMedia(""); }
  }

  return (
    <section className="hero" id="mi-perfil">
      <article className="profile-preview profile-preview-expanded">
        <div className="profile-avatar-wrap">
          <img className="profile-avatar" src={profile.photoUrl || gUser} alt={`Foto de perfil de ${displayName}`} />
          <button className="profile-photo-button" type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto}>{uploadingPhoto ? "Subiendo..." : profile.photoUrl ? "Cambiar foto principal" : "Agregar foto principal"}</button>
          <input ref={fileInputRef} className="profile-photo-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} aria-label="Seleccionar foto de perfil" />
        </div>
        {photoError && <p className="profile-photo-error" role="alert">{photoError}</p>}
        <div className="profile-content">
          <p className="profile-eyebrow">Bienvenido a Linkea</p><h1>{displayName}</h1><p className="profile-username">@{user.username}</p>
          {profile.city && <p className="profile-city">{profile.city}</p>}
          {profile.vocalRegister && <p className="profile-vocal-register">Registro vocal: <strong>{profile.vocalRegister}</strong></p>}
          {profile.bio && <p className="profile-bio">{profile.bio}</p>}
          {profile.gender && <p className="profile-meta-line">Género: {profile.gender}</p>}
          {profile.experience && <p className="profile-meta-line">Experiencia: {profile.experience}</p>}
          {profile.languages?.length > 0 && <p className="profile-meta-line">Idiomas: {profile.languages.join(", ")}</p>}
          {profile.repertoire?.length > 0 && <div className="profile-extra-list"><strong>Repertorio</strong><p>{profile.repertoire.join(" · ")}</p></div>}
          {profile.interests?.length > 0 && <div className="profile-interests">{profile.interests.map((interest) => <span key={interest}>{interest}</span>)}</div>}
          <div className="profile-details"><span>Correo</span><p>{user.email}</p></div>
          <button type="button" className="profile-edit-button" onClick={startEditing}>Editar mi perfil</button>
          {profileNotice && <p className="profile-success" role="status">{profileNotice}</p>}
          {profileError && !editing && <p className="profile-photo-error" role="alert">{profileError}</p>}
        </div>

        {editing && <form className="profile-edit-form" onSubmit={saveProfile}>
          <h2>Editar perfil</h2>
          <label>Nombre visible<input name="displayName" value={form.displayName} onChange={updateField} minLength="2" maxLength="60" required /></label>
          <label>Género<select name="gender" value={form.gender} onChange={updateField}><option value="">Sin especificar</option><option>Masculino</option><option>Femenino</option><option>Prefiero no contestar</option></select></label>
          <label>Registro vocal<select name="vocalRegister" value={form.vocalRegister} onChange={updateField}><option value="">Sin especificar</option>{["Tenor","Barítono","Bajo","Soprano","Mezzo","Contralto"].map((v) => <option key={v}>{v}</option>)}</select></label>
          <label>Ciudad o localidad<input name="city" value={form.city} onChange={updateField} maxLength="100" /></label>
          <label>Presentación<textarea name="bio" value={form.bio} onChange={updateField} maxLength="500" rows="3" /></label>
          <label>Idiomas <span>(separados por coma)</span><input name="languages" value={form.languages} onChange={updateField} placeholder="Español, Italiano, Inglés" /></label>
          <label>Experiencia<select name="experience" value={form.experience} onChange={updateField}><option value="">Sin especificar</option>{["Estudiante","Amateur","Semiprofesional","Profesional"].map((v) => <option key={v}>{v}</option>)}</select></label>
          <label>Repertorio <span>(separá las obras por coma)</span><textarea name="repertoire" value={form.repertoire} onChange={updateField} rows="3" placeholder="La Traviata, Don Giovanni..." /></label>
          <label>Intereses <span>(separados por coma)</span><input name="interests" value={form.interests} onChange={updateField} /></label>
          {profileError && <p className="profile-photo-error" role="alert">{profileError}</p>}
          <div className="profile-edit-actions"><button type="submit">Guardar cambios</button><button type="button" onClick={() => setEditing(false)}>Cancelar</button></div>
        </form>}

        <section className="profile-gallery">
          <div className="profile-gallery-heading"><div><h2>Mi galería</h2><p>Compartí fotos y videos de tu trabajo artístico.</p></div>
            <button type="button" className="profile-photo-button" onClick={() => mediaInputRef.current?.click()} disabled={uploadingMedia}>{uploadingMedia ? "Subiendo..." : "Agregar archivos"}</button>
            <input ref={mediaInputRef} className="profile-photo-input" type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" multiple onChange={handleMediaChange} />
          </div>
          <p className="profile-gallery-hint">JPG, PNG, WEBP, MP4 o WEBM. Hasta 50 MB por archivo.</p>
          {mediaError && <p className="profile-photo-error" role="alert">{mediaError}</p>}
          {media.length ? <div className="profile-gallery-grid">{media.map((item) => <div className="profile-gallery-item" key={item.id}>
            {item.type === "video" ? <video src={item.url} controls preload="metadata" /> : <img src={item.url} alt={item.fileName || "Imagen de la galería"} loading="lazy" />}
            <button type="button" onClick={() => removeMedia(item)} disabled={deletingMedia === item.id}>{deletingMedia === item.id ? "Eliminando..." : "Eliminar"}</button>
          </div>)}</div> : <p className="profile-gallery-empty">Todavía no agregaste fotos ni videos.</p>}
        </section>
      </article>
    </section>
  );
};
export default Hero;