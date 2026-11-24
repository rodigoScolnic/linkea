import { useState } from "react";
import "../styles/home.css"

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <nav className="navbar">

      <a href="/" className="logo">
        MiLogo
      </a>

      {/* Botón hamburguesa */}
      <button
        className={`hamburger ${menuOpen ? "active" : ""}`}
        onClick={toggleMenu}
        aria-label="Abrir menú"
        aria-expanded={menuOpen}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Navegación */}
      <ul className={`nav-links ${menuOpen ? "open" : ""}`}>
        <li><a href="/">Inicio</a></li>
        <li><a href="/nosotros">Nosotros</a></li>
        <li><a href="/servicios">Servicios</a></li>
        <li><a href="/contacto">Contacto</a></li>
      </ul>

    </nav>
  );
}

export default Navbar;