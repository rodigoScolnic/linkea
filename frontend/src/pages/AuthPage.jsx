import AuthForm from "../components/authForm"
import authBackground from "../assets/images/auth-background.mp4";
import logo from "../assets/images/logo.png"
import "../styles/auth.css"
const AuthPage = () => {
    return (
        <main className="auth-page">
            <video
                className="auth-background"
                autoPlay
                muted
                loop
                playsInline
            >
                <source src={authBackground} type="video/mp4" />
            </video>

            <section className="auth-container">
                <img src={logo} alt="linka" className="auth-logo" />
                <AuthForm></AuthForm>
                
            </section>
            
            <footer>
                <p id="footerP">© 2026 Linka. Todos los derechos reservados.</p>
            </footer>
        </main>
    );
};

export default AuthPage;