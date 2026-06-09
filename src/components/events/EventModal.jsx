import React, { useEffect, useRef } from 'react';
import './EventModal.css';

// ── Mapeamento de tipo de evento → label e CAPEX ──
const EVENTO_CONFIG = {
  SEGURANCA: {
    label: 'Falha de Segurança',
    capexLabel: 'Segurança',
  },
  REDES: {
    label: 'Falha de Redes',
    capexLabel: 'Redes',
  },
  // O backend emite o tipo como BALANCA_FREEZER (ver ConfigureRoom.jsx linha 506)
  BALANCA_FREEZER: {
    label: 'Problema no Freezer/Balança',
    capexLabel: 'Balança/Freezer',
  },
  // Alias para compatibilidade caso o backend evolua
  FREEZER: {
    label: 'Problema no Freezer/Balança',
    capexLabel: 'Balança/Freezer',
  },
  SITE: {
    label: 'Queda do Site',
    capexLabel: 'Site',
  },
  SELF_CHECKOUT: {
    label: 'Falha no Self Checkout',
    capexLabel: 'Self Checkout',
  },
  MELHORIA_CONTINUA: {
    label: 'Problema de Melhoria Contínua',
    capexLabel: 'Melhoria Contínua',
  },
};

const getEventoConfig = (tipo) =>
  EVENTO_CONFIG[tipo] || { label: tipo, capexLabel: tipo };

/**
 * EventModal — Modal de eventos da rodada.
 *
 * Props:
 *   events        Array<{ tipo: string, protegido: boolean, penalidade: number }>
 *   companyName   string   — nome da empresa (para o título)
 *   round         number   — número da rodada
 *   isOpen        boolean  — controla visibilidade
 *   onClose       Function — callback ao fechar
 *   isFacilitador boolean  — quando true, exibe "Rodada N — Nome da Empresa"
 */
const EventModal = ({ events = [], companyName, round, isOpen, onClose, isFacilitador = false }) => {
  const btnRef = useRef(null);

  // Foco no botão ao abrir (acessibilidade)
  useEffect(() => {
    if (isOpen && btnRef.current) {
      btnRef.current.focus();
    }
  }, [isOpen]);

  // Fechar com Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const titulo = isFacilitador && companyName
    ? `Eventos da Rodada ${round} — ${companyName}`
    : `Eventos da Rodada ${round}`;

  const subtitulo = !isFacilitador && companyName ? companyName : null;

  return (
    <div
      className="event-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-modal-title"
      onClick={(e) => {
        // Fechar ao clicar no overlay (fora do modal)
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="event-modal">
        {/* Header */}
        <div className="event-modal-header">
          <div>
            <h2 id="event-modal-title" className="event-modal-title">
              {titulo}
            </h2>
            {subtitulo && (
              <p className="event-modal-subtitle">{subtitulo}</p>
            )}
          </div>
          <button
            className="event-modal-close-btn"
            onClick={onClose}
            aria-label="Fechar modal de eventos"
          >
            ×
          </button>
        </div>

        {/* Lista de eventos */}
        <div className="event-modal-body">
          {events.length === 0 ? (
            <p className="event-modal-empty">Nenhum evento nesta rodada.</p>
          ) : (
            events.map((evento, idx) => {
              const config = getEventoConfig(evento.tipo);
              const isProtected = evento.protegido;

              return (
                <div
                  key={idx}
                  className={`event-card ${isProtected ? 'protected' : 'hit'}`}
                >
                  <div className="event-card-icon">
                    {isProtected ? '🔒' : '⚡'}
                  </div>
                  <div className="event-card-content">
                    <strong className="event-card-title">
                      {config.label}
                    </strong>
                    {isProtected ? (
                      <>
                        <p className="event-card-text">
                          Sua loja estava protegida com CAPEX de {config.capexLabel}.
                        </p>
                        <p className="event-card-text event-card-ok">
                          Sem penalidades nesta rodada.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="event-card-text">
                          Sua loja não tinha CAPEX de {config.capexLabel}.
                        </p>
                        <p className="event-card-text event-card-danger">
                          Receita reduzida em {evento.penalidade}% por conta deste evento.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer com botão fixo */}
        <div className="event-modal-footer">
          <button
            ref={btnRef}
            id="event-modal-confirm-btn"
            className="event-modal-btn"
            onClick={onClose}
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventModal;
