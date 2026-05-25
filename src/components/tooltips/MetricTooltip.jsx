import React from 'react';
import './tooltips.css';

/**
 * MetricTooltip — mini-modal inline expansível que explica a lógica de uma métrica.
 *
 * Props:
 *   isOpen      : boolean
 *   onClose     : Function
 *   metric      : string              — nome da métrica
 *   formula     : string              — fórmula matemática (texto plano)
 *   explanation : string              — explicação simples (1-2 frases)
 *   variables   : Array<{
 *     name        : string            — nome da variável (laranja)
 *     description : string            — descrição curta (muted)
 *     value       : number | string   — valor real da rodada (azul)
 *   }>
 */
const MetricTooltip = ({ isOpen, onClose, metric, formula, explanation, variables = [] }) => {
  return (
    <>
      {/* Overlay escuro no mobile */}
      {isOpen && (
        <div
          className="metric-tooltip-overlay"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <div
        className={`metric-tooltip ${isOpen ? 'metric-tooltip--open' : ''}`}
        role="region"
        aria-label={`Explicação: ${metric}`}
        aria-hidden={!isOpen}
      >
        <div className="metric-tooltip-inner">
          {/* Cabeçalho */}
          <div className="metric-tooltip-header">
            <span className="metric-tooltip-title">Como é calculado: {metric}</span>
            <button
              className="metric-tooltip-close"
              onClick={onClose}
              aria-label="Fechar explicação"
              type="button"
            >
              ✕
            </button>
          </div>

          {/* Fórmula */}
          <div className="metric-tooltip-formula">
            <span className="formula-var">Fórmula: </span>
            {formula}
          </div>

          {/* Variáveis */}
          {variables.length > 0 && (
            <ul className="metric-tooltip-vars" aria-label="Variáveis da fórmula">
              {variables.map((v, i) => (
                <li key={i} className="metric-tooltip-var">
                  <span className="var-name">• {v.name}</span>
                  {v.description && <span className="var-desc">{v.description}</span>}
                  {v.value !== undefined && v.value !== null && (
                    <span className="var-value">{v.value}</span>
                  )}
                </li>
              ))}
            </ul>
          )}

          {/* Divisor */}
          {explanation && <hr className="metric-tooltip-divider" />}

          {/* Explicação */}
          {explanation && (
            <p className="metric-tooltip-explanation">{explanation}</p>
          )}
        </div>
      </div>
    </>
  );
};

export default MetricTooltip;
