import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../../index.css';
import '../../assets/css/RoomConfig.css';
import './FacilitadorDashboard.css';
import { io } from 'socket.io-client';
import Modal from '../../components/Modal';
import GraficoDemandaEmpresas from '../../components/GraficoDemandaEmpresas';
import { useToast } from '../../components/Toast.jsx';

const FacilitadorDashboard = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const socketRef = useRef(null);

  // ── States de dados ──
  const [configRoom, setConfigRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState(false);
  const [error, setError] = useState(null);
  const [roundAtual, setRoundAtual] = useState(1);
  const [resultado, setResultado] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [historicoDemanda, setHistoricoDemanda] = useState([]);

  // ── States de controle de UI ──
  const [showModalStart, setShowModalStart] = useState(false);
  const [showModalFinish, setShowModalFinish] = useState(false);
  const [isLoadingNextRound, setIsLoadingNextRound] = useState(false);
  const [isLoadingFinish, setIsLoadingFinish] = useState(false);
  const [configuredCompanyIds, setConfiguredCompanyIds] = useState(new Set());
  const [gameFinished, setGameFinished] = useState(false);

  const facilitadorToken = localStorage.getItem('facilitadorToken');
  const roundAtualRef = useRef(roundAtual);

  useEffect(() => {
    roundAtualRef.current = roundAtual;
  }, [roundAtual]);

  // ── Socket.IO — conexão e listeners ──
  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL);
    socketRef.current = socket;

    socket.emit('join_room', code);

    socket.on('connect', () => console.log('Socket conectado:', socket.id));
    socket.on('disconnect', () => console.log('Socket desconectado'));

    socket.on('companies_updated', (updatedCompanies) => {
      console.log('Empresas atualizadas:', updatedCompanies);
      setCompanies(updatedCompanies);
    });

    socket.on('company_config_saved', (data) => {
      setConfiguredCompanyIds(prev => new Set([...prev, data.companyId]));
    });

    socket.on('all_companies_confirmed', (data) => {
      showToast(`Todas as empresas confirmaram a rodada ${data.round}! Calculando ranking...`, 'success');
      carregarResultadoRodada(data.round);
    });

    // Listener para avanço de rodada
    socket.on('round_advanced', (data) => {
      console.log('Rodada avançada:', data);
      setRoundAtual(data.round);
      setConfiguredCompanyIds(new Set());
      showToast(`Rodada ${data.round} iniciada!`, 'success');

      // Recarrega resultados da nova rodada
      if (data.round <= data.totalRounds) {
        carregarResultadoRodada(data.round);
      }
    });

    // ── Re-sincronização após reconexão ──
    socket.on('connect', () => {
      console.log('Socket reconectado — sincronizando estado...')
      carregarResultadoRodada(roundAtualRef.current)
    })

    // Listener para fim de jogo
    socket.on('game_finished', (data) => {
      console.log('Jogo finalizado');
      setGameFinished(true);
      showToast('Jogo finalizado! Redirecionando para resultados...', 'success');

      // Salva dados no localStorage pra tela de resultado
      localStorage.setItem('resultadoFinal', JSON.stringify(data));
      localStorage.setItem('codeRoom', code);

      setTimeout(() => {
        navigate('/ranking-final');
      }, 2000);
    });

    return () => {
      socket.off('companies_updated');
      socket.off('company_config_saved');
      socket.off('all_companies_confirmed');
      socket.off('connect');
      socket.off('disconnect');
      socket.off('round_advanced');
      socket.off('game_finished');
      socket.disconnect();
    };
  }, [code]);

  // ── Buscar configuração da sala ──
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/rooms/${code}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Erro ao buscar dados da sala');
        }
        return response.json();
      })
      .then((data) => {
        setConfigRoom(data);
        if (data.companies) setCompanies(data.companies);
        if (data.currentRound) setRoundAtual(data.currentRound);
      })
      .catch((err) => {
        console.error(err);
        setError('Não foi possível carregar os dados da sala. Por favor, tente novamente mais tarde.');
      });
  }, [code]);

  // ── Função reutilizável: carrega resultado de uma rodada específica ──
  const carregarResultadoRodada = async (rodada) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/rooms/${code}/resultado/${rodada}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-facilitator-token': `${facilitadorToken}`,
          },
        }
      );
      if (!response.ok) {
        setWarning(true);
        setTimeout(() => setWarning(false), 4500);
        throw new Error('Erro ao buscar dados da sala');
      }
      const data = await response.json();
      setResultado(data);
    } catch (err) {
      console.error(err);
      setError('Não foi possível carregar os dados da sala.');
    } finally {
      setLoading(false);
    }
  };

  // ── Carrega resultado ao mudar de rodada ──
  useEffect(() => {
    carregarResultadoRodada(roundAtual);
  }, [code, roundAtual]);

  // ── Histórico de demanda para o gráfico de evolução ──
  useEffect(() => {
    const carregarHistorico = async () => {
      const novoHistorico = [];

      // Faz um loop da rodada 1 até a rodada atual
      for (let r = 1; r <= roundAtual; r++) {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_API_URL}/rooms/${code}/resultado/${r}`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'x-facilitator-token': `${facilitadorToken}`,
              },
            }
          );

          if (response.ok) {
            const data = await response.json();

            // Monta o objeto no formato que o Recharts entende
            const pontoRodada = { rodada: `Rodada ${r}` };

            data.forEach((empresa) => {
              const nome = empresa.company?.name || `Empresa ${empresa.id}`;
              const valorDemanda = (empresa.percentualDemanda || 0) * 100;
              pontoRodada[nome] = parseFloat(valorDemanda.toFixed(1));
            });

            novoHistorico.push(pontoRodada);
          }
        } catch (err) {
          console.error(`Erro ao buscar histórico da rodada ${r}:`, err);
        }
      }

      // Salva o histórico completo no state
      setHistoricoDemanda(novoHistorico);
    };

    if (code && facilitadorToken) {
      carregarHistorico();
    }
  }, [code, roundAtual, facilitadorToken]);

  // ── Handler: Próxima Rodada ──
  const handleNextRound = async () => {
    setIsLoadingNextRound(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/rooms/${code}/next-round`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-facilitator-token': `${facilitadorToken}`,
          },
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Erro ${response.status}`);
      }

      const data = await response.json();
      // roundAtual e configuredCompanyIds são atualizados pelo socket 'round_advanced'
      if (data.room?.currentRound >= data.room?.totalRounds) {
        showToast('Última rodada! Prepare-se para encerrar.', 'warning');
      }
    } catch (error) {
      console.error('Erro ao avançar rodada:', error);
      showToast(error.message || 'Erro ao avançar rodada', 'error');
    } finally {
      setIsLoadingNextRound(false);
      setShowModalStart(false);
    }
  };

  // ── Handler: Encerrar Jogo ──
  const handleFinishGame = async () => {
    setIsLoadingFinish(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/rooms/${code}/finish-game`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-facilitator-token': `${facilitadorToken}`,
          },
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Erro ${response.status}`);
      }

      const data = await response.json();
      setGameFinished(true);

      // Salva e redireciona
      localStorage.setItem('resultadoFinal', JSON.stringify(data));
      localStorage.setItem('codeRoom', code);
      navigate('/ranking-final');
    } catch (error) {
      console.error('Erro ao encerrar jogo:', error);
      showToast(error.message || 'Erro ao encerrar jogo', 'error');
    } finally {
      setIsLoadingFinish(false);
      setShowModalFinish(false);
    }
  };

  // ── Formatadores ──
  const fmt = (v) => {
    if (v === undefined || v === null || isNaN(v)) return 'R$ 0,00';
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const fmtPercent = (v) => {
    if (v === undefined || v === null || isNaN(v)) return '0%';
    return v.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 1 }) + '%';
  };

  return (
    <div className="config-container">
      {/* Sidebar */}
      <aside className="config-sidebar">
        <div className="sidebar-top">
          <h1 className="config-title">Dashboard<br />do Facilitador</h1>
          <span className="config-title-accent" />
          <p className="config-subtitle">
            Acompanhe os resultados e o ranking das empresas em tempo real.
          </p>
        </div>

        <div className="dash-info-card">
          <span className="dash-info-label">Sala</span>
          <strong className="dash-info-value">{code}</strong>
        </div>

        <div className="dash-info-card">
          <span className="dash-info-label">Empresas Conectadas</span>
          <strong className="dash-info-value">{resultado.length}</strong>
        </div>

        <div className="dash-info-card">
          <span className="dash-info-label">Rodada Atual</span>
          <strong className="dash-info-value">{roundAtual} / {configRoom?.totalRounds || '—'}</strong>
        </div>

        {/* Status de confirmação das empresas */}
        {companies.length > 0 && (
          <div className="dash-info-card dash-status-card">
            <span className="dash-info-label">
              Status das Empresas ({configuredCompanyIds.size}/{companies.length})
            </span>
            <div className="company-status-list">
              {companies.map((company) => {
                const confirmou = configuredCompanyIds.has(company.id);
                return (
                  <div key={company.id} className="company-status-item">
                    <span className={`status-dot-config ${confirmou ? 'ok' : 'pending'}`} />
                    <span className="status-name">{company.name}</span>
                    <span className="status-badge">
                      {confirmou ? '✓ Enviou' : '⏳ Pendente'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </aside>

      {/* Painel principal */}
      <div className="config-main">
        <div className="config-content">
          {/* SEÇÃO 1: Resultados das Empresas */}
          <section className="config-section">
            <h3 className="section-subtitle">Resultados das Empresas</h3>
            <GraficoDemandaEmpresas historicoDados={historicoDemanda} />
            <div className="dash-table">
              <div className="dash-table-header">
                <span>Empresa</span>
                <span className="dash-center">Preço Médio<br />da Cesta</span>
                <span className="dash-center">Disponibilidade</span>
                <span className="dash-center">CSAT</span>
                <span className="dash-center">% Part. Demanda<br />de Vendas</span>
              </div>
              {resultado.length === 0 && !loading && (
                <div className="dash-table-empty">Nenhuma empresa encontrada.</div>
              )}
              {resultado.map((empresa, index) => (
                <div className="dash-table-row" key={empresa.id || empresa.name || index}>
                  <span className="dash-empresa-name">{empresa.company.name}</span>
                  <span className="dash-center">{fmt(empresa.precoMedioCesta)}</span>
                  <span className="dash-center">{fmtPercent(empresa.disponibilidade)}</span>
                  <span className="dash-center">{fmtPercent(empresa.csat)}</span>
                  <span className="dash-center">{fmtPercent(empresa.percentualDemanda * 100)}</span>
                </div>
              ))}
            </div>
          </section>

          {/* SEÇÃO 2: Ranking */}
          <section className="config-section">
            <h3 className="section-subtitle">Ranking</h3>
            <div className="dash-table">
              <div className="dash-table-header dash-ranking-header">
                <span>Colocação</span>
                <span>Empresa</span>
                <span>Gerente</span>
                <span className="dash-center">Total de Vendas</span>
              </div>
              {resultado.map((empresa, index) => {
                return (
                  <div className={`dash-table-row dash-ranking-row ${index === 0 ? 'dash-row-first' : ''}`} key={empresa.id || empresa.name || index}>
                    <span className="dash-position">{index + 1}°</span>
                    <span className="dash-empresa-name">{empresa.company.name || `Empresa ${index + 1}`}</span>
                    <span>{empresa.company.managerName || '—'}</span>
                    <span className="dash-center dash-total-score">
                      <strong>{fmt(empresa.receitaTotal)}</strong>
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* SEÇÃO 3: Vendas por Rodada */}
          <section className="config-section">
            <h3 className="section-subtitle">Demanda de vendas da rodada</h3>

            {/* Demanda do round */}
            <div className="dash-table" style={{ marginBottom: 20 }}>
              <div className="dash-table-header dash-demanda-header">
                <span>Rodada</span>
                <span className="dash-center">Perecíveis</span>
                <span className="dash-center">Mercearia</span>
                <span className="dash-center">Eletro</span>
                <span className="dash-center">Hipel</span>
                <span className="dash-center">Total</span>
              </div>
              {configRoom ? (
                <div className="dash-table-row dash-demanda-row">
                  <span className="dash-empresa-name">Rodada {roundAtual} - {configRoom.demandaEstqRounds?.[roundAtual - 1] || 0}%</span>
                  <span className="dash-center">
                    {(
                      (configRoom.estoqueDisponivelPereciveis || 0) *
                      ((configRoom.demandaEstqRounds?.[roundAtual - 1] || 0) / 100)
                    ).toLocaleString('pt-BR')}
                  </span>
                  <span className="dash-center">
                    {(
                      (configRoom.estoqueDisponivelMercearia || 0) *
                      ((configRoom.demandaEstqRounds?.[roundAtual - 1] || 0) / 100)
                    ).toLocaleString('pt-BR')}
                  </span>
                  <span className="dash-center">
                    {(
                      (configRoom.estoqueDisponivelEletro || 0) *
                      ((configRoom.demandaEstqRounds?.[roundAtual - 1] || 0) / 100)
                    ).toLocaleString('pt-BR')}
                  </span>
                  <span className="dash-center">
                    {(
                      (configRoom.estoqueDisponivelHipel || 0) *
                      ((configRoom.demandaEstqRounds?.[roundAtual - 1] || 0) / 100)
                    ).toLocaleString('pt-BR')}
                  </span>
                  <span className="dash-center">
                    <strong>
                      {(
                        ((configRoom.estoqueDisponivelPereciveis || 0) * ((configRoom.demandaEstqRounds?.[roundAtual - 1] || 0) / 100)) +
                        ((configRoom.estoqueDisponivelMercearia || 0) * ((configRoom.demandaEstqRounds?.[roundAtual - 1] || 0) / 100)) +
                        ((configRoom.estoqueDisponivelEletro || 0) * ((configRoom.demandaEstqRounds?.[roundAtual - 1] || 0) / 100)) +
                        ((configRoom.estoqueDisponivelHipel || 0) * ((configRoom.demandaEstqRounds?.[roundAtual - 1] || 0) / 100))
                      ).toLocaleString('pt-BR')}
                    </strong>
                  </span>
                </div>
              ) : (
                <div className="dash-table-empty">Carregando demanda...</div>
              )}
            </div>
          </section>

          {/* Vendas por empresa */}
          <section className="config-section">
            <h3 className="section-subtitle">Vendas por Empresa</h3>
            <div className="dash-table">
              <div className="dash-table-header dash-vendas-header">
                <span>Empresa</span>
                <span className="dash-center">Perecíveis</span>
                <span className="dash-center">Mercearia</span>
                <span className="dash-center">Eletro</span>
                <span className="dash-center">Hipel</span>
                <span className="dash-center">Total estoque vendido</span>
              </div>
              {resultado.map((empresa, index) => {
                return (
                  <div className="dash-table-row dash-vendas-row" key={empresa.id || empresa.company.name || index}>
                    <span className="dash-empresa-name">{empresa.company.name || `Empresa ${index + 1}`}</span>
                    <span className="dash-center">{(empresa.qtdVendidaPereciveis || 0).toLocaleString('pt-BR')}</span>
                    <span className="dash-center">{(empresa.qtdVendidaMercearia || 0).toLocaleString('pt-BR')}</span>
                    <span className="dash-center">{(empresa.qtdVendidaEletro || 0).toLocaleString('pt-BR')}</span>
                    <span className="dash-center">{(empresa.qtdVendidaHipel || 0).toLocaleString('pt-BR')}</span>
                    <span className="dash-center dash-total-score">
                      <strong>{(empresa.qtdVendidaPereciveis + empresa.qtdVendidaMercearia + empresa.qtdVendidaHipel + empresa.qtdVendidaEletro)}</strong>
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="config-section">
            <h3 className="section-subtitle">Receita detalhada por empresa</h3>
            <div className="dash-table">
              <div className="dash-table-header dash-vendas-header">
                <span>Empresa</span>
                <span className="dash-center">Perecíveis</span>
                <span className="dash-center">Mercearia</span>
                <span className="dash-center">Eletro</span>
                <span className="dash-center">Hipel</span>
                <span className="dash-center">Total estoque vendido</span>
              </div>
              {resultado.map((empresa, index) => {
                return (
                  <div className="dash-table-row dash-vendas-row" key={empresa.id || empresa.company.name || index}>
                    <span className="dash-empresa-name">{empresa.company.name || `Empresa ${index + 1}`}</span>
                    <span className="dash-center">{fmt(empresa.receitaPereciveis || 0)}</span>
                    <span className="dash-center">{fmt(empresa.receitaMercearia || 0)}</span>
                    <span className="dash-center">{fmt(empresa.receitaEletro || 0)}</span>
                    <span className="dash-center">{fmt(empresa.receitaHipel || 0)}</span>
                    <span className="dash-center dash-total-score">
                      <strong>{fmt(empresa.receitaTotal)}</strong>
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Botões de Ação do Facilitador ── */}
          <div className="waiting-actions dash-actions">
            
                {/* Botão Encerrar Jogo — visível apenas na última rodada */}
                {roundAtual === configRoom?.totalRounds && (
                  <button
                    className="btn-finish"
                    onClick={() => setShowModalFinish(true)}
                    disabled={isLoadingFinish || isLoadingNextRound || gameFinished}
                  >
                    {isLoadingFinish ? 'Encerrando...' : 'Encerrar Jogo'}
                  </button>
                )}

                {/* Botão Próxima Rodada */}
                {roundAtual < configRoom?.totalRounds && (
                  <button
                    className="btn-start"
                    onClick={() => setShowModalStart(true)}
                    disabled={isLoadingNextRound || isLoadingFinish || gameFinished}
                  >
                    {isLoadingNextRound ? 'Avançando...' : 'Próxima Rodada'}
                  </button>
                )}
             
          </div>
        </div>
      </div>

      {/* Modal de loading ao carregar dados */}
      <Modal
        isOpen={loading}
        type="loading"
        title="Carregando Dashboard"
        message="Aguarde enquanto os dados são carregados..."
      />

      {/* Modal de aviso de erro */}
      <Modal
        isOpen={warning}
        type="warning"
        title="Erro ao Carregar Dados"
        message="Não foi possível carregar os dados da sala. Por favor, tente novamente mais tarde."
      />

      {/* Modal confirmar Próxima Rodada */}
      <Modal
        isOpen={showModalStart}
        type={isLoadingNextRound ? 'loading' : 'confirm'}
        title={isLoadingNextRound ? 'Avançando rodada...' : 'Confirmar Avanço'}
        message={
          roundAtual >= (configRoom?.totalRounds || 4)
            ? 'Esta é a última rodada. Ao avançar, o jogo será encerrado. Deseja continuar?'
            : `Avançar para a rodada ${roundAtual + 1}? Certifique-se de que todos revisaram os resultados.`
        }
        confirmText="Sim, avançar"
        cancelText="Cancelar"
        onConfirm={handleNextRound}
        onCancel={() => !isLoadingNextRound && setShowModalStart(false)}
      />

      {/* Modal confirmar Encerrar Jogo */}
      <Modal
        isOpen={showModalFinish}
        type={isLoadingFinish ? 'loading' : 'warning'}
        title={isLoadingFinish ? 'Finalizando jogo...' : 'Encerrar Jogo'}
        message="Tem certeza que deseja encerrar o jogo? Esta ação calculará o ranking final e não poderá ser desfeita."
        confirmText="Sim, encerrar"
        cancelText="Cancelar"
        onConfirm={handleFinishGame}
        onCancel={() => !isLoadingFinish && setShowModalFinish(false)}
      />
    </div>
  );
};

export default FacilitadorDashboard;
