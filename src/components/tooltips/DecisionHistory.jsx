import React from 'react';
import './tooltips.css';

/**
 * DecisionHistory — tabela + gráfico de histórico de rodadas.
 *
 * Props:
 *   rounds: Array<{
 *     round         : number,
 *     precoCesta    : number,
 *     estoqueTotal  : number,
 *     capexNovos    : string,   // ex: "Segurança, Redes"
 *     receitaTotal  : number,
 *     ebitda        : number,   // percentual (ex: 15 = 15%)
 *     saldoFinal    : number,
 *   }>
 */
const DecisionHistory = ({ rounds = [] }) => {
  const fmt = (v) => {
    if (v === undefined || v === null || isNaN(v)) return '—';
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const fmtPct = (v) => {
    if (v === undefined || v === null || isNaN(v)) return '—';
    return v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';
  };

  if (rounds.length === 0) {
    return (
      <div className="decision-history">
        <p className="decision-history-empty">
          O histórico de rodadas aparecerá aqui após a primeira rodada confirmada.
        </p>
      </div>
    );
  }

  return (
    <div className="decision-history">
      {/* Tabela */}
      <table className="decision-history-table">
        <thead>
          <tr>
            <th>Rodada</th>
            <th>Preço da Cesta</th>
            <th>Disponibilidade</th>
            <th>Receita</th>
          </tr>
        </thead>
        <tbody>
          {rounds.map((r) => (
            <tr key={r.round}>
              <td>Rodada {r.round}</td>
              <td>{fmt(r.precoCesta)}</td>
              <td>{fmtPct(r.disponibilidade)}</td>
              <td>{fmt(r.receitaTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DecisionHistory;
