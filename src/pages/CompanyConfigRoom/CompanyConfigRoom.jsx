import Modal from '../../components/Modal';
import localStorage from '../../services/storage';
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getCompanySettings, saveCompanySettings, getCompanyLatestConfig } from '../../services/CompanyService';
import "../../index.css";
import '../../assets/css/RoomConfig.css';
import './CompanyConfigRoom.css';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import InfoButton from '../../components/tooltips/InfoButton';
import MetricTooltip from '../../components/tooltips/MetricTooltip';
import ProfessorFeed from '../../components/tooltips/ProfessorFeed';

const CARGOS = ['Serviços', 'Abastecimento', 'Comercial', 'Operacional', 'Gerente'];

const CAPEX_ITEMS = [
  { key: 'seguranca', field: 'capexSegurancaValor', label: 'Segurança', risk: 'Furtos e perdas sem sistema de segurança' },
  { key: 'balancaFreezer', field: 'capexBalancaFreezerValor', label: 'Balança/Freezer', risk: 'Perda de perecíveis e impossibilidade de pesar produtos', costFn: (room) => (room.capexBalancaValor || 0) + (room.capexFreezerValor || 0) },
  { key: 'redes', field: 'capexRedesValor', label: 'Redes', risk: 'Falha de conectividade e sistemas offline' },
  { key: 'site', field: 'capexSiteValor', label: 'Site', risk: 'Sem presença digital e vendas online' },
  { key: 'selfCheckout', field: 'capexSelfCheckoutValor', label: 'Self Checkout', risk: 'Filas maiores e custo operacional elevado' },
  { key: 'melhoriaContinua', field: 'capexMelhoriaContinuaValor', label: 'Melhoria Contínua', risk: 'Processos ineficientes sem otimização' },
];

const CompanyConfigRoom = () => {
  const code = localStorage.getItem('codeRoom');
  const navigate = useNavigate();
  const [configRoom, setConfigRoom] = useState({});
  const [warning, setWarning] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [socket, setSocket] = useState(null);

  // Estado do Timer de Rodada
  const [timerState, setTimerState] = useState({ timeLeft: 1200, isActive: false, currentRound: 1, totalRounds: 4 });

  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_API_URL);
    setSocket(newSocket);

    newSocket.emit('join_room', code);

    newSocket.on('all_companies_confirmed', (data) => {
      console.log('Todas as empresas confirmaram!', data);
      localStorage.setItem('rankingRound', data.round);
      setTimeout(() => {
        navigate(`/ranking`);
      }, 2000);
    });

    newSocket.on('server:timer-update', (data) => {
      setTimerState(data);
    });

    newSocket.on('round_advanced', (data) => {
      console.log('Rodada avançada!', data);
      window.location.reload();
    });

    newSocket.on('game_finished', (data) => {
      localStorage.setItem('resultadoFinal', JSON.stringify(data));
      localStorage.setItem('codeRoom', code);
      navigate('/ranking-final');
    });

    return () => {
      newSocket.disconnect();
    };
  }, [navigate, code]);

  const { companyId } = useParams();

  const [params, setParams] = useState({
    saldoInicial: 0, juros: 12, custoPorOperador: 3000,
    custoUntPereciveis: 0, custoUntMercearia: 0, custoUntEletro: 0, custoUntHipel: 0,
    capexItems: [],
    estoqueAtualPereciveis: 0,
    estoqueAtualMercearia: 0,
    estoqueAtualEletro: 0,
    estoqueAtualHipel: 0,
    estoqueJaCompradoPereciveis: 0,
    estoqueJaCompradoMercearia: 0,
    estoqueJaCompradoEletro: 0,
    estoqueJaCompradoHipel: 0,
  });

  const [cargos, setCargos] = useState({
    servicos: '', abastecimento: '', comercial: '', operacional: '', gerente: '',
  });

  const [capexSelected, setCapexSelected] = useState([]);
  const [capexJaComprado, setCapexJaComprado] = useState({});

  const [formData, setFormData] = useState({
    margemPereciveis: 15,
    margemMercearia: 10,
    margemEletro: 25,
    margemHipel: 18,
    estoquePereciveis: 0,
    estoqueMercearia: 0,
    estoqueEletro: 0,
    estoqueHipel: 0,
    estoqueDisponivelPereciveis: 1000,
    estoqueDisponivelMercearia: 1000,
    estoqueDisponivelEletro: 1000,
    estoqueDisponivelHipel: 1000,
    disponibilidadePereciveis: 100,
    disponibilidadeMercearia: 100,
    disponibilidadeEletro: 100,
    disponibilidadeHipel: 100,
    operadoresVenda: 0,
    operadoresServico: 0,
    capexSegurancaValor: false,
    capexBalancaFreezerValor: false,
    capexRedesValor: false,
    capexSiteValor: false,
    capexSelfCheckoutValor: false,
    capexMelhoriaContinuaValor: false,
  });
  const handleChange = (e) => {
  const { name, value, type, checked } = e.target;
  if (name.startsWith('estoque') && !name.startsWith('estoqueDisponivel')) {
    const catKey = name.replace('estoque', '');
    const disponivelTotal = formData[`estoqueDisponivel${catKey}`];
    const jaComprado = params[`estoqueJaComprado${catKey}`] || 0;
    const disponivelRestante = Math.max(0, disponivelTotal - jaComprado);
    const numValue = Number(value) || 0;

    if (numValue > disponivelRestante) {
      console.warn(`⚠️ Quantidade não pode exceder o disponível restante (${disponivelRestante} un.)`);
      return;
    }
  }
  setFormData(prev => ({
    ...prev,
    [name]: type === 'checkbox' ? checked : (Number(value) || 0)
  }));
};

