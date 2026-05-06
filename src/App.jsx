
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ScrollToTop from "./components/ScrollToTop";

// Importe suas páginas (verifique se os nomes dos arquivos estão corretos)
import Home from './pages/Landing/Landing';
import Lobby from './pages/Lobby/Lobby';
import ConfiguracaoSala from './pages/ConfigureRoom/ConfigureRoom';
import WaitingRoom from './pages/WaitingRoom/WaitingRoom';
import CompanyConfigRoom from './pages/CompanyConfigRoom/CompanyConfigRoom';
import FacilitadorDashboard from './pages/FacilitadorDashboard/FacilitadorDashboard';
import GerenteQuizTime from './pages/GerenteQuizTime/GerenteQuizTime';
import FacilitadorQuizTime from './pages/FacilitadorQuizTime/FacilitadorQuizTime';
import GerenteRanking from './pages/GerenteRanking/GerenteRanking';


function App() {
  return (
    <BrowserRouter>
      
      <ScrollToTop /> 
      
      <Routes>
        {/* Rota da Landing Page (Raiz) */}
        <Route path="/" element={<Home />} />
        
        {/* Rota da tela de PIN (Lobby) */}
        <Route path="/lobby" element={<Lobby />} />
        {/* Rota para configuração de sala */}
        <Route path="/configuracaodesala" element={<ConfiguracaoSala />} />
        {/* Rota para sala de espera */}
        <Route path="/waitingroom/:code" element={<WaitingRoom />} />
        <Route path="/gerente-quiz/:companyId" element={<GerenteQuizTime />} />
        <Route path="/facilitador-quiz/:code" element={<FacilitadorQuizTime />} />
        <Route path="/config/:companyId" element={<CompanyConfigRoom />} />
        <Route path="/facilitador/:code" element={<FacilitadorDashboard />} />
        <Route path="/ranking" element={<GerenteRanking />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;