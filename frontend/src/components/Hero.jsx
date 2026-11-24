import { useRef, useState } from "react";
import gUser from "../assets/images/genericUser.png";
import { useAuth } from "../context/AuthContext";
import { profileApi } from "../services/api";

const Hero = ({ user }) => {
  const { token, refreshUser } = useAuth();
  const fileInputRef = useRef(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState("");

  async function handlePhotoChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setPhotoError("Elegí una imagen JPG, PNG o WEBP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("La foto no puede superar los 5 MB.");
      return;
    }

    setPhotoError("");
    setUploadingPhoto(true);
    try {
      await profileApi.uploadPhoto(token, file);
      await refreshUser();
    } catch (error) {
      setPhotoError(error.message || "No se pudo subir la foto.");
    } finally {
      setUploadingPhoto(false);
    }
  }

  if (!user) {
    return (
      <section className="hero">
        <article className="profile-preview guest-preview">
          <img className="profile-avatar" src={gUser} alt="Perfil de visitante" />
          <div className="profile-content">
            <p className="profile-eyebrow">Modo visitante</p>
            <h1>¡Bienvenido a Linkea!</h1>
            <p className="profile-bio">Estás explorando Linkea como visitante. Creá una cuenta o iniciá sesión para completar tu perfil y empezar a conectar.</p>
          </div>
        </article>
      </section>
    );
  }

  const profile = user?.profile;
  const displayName = profile?.displayName || user?.username || "Tu perfil";
  const interests = profile?.interests || [];

  return (
    <section className="hero">
      <article className="profile-preview">
        <div className="profile-avatar-wrap">
          <img
            className="profile-avatar"
            src={profile?.photoUrl || gUser}
            alt={`Foto de perfil de ${displayName}`}
          />
          <button
            className="profile-photo-button"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingPhoto}
          >
            {uploadingPhoto ? "Subiendo..." : profile?.photoUrl ? "Cambiar foto" : "Agregar foto"}
          </button>
          <input
            ref={fileInputRef}
            className="profile-photo-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoChange}
            aria-label="Seleccionar foto de perfil"
          />
        </div>
        {photoError && <p className="profile-photo-error" role="alert">{photoError}</p>}
        <div className="profile-content">
          <p className="profile-eyebrow">Bienvenido a Linkea</p>
          <h1>{displayName}</h1>
          <p className="profile-username">@{user?.username}</p>

          {profile?.city && <p className="profile-city">{profile.city}</p>}
          {profile?.bio && <p className="profile-bio">{profile.bio}</p>}

          {interests.length > 0 && (
            <div className="profile-interests">
              {interests.map((interest) => (
                <span key={interest}>{interest}</span>
              ))}
            </div>
          )}

          <div className="profile-details">
            <span>Correo</span>
            <p>{user?.email}</p>
          </div>
        </div>
      </article>
    </section>
  );
};

export default Hero;
