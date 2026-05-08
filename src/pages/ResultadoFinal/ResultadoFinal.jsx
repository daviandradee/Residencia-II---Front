import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import '../../index.css'
import '../../assets/css/RoomConfig.css'
import './ResultadoFinal.css'
import Modal from '../../components/Modal'

const ResultadoFinal = () => {
  const { code } = useParams()
  const navigate = useNavigate()
  const [resultado, setResultado] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Tenta carregar do localStorage primeiro (veio do finish-game)
    const stored = localStorage.getItem('resultadoFinal')
    if (stored) {
      try {
        setResultado(JSON.parse(stored))
        setLoading(false)
        return
      } catch (e) {
        console.error('Erro ao parsear resultado:', e)
      }
    }

    // Fallback: sem dados locais → exibe tela de erro
    // NÃO chamar PATCH /finish-game aqui — isso re-finalizaria o jogo
    setLoading(false)
  }, [code])

  const fmt = (v) => {
    if (v === undefined || v === null || isNaN(v)) return 'R$ 0,00'
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  // Tela de erro caso não haja resultado e não esteja carregando
  if (!resultado && !loading) {
    return (
      <div className="config-container">
        <div className="config-main">
          <div className="config-content">
            <h2>Resultado não encontrado</h2>
            <button className="btn-confirm" onClick={() => navigate(`/facilitador/${code}`)}>
              Voltar ao Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Campeão geral (primeiro do ranking)
  const campeao = resultado?.rankingGeral?.[0]

  return (
    <div className="config-container">
      <aside className="config-sidebar">
        <div className="sidebar-top">
          <h1 className="config-title">Resultado<br />Final</h1>
          <span className="config-title-accent" />
          <p className="config-subtitle">
            Ranking geral e análise de desempenho das empresas.
          </p>
        </div>

        <div className="dash-info-card">
          <span className="dash-info-label">Sala</span>
          <strong className="dash-info-value">{code}</strong>
        </div>

        <div className="dash-info-card">
          <span className="dash-info-label">Total de Rodadas</span>
          <strong className="dash-info-value">{resultado?.totalRounds || '—'}</strong>
        </div>

        {/* Card do campeão geral */}
        {campeao && (
          <div className="dash-info-card champion-card">
            <span className="dash-info-label">🏆 Campeão Geral</span>
            <strong className="dash-info-value">{campeao.companyName}</strong>
            <span className="champion-receita">{fmt(campeao.receitaTotal)}</span>
          </div>
        )}
      </aside>

      <div className="config-main">
        <div className="config-content">

          {/* ── Ranking Geral ── */}
          <section className="config-section">
            <h3 className="section-subtitle">Ranking Geral</h3>
            <div className="dash-table">
              <div className="dash-table-header dash-ranking-header">
                <span>Posição</span>
                <span>Empresa</span>
                <span className="dash-center">Receita Total</span>
                <span className="dash-center">Pontos</span>
              </div>
              {resultado?.rankingGeral?.length > 0 ? (
                resultado.rankingGeral.map((emp, index) => (
                  <div
                    className={`dash-table-row dash-ranking-row ${index === 0 ? 'dash-row-first' : ''}`}
                    key={emp.companyId || index}
                  >
                    <span className="dash-position">{emp.posicao || index + 1}°</span>
                    <span className="dash-empresa-name">{emp.companyName}</span>
                    <span className="dash-center dash-total-score">
                      <strong>{fmt(emp.receitaTotal)}</strong>
                    </span>
                    <span className="dash-center">{emp.pontos || '—'}</span>
                  </div>
                ))
              ) : (
                <div className="dash-table-empty">Nenhum dado disponível.</div>
              )}
            </div>
          </section>

          {/* ── Vencedores por Rodada ── */}
          <section className="config-section">
            <h3 className="section-subtitle">Vencedores por Rodada</h3>
            <div className="dash-table">
              <div className="dash-table-header dash-vencedores-header">
                <span>Rodada</span>
                <span>Empresa Vencedora</span>
                <span className="dash-center">Receita da Rodada</span>
              </div>
              {resultado?.vencedoresPorRodada?.length > 0 ? (
                resultado.vencedoresPorRodada.map((v, index) => (
                  <div className="dash-table-row dash-vencedores-row" key={index}>
                    <span className="dash-empresa-name">Rodada {v.round}</span>
                    <span>{v.companyName}</span>
                    <span className="dash-center">{fmt(v.receitaTotal)}</span>
                  </div>
                ))
              ) : (
                <div className="dash-table-empty">Nenhum dado disponível.</div>
              )}
            </div>
          </section>

          {/* ── Discrepância por Rodada ── */}
          <section className="config-section">
            <h3 className="section-subtitle">Discrepância entre Jogadores por Rodada</h3>
            <div className="dash-table">
              <div className="dash-table-header dash-discrepancia-header">
                <span>Rodada</span>
                <span className="dash-center">Discrepância (%)</span>
              </div>
              {resultado?.discrepanciaPorRodada?.length > 0 ? (
                resultado.discrepanciaPorRodada.map((d, index) => (
                  <div className="dash-table-row dash-discrepancia-row" key={index}>
                    <span className="dash-empresa-name">Rodada {d.round}</span>
                    <span className="dash-center">
                      <strong style={{ color: d.valor > 50 ? '#e74c3c' : '#27ae60' }}>
                        {d.valor?.toFixed(1) || 0}%
                      </strong>
                    </span>
                  </div>
                ))
              ) : (
                <div className="dash-table-empty">Nenhum dado disponível.</div>
              )}
            </div>
          </section>

          {/* ── Ações ── */}
          <div className="dash-actions">
            <button className="btn-confirm" onClick={() => navigate(`/facilitador/${code}`)}>
              Voltar ao Dashboard
            </button>
            <button
              className="btn-start"
              onClick={() => {
                localStorage.clear()
                navigate('/lobby')
              }}
            >
              Nova Sala
            </button>
          </div>
        </div>
      </div>

      {/* Modal de loading */}
      <Modal
        isOpen={loading}
        type="loading"
        title="Carregando Resultados"
        message="Aguarde enquanto os dados são carregados..."
      />
    </div>
  )
}

export default ResultadoFinal
