import React, { /*use, */ useState } from 'react';
import logoCencosud from '../../assets/images/cencosud.svg'; 
import { Link } from 'react-router-dom';
import localStorage from '../../services/storage';
import { useNavigate } from 'react-router-dom';

import './lobby.css'; 
import ConfiguracaoSala from '../ConfigureRoom/ConfigureRoom';
import { joinRoom } from '../../services/joinRoomService';
import Modal from '../../components/Modal';
import ErrorModal from '../../components/ErroModal';

const CencosudPinPage = () => {
  const [pin, setPin] = useState('');
  const [showAdditionalInputs, setShowAdditionalInputs] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
const [errorMessage, setErrorMessage] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try{
      const data =  await joinRoom(pin, companyName, playerName);
      console.log("Entrou na sala com sucesso:", data);
      localStorage.clear();
      localStorage.setItem('companyId', data.company.id);
      localStorage.setItem('codeRoom', pin);
      console.log('Company ID armazenado:', localStorage.getItem('companyId'));
      navigate(`/waitingroom/${pin}?companyId=${data.company.id}`);
    } catch (err) {
      console.error("Erro ao entrar na sala:", err);
    
      setErrorMessage(err.response?.data?.message || "Falha ao entrar na sala. Verifique o PIN e tente novamente.");
      setIsErrorModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };
  const navigate = useNavigate();
  
 const handlePinChange = (e) => {
    const value = e.target.value;
    setPin(value);
    setShowAdditionalInputs(value.length === 6); // Mostra quando PIN tiver 6 dígitos
  };

  return (
    <div className="page-wrapper">
      <header className="header">
        <nav className="header__nav">
          <div className="header__logo">
            <Link to="/"><img src={logoCencosud} alt="Cencosud Logo" className="header__logo-img" /></Link>
          </div>
          <ul className="header__menu">
            {[
    { label: 'Aprender', path: '/aprender' },
    { label: 'Criar', path: '/configuracaodesala' }
  ].map((item) =>  (
              <li key={item} className="header__menu-item">
                <button
                onClick={() => navigate(item.path)}
                 className="header__menu-btn" type="button">{item.label}</button>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="main">
        <section className="login">
          <div className="login__brand">
            <h2 className="login__title">Cencosud Learning</h2>
          </div>
          <form className="login__form" onSubmit={handleSubmit}>
            <div className="login__input-group">
              <label htmlFor="game-pin" className="login__label visually-hidden">
                PIN do Jogo
              </label>
              <input 
                className="login__input" 
                type="tel" 
                id="game-pin" 
                name="game-pin" 
                placeholder="PIN de acesso" 
                maxLength="6"
                value={pin}
                onChange={handlePinChange}
              />
                {showAdditionalInputs && (
                <div className="login__additional-inputs">
                  <input 
                    className="login__input" 
                    type="text" 
                    placeholder="Nome da Empresa" 
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                  <input 
                    className="login__input" 
                    type="text" 
                    placeholder="Seu Nome" 
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                  />
                </div>
              )}

              <button 
                className="idroom-submit" 
                type="submit"
                disabled={pin.length !== 6 || (showAdditionalInputs && (!companyName || !playerName))}
              >
                Entrar
              </button>
            </div>
            <div className="login__action-group">
            </div>
          </form>
        </section>
      </main>

      <footer className="footer">
        <p className="footer__text">
          Crie seu próprio ambiente de <strong className="footer__brand">aprendizado</strong>.
        </p>
        {/*<div className="footer__links">
          <a className="footer__link" href="#">Termos</a> | 
          <a className="footer__link" href="#">Privacidade</a> | 
          <a className="footer__link" href="#">Aviso sobre cookies</a>
        </div>*/}
      </footer>

      <Modal
        isOpen={isLoading}
        type="loading"
        title="Entrando na sala..."
        message="Aguarde enquanto conectamos você à sala."
      />

      <ErrorModal 
        isOpen={isErrorModalOpen} 
        onClose={() => setIsErrorModalOpen(false)} 
        errorMessage={errorMessage} 
      />
    </div>
  );
};

export default CencosudPinPage;