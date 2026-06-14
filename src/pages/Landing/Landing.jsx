import "../../index.css";
import './landing.css';
import logoCencosud from '../../assets/images/cencosud.svg';
import supermarket from '../../assets/images/supermarket.jpg';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  const handleAnchor = (e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.pushState(null, '', `#${id}`);
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  return (
    <div className="landing-wrapper">
      
      <header>
        <nav className="container">
          <div className="logo-placeholder">
            <img 
                src={logoCencosud} 
                alt="Cencosud Logo" 
                className="header__logo-img" 
            />
          </div>
          <ul className="nav-links">
            <li>
              <a href="#sobre" onClick={(e) => handleAnchor(e, 'sobre')}>SOBRE</a>
            </li>
            <li>
              <a href="#caracteristicas" onClick={(e) => handleAnchor(e, 'caracteristicas')}>CARACTERÍSTICAS</a>
            </li>
            <li>
              <Link to="/aprender">COMO JOGAR</Link>
            </li>
            <li>
              <Link to="/lobby" className="btn-primary">
                COMEÇAR AGORA
              </Link>
            </li>
          </ul>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-content">
            <h1>
              Transforme o <br />
              <span>aprendizado</span> <br />
              em experiência
            </h1>
            <p>
              Explore a nova plataforma de gamificação.
              Aprenda, interaja e evolua suas habilidades de forma dinâmica.
            </p>
            <div className="hero-btns">
              <Link to="/lobby" className="btn-main">
                Começar Agora
              </Link>
            </div>
          </div>
          <div className="hero-visual">
            <img src={supermarket} alt='supermarketimg' />
          </div>
        </div>
      </section>

      {/* Footer conforme o estilo CSS (dark-tuna) */}
      <footer>
        <div className="container">
          <p>© 2026 Cencosud Learning</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;