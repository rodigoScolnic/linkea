import { useNavigate } from "react-router";
import HeaderHome from "../components/HeaderHome";
import Hero from "../components/Hero";
import { useAuth } from "../context/AuthContext";
import "../styles/home.css";

const HomePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/", { replace: true });
  }

  return (
    <main className="home-page">
      <HeaderHome />
      <div className="home-toolbar">
        <span>Mi espacio</span>
        <button type="button" className="logout-button" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </div>
      <Hero user={user} />
    </main>
  );
};

export default HomePage;