const toggleCapex = (key) => {
  setFormData(prev => ({
    ...prev,
    [key]: !prev[key]
  }));
};

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // ── Tooltip ⓘ em Estoque ──
  const [showEstoqueTooltip, setShowEstoqueTooltip] = useState(false);

  // ── Feed do Professor ──
  const [professorTrigger, setProfessorTrigger] = useState(null);
  const [savedDecisions, setSavedDecisions] = useState({});
  //pegar dados da sala
  useEffect(() => {
    try{
      fetch (`${import.meta.env.VITE_API_URL}/rooms/${code}`, {
        method: 'GET',
      })
      .then(res => res.json())
      .then(data => {
        setConfigRoom(data);
        console.log('Configurações da sala:', data);
      });
    } catch (error) {
      console.error('Erro ao buscar configurações da sala:', error);
    }
  }, [code]);
  useEffect(() => {
    if (Object.keys(configRoom).length > 0) {
      setFormData(prev => ({
        ...prev,
        estoqueDisponivelPereciveis: configRoom.estoqueDisponivelPereciveis ?? prev.estoqueDisponivelPereciveis,
        estoqueDisponivelMercearia:  configRoom.estoqueDisponivelMercearia  ?? prev.estoqueDisponivelMercearia,
        estoqueDisponivelEletro:     configRoom.estoqueDisponivelEletro     ?? prev.estoqueDisponivelEletro,
        estoqueDisponivelHipel:      configRoom.estoqueDisponivelHipel      ?? prev.estoqueDisponivelHipel,
      }));
    }
  }, [configRoom]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [settings, lastConfig] = await Promise.all([
          getCompanySettings(companyId),
          getCompanyLatestConfig(companyId),
        ]);
        setParams(settings);
        if (lastConfig) {
          // Registra quais capex já foram comprados na rodada anterior
          setCapexJaComprado({
            capexSegurancaValor: !!lastConfig.capexSeguranca,
            capexBalancaFreezerValor: !!lastConfig.capexBalanca,
            capexRedesValor: !!lastConfig.capexRedes,
            capexSiteValor: !!lastConfig.capexSite,
            capexSelfCheckoutValor: !!lastConfig.capexSelfCheckout,
            capexMelhoriaContinuaValor: !!lastConfig.capexMelhoriaContinua,
          });
          setFormData(prev => ({
            ...prev,
            // Estoque zerado — nova compra a cada rodada
            estoquePereciveis: 0,
            estoqueMercearia: 0,
            estoqueEletro: 0,
            estoqueHipel: 0,
            // Estratégias mantidas
            margemPereciveis: lastConfig.margemPereciveis ?? prev.margemPereciveis,
            margemMercearia: lastConfig.margemMercearia ?? prev.margemMercearia,
            margemEletro: lastConfig.margemEletro ?? prev.margemEletro,
            margemHipel: lastConfig.margemHipel ?? prev.margemHipel,
            operadoresVenda: lastConfig.operadoresVenda ?? prev.operadoresVenda,
            operadoresServico: lastConfig.operadoresServico ?? prev.operadoresServico,
            // Capex zerado no form — já comprado fica só no capexJaComprado
            capexSegurancaValor: false,
            capexBalancaFreezerValor: false,
            capexRedesValor: false,
            capexSiteValor: false,
            capexSelfCheckoutValor: false,
            capexMelhoriaContinuaValor: false,
          }));
        }
      } catch (err) {
        console.error(err);
        setError(err.message || 'Erro ao carregar dados da empresa');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [companyId]);

  // Cálculos dinâmicos
  const totalCapex = CAPEX_ITEMS.reduce((sum, item) => {
    const isSelected = formData[item.field];
    const jaComprado = capexJaComprado[item.field];
    const itemCost = item.costFn ? item.costFn(configRoom) : (configRoom[item.field] || 0);
    const cost = (isSelected && !jaComprado) ? itemCost : 0;
    return sum + cost;
  }, 0);
