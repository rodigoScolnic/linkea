import { useEffect } from "react";
import { useNavigate } from "react-router";
import AuthForm from "../components/authForm";
import { useAuth } from "../context/AuthContext";
import authBackground from "../assets/images/auth-background.mp4";
import logo from "../assets/images/logo.png";
import "../styles/auth.css";

const AuthPage = () => {
  const { user, loading, isGuest } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (user || isGuest)) navigate("/home", { replace: true });
  }, [loading, user, isGuest, navigate]);

  return (
    <main className="auth-page">
      <video className="auth-background" autoPlay muted loop playsInline>
        <source src={authBackground} type="video/mp4" />
      </video>

      <section className="auth-container">
        <img src={logo} alt="Linkea" className="auth-logo" />
        <AuthForm />
      </section>

      <footer>
        <p id="footerP">© 2026 Linkea. Todos los derechos reservados.</p>
      </footer>
    </main>
  );
};

export default AuthPage;
