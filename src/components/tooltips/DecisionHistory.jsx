import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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

  const fmtNum = (v) => {
    if (v === undefined || v === null || isNaN(v)) return '—';
    return v.toLocaleString('pt-BR');
  };

  const fmtPct = (v) => {
    if (v === undefined || v === null || isNaN(v)) return '—';
    return v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';
  };

  // Dados para o gráfico recharts
  const chartData = rounds.map((r) => ({
    name: `R${r.round}`,
    Saldo: r.saldoFinal ?? null,
    EBITDA: r.ebitda ?? null,
  }));

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
            <th>Preço Cesta</th>
            <th>Estoque Total</th>
            <th>CAPEX Novos</th>
            <th>Receita</th>
            <th>EBITDA</th>
            <th>Saldo Final</th>
          </tr>
        </thead>
        <tbody>
          {rounds.map((r) => {
            const ebitdaPos = r.ebitda !== undefined && r.ebitda !== null && !isNaN(r.ebitda) && r.ebitda >= 0;
            return (
              <tr key={r.round}>
                <td>Rodada {r.round}</td>
                <td>{fmt(r.precoCesta)}</td>
                <td>{fmtNum(r.estoqueTotal)} un.</td>
                <td>{r.capexNovos || 'Nenhum'}</td>
                <td>{fmt(r.receitaTotal)}</td>
                <td className={ebitdaPos ? 'dh-ebitda-pos' : 'dh-ebitda-neg'}>
                  {fmtPct(r.ebitda)}
                </td>
                <td>{fmt(r.saldoFinal)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Gráfico de tendência (apenas se tiver 2+ rodadas) */}
      {rounds.length >= 2 && (
        <div className="decision-history-chart">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#DDE2E6" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6C757D' }} />
              <YAxis
                tick={{ fontSize: 11, fill: '#6C757D' }}
                tickFormatter={(v) =>
                  v !== null
                    ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' })
                    : ''
                }
              />
              <Tooltip
                formatter={(value, name) => [
                  name === 'EBITDA' ? fmtPct(value) : fmt(value),
                  name,
                ]}
                contentStyle={{
                  borderRadius: 8,
                  border: '1.5px solid #DDE2E6',
                  fontSize: '0.82rem',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '0.82rem' }} />
              <Line
                type="monotone"
                dataKey="Saldo"
                stroke="#0B5A97"
                strokeWidth={2}
                dot={{ r: 4, fill: '#0B5A97' }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="EBITDA"
                stroke="#FF690A"
                strokeWidth={2}
                dot={{ r: 4, fill: '#FF690A' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default DecisionHistory;
