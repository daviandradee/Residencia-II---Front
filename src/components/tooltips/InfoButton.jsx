import React from 'react';
import './tooltips.css';

/**
 * InfoButton — botão ⓘ clicável para abrir tooltips educativos.
 * Props:
 *   onClick   : Function
 *   ariaLabel : string
 *   active    : boolean  (ativo = fundo azul)
 *   inline    : boolean  (true = posição estática, para cabeçalhos de tabela)
 */
const InfoButton = ({ onClick, ariaLabel = 'Explicar métrica', active = false, inline = false }) => {
  return (
    <button
      className={`info-btn ${active ? 'info-btn--active' : ''} ${inline ? 'info-btn--inline' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={ariaLabel}
      aria-expanded={active}
      type="button"
    >
      ⓘ
    </button>
  );
};

export default InfoButton;
