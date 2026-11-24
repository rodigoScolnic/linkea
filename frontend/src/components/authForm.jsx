import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";

const AuthForm = () => {
  const { login, register, enterGuest } = useAuth();
  const navigate = useNavigate();

  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [accountType, setAccountType] = useState("TALENT");
  const [identifier, setIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [institutionName, setInstitutionName] = useState("");
  const [institutionType, setInstitutionType] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [vocalRegister, setVocalRegister] = useState("");
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
    const userData = {
      accountType,
      email: email.trim(),
      username: username.trim(),
      password: registerPassword,
      ...(accountType === "TALENT"
        ? { displayName: displayName.trim(), vocalRegister }
        : { institutionName: institutionName.trim(), institutionType })
    };
    try {
      await register(userData);
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
          <input id="login-identifier" name="identifier" type="text" placeholder="Usuario o email" autoComplete="username" value={identifier} onChange={(event) => setIdentifier(event.target.value)} required />
          <input id="login-password" name="password" type="password" placeholder="Contraseña" autoComplete="current-password" value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} required />
          <button type="submit" disabled={submitting}>{submitting ? "Un momento..." : "Comenzar"}</button>
        </form>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <p>Si no tenés cuenta{" "}
          <button className="register-trigger" type="button" onClick={() => { setError(""); setIsRegisterOpen(true); }}>Registrate</button>
        </p>
        <button className="guest-button" type="button" onClick={() => { setError(""); enterGuest(); navigate("/home", { replace: true }); }}>Entrar como visitante</button>
      </section>

      {isRegisterOpen && (
        <div className="register-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !submitting) closeRegister(); }}>
          <section className="register-modal" role="dialog" aria-modal="true" aria-labelledby="register-modal-title">
            <button className="register-modal-close" type="button" aria-label="Cerrar registro" onClick={closeRegister} disabled={submitting}>×</button>
            <h2 id="register-modal-title">Creá tu cuenta</h2>
            <p className="register-modal-description">Elegí cómo querés formar parte de Linkea.</p>

            <div className="account-type-options" role="group" aria-label="Tipo de cuenta">
              <button type="button" className={accountType === "TALENT" ? "account-type-option active" : "account-type-option"} onClick={() => { setAccountType("TALENT"); setError(""); }}>
                <span className="account-type-icon">♫</span>
                <strong>Soy talento</strong>
                <small>Cantante o artista</small>
              </button>
              <button type="button" className={accountType === "INSTITUTION" ? "account-type-option active" : "account-type-option"} onClick={() => { setAccountType("INSTITUTION"); setError(""); }}>
                <span className="account-type-icon">▤</span>
                <strong>Soy institución</strong>
                <small>Teatro, compañía, coro...</small>
              </button>
            </div>

            <form className="register-modal-form" onSubmit={handleRegister}>
              {accountType === "TALENT" ? (
                <>
                  <input id="register-display-name" name="displayName" type="text" placeholder="¿Cómo te llamás?" autoComplete="name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} minLength={2} maxLength={60} required />
                  <label className="register-field-label" htmlFor="register-vocal-register">Registro vocal</label>
                  <select id="register-vocal-register" name="vocalRegister" value={vocalRegister} onChange={(event) => setVocalRegister(event.target.value)} required>
                    <option value="" disabled>Seleccioná tu registro vocal</option>
                    <option value="Tenor">Tenor</option><option value="Barítono">Barítono</option><option value="Bajo">Bajo</option>
                    <option value="Soprano">Soprano</option><option value="Mezzo">Mezzo</option><option value="Contralto">Contralto</option>
                  </select>
                </>
              ) : (
                <>
                  <input id="register-institution-name" name="institutionName" type="text" placeholder="Nombre de la institución" value={institutionName} onChange={(event) => setInstitutionName(event.target.value)} minLength={2} maxLength={100} required />
                  <label className="register-field-label" htmlFor="register-institution-type">Tipo de institución</label>
                  <select id="register-institution-type" name="institutionType" value={institutionType} onChange={(event) => setInstitutionType(event.target.value)} required>
                    <option value="" disabled>Seleccioná una categoría</option>
                    <option value="Teatro">Teatro</option><option value="Compañía">Compañía</option><option value="Conservatorio">Conservatorio</option><option value="Coro">Coro</option><option value="Agencia">Agencia</option><option value="Otra">Otra</option>
                  </select>
                </>
              )}

              <input id="register-email" name="email" type="email" placeholder="Correo electrónico" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              <input id="register-username" name="username" type="text" placeholder="Elegí un nombre de usuario" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} minLength={3} maxLength={30} pattern="[a-zA-Z0-9_.-]+" required />
              <input id="register-password" name="new-password" type="password" placeholder="Contraseña (mínimo 8 caracteres)" autoComplete="new-password" value={registerPassword} onChange={(event) => setRegisterPassword(event.target.value)} minLength={8} required />
              {error && <p className="register-modal-error" role="alert">{error}</p>}
              <button type="submit" disabled={submitting}>{submitting ? "Creando cuenta..." : "Crear cuenta"}</button>
            </form>
            <p className="register-modal-footer">¿Ya tenés cuenta?{" "}
              <button type="button" onClick={closeRegister}>Iniciá sesión</button>
            </p>
          </section>
        </div>
      )}
    </>
  );
};

export default AuthForm;
