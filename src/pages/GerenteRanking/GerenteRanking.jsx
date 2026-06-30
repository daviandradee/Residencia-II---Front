import React, { useState, useEffect } from 'react';
import localStorage from '../../services/storage';
import { useNavigate } from 'react-router-dom';
import '../../index.css';
import '../../assets/css/RoomConfig.css';
import './GerenteRanking.css';
import { io } from 'socket.io-client';
import Modal from '../../components/Modal';
import GraficoVendas from '../../components/GraficoVendas';
import InfoButton from '../../components/tooltips/InfoButton';
import MetricTooltip from '../../components/tooltips/MetricTooltip';
import ProfessorFeed from '../../components/tooltips/ProfessorFeed';
import DecisionHistory from '../../components/tooltips/DecisionHistory';
import EventModal from '../../components/events/EventModal';

console.log('Renderizando GerenteRanking')

// ── Helpers de localStorage para histórico ──
const HISTORY_KEY = 'cencosud_decision_history';

const loadHistory = () => {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch {
    return [];
  }
};

const saveHistory = (rounds) => {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(rounds));
  } catch {}
};

// ── Função que monta as variáveis de cada tooltip com dados reais ──
const buildTooltipData = (meuResultado, resultado, companyId) => {
  const r = meuResultado || {};
  const rank = resultado || [];

  // Posição no ranking de receita (1-based)
  const posicao = rank.findIndex(e => e.company?.id === companyId) + 1;
  const totalEmpresas = rank.length;

  // % Demanda
  const pctDemanda = ((r.percentualDemanda || 0) * 100).toFixed(1);
  const pontos = r.pontosTotais || 0;
  const somaTotal = rank.reduce((acc, e) => acc + (e.pontosTotais || 0), 0);

  // CSAT
  const operadores = r.operadoresServico ?? '—';
  const acertosQuiz = r.acertosQuiz ?? '—';
  const totalPerguntas = r.totalPerguntas ?? 10;
  const propOp = operadores !== '—' ? ((operadores / 10) * 100).toFixed(0) : '—';
  const propAcertos = acertosQuiz !== '—' ? ((acertosQuiz / totalPerguntas) * 100).toFixed(0) : '—';

  // Receita
  const receitaBruta = r.receitaBruta ?? 0;
  const receitaTotal = r.receitaTotal ?? 0;
  const penPct = r.percentualPenalidade ?? 0;

  // Disponibilidade
  const disp = r.disponibilidade ?? 0;

  // Deixou de vender total
  const deixouTotal =
    (r.deixouDeVenderPereciveis || 0) +
    (r.deixouDeVenderMercearia || 0) +
    (r.deixouDeVenderEletro || 0) +
    (r.deixouDeVenderHipel || 0);

  const fmtR = (v) => {
    if (v === undefined || v === null || isNaN(v)) return '—';
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };
  const fmtP = (v) => {
    if (v === undefined || v === null || isNaN(v)) return '—';
    return v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';
  };

  return {
    precoCesta: {
      metric: 'Preço da Cesta',
      formula: 'preço Perecíveis + preço Mercearia + preço Eletro + preço Hipel',
      explanation: 'O cliente avalia uma cesta com 1 item de cada categoria. O preço da cesta é a soma dos preços dos 4 itens.',
      variables: [
        { name: 'Preço da Cesta', description: 'resultado desta rodada', value: fmtR(r.precoMedioCesta) },
      ],
    },
    disponibilidade: {
      metric: 'Disponibilidade',
      formula: 'Média de (estoque total categoria / estoque disponível sala) × 100',
      explanation: 'Disponibilidade mede o quanto da demanda do mercado você consegue atender. É baseada no estoque ACUMULADO, incluindo o que sobrou de rodadas anteriores.',
      variables: [
        { name: 'Disponibilidade Geral', description: 'sua média desta rodada', value: fmtP(disp) },
        { name: 'Qtd Vendida Perecíveis', description: '', value: (r.qtdVendidaPereciveis || 0).toLocaleString('pt-BR') + ' un.' },
        { name: 'Qtd Vendida Mercearia', description: '', value: (r.qtdVendidaMercearia || 0).toLocaleString('pt-BR') + ' un.' },
        { name: 'Qtd Vendida Eletro', description: '', value: (r.qtdVendidaEletro || 0).toLocaleString('pt-BR') + ' un.' },
        { name: 'Qtd Vendida Hipel', description: '', value: (r.qtdVendidaHipel || 0).toLocaleString('pt-BR') + ' un.' },
      ],
    },
    csat: {
      metric: 'CSAT',
      formula: '(operadores / 10) × (acertos quiz / total perguntas) × 100',
      explanation: 'CSAT mede a satisfação do cliente com o atendimento. Depende de quantos operadores de serviço você alocou e do seu desempenho no quiz.',
      variables: [
        { name: 'Operadores de Serviço', description: 'sua decisão', value: operadores !== '—' ? operadores : '—' },
        { name: 'Proporção Operadores', description: 'operadores / 10', value: propOp !== '—' ? propOp + '%' : '—' },
        { name: 'Acertos no Quiz', description: 'seu resultado', value: acertosQuiz !== '—' ? `${acertosQuiz} / ${totalPerguntas}` : '—' },
        { name: 'Proporção Acertos', description: 'acertos / total', value: propAcertos !== '—' ? propAcertos + '%' : '—' },
        { name: 'CSAT', description: 'resultado final', value: fmtP(r.csat) },
      ],
    },
    demanda: {
      metric: '% Participação de Demanda',
      formula: 'seus pontos totais / soma de pontos de todas as empresas',
      explanation: 'A demanda do mercado é dividida entre as empresas por um sistema de ranking. Quem tem melhor posição nos 3 pilares (preço, disponibilidade, CSAT) ganha mais clientes.',
      variables: [
        { name: 'Seus Pontos Totais', description: '', value: pontos },
        { name: 'Pontos de Todas as Empresas', description: 'soma do ranking', value: somaTotal },
        { name: 'Sua % Demanda', description: 'pontos / soma total', value: pctDemanda + '%' },
        { name: 'Sua Posição Geral', description: '', value: posicao > 0 ? `${posicao}° de ${totalEmpresas}` : '—' },
      ],
    },
    receita: {
      metric: 'Receita Bruta vs Receita Final',
      formula: 'Receita Bruta = Σ(qtd vendida × preço venda)\nReceita Final = Receita Bruta × (1 − penalidade)',
      explanation: 'Receita Bruta é tudo que você vendeu. Receita Final é o valor após eventos negativos que não foram mitigados com CAPEX.',
      variables: [
        { name: 'Receita Antes do Impacto', description: 'soma de todas as categorias', value: fmtR(receitaBruta) },
        { name: 'Penalidade Aplicada', description: '% de redução por eventos', value: fmtP(penPct) },
        { name: 'Receita Final', description: 'após desconto de eventos', value: fmtR(receitaTotal) },
        { name: 'Eventos Aplicados', description: '', value: (r.eventosAplicados || []).join(', ') || 'Nenhum' },
      ],
    },
    deixouVender: {
      metric: 'Deixou de Vender',
      formula: 'max(0, demanda capturada − estoque disponível)',
      explanation: 'Clientes que vieram na sua loja mas encontraram a prateleira vazia. Acontece quando sua demanda capturada é maior que seu estoque total.',
      variables: [
        { name: 'Deixou de Vender — Perecíveis', description: '', value: (r.deixouDeVenderPereciveis || 0).toLocaleString('pt-BR') + ' un.' },
        { name: 'Deixou de Vender — Mercearia', description: '', value: (r.deixouDeVenderMercearia || 0).toLocaleString('pt-BR') + ' un.' },
        { name: 'Deixou de Vender — Eletro', description: '', value: (r.deixouDeVenderEletro || 0).toLocaleString('pt-BR') + ' un.' },
        { name: 'Deixou de Vender — Hipel', description: '', value: (r.deixouDeVenderHipel || 0).toLocaleString('pt-BR') + ' un.' },
        { name: 'Total Não Vendido', description: '', value: deixouTotal.toLocaleString('pt-BR') + ' un.' },
      ],
    },
    deixouVender: {
      metric: 'Deixou de Vender',
      formula: 'max(0, demanda capturada − estoque disponível)',
      explanation: 'Clientes que vieram na sua loja mas encontraram a prateleira vazia. Acontece quando sua demanda capturada é maior que seu estoque total.',
      variables: [
        { name: 'Deixou de Vender — Perecíveis', description: '', value: (r.deixouDeVenderPereciveis || 0).toLocaleString('pt-BR') + ' un.' },
        { name: 'Deixou de Vender — Mercearia', description: '', value: (r.deixouDeVenderMercearia || 0).toLocaleString('pt-BR') + ' un.' },
        { name: 'Deixou de Vender — Eletro', description: '', value: (r.deixouDeVenderEletro || 0).toLocaleString('pt-BR') + ' un.' },
        { name: 'Deixou de Vender — Hipel', description: '', value: (r.deixouDeVenderHipel || 0).toLocaleString('pt-BR') + ' un.' },
        { name: 'Total Não Vendido', description: '', value: deixouTotal.toLocaleString('pt-BR') + ' un.' },
      ],
    },

    // ── Métrica G: Quantidade Vendida ──
    qtdVendida: {
      metric: 'Quantidade Vendida',
      formula: 'min(demanda capturada, estoque total da categoria)',
      explanation: 'Você vende o mínimo entre: (a) quantos clientes escolheram sua loja, e (b) quanto estoque você tem. Se não tem estoque suficiente, perde vendas.',
      variables: [
        { name: 'Qtd Vendida — Perecíveis', description: '', value: (r.qtdVendidaPereciveis || 0).toLocaleString('pt-BR') + ' un.' },
        { name: 'Qtd Vendida — Mercearia', description: '', value: (r.qtdVendidaMercearia || 0).toLocaleString('pt-BR') + ' un.' },
        { name: 'Qtd Vendida — Eletro', description: '', value: (r.qtdVendidaEletro || 0).toLocaleString('pt-BR') + ' un.' },
        { name: 'Qtd Vendida — Hipel', description: '', value: (r.qtdVendidaHipel || 0).toLocaleString('pt-BR') + ' un.' },
        { name: 'Total Vendido', description: '', value: (
          (r.qtdVendidaPereciveis || 0) +
          (r.qtdVendidaMercearia || 0) +
          (r.qtdVendidaEletro || 0) +
          (r.qtdVendidaHipel || 0)
        ).toLocaleString('pt-BR') + ' un.' },
        { name: 'Receita Bruta Total', description: 'tudo que foi vendido × preço', value: fmtR(receitaBruta) },
      ],
    },

    // ── Métrica H: EBITDA Acumulado ──
    ebitda: {
      metric: 'EBITDA Acumulado',
      formula: '((Receita Total − Custos − Custo Aging/Quebras) / Receita Total) × 100',
      explanation: 'EBITDA é sua margem de lucro operacional. Mostra quanto sobrou depois de todos os custos, incluindo o prejuízo com estoque que encalhou e estragou.',
      variables: [
        { name: 'Receita Total (esta rodada)', description: '', value: fmtR(receitaTotal) },
        { name: 'EBITDA', description: r.ebitda !== undefined && r.ebitda !== null ? 'resultado calculado pelo sistema' : 'não disponível nesta rodada', value: r.ebitda !== undefined && r.ebitda !== null ? fmtP(r.ebitda) : '—' },
        { name: 'Saldo Final', description: 'caixa após todos os gastos e receitas', value: r.saldoFinal !== undefined && r.saldoFinal !== null ? fmtR(r.saldoFinal) : '—' },
      ],
    },

    // ── Métrica I: Juros (Cheque Especial) ──
    juros: {
      metric: 'Juros — Cheque Especial',
      formula: 'max(0, total gastos − caixa disponível) × (taxa de juros / 100)',
      explanation: 'Quando seus gastos superam o caixa disponível, você entra no cheque especial. O juros é cobrado sobre o rombo, não sobre o total gasto.',
      variables: [
        { name: 'Juros Aplicado', description: 'cobrado sobre o excedente', value: r.jurosAplicado !== undefined && r.jurosAplicado !== null ? fmtR(r.jurosAplicado) : '—' },
        { name: 'Saldo Final', description: 'caixa após receitas e gastos', value: r.saldoFinal !== undefined && r.saldoFinal !== null ? fmtR(r.saldoFinal) : '—' },
        { name: 'Receita Final', description: '', value: fmtR(receitaTotal) },
      ],
    },
  };
};

