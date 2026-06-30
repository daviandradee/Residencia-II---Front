
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import localStorage from './services/storage';
import ScrollToTop from "./components/ScrollToTop";
import { ToastProvider } from './components/Toast';
import Chat from './components/Chat/Chat';

import Home from './pages/Landing/Landing';
import Lobby from './pages/Lobby/Lobby';
import ConfiguracaoSala from './pages/ConfigureRoom/ConfigureRoom';
import WaitingRoom from './pages/WaitingRoom/WaitingRoom';
import CompanyConfigRoom from './pages/CompanyConfigRoom/CompanyConfigRoom';
import FacilitadorDashboard from './pages/FacilitadorDashboard/FacilitadorDashboard';
import QuizPlayer from './pages/QuizPlayer/QuizPlayer'
import QuizFacilitator from './pages/QuizFacilitator/QuizFacilitator'
import Categories from './pages/Categories/Categories'
import GerenteRanking from './pages/GerenteRanking/GerenteRanking';
import FacilitadorRanking from './pages/FacilitadorRanking/FacilitadorRanking';
import Tutorial from './pages/Tutorial/Tutorial';

const HIDDEN_ROUTES = ['/', '/lobby', '/aprender', '/configuracaodesala'];

function ChatOverlay() {
  const { pathname } = useLocation();
  const [roomConfig, setRoomConfig] = useState(null);

  const hidden = HIDDEN_ROUTES.includes(pathname) || pathname.startsWith('/waitingroom');

  useEffect(() => {
    if (hidden) return;
    const code = localStorage.getItem('codeRoom');
    if (!code) return;

    const API = import.meta.env.VITE_API_URL || '';
    fetch(`${API}/rooms/${code}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setRoomConfig(data); })
      .catch(() => {});
  }, [pathname, hidden]);

  if (hidden || !roomConfig) return null;
  return <Chat roomConfig={roomConfig} />;
}

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/aprender" element={<Tutorial />} />
          <Route path="/configuracaodesala" element={<ConfiguracaoSala />} />
          <Route path="/waitingroom/:code" element={<WaitingRoom />} />
          <Route path="/gerente-quiz/:code" element={<QuizPlayer />} />
          <Route path="/facilitador-quiz/:code" element={<QuizFacilitator />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/config/:companyId" element={<CompanyConfigRoom />} />
          <Route path="/facilitador/:code" element={<FacilitadorDashboard />} />
          <Route path="/ranking" element={<GerenteRanking />} />
          <Route path="/ranking-final" element={<FacilitadorRanking />} />
        </Routes>
        <ChatOverlay />
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;