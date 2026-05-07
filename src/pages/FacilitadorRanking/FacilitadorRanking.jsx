import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../../index.css';
import './FacilitadorRanking.css';
import Modal from '../../components/Modal';


const CONFETTI_PIECES = [
  { tx: -80,  ty: -150, rot:  380, color: '#FF690A', w: 8,  h: 14, d: 0.00 },
  { tx:  70,  ty: -160, rot: -310, color: '#FFE066', w: 6,  h: 10, d: 0.05 },
  { tx: -140, ty:  -80, rot:  220, color: '#ffffff', w: 10, h:  7, d: 0.08 },
  { tx:  130, ty:  -90, rot: -200, color: '#87CEEB', w: 7,  h: 11, d: 0.12 },
  { tx: -100, ty: -180, rot:  450, color: '#FFE066', w: 9,  h:  8, d: 0.15 },
  { tx:   90, ty: -170, rot: -400, color: '#FF690A', w: 11, h:  7, d: 0.18 },
  { tx: -170, ty:  -30, rot:  300, color: '#ffffff', w: 8,  h: 13, d: 0.22 },
  { tx:  160, ty:  -40, rot: -280, color: '#a8e6cf', w: 6,  h:  9, d: 0.25 },
  { tx:  -50, ty: -200, rot:  500, color: '#FF690A', w: 7,  h: 12, d: 0.28 },
  { tx:   50, ty: -195, rot: -480, color: '#FFE066', w: 12, h:  6, d: 0.30 },
  { tx: -120, ty: -130, rot:  350, color: '#87CEEB', w: 8,  h: 10, d: 0.33 },
  { tx:  110, ty: -140, rot: -330, color: '#ffffff', w: 9,  h:  8, d: 0.35 },
  { tx: -160, ty: -100, rot:  420, color: '#FFE066', w: 6,  h: 14, d: 0.38 },
  { tx:  150, ty: -110, rot: -380, color: '#FF690A', w: 10, h:  7, d: 0.40 },
  { tx:  -30, ty: -210, rot:  600, color: '#a8e6cf', w: 7,  h: 11, d: 0.42 },
  { tx:   30, ty: -205, rot: -550, color: '#FFE066', w: 11, h:  6, d: 0.45 },
  { tx: -190, ty:  -50, rot:  270, color: '#ffffff', w: 8,  h:  9, d: 0.48 },
  { tx:  180, ty:  -60, rot: -250, color: '#FF690A', w: 9,  h: 12, d: 0.50 },
];

const MOCK_RESULTADO = [
  { id: '1', pontosTotais: 1240, company: { name: 'Atacadão Sul',       managerName: 'Rafael Lima' } },
  { id: '2', pontosTotais:  932, company: { name: 'Mercado Norte',      managerName: 'Camila Vieira' } },
  { id: '3', pontosTotais:  870, company: { name: 'Hipermarket Leste',  managerName: 'Joana Pereira' } },
  { id: '4', pontosTotais:  810, company: { name: 'SuperMais Centro',   managerName: 'Bruno Costa' } },
  { id: '5', pontosTotais:  755, company: { name: 'Rede Compra Fácil',  managerName: 'Ana Souza' } },
  { id: '6', pontosTotais:  690, company: { name: 'MaxiBox Oeste',      managerName: 'Carlos Melo' } },
  { id: '7', pontosTotais:  620, company: { name: 'Grupo Varejo+',      managerName: 'Patrícia Lima' } },
  { id: '8', pontosTotais:  540, company: { name: 'Central Market',     managerName: 'Diego Ramos' } },
];