const GerenteRanking = () => {
  const companyId = localStorage.getItem('companyId');
  const navigate = useNavigate();
  const [resultado, setResultado] = useState([]);
  const [meuResultado, setMeuResultado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roundAtual, setRoundAtual] = useState(() => parseInt(localStorage.getItem('rankingRound')) || 1);
  const [currentGameRound, setCurrentGameRound] = useState(() => parseInt(localStorage.getItem('rankingRound')) || 1);
  const [showNextRoundModal, setShowNextRoundModal] = useState(false);
  const [nextRoundCountdown, setNextRoundCountdown] = useState(5);
  const [showCalculandoModal, setShowCalculandoModal] = useState(false);
  const [showRankingFinalModal, setShowRankingFinalModal] = useState(false);
  const roomCode = localStorage.getItem('codeRoom');

  // ── Estado do modal de eventos ──
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventosParaModal, setEventosParaModal] = useState([]);

  // ── Tooltip state ──
  const [openTooltip, setOpenTooltip] = useState(null);
  const toggleTooltip = (key) => setOpenTooltip(prev => prev === key ? null : key);

  // ── Feed do Professor ──
  const [professorTrigger, setProfessorTrigger] = useState(null);

  // ── Histórico de Decisões ──
  const [historyRounds, setHistoryRounds] = useState(() => loadHistory());

  // Contagem regressiva para redirecionar à config da próxima rodada
  useEffect(() => {
    if (!showNextRoundModal) return;
    setNextRoundCountdown(5);
    const interval = setInterval(() => {
      setNextRoundCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          navigate(`/config/${companyId}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [showNextRoundModal]);

  // Inicializar currentGameRound a partir do servidor
  useEffect(() => {
    if (!roomCode) return;
    fetch(`${import.meta.env.VITE_API_URL}/rooms/${roomCode}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.currentRound) setCurrentGameRound(data.currentRound);
      })
      .catch(() => {});
  }, [roomCode]);

  // Buscar resultado quando tiver roomCode
  useEffect(() => {
    if (!roomCode) return;

    fetch(`${import.meta.env.VITE_API_URL}/rooms/${roomCode}/rank/${roundAtual}?companyId=${companyId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Erro ao buscar resultado');
        return res.json();
      })
      .then((data) => {
        console.log('Resultado bruto:', data);
        setMeuResultado(data.meuResultado);
        setResultado(Array.isArray(data.rank) ? data.rank : []);
        setLoading(false);

        // Enriquecer histórico com resultado desta rodada
        if (data.meuResultado) {
          const r = data.meuResultado;
          setHistoryRounds(prev => {
            const existing = prev.filter(h => h.round !== roundAtual);
            const myConfig = JSON.parse(localStorage.getItem(`cencosud_config_r${roundAtual}`) || 'null');
            const newEntry = {
              round: roundAtual,
              precoCesta: r.precoMedioCesta,
              disponibilidade: r.disponibilidade ?? null,
              capexNovos: myConfig?.capexNovos || '—',
              receitaTotal: r.receitaTotal,
              ebitda: r.ebitda ?? null,
              saldoFinal: r.saldoFinal ?? null,
            };
            const updated = [...existing, newEntry].sort((a, b) => a.round - b.round);
            saveHistory(updated);
            return updated;
          });

          // Disparar Feed do Professor
          setProfessorTrigger(Date.now());
        }
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [roomCode, roundAtual, companyId]);

  // ── Dispara modal de eventos uma vez por rodada (só se houver eventos) ──
  useEffect(() => {
    if (!meuResultado) return;
    const eventos = meuResultado.eventosAplicados;
    if (!Array.isArray(eventos) || eventos.length === 0) return;

    const storageKey = `eventModal_seen_${roomCode}_round_${roundAtual}`;
    const alreadySeen = localStorage.getItem(storageKey);
    if (alreadySeen) return;

    // Monta array { tipo, protegido, penalidade } para o modal
    // Nota: o backend armazena como capexBalanca (mapCapexFields em CompanyConfigRoom)
    // e emite o tipo de evento como BALANCA_FREEZER (ConfigureRoom.jsx)
    const capexMap = {
      SEGURANCA: 'capexSeguranca',
      REDES: 'capexRedes',
      BALANCA_FREEZER: 'capexBalanca',   // tipo real emitido pelo backend
      FREEZER: 'capexBalanca',            // alias por compatibilidade
      SITE: 'capexSite',
      SELF_CHECKOUT: 'capexSelfCheckout',
      MELHORIA_CONTINUA: 'capexMelhoriaContinua',
    };
    const config = meuResultado.config ||
      JSON.parse(localStorage.getItem(`cencosud_config_r${roundAtual}`) || 'null') ||
      {};

    const eventosFormatados = eventos.map((tipo) => ({
      tipo,
      protegido: config[capexMap[tipo]] === true,
      penalidade: meuResultado.percentualPenalidade ?? 10,
    }));

    setEventosParaModal(eventosFormatados);
    setShowEventModal(true);
    localStorage.setItem(storageKey, 'true');
  }, [meuResultado, roundAtual, roomCode]);

  // Socket para atualizações em tempo real
  useEffect(() => {
    if (!roomCode) return;

    const socket = io(import.meta.env.VITE_API_URL);
    socket.emit('join_room', roomCode);

    socket.on('round_advanced', (data) => {
      setCurrentGameRound(data.round);
      if (data.round <= 2) {
        setShowNextRoundModal(true);
      } else {
        setShowCalculandoModal(true);
        setTimeout(() => setShowCalculandoModal(false), 3000);
      }
    });

    socket.on('all_companies_confirmed', (data) => {
      localStorage.setItem('rankingRound', data.round);
      setRoundAtual(data.round);
      setCurrentGameRound(data.round);
    });

    socket.on('game_finished', () => {
      setShowRankingFinalModal(true);
      setTimeout(() => {
        navigate(`/ranking-final`);
      }, 3000);
    });

    return () => {
      socket.off('round_advanced');
      socket.off('all_companies_confirmed');
      socket.off('game_finished');
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [roomCode]);

  const fmt = (v) => {
    if (v === undefined || v === null || isNaN(v)) return 'R$ 0,00';
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const fmtPercent = (v) => {
    if (v === undefined || v === null || isNaN(v)) return '0%';
    return v.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 1 }) + '%';
  };

  const EVENTO_LABELS = {
    SEGURANCA: 'Segurança',
    BALANCA_FREEZER: 'Balança/Freezer',
    REDES: 'Redes',
    SITE: 'Site',
    SELF_CHECKOUT: 'Self-checkout',
    MELHORIA_CONTINUA: 'Melhoria contínua',
    EQUIPMENT_FAILURE: 'Falha de equipamento',
    SYSTEM_FAILURE: 'Falha de sistema',
    OTHER: 'Outros',
  };

  const formatarEvento = (evento) => EVENTO_LABELS[evento] || evento;

  const houvePenalidade = (meuResultado?.diasSemVenda || 0) > 0;
  const textoPenalidade = houvePenalidade ? 'Sim' : 'Não';
  const classePenalidade = houvePenalidade ? 'gr-stat-value-danger' : 'gr-stat-value-ok';
  const eventos = meuResultado?.eventosAplicados?.map(formatarEvento).join(', ') || '';
  const valorPenalidade = meuResultado?.valorPenalidade || 0;

  const tooltips = meuResultado ? buildTooltipData(meuResultado, resultado, companyId) : {};

  // Estoque acumulado (soma do estoqueAtual* se o backend retornar)
  const estoqueAcumulado =
    (meuResultado?.estoqueAtualPereciveis ?? null) !== null
      ? (meuResultado.estoqueAtualPereciveis || 0) +
        (meuResultado.estoqueAtualMercearia || 0) +
        (meuResultado.estoqueAtualEletro || 0) +
        (meuResultado.estoqueAtualHipel || 0)
      : null;

  console.log('Meu Resultado:', meuResultado);
  console.log('Resultado Completo:', resultado);

  return (
    <div className="config-container">
      {/* Feed do Professor (sem UI) */}
      <ProfessorFeed
        context="ranking"
        results={meuResultado || {}}
        trigger={professorTrigger}
      />

      {/* Sidebar */}
      <aside className="config-sidebar config-sidebar-static">
        <div className="sidebar-top">
          <h1 className="config-title">Ranking<br />da Rodada</h1>
          <span className="config-title-accent" />
          <p className="config-subtitle">
            Veja sua posição e compare com as outras empresas.
          </p>
        </div>

        {meuResultado && (
          <>
            <div className="dash-info-card">
              <span className="dash-info-label">Sua Empresa</span>
              <strong className="dash-info-value">{resultado.find(e => e.company?.id === companyId)?.company?.name || '—'}</strong>
            </div>

            <div className="dash-info-card">
              <span className="dash-info-label">Sua Colocação</span>
              <strong className="dash-info-value ranking-position">
                {resultado.findIndex(e => e.company?.id === companyId) + 1}° lugar
              </strong>
            </div>

            <div className="dash-info-card">
              <span className="dash-info-label">Rodada</span>
              <strong className="dash-info-value">{currentGameRound}</strong>
            </div>

            <div className="dash-info-card">
              <span className="dash-info-label">Receita Total</span>
              <strong className="dash-info-value">{fmt(resultado.find(e => e.company?.id === companyId)?.receitaTotal)}</strong>
            </div>
          </>
        )}
        
      </aside>

        
      {/* Painel principal */}
  
        
      <div className="config-main">
        <div className="config-content">
          {/* Ranking */}
          <section className="config-section">
            <h3 className="section-subtitle">Ranking Geral — Rodada {currentGameRound}</h3>
            <div className="dash-table">
              <div className="dash-table-header gr-ranking-header">
                <span>Colocação</span>
                <span>Empresa</span>
                <span>Gerente</span>
                <span className="dash-center">Receita Total</span>
              </div>
              {resultado.length === 0 && !loading && (
                <div className="dash-table-empty">Nenhum resultado disponível.</div>
              )}
              {resultado.map((emp, index) => {
                const isMe = emp.companyId === companyId;
                return (
                  <div
                    className={`dash-table-row gr-ranking-row ${index === 0 ? 'dash-row-first' : ''} ${isMe ? 'gr-row-me' : ''}`}
                    key={emp.id || index}
                  >
                    <span className="dash-position">{index + 1}°</span>
                    <span className="dash-empresa-name">
                      {emp.company?.name || `Empresa ${index + 1}`}
                      {isMe && <span className="gr-badge-me">Você</span>}
                    </span>
                    <span>{emp.company?.managerName || '—'}</span>
                    <span className="dash-center dash-total-score">
                      <strong>{fmt(emp.receitaTotal)}</strong>
                    </span>
                  </div>
                );
              })}
            </div>
          </section>


          {/* Detalhes da minha empresa */}
          {meuResultado && (
            <section className="config-section">
              <h3 className="section-subtitle">Seus Resultados</h3>
              <div className="gr-stats-grid">

                {/* Preço Médio da Cesta */}
                <div className="gr-stat-card">
                  <InfoButton
                    onClick={() => toggleTooltip('precoCesta')}
                    active={openTooltip === 'precoCesta'}
                    ariaLabel="Explicar Preço da Cesta"
                  />
                  <span className="gr-stat-label">Preço da Cesta</span>
                  <strong className="gr-stat-value">{fmt(meuResultado.precoMedioCesta)}</strong>
                </div>

                {/* Disponibilidade */}
                <div className="gr-stat-card">
                  <InfoButton
                    onClick={() => toggleTooltip('disponibilidade')}
                    active={openTooltip === 'disponibilidade'}
                    ariaLabel="Explicar Disponibilidade"
                  />
                  <span className="gr-stat-label">Disponibilidade</span>
                  <strong className="gr-stat-value">{fmtPercent(meuResultado.disponibilidade)}</strong>
                </div>

                {/* CSAT */}
                <div className="gr-stat-card">
                  <InfoButton
                    onClick={() => toggleTooltip('csat')}
                    active={openTooltip === 'csat'}
                    ariaLabel="Explicar CSAT"
                  />
                  <span className="gr-stat-label">CSAT</span>
                  <strong className="gr-stat-value">{fmtPercent(meuResultado.csat)}</strong>
                </div>

                {/* % Demanda */}
                <div className="gr-stat-card">
                  <InfoButton
                    onClick={() => toggleTooltip('demanda')}
                    active={openTooltip === 'demanda'}
                    ariaLabel="Explicar Participação de Demanda"
                  />
                  <span className="gr-stat-label">Part. Demanda</span>
                  <strong className="gr-stat-value">{fmtPercent((meuResultado.percentualDemanda || 0) * 100)}</strong>
                </div>

                {/* Receita Bruta */}
                <div className="gr-stat-card">
                  <InfoButton
                    onClick={() => toggleTooltip('receita')}
                    active={openTooltip === 'receita'}
                    ariaLabel="Explicar Receita Bruta vs Final"
                  />
                  <span className="gr-stat-label">Receita Antes do Impacto</span>
                  <strong className="gr-stat-value">{fmt(meuResultado.receitaBruta)}</strong>
                </div>

                {/* Houve Penalidade */}
                <div className={`gr-stat-card ${houvePenalidade ? 'gr-stat-card-alert' : ''}`}>
                  <span className="gr-stat-label">Houve Penalidade?</span>
                  <strong className={`gr-stat-value ${classePenalidade}`}>
                    {textoPenalidade}
                  </strong>
                </div>

                {houvePenalidade && (
                  <div className="gr-stat-card gr-stat-card-alert">
                    <span className="gr-stat-label">Dias sem venda</span>
                    <strong className="gr-stat-value gr-stat-value-danger">{meuResultado.diasSemVenda}</strong>
                  </div>
                )}
                {houvePenalidade && (
                  <div className="gr-stat-card gr-stat-card-alert">
                    <span className="gr-stat-label">Valor da Penalidade</span>
                    <strong className="gr-stat-value gr-stat-value-danger">
                      {valorPenalidade.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </strong>
                  </div>
                )}
                {houvePenalidade && eventos && (
                  <div className="gr-stat-card gr-stat-card-alert">
                    <span className="gr-stat-label">Evento(s) Aplicado(s)</span>
                    <strong className="gr-stat-value gr-stat-value-danger">{eventos}</strong>
                  </div>
                )}

                <div className={`gr-stat-card ${houvePenalidade ? 'gr-stat-card-alert' : ''}`}>
                  <span className="gr-stat-label">Redução Aplicada</span>
                  <strong className={`gr-stat-value ${classePenalidade}`}>
                    {fmtPercent(meuResultado.percentualPenalidade)}
                  </strong>
                </div>

                <div className="gr-stat-card">
                  <span className="gr-stat-label">Receita Final</span>
                  <strong className="gr-stat-value">{fmt(meuResultado.receitaTotal)}</strong>
                </div>

                {/* Juros — Fase 2 */}
                {(meuResultado.jurosAplicado !== undefined && meuResultado.jurosAplicado !== null) && (
                  <div className={`gr-stat-card ${meuResultado.jurosAplicado > 0 ? 'gr-stat-card-alert' : ''}`}>
                    <InfoButton
                      onClick={() => toggleTooltip('juros')}
                      active={openTooltip === 'juros'}
                      ariaLabel="Explicar Juros Cheque Especial"
                    />
                    <span className="gr-stat-label">Juros (Cheque Especial)</span>
                    <strong className={`gr-stat-value ${meuResultado.jurosAplicado > 0 ? 'gr-stat-value-danger' : ''}`}>
                      {fmt(meuResultado.jurosAplicado)}
                    </strong>
                  </div>
                )}

                {/* Estoque Acumulado (Fase 1) */}
                {estoqueAcumulado !== null && (
                  <div className="gr-stat-card">
                    <InfoButton
                      onClick={() => toggleTooltip('estoqueAcumulado')}
                      active={openTooltip === 'estoqueAcumulado'}
                      ariaLabel="Explicar Estoque Acumulado"
                    />
                    <span className="gr-stat-label">Estoque Acumulado</span>
                    <strong className="gr-stat-value">{estoqueAcumulado.toLocaleString('pt-BR')} un.</strong>
                  </div>
                )}

              </div>

              {/* Tooltips fora do grid — largura total, igual ao FacilitadorDashboard */}
              <MetricTooltip isOpen={openTooltip === 'precoCesta'} onClose={() => setOpenTooltip(null)} {...tooltips.precoCesta} />
              <MetricTooltip isOpen={openTooltip === 'disponibilidade'} onClose={() => setOpenTooltip(null)} {...tooltips.disponibilidade} />
              <MetricTooltip isOpen={openTooltip === 'csat'} onClose={() => setOpenTooltip(null)} {...tooltips.csat} />
              <MetricTooltip isOpen={openTooltip === 'demanda'} onClose={() => setOpenTooltip(null)} {...tooltips.demanda} />
              <MetricTooltip isOpen={openTooltip === 'receita'} onClose={() => setOpenTooltip(null)} {...tooltips.receita} />
              {(meuResultado.jurosAplicado !== undefined && meuResultado.jurosAplicado !== null) && (
                <MetricTooltip isOpen={openTooltip === 'juros'} onClose={() => setOpenTooltip(null)} {...tooltips.juros} />
              )}
              {estoqueAcumulado !== null && (
                <MetricTooltip
                  isOpen={openTooltip === 'estoqueAcumulado'}
                  onClose={() => setOpenTooltip(null)}
                  metric="Estoque Acumulado"
                  formula="estoqueAtual = estoque anterior não vendido + compras desta rodada"
                  explanation="Total de produtos ainda em sua loja. Estoque não vendido carrega para a próxima rodada e pode estragar (aging + quebras)."
                  variables={[
                    { name: 'Perecíveis em Estoque', description: '', value: (meuResultado.estoqueAtualPereciveis || 0).toLocaleString('pt-BR') + ' un.' },
                    { name: 'Mercearia em Estoque', description: '', value: (meuResultado.estoqueAtualMercearia || 0).toLocaleString('pt-BR') + ' un.' },
                    { name: 'Eletro em Estoque', description: '', value: (meuResultado.estoqueAtualEletro || 0).toLocaleString('pt-BR') + ' un.' },
                    { name: 'Hipel em Estoque', description: '', value: (meuResultado.estoqueAtualHipel || 0).toLocaleString('pt-BR') + ' un.' },
                    { name: 'Total Acumulado', description: '', value: estoqueAcumulado.toLocaleString('pt-BR') + ' un.' },
                  ]}
                />
              )}
            </section>
          )}

          {/* Vendas detalhadas */}
          {meuResultado && (
            <section className="config-section">
              <h3 className="section-subtitle">Suas Vendas</h3>
              <div style={{ marginBottom: '25px' }}>
                <GraficoVendas data={meuResultado} />
              </div>
              <div className="dash-table">
                <div className="dash-table-header gr-vendas-header">
                  <span>Categoria</span>
                  <span className="dash-center">
                    Qtd Vendida
                    <InfoButton
                      inline
                      onClick={() => toggleTooltip('qtdVendida')}
                      active={openTooltip === 'qtdVendida'}
                      ariaLabel="Explicar Quantidade Vendida"
                    />
                  </span>
                  <span className="dash-center">Receita</span>
                  <span className="dash-center">
                    Deixou de Vender
                    <InfoButton
                      inline
                      onClick={() => toggleTooltip('deixouVender')}
                      active={openTooltip === 'deixouVender'}
                      ariaLabel="Explicar Deixou de Vender"
                    />
                  </span>
                </div>
                {[
                  { label: 'Pereciveis', qtd: meuResultado.qtdVendidaPereciveis, receita: meuResultado.receitaPereciveis, perdeu: meuResultado.deixouDeVenderPereciveis },
                  { label: 'Mercearia', qtd: meuResultado.qtdVendidaMercearia, receita: meuResultado.receitaMercearia, perdeu: meuResultado.deixouDeVenderMercearia },
                  { label: 'Eletro', qtd: meuResultado.qtdVendidaEletro, receita: meuResultado.receitaEletro, perdeu: meuResultado.deixouDeVenderEletro },
                  { label: 'Hipel', qtd: meuResultado.qtdVendidaHipel, receita: meuResultado.receitaHipel, perdeu: meuResultado.deixouDeVenderHipel },
                ].map((cat) => (
                  <div className="dash-table-row gr-vendas-row" key={cat.label}>
                    <span className="dash-empresa-name">{cat.label}</span>
                    <span className="dash-center">{(cat.qtd || 0).toLocaleString('pt-BR')}</span>
                    <span className="dash-center">{fmt(cat.receita)}</span>
                    <span className={`dash-center ${(cat.perdeu || 0) > 0 ? 'gr-perdeu' : ''}`}>
                      {(cat.perdeu || 0).toLocaleString('pt-BR')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Tooltips de Qtd Vendida e Deixou de Vender */}
              <MetricTooltip
                isOpen={openTooltip === 'qtdVendida'}
                onClose={() => setOpenTooltip(null)}
                {...tooltips.qtdVendida}
              />
              <MetricTooltip
                isOpen={openTooltip === 'deixouVender'}
                onClose={() => setOpenTooltip(null)}
                {...tooltips.deixouVender}
              />
            </section>
          )}

          {/* Histórico de Decisões (Fase 4) */}
          <section className="config-section">
            <h3 className="section-subtitle">Histórico de Rodadas</h3>
            <DecisionHistory rounds={historyRounds} />
          </section>

        </div>
      </div>

      {/* Modal de eventos da rodada (automático, uma vez por rodada) */}
      {showEventModal && (
        <EventModal
          events={eventosParaModal}
          companyName={
            resultado.find((e) => e.company?.id === companyId)?.company?.name ||
            localStorage.getItem('companyName') ||
            ''
          }
          round={roundAtual}
          isOpen={showEventModal}
          onClose={() => setShowEventModal(false)}
        />
      )}

      <Modal
        isOpen={loading}
        type="loading"
        title="Carregando Ranking"
        message="Aguarde enquanto os dados sao carregados..."
      />

      <Modal
        isOpen={showCalculandoModal}
        type="loading"
        title="Calculando próxima rodada"
        message="Aguarde enquanto os resultados são processados..."
      />

      <Modal
        isOpen={showRankingFinalModal}
        type="loading"
        title="Calculando ranking final"
        message="Processando os resultados finais. Você será redirecionado em instantes..."
      />

      <Modal
        isOpen={showNextRoundModal}
        type="confirm"
        title="Nova rodada abriu!"
        message={`Você ganhou uma chance de editar sua configuração. Redirecionando em ${nextRoundCountdown}s...`}
        confirmText="Ir agora"
        onConfirm={() => {
          setShowNextRoundModal(false);
          navigate(`/config/${companyId}`);
        }}
      />
    </div>
  );
};

export default GerenteRanking;
