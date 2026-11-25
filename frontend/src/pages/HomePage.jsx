import { useNavigate } from "react-router";
import HeaderHome from "../components/HeaderHome";
import Hero from "../components/Hero";
import DiscoverPeople from "../components/DiscoverPeople";
import InstitutionFavorites from "../components/InstitutionFavorites";
import ProfessionalHub from "../components/ProfessionalHub";
import LikesHistory from "../components/LikesHistory";
import { useAuth } from "../context/AuthContext";
import "../styles/home.css";

const HomePage = () => {
  const { user, isGuest, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/", { replace: true });
  }

  if (!isGuest && user?.accountType === "INSTITUTION") {
    const institution = user.institutionProfile;
    return (
      <main className="home-page">
        <HeaderHome />
        <div className="home-toolbar">
          <span>Espacio institucional</span>
          <button type="button" className="logout-button" onClick={handleLogout}>Cerrar sesión</button>
        </div>
        <section className="institution-welcome">
          <span className="institution-welcome-eyebrow">LINK​​EA · INSTITUCIONES</span>
          <h1>Bienvenida a Linkea</h1>
          <p>Tu espacio para descubrir artistas, conectar con talentos y encontrar nuevas voces.</p>
          <div className="institution-welcome-card">
            <span>Perfil institucional</span>
            <h2>{institution?.name || "Tu institución"}</h2>
            <p>{institution?.type || "Institución cultural"}</p>
          </div>
        </section>
        <DiscoverPeople />
        <InstitutionFavorites />
        <ProfessionalHub />
      </main>
    );
  }

  return (
    <main className="home-page">
      <HeaderHome />
      <div className="home-toolbar">
        <span>{isGuest ? "Modo visitante" : "Mi espacio"}</span>
        <button type="button" className="logout-button" onClick={handleLogout}>
          {isGuest ? "Salir del modo visitante" : "Cerrar sesión"}
        </button>
      </div>
      <Hero user={user} />
      <DiscoverPeople />
      {!isGuest && <LikesHistory />}
      {!isGuest && <ProfessionalHub />}
    </main>
  );
};

export default HomePage;
