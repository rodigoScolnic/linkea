import gUser from "../assets/images/genericUser.png";

const Hero = ({ user }) => {
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
        <img
          className="profile-avatar"
          src={profile?.photoUrl || gUser}
          alt={`Foto de perfil de ${displayName}`}
        />
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