useEffect(() => {
  console.log('form:', formData);
}, [formData]);

  const custoEstoque =
    formData.estoquePereciveis * configRoom.custoUntPereciveis +
    formData.estoqueMercearia * configRoom.custoUntMercearia +
    formData.estoqueEletro * configRoom.custoUntEletro +
    formData.estoqueHipel * configRoom.custoUntHipel;

  const custoPessoal = (formData.operadoresVenda + formData.operadoresServico) * params.custoPorOperador;
  const totalGastos = totalCapex + custoEstoque + custoPessoal;
  const saldoRestante = params.saldoInicial - totalGastos;
  const excedente = Math.max(0, -saldoRestante);
  const jurosPrevistos = excedente * (params.juros / 100);

  const precoCesta =
    configRoom.custoUntPereciveis * (1 + formData.margemPereciveis / 100) +
    configRoom.custoUntMercearia * (1 + formData.margemMercearia / 100) +
    configRoom.custoUntEletro * (1 + formData.margemEletro / 100) +
    configRoom.custoUntHipel * (1 + formData.margemHipel / 100);

  // Handlers

  const handleCargoChange = (e) => {
    const { name, value } = e.target;
    setCargos(prev => ({ ...prev, [name]: value }));
  };

 
  useEffect(() => {
    console.log("capex selecionado:", capexSelected);
  }, [capexSelected]);

  const mapCapexFields = (data) => ({
    ...data,
    capexSeguranca: data.capexSegurancaValor,
    capexBalanca: data.capexBalancaFreezerValor,
    capexRedes: data.capexRedesValor,
    capexSite: data.capexSiteValor,
    capexSelfCheckout: data.capexSelfCheckoutValor,
    capexMelhoriaContinua: data.capexMelhoriaContinuaValor,
  });

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = mapCapexFields(formData);
      const result = await saveCompanySettings(companyId, payload);
      let msg = result.message || 'Estratégia confirmada com sucesso!';
      if (result.jurosAplicado > 0) {
        msg += `\n⚠️ Juros aplicados: R$ ${result.jurosAplicado.toLocaleString('pt-BR')}`;
      }
      setConfirmMessage(msg);
      setShowConfirmModal(true);

      // ── Salvar snapshot para histórico de rodadas (localStorage) ──
      const round = parseInt(localStorage.getItem('rankingRound') || '1');
      const capexNovosLabels = CAPEX_ITEMS
        .filter(item => formData[item.field] && !capexJaComprado[item.field])
        .map(item => item.label)
        .join(', ');
      const snapshot = {
        round,
        precoCesta,
        capexNovos: capexNovosLabels || 'Nenhum',
        // campos booleanos usados pelo GerenteRanking para verificar proteção
        capexSeguranca: payload.capexSeguranca || capexJaComprado.capexSegurancaValor || false,
        capexBalanca: payload.capexBalanca || capexJaComprado.capexBalancaFreezerValor || false,
        capexRedes: payload.capexRedes || capexJaComprado.capexRedesValor || false,
        capexSite: payload.capexSite || capexJaComprado.capexSiteValor || false,
        capexSelfCheckout: payload.capexSelfCheckout || capexJaComprado.capexSelfCheckoutValor || false,
        capexMelhoriaContinua: payload.capexMelhoriaContinua || capexJaComprado.capexMelhoriaContinuaValor || false,
      };
      localStorage.setItem(`cencosud_config_r${round}`, JSON.stringify(snapshot));

      // ── Feed do Professor (disparar toasts após confirmar) ──
      setSavedDecisions({ ...formData, _excedente: excedente });
      setProfessorTrigger(Date.now());
    } catch (err) {
      console.error(err);
      setError(err.message || 'Erro ao salvar configurações');
      setWarning(true);
      setTimeout(() => setWarning(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (seconds) => {
    if (seconds === undefined || seconds === null || isNaN(seconds)) return '00:00';
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const getTimerClass = () => {
    if (!timerState.isActive) return 'timer-paused';
    if (timerState.timeLeft <= 30) return 'timer-red timer-flash';
    if (timerState.timeLeft <= 120) return 'timer-red';
    if (timerState.timeLeft <= 300) return 'timer-yellow';
    return 'timer-green';
  };


  const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const fmtPercent = (value) => {
  return value.toLocaleString('pt-BR', { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 2 
  });
};
  return (
    <div className="config-container">
      {/* Feed do Professor (sem UI) */}
      <ProfessorFeed
        context="config"
        decisions={savedDecisions}
        params={params}
        trigger={professorTrigger}
      />

      {/* Sidebar */}
      <aside className="config-sidebar config-sidebar-static">
        <div className="sidebar-top">
          <h1 className="config-title">Painel de Estratégia</h1>
          <span className="config-title-accent" />
          <p className="config-subtitle">
            Defina cargos, investimentos, estoque, preços e pessoal para esta rodada.
          </p>
        </div>

        <div className="sidebar-cards-group">
          <div className={`balance-card ${saldoRestante < 0 ? 'insufficient-funds' : ''}`}>
            <span className="balance-label">Saldo Disponível</span>
            <strong className="balance-value">{fmt(saldoRestante)}</strong>
            <span className="balance-hint">Gasto: {fmt(totalGastos)}</span>
            {excedente > 0 && (
              <div className="juros-alert">
                ⚠️ Excedente: {fmt(excedente)} → Juros de {params.juros}%: {fmt(jurosPrevistos)}
              </div>
            )}
          </div>

          <div className="cesta-resumo">
            <span className="balance-label">Preço Final da Cesta</span>
            <strong className="balance-value">{fmt(precoCesta)}</strong>
          </div>
        </div>
      </aside>

      {/* Painel principal */}
      <div className="config-main">
        {/* Timer de Rodada */}
        <div className="manager-timer-header">
          <div className="manager-timer-details">
            <span className="manager-timer-label">Tempo Restante da Rodada</span>
            <div className="manager-timer-clock-row">
              <strong className={`manager-timer-clock ${getTimerClass()}`}>
                {formatTime(timerState.timeLeft)}
              </strong>
              {!timerState.isActive && <span className="manager-timer-paused-label">PAUSADO</span>}
            </div>
          </div>
          <div className="manager-round-details">
            <span>Rodada {timerState.currentRound} de {timerState.totalRounds}</span>
          </div>
        </div>

        {loading && <div className="status-message loading">Carregando dados...</div>}
        {error && <div className="status-message error">Erro: {error}</div>}

        <div className="config-content">
          {/* SEÇÃO 1: Gestão de Pessoas */}
          <section className="config-section">
            <h3 className="section-subtitle" style={{ marginTop: 28 }}>Dimensionamento de Pessoal</h3>
            <p className="section-hint">Custo: {fmt(params.custoPorOperador)} por operador</p>
            <div className="input-grid">
              <div className="input-group">
                <label htmlFor="operadoresVenda">Operadores de Caixa</label>
                <input id="operadoresVenda" name="operadoresVenda" type="number" min="0"
                  value={formData.operadoresVenda} onChange={handleChange} />
              </div>
              <div className="input-group">
                <label htmlFor="operadoresServico">Operadores de Serviço</label>
                <input id="operadoresServico" name="operadoresServico" type="number" min="0"
                  value={formData.operadoresServico} onChange={handleChange} />
              </div>
              <div className="input-group readonly-group">
                <label>Custo Total Pessoal</label>
                <span className="computed-value">{fmt(custoPessoal)}</span>
              </div>
            </div>
          </section>

          {/* SEÇÃO 2: CAPEX */}
                    {/* SEÇÃO 2: CAPEX */}
          <section className="config-section">
            <h3 className="section-subtitle">Investimentos (CAPEX)</h3>
            <p className="section-hint">Selecione os itens de infraestrutura. Itens não comprados podem gerar incidentes.</p>
            <div className="capex-grid">
              {CAPEX_ITEMS.map(item => {
                const jaComprado = capexJaComprado[item.field];
                const isSelected = formData[item.field];
                return (
                  <div
                    key={item.key}
                    className={`capex-card ${isSelected ? 'selected' : ''} ${jaComprado ? 'capex-ja-comprado' : ''}`}
                    onClick={() => !jaComprado && toggleCapex(item.field)}
                  >
                    <div className="capex-card-header">
                      <span className="capex-check">{jaComprado ? '✓' : isSelected ? '✓' : ''}</span>
                      <strong className="capex-label">{item.label}</strong>
                      <span className="capex-cost">
                        {jaComprado ? 'Já adquirido' : fmt(item.costFn ? item.costFn(configRoom) : (configRoom[item.field] || 0))}
                      </span>
                    </div>
                    <p className="capex-risk">⚠ Risco: {item.risk}</p>
                  </div>
                );
              })}

            </div>
            <div className="capex-total">
              Total CAPEX: <strong>{fmt(totalCapex)}</strong>
            </div>
          </section>
          {/* SEÇÃO 3: Estoque + Margens */}
          <section className="config-section">
            <h3 className="section-subtitle">Abastecimento e Comercial</h3>
            <div className="stock-table-wrapper">
            <div className="stock-table">
              <div className="stock-header">
                <span>Categoria</span>
                <span className="stock-center">Custo <br /> Unitário</span>
                <span className="stock-center" style={{ position: 'relative' }}>
                  Em <br /> Estoque
                  <InfoButton
                    inline
                    onClick={() => setShowEstoqueTooltip(p => !p)}
                    active={showEstoqueTooltip}
                    ariaLabel="Explicar estoque acumulado"
                  />
                </span>
                <span className="stock-center">Disponível</span>
                <span className="stock-center">Qtd. <br /> Comprar</span>
                <span className="stock-center">Disponibilidade <br /> (%)</span>
                <span className="stock-center">Custo <br /> Total</span>
                <span className="stock-center">Imposto <br /> (%)</span>
                <span className="stock-center">Margem <br /> (%)</span>
                <span className="stock-center">Preço <br /> Venda</span>
              </div>
              {/* Tooltip de Estoque Acumulado */}
              {showEstoqueTooltip && (
                <MetricTooltip
                  isOpen={showEstoqueTooltip}
                  onClose={() => setShowEstoqueTooltip(false)}
                  metric="Em Estoque (acumulado)"
                  formula="estoqueAtual = estoque não vendido da rodada anterior + compras novas"
                  explanation="Estoque acumulado de rodadas anteriores. Produtos não vendidos carregam para a próxima rodada e podem gerar custos de aging e quebras."
                  variables={[
                    { name: 'Perecíveis em Estoque', description: 'acumulado', value: `${(params.estoqueAtualPereciveis || 0).toLocaleString('pt-BR')} un.` },
                    { name: 'Mercearia em Estoque', description: 'acumulado', value: `${(params.estoqueAtualMercearia || 0).toLocaleString('pt-BR')} un.` },
                    { name: 'Eletro em Estoque', description: 'acumulado', value: `${(params.estoqueAtualEletro || 0).toLocaleString('pt-BR')} un.` },
                    { name: 'Hipel em Estoque', description: 'acumulado', value: `${(params.estoqueAtualHipel || 0).toLocaleString('pt-BR')} un.` },
                  ]}
                />
              )}
              {[
                { key: 'Pereciveis', label: 'Perecíveis', custo: configRoom.custoUntPereciveis || 0, imposto: configRoom.impostoPereciveis || 0 },
                { key: 'Mercearia', label: 'Mercearia', custo: configRoom.custoUntMercearia || 0, imposto: configRoom.impostoMercearia || 0 },
                { key: 'Eletro', label: 'Eletro', custo: configRoom.custoUntEletro || 0, imposto: configRoom.impostoEletro || 0 },
                { key: 'Hipel', label: 'Hipel', custo: configRoom.custoUntHipel || 0, imposto: configRoom.impostoHipel || 0 },
              ].map(cat => {
                const qtd = formData[`estoque${cat.key}`];
                const margem = formData[`margem${cat.key}`];
                const disponivelTotal = formData[`estoqueDisponivel${cat.key}`];
                const jaComprado = params[`estoqueJaComprado${cat.key}`] || 0;
                const disponivelRestante = Math.max(0, disponivelTotal - jaComprado);
                const emEstoque = params[`estoqueAtual${cat.key}`] || 0;
                const disponibilidade = disponivelTotal > 0 ? (qtd / disponivelTotal) * 100 : 0;
                const custoTotal = qtd * cat.custo;
                const precoVenda = cat.custo * (1 + margem / 100);
                return (
                  <div className="stock-row" key={cat.key}>
                    <span className="stock-cat">{cat.label}</span>
                    <span className="stock-center">{fmt(cat.custo)}</span>
                    <span className="stock-center">{emEstoque.toLocaleString('pt-BR')} un.</span>
                    <span className={`stock-center ${disponivelRestante === 0 ? 'stock-esgotado' : ''}`}>
                      {disponivelRestante.toLocaleString('pt-BR')} un.
                    </span>
                    <input
                      name={`estoque${cat.key}`}
                      type="text"
                      min="0"
                      max={disponivelRestante}
                      value={qtd}
                      onChange={handleChange}
                      className="stock-input"
                    />
                    <span className="stock-center stock-disponibilidade">
                      {fmtPercent(disponibilidade)}%
                    </span>
                    
                    <span className="stock-center">{fmt(custoTotal)}</span>
                    <span className="stock-center">{cat.imposto}%</span>
                    <input 
                      name={`margem${cat.key}`} 
                      type="text" 
                      min="0"
                      value={margem} 
                      onChange={handleChange} 
                      className="stock-input"
                    />
                    <span className="stock-price stock-center">{fmt(precoVenda)}</span>
                    
                    
                  </div>
                );
              })}
              <div className="stock-row stock-summary">
                <span className="stock-cat">Total</span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span className="stock-center"><strong>{fmt(custoEstoque)}</strong></span>
                <span></span>
                <span></span>
                <span className="stock-price stock-center"><strong>{fmt(precoCesta)}</strong></span>
              </div>
            </div>
            </div>
          </section>

          <button className="btn-confirm" onClick={handleSave} disabled={saving}>
            {saving ? 'SALVANDO...' : 'CONFIRMAR ESTRATÉGIA'}
          </button>
        </div>
      </div>
      <Modal
        isOpen={showConfirmModal}
        type="confirm"
        title="Estratégia Confirmada"
        message={confirmMessage}
      />
      <Modal
        isOpen={warning}
        type="warning"
        title="Erro ao salvar Dados"
        message="Erro ao salvar os dados"
      />
    </div>
  );
};

export default CompanyConfigRoom;