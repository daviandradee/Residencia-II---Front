import React, { useState, useCallback } from 'react';
import { data, useNavigate } from 'react-router-dom';
import "../../index.css";
import './ConfigureRoom.css';
import { createRoom } from '../../services/createRoomService';
import localStorage from '../../services/storage';
import Modal from '../../components/Modal';
import ErrorModal from '../../components/ErroModal';
import { useToast } from '../../components/Toast.jsx';


const ConfiguracaoSala = () => {
  const { showToast } = useToast();
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const [config, setConfig] = useState({
    caixa: 700000,
    juros: 12,
    totalRounds: 4,
    hasQuiz: true,
    quebrasPereciveis: 2,
    quebrasMercearia: 1.5,
    quebrasEletro: 0,
    quebrasHipel: 1,
    agingEletro: 1.3,
    agingHipel: 1.1,
    agingMercearia: 0.8,
    agingPereciveis: 5.8,
    impostoPereciveis: 12,
    impostoMercearia: 7,
    impostoEletro: 25,
    impostoHipel: 17,
    custoUntPereciveis: 0,
    custoUntMercearia: 0,
    custoUntEletro: 0,
    custoUntHipel: 0,
    capexSegurancaValor: 50000,
    capexBalancaValor: 75000,
    capexFreezerValor: 75000,
    capexRedesValor: 80000,
    capexSiteValor: 65000,
    capexSelfCheckoutValor : 80000,
    capexMelhoriaContinuaValor: 45000,
    estoqueDisponivelPereciveis: 1000,
    estoqueDisponivelMercearia: 1000,
    estoqueDisponivelEletro: 1000,
    estoqueDisponivelHipel: 1000
  });
  
  const [events, setEvents] = useState([]);

  // Distribuição de vendas por rodada (% por round, soma = 100%)
  const [vendasDist, setVendasDist] = useState(
    () => Array(config.totalRounds).fill('')
  );

  // Atualiza array quando totalRounds mudar
  const handleRoundsSync = (newTotal) => {
    setVendasDist((prev) => {
      if (newTotal > prev.length) {
        return [...prev, ...Array(newTotal - prev.length).fill('')];
      }
      return prev.slice(0, newTotal);
    });
  };

  const vendasSum = vendasDist.reduce((acc, v) => acc + (parseFloat(v) || 0), 0);
  const vendasValid = Math.abs(vendasSum - 100) < 0.01;

  const handleVendasChange = (index, rawValue) => {
    const v = rawValue === '' ? '' : Math.max(0, parseFloat(rawValue) || 0);
    setVendasDist((prev) => {
      const updated = [...prev];
      updated[index] = v;
      return updated;
    });
  };

  const formatBR = (val) => {
    if (val === '' || val === undefined || val === null) return '';
    return Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleMoneyChange = (e) => {
    const { name, value } = e.target;
    if (value === '') {
      setConfig((prev) => ({ ...prev, [name]: '' }));
      return;
    }
    const digits = value.replace(/\D/g, '');
    const num = parseInt(digits, 10);
    setConfig((prev) => ({
      ...prev,
      [name]: isNaN(num) ? '' : num / 100,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const parsed = value === '' ? '' : parseFloat(value);
    setConfig((prev) => ({ ...prev, [name]: parsed }));
    if (name === 'totalRounds' && parsed !== '' && parsed > 0) {
      handleRoundsSync(parsed);
    }
  };

  // CORREÇÃO: Unifiquei os dois validateConfig em um só
  const validateConfig = () => {
    const required = [
      'caixa', 'juros', 'totalRounds', 'quebrasPereciveis', 'quebrasMercearia',
      'quebrasEletro', 'quebrasHipel', 'agingEletro', 'agingHipel', 'agingMercearia',
      'agingPereciveis', 'impostoPereciveis', 'impostoMercearia', 'impostoEletro',
      'impostoHipel', 'custoUntPereciveis', 'custoUntMercearia', 'custoUntEletro',
      'custoUntHipel', 'capexSegurancaValor', 'capexBalancaValor', 'capexFreezerValor',
      'capexRedesValor', 'capexSiteValor', 'capexSelfCheckoutValor', 'capexMelhoriaContinuaValor',
    ];
    const notZeroFields = [
      'custoUntPereciveis', 'custoUntMercearia', 'custoUntEletro', 'custoUntHipel',
      'capexSegurancaValor', 'capexBalancaValor', 'capexFreezerValor', 'capexRedesValor',
      'capexSiteValor', 'capexSelfCheckoutValor', 'capexMelhoriaContinuaValor',
    ];

    const missingFields = required.filter(field => {
      const value = config[field];
      return value === '' || value === undefined || value === null;
    });

    const zeroFields = notZeroFields.filter(field => config[field] === 0);

    if (missingFields.length > 0) {
      setErrorMessage(`Campos vazios: ${missingFields.join(', ')}`);
      setIsErrorModalOpen(true);
      setShowModal(false); // Fecha o modal de confirmação que estava aberto
      return false;
    }

    if (zeroFields.length > 0) {
      setErrorMessage(`Os seguintes campos não podem ser 0: ${zeroFields.join(', ')}`);
      setIsErrorModalOpen(true);
      setShowModal(false);
      return false;
    }

    if (Number(config.caixa) <= 0) {
      setErrorMessage("O Caixa Inicial deve ser maior que zero.");
      setIsErrorModalOpen(true);
      setShowModal(false);
      return false;
    }

    if (Number(config.totalRounds) <= 0) {
      setErrorMessage("O Total de Rounds deve ser pelo menos 1.");
      setIsErrorModalOpen(true);
      setShowModal(false);
      return false;
    }

    if (Number(config.juros) < 0) {
      setErrorMessage("A Taxa de Juros não pode ser negativa.");
      setIsErrorModalOpen(true);
      setShowModal(false);
      return false;
    }

    const keys = Object.keys(config);
    for (let key of keys) {
      if (Number(config[key]) < 0) {
        setErrorMessage(`O campo ${key} não pode ser negativo.`);
        setIsErrorModalOpen(true);
        setShowModal(false);
        return false;
      }
    }

    return true;
  };

  const handleAddEvent = () => {
    setEvents((prev) => [
      ...prev,
      { round: 1, type: 'SEGURANCA', description: '' },
    ]);
  };

  const handleRemoveEvent = (index) => {
    setEvents((prev) => prev.filter((_, i) => i !== index));
  };

  // CORREÇÃO: Coloquei aquele código órfão dentro da função correta
  const handleEventChange = (index, field, value) => {
    setEvents((prev) =>
      prev.map((event, i) => {
        if (i === index) {
          let finalValue = value;
          if (field === 'round') {
            const num = parseInt(value, 10);
            const max = config.totalRounds;
            if (isNaN(num)) {
              finalValue = ""; 
            } else {
              finalValue = Math.min(Math.max(num, 1), max);
            }
          }
          return { ...event, [field]: finalValue };
        }
        return event;
      })
    );
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    if (!validateConfig()) {
      return; 
    }

    if (!vendasValid) {
      setErrorMessage(`A distribuição de vendas deve somar 100% (atual: ${vendasSum.toFixed(0)}%)`);
      setIsErrorModalOpen(true); 
      setShowModal(false); 
      return;
    }

    setIsLoading(true); 

    try {
      const demandaEstqRounds = vendasDist.map((pct) => parseFloat(pct) || 0);

      const payload = {
        ...config,
        demandaEstqRounds,
        events
      };
      console.log('Payload enviado:', JSON.stringify(payload, null, 2));
      const data = await createRoom(payload);
      console.log("Sala", data);
      
      localStorage.setItem('facilitadorToken', data.room.facilitatorToken);
      navigate(`/waitingroom/${data.room.code}?token=${data.room.facilitatorToken}`);
    } catch (error) {
      setErrorMessage(error.message || "Não foi possível criar a sala. Verifique a conexão e tente novamente.");
      setIsErrorModalOpen(true); 
      setShowModal(false); 
      
    } finally {
      setIsLoading(false); 
    }
  };

  return (
    <div className="config-container">
      <aside className="config-sidebar config-sidebar-static">
        <div className="sidebar-top">
          <h1 className="config-title">Configuração<br />da Sala</h1>
          <span className="config-title-accent" />
          <p className="config-subtitle">Defina os parâmetros e eventos para a sala.</p>
        </div>
      </aside>

      <div className="config-main">
        <div className="config-main-header">
          <button type="button" className="back-button" onClick={() => navigate(-1)} aria-label="Voltar">
            ← Voltar
          </button>
        </div>
        <div className="config-content">
          <form onSubmit={handleSubmit}>
            <section className="config-section">
              <h3 className="section-subtitle">Geral &amp; Financeiro</h3>
              <div className="input-grid">
                <div className="input-group">
                  <label>Caixa Inicial</label>
                  <input type="text" name="caixa" value={formatBR(config.caixa)} onChange={handleMoneyChange} placeholder="0" />
                </div>
                <div className="input-group">
                  <label>Taxa de Juros (%)</label>
                  <input type="number" name="juros" value={config.juros} onChange={handleChange} placeholder="0" />
                </div>
                <div className="input-group">
                  <label>Total de Rounds</label>
                  <input type="number" name="totalRounds" value={config.totalRounds} onChange={handleChange} placeholder="0" />
                </div>
                <div className="checkbox-premium-container">
                  <label className="checkbox-premium-label">
                    <input
                      type="checkbox"
                      name="hasQuiz"
                      checked={config.hasQuiz}
                      onChange={(e) => setConfig({ ...config, hasQuiz: e.target.checked })}
                      className="checkbox-premium-input"
                    />
                    <span className="checkbox-premium-text">Incluir Quiz Interativo</span>
                  </label>
                </div>
              </div>
            </section>

            <section className="config-section">
              <h3 className="section-subtitle">Quebras (%)</h3>
              <div className="input-grid">
                <div className="input-group">
                  <label>Perecíveis</label>
                  <input type="number" name="quebrasPereciveis" value={config.quebrasPereciveis} onChange={handleChange} step="0.1" />
                </div>
                <div className="input-group">
                  <label>Mercearia</label>
                  <input type="number" name="quebrasMercearia" value={config.quebrasMercearia} onChange={handleChange} step="0.1" />
                </div>
                <div className="input-group">
                  <label>Eletro</label>
                  <input type="number" name="quebrasEletro" value={config.quebrasEletro} onChange={handleChange} step="0.1" />
                </div>
                <div className="input-group">
                  <label>Hipel</label>
                  <input type="number" name="quebrasHipel" value={config.quebrasHipel} onChange={handleChange} step="0.1" />
                </div>
              </div>
            </section>

            <section className="config-section">
              <h3 className="section-subtitle">Aging(%)</h3>
              <div className="input-grid">
                <div className="input-group">
                  <label>Eletro</label>
                  <input type="number" name="agingEletro" value={config.agingEletro} onChange={handleChange} step="0.1" />
                </div>
                <div className="input-group">
                  <label>Hipel</label>
                  <input type="number" name="agingHipel" value={config.agingHipel} onChange={handleChange} step="0.1" />
                </div>
                <div className="input-group">
                  <label>Mercearia</label>
                  <input type="number" name="agingMercearia" value={config.agingMercearia} onChange={handleChange} step="0.1" />
                </div>
                <div className="input-group">
                  <label>Perecíveis</label>
                  <input type="number" name="agingPereciveis" value={config.agingPereciveis} onChange={handleChange} step="0.1" />
                </div>
              </div>
            </section>

            <section className="config-section">
              <h3 className="section-subtitle">Impostos (%)</h3>
              <div className="input-grid">
                <div className="input-group">
                  <label>Perecíveis</label>
                  <input type="number" name="impostoPereciveis" value={config.impostoPereciveis} onChange={handleChange} placeholder="0" />
                </div>
                <div className="input-group">
                  <label>Mercearia</label>
                  <input type="number" name="impostoMercearia" value={config.impostoMercearia} onChange={handleChange} placeholder="0" />
                </div>
                <div className="input-group">
                  <label>Eletro</label>
                  <input type="number" name="impostoEletro" value={config.impostoEletro} onChange={handleChange} placeholder="0" />
                </div>
                <div className="input-group">
                  <label>Hipel</label>
                  <input type="number" name="impostoHipel" value={config.impostoHipel} onChange={handleChange} placeholder="0" />
                </div>
              </div>
            </section>

            <section className="config-section">
              <h3 className="section-subtitle">Estoque Disponível</h3>
              <div className="input-grid">
                <div className="input-group">
                  <label>Perecíveis</label>
                  <input type="number" name="estoqueDisponivelPereciveis" value={config.estoqueDisponivelPereciveis} onChange={handleChange} placeholder="0" />
                </div>
                <div className="input-group">
                  <label>Mercearia</label>
                  <input type="number" name="estoqueDisponivelMercearia" value={config.estoqueDisponivelMercearia} onChange={handleChange} placeholder="0" />
                </div>
                <div className="input-group">
                  <label>Eletro</label>
                  <input type="number" name="estoqueDisponivelEletro" value={config.estoqueDisponivelEletro} onChange={handleChange} placeholder="0" />
                </div>
                <div className="input-group">
                  <label>Hipel</label>
                  <input type="number" name="estoqueDisponivelHipel" value={config.estoqueDisponivelHipel} onChange={handleChange} placeholder="0" />
                </div>
              </div>
            </section>

            <section className="config-section">
              <h3 className="section-subtitle">Custo Unitário</h3>
              <div className="input-grid">
                <div className="input-group">
                  <label>Perecíveis</label>
                  <input type="text" name="custoUntPereciveis" value={formatBR(config.custoUntPereciveis)} onChange={handleMoneyChange} placeholder="0" />
                </div>
                <div className="input-group">
                  <label>Mercearia</label>
                  <input type="text" name="custoUntMercearia" value={formatBR(config.custoUntMercearia)} onChange={handleMoneyChange} placeholder="0" />
                </div>
                <div className="input-group">
                  <label>Eletro</label>
                  <input type="text" name="custoUntEletro" value={formatBR(config.custoUntEletro)} onChange={handleMoneyChange} placeholder="0" />
                </div>
                <div className="input-group">
                  <label>Hipel</label>
                  <input type="text" name="custoUntHipel" value={formatBR(config.custoUntHipel)} onChange={handleMoneyChange} placeholder="0" />
                </div>
              </div>
            </section>

            <section className="config-section">
              <h3 className="section-subtitle">CAPEX</h3>
              <div className="input-grid">
                <div className="input-group">
                  <label>Segurança</label>
                  <input type="text" name="capexSegurancaValor" value={formatBR(config.capexSegurancaValor)} onChange={handleMoneyChange} placeholder="0" />
                </div>
                <div className="input-group">
                  <label>Balança</label>
                  <input type="text" name="capexBalancaValor" value={formatBR(config.capexBalancaValor)} onChange={handleMoneyChange} placeholder="0" />
                </div>
                 <div className="input-group">
                  <label>Freezer</label>
                  <input type="text" name="capexFreezerValor" value={formatBR(config.capexFreezerValor)} onChange={handleMoneyChange} placeholder="0" />
                </div>
                <div className="input-group">
                  <label>Redes</label>
                  <input type="text" name="capexRedesValor" value={formatBR(config.capexRedesValor)} onChange={handleMoneyChange} placeholder="0" />
                </div>
                <div className="input-group">
                  <label>Sites</label>
                  <input type="text" name="capexSiteValor" value={formatBR(config.capexSiteValor)} onChange={handleMoneyChange} placeholder="0" />
                </div>
                <div className="input-group">
                  <label>Self Checkout</label>
                  <input type="text" name="capexSelfCheckoutValor" value={formatBR(config.capexSelfCheckoutValor)} onChange={handleMoneyChange} placeholder="0" />
                </div>
                <div className="input-group">
                  <label>Melhoria Contínua</label>
                  <input type="text" name="capexMelhoriaContinuaValor" value={formatBR(config.capexMelhoriaContinuaValor)} onChange={handleMoneyChange} placeholder="0" />
                </div>
              </div>
            </section>

            <section className="config-section">
              <h3 className="section-subtitle">Distribuição de Vendas por Rodada</h3>
              <p style={{ fontSize: 'var(--font-size-body)', color: '#888', marginBottom: 12 }}>
                Defina a % da demanda total em cada rodada. A soma deve ser exatamente 100%.
              </p>
              <div className="input-grid">
                {vendasDist.map((pct, i) => (
                  <div className="input-group" key={i}>
                    <label>Rodada {i + 1}</label>
                    <div className="input-with-suffix">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        value={pct}
                        placeholder="0"
                        onChange={(e) => handleVendasChange(i, e.target.value)}
                      />
                      <span className="input-suffix">%</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="vendas-progress-wrap">
                <div className="vendas-track">
                  <div
                    className="vendas-fill"
                    style={{
                      width: `${Math.min(vendasSum, 100)}%`,
                      background: vendasValid ? '#1D9E75' : vendasSum > 100 ? '#E24B4A' : 'var(--color-primary-blue)'
                    }}
                  />
                </div>
                <span
                  className="vendas-sum-label"
                  style={{ color: vendasValid ? '#0F6E56' : vendasSum > 100 ? '#A32D2D' : '#888' }}
                >
                  {vendasValid ? '100% ✓' : `${vendasSum.toFixed(0)}%`}
                </span>
              </div>
            </section>

            <section className="config-section">
              <h3 className="section-subtitle">Eventos que aconteceram na Rodada</h3>
              {events.length === 0 && (
                <p className="event-empty-message">
                  Nenhum evento configurado. Clique em "Adicionar Evento" para criar.
                </p>
              )}
              {events.map((event, index) => (
                <div key={index} className="event-item">
                  <div>
                    <label>Round</label>
                    <input
                      type="number"
                      min="1"
                      max={config.totalRounds}
                      value={event.round}
                      onChange={(e) => handleEventChange(index, 'round', e.target.value)}
                      className="event-input-no-margin"
                    />
                  </div>
                  <div>
                    <label>Tipo</label>
                    <select
                      value={event.type}
                      onChange={(e) => handleEventChange(index, 'type', e.target.value)}
                      className="event-select"
                    >
                      <option value="SEGURANCA">Segurança</option>
                      <option value="BALANCA_FREEZER">Balança/Freezer</option>
                      <option value="REDES">Redes</option>
                      <option value="SITE">Site</option>
                      <option value="SELF_CHECKOUT">Self Checkout</option>
                      <option value="MELHORIA_CONTINUA">Melhoria Contínua</option>
                    </select>
                  </div>
                  <div>
                    <label>Descrição</label>
                    <input
                      type="text"
                      placeholder="Ex: A balança quebra neste round"
                      value={event.description}
                      onChange={(e) => handleEventChange(index, 'description', e.target.value)}
                      className="event-input-no-margin"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveEvent(index)}
                    className="event-remove-button"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddEvent}
                className="event-add-button"
              >
                + Adicionar Evento
              </button>
            </section>

  

            <button
              type="button"
              className="btn-confirm"
              onClick={() => setShowModal(true)}
              style={{ marginTop: 24 }}
            >
              Criar jogo
            </button>
          </form>
        </div>
      </div>
      
      <Modal
        isOpen={showModal}
        type={isLoading ? "loading" : "confirm"}
        title={isLoading ? "Criando Sala..." : "Confirmar Configurações"}
        message="Tem certeza que deseja criar a sala com essas configurações?"
        confirmText="Sim, criar sala"
        cancelText="Não, voltar"
        onConfirm={() => {
          if (!isLoading) {
            handleSubmit();
          }
        }}
        onCancel={() => {
          if (!isLoading) {
            setShowModal(false);
          }
        }}
      />

      <ErrorModal 
        isOpen={isErrorModalOpen} 
        onClose={() => setIsErrorModalOpen(false)} 
        errorMessage={errorMessage} 
      />
    </div>
  );
};

export default ConfiguracaoSala;