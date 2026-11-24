import { useState } from "react";
import "../styles/home.css";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="navbar">
      <a href="/home" className="logo" onClick={closeMenu} aria-label="Linkea, inicio">
        <span className="logo-mark">L</span>
        <span>linkea</span>
      </a>
      <button
        className={`hamburger ${menuOpen ? "active" : ""}`}
        onClick={() => setMenuOpen((open) => !open)}
        aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={menuOpen}
        aria-controls="home-navigation"
        type="button"
      >
        <span></span><span></span><span></span>
      </button>
      <ul id="home-navigation" className={`nav-links ${menuOpen ? "open" : ""}`}>
        <li><a href="#mi-perfil" onClick={closeMenu}>Mi perfil</a></li>
        <li><a href="#descubrir" onClick={closeMenu}>Descubrir</a></li>
        <li><a href="#mis-likes" onClick={closeMenu}>Mis likes</a></li>
      </ul>
    </nav>
  );
}

export default Navbar;
