import { useNavigate } from "react-router";
import HeaderHome from "../components/HeaderHome";
import Hero from "../components/Hero";
import DiscoverPeople from "../components/DiscoverPeople";
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
    </main>
  );
};

export default HomePage;