const FacilitadorRanking = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const roomCode = code || localStorage.getItem('codeRoom');
  const [resultado] = useState(MOCK_RESULTADO);
  const [loading] = useState(false);
  const [totalEmpresas] = useState(MOCK_RESULTADO.length);



  const top3 = resultado.slice(0, 3);
  const outros = resultado.slice(3);

  // Reordena para: [2º, 1º, 3º] (visual do pódio)
  const podiumOrder = [top3[1], top3[0], top3[2]];
  const podiumClasses = ['fr-pod--silver', 'fr-pod--gold', 'fr-pod--bronze'];
  const podiumRanks = [2, 1, 3];
  // 3º sobe primeiro, depois 2º, depois 1º
  const animDelays = { 3: '2s', 2: '6s', 1: '10s' };

  return (
    <div className="fr-root">
      <div className="fr-confetti" aria-hidden="true">
        {Array.from({ length: 10 }).map((_, i) => (
          <span key={i} />
        ))}
      </div>

      <div className="fr-stage">
        <div className="fr-hero">
          <div className="fr-kicker">
            <span className="fr-kicker-dot" />
            Ranking Final
          </div>
          <h1 className="fr-hero-title">
            Os <em>melhores</em> da sessão
          </h1>
          <p className="fr-hero-sub">
            Parabéns às empresas vencedoras! Uma gestão de alto nível não acontece por acaso, ela é construída no dia a dia, com foco em inovação e valorização do capital humano. Que este marco seja apenas o início de um ciclo ainda mais próspero. Vocês são exemplos de como a organização e o propósito podem transformar o mercado!
          </p>
        </div>
        {!loading && resultado.length > 0 && (
          <div className="fr-podium">
            {podiumOrder.map((emp, i) => {
              if (!emp) return <div key={i} className="fr-pod-placeholder" />;
              const isGold = podiumClasses[i] === 'fr-pod--gold';
              const goldBaseDelay = parseFloat(animDelays[1]);

              const cardInner = (
                <>
                  {isGold && (
                    <>
                      <span className="fr-sparkle fr-sparkle-1" aria-hidden="true" />
                      <span className="fr-sparkle fr-sparkle-2" aria-hidden="true" />
                      <span className="fr-sparkle fr-sparkle-3" aria-hidden="true" />
                      <span className="fr-sparkle fr-sparkle-4" aria-hidden="true" />
                      <span className="fr-sparkle fr-sparkle-5" aria-hidden="true" />
                      <span className="fr-sparkle fr-sparkle-6" aria-hidden="true" />
                    </>
                  )}
                  <div className="fr-rank-badge">{podiumRanks[i]}</div>
                  <div className="fr-pod-name">
                    {emp.company?.name || `Empresa ${podiumRanks[i]}`}
                  </div>
                  <div className="fr-pod-mgr">
                    {emp.company?.managerName || '—'}
                  </div>
                  <div className="fr-pod-divider" />
                  <div className="fr-pod-points">
                    {(emp.pontosTotais || 0).toLocaleString('pt-BR')}
                    <span>pontos</span>
                  </div>
                  <div className="fr-pod-base" />
                </>
              );

              if (isGold) {
                return (
                  <div
                    key={emp.id || i}
                    className="fr-gold-wrapper"
                    style={{ '--pod-delay': animDelays[podiumRanks[i]] }}
                  >
                    {/* Confetti fora do overflow:hidden do card */}
                    <div className="fr-confetti-burst" aria-hidden="true">
                      {CONFETTI_PIECES.map((c, j) => (
                        <span
                          key={j}
                          className="fr-cp"
                          style={{
                            '--tx': `${c.tx}px`,
                            '--ty': `${c.ty}px`,
                            '--rot': `${c.rot}deg`,
                            background: c.color,
                            width: `${c.w}px`,
                            height: `${c.h}px`,
                            animationDelay: `${goldBaseDelay + 1.1 + c.d}s`,
                          }}
                        />
                      ))}
                    </div>
                    <div className={`fr-pod ${podiumClasses[i]}`}>
                      {cardInner}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={emp.id || i}
                  className={`fr-pod ${podiumClasses[i]}`}
                  style={{ '--pod-delay': animDelays[podiumRanks[i]] }}
                >
                  {cardInner}
                </div>
              );
            })}
          </div>
        )}
        {/* Rodapé de ações 
        <div className="fr-actions">
          <div className="fr-live-meta">
            <span className="fr-dot-live" />
            Atualizado em tempo real · {totalEmpresas} empresa{totalEmpresas !== 1 ? 's' : ''} conectada{totalEmpresas !== 1 ? 's' : ''}
          </div>
          <div className="fr-actions-btns">
            <button
              className="fr-btn-ghost"
              onClick={() => navigate(`/facilitador/${roomCode}`)}
            >
              Voltar ao Dashboard
            </button>
            <button
              className="fr-btn-primary"
              onClick={() => navigate(`/facilitador-quiz/${roomCode}`)}
            >
              Iniciar próxima rodada →
            </button>
          </div>
        </div>*/}
      </div>

      <Modal
        isOpen={loading}
        type="loading"
        title="Carregando Ranking"
        message="Aguarde enquanto os dados são carregados..."
      />
    </div>
  );
};

export default FacilitadorRanking;
