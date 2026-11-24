import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";

const AuthForm = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isRegisterOpen) return undefined;

    function handleEscape(event) {
      if (event.key === "Escape" && !submitting) closeRegister();
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isRegisterOpen, submitting]);

  function closeRegister() {
    setIsRegisterOpen(false);
    setError("");
  }

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(identifier.trim(), loginPassword);
      navigate("/home", { replace: true });
    } catch (requestError) {
      setError(requestError.message || "No se pudo iniciar sesión.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await register({
        displayName: displayName.trim(),
        email: email.trim(),
        username: username.trim(),
        password: registerPassword,
      });
      closeRegister();
      navigate("/home", { replace: true });
    } catch (requestError) {
      setError(requestError.message || "No se pudo crear la cuenta.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <section className="auth-form">
        <h3>Inicia sesión</h3>

        <form onSubmit={handleLogin}>
          <input
            id="login-identifier"
            name="identifier"
            type="text"
            placeholder="Usuario o email"
            autoComplete="username"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            required
          />
          <input
            id="login-password"
            name="password"
            type="password"
            placeholder="Contraseña"
            autoComplete="current-password"
            value={loginPassword}
            onChange={(event) => setLoginPassword(event.target.value)}
            required
          />
          <button type="submit" disabled={submitting}>
            {submitting ? "Un momento..." : "Comenzar"}
          </button>
        </form>

        {error && <p className="auth-error" role="alert">{error}</p>}

        <p>
          Si no tenés cuenta{" "}
          <button
            className="register-trigger"
            type="button"
            onClick={() => {
              setError("");
              setIsRegisterOpen(true);
            }}
          >
            Registrate
          </button>
        </p>
      </section>

      {isRegisterOpen && (
        <div
          className="register-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !submitting) closeRegister();
          }}
        >
          <section
            className="register-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="register-modal-title"
          >
            <button
              className="register-modal-close"
              type="button"
              aria-label="Cerrar registro"
              onClick={closeRegister}
              disabled={submitting}
            >
              ×
            </button>

            <span className="register-modal-eyebrow">LINK<strong>EA</strong></span>
            <h2 id="register-modal-title">Creá tu cuenta</h2>
            <p className="register-modal-description">
              Empezá a conectar con nuevas personas.
            </p>

            <form className="register-modal-form" onSubmit={handleRegister}>
              <input
                id="register-display-name"
                name="displayName"
                type="text"
                placeholder="¿Cómo te llamás?"
                autoComplete="name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                minLength={2}
                maxLength={60}
                required
              />
              <input
                id="register-email"
                name="email"
                type="email"
                placeholder="Correo electrónico"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              <input
                id="register-username"
                name="username"
                type="text"
                placeholder="Elegí un nombre de usuario"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                minLength={3}
                required
              />
              <input
                id="register-password"
                name="new-password"
                type="password"
                placeholder="Contraseña (mínimo 8 caracteres)"
                autoComplete="new-password"
                value={registerPassword}
                onChange={(event) => setRegisterPassword(event.target.value)}
                minLength={8}
                required
              />

              {error && <p className="register-modal-error" role="alert">{error}</p>}

              <button type="submit" disabled={submitting}>
                {submitting ? "Creando cuenta..." : "Crear cuenta"}
              </button>
            </form>

            <p className="register-modal-footer">
              ¿Ya tenés cuenta?{" "}
              <button type="button" onClick={closeRegister}>
                Iniciá sesión
              </button>
            </p>
          </section>
        </div>
      )}
    </>
  );
};

export default AuthForm;
