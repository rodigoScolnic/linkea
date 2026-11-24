import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";

const AuthForm = () => {
  const [mode, setMode] = useState("login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const isRegister = mode === "register";

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (isRegister) {
        await register({ displayName: displayName.trim(), email: email.trim(), username: username.trim(), password });
      } else {
        await login(username.trim(), password);
      }
      navigate("/home", { replace: true });
    } catch (requestError) {
      setError(requestError.message || "No se pudo iniciar sesión.");
    } finally {
      setSubmitting(false);
    }
  }

  function changeMode(event) {
    event.preventDefault();
    setError("");
    setMode(isRegister ? "login" : "register");
  }

  return (
    <section className="auth-form">
      <h3>{isRegister ? "Crea tu cuenta" : "Inicia sesión"}</h3>

      <form onSubmit={handleSubmit}>
        {isRegister && (
          <>
            <input
              type="text"
              placeholder="Nombre para mostrar"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              minLength={2}
              maxLength={60}
              required
            />
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </>
        )}

        <input
          type="text"
          placeholder={isRegister ? "Nombre de usuario" : "Usuario o email"}
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          minLength={isRegister ? 3 : undefined}
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={isRegister ? 8 : undefined}
          required
        />
        <button type="submit" disabled={submitting}>
          {submitting ? "Un momento..." : isRegister ? "Crear cuenta" : "Comenzar"}
        </button>
      </form>

      {error && <p className="auth-error" role="alert">{error}</p>}

      <p>
        {isRegister ? "¿Ya tenés cuenta?" : "Si no tenés cuenta"}{" "}
        <a href="#" onClick={changeMode}>
          {isRegister ? "Iniciá sesión" : "Registrate"}
        </a>
      </p>
    </section>
  );
};

export default AuthForm;
