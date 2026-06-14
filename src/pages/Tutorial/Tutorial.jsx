import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Gamepad2,
  UserCog,
  Users,
  KeyRound,
  ClipboardList,
  Boxes,
  Wallet,
  Tag,
  Trophy,
  Lightbulb,
  ShieldAlert,
  ArrowRight,
  Settings2,
  Apple,
  ShoppingCart,
  Tv,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import logoCencosud from '../../assets/images/cencosud.svg';
import '../../index.css';
import './tutorial.css';

const ROLES = [
  {
    icon: UserCog,
    title: 'Facilitador',
    desc:
      'O professor ou mediador. Cria a sala, define os parâmetros do jogo (caixa, juros, rodadas, custos, impostos e eventos), inicia a partida e acompanha o desempenho das empresas pelo painel e pelo ranking.',
  },
  {
    icon: Users,
    title: 'Gerente / Empresa',
    desc:
      'Os participantes. Entram com o PIN formando uma empresa, respondem ao quiz e tomam as decisões estratégicas de cada rodada para crescer e vencer a concorrência.',
  },
];

const STEPS = [
  {
    icon: KeyRound,
    title: 'Entre na sala',
    text:
      'O facilitador compartilha um PIN de 6 dígitos. No lobby, digite o PIN, o nome da sua empresa e o seu nome para entrar na sala de espera.',
  },
  {
    icon: ClipboardList,
    title: 'Responda ao quiz',
    text:
      'Quando o facilitador iniciar o jogo, começa a etapa do gerente: um quiz com perguntas para colocar o conhecimento em prática antes de gerir a empresa.',
  },
  {
    icon: Wallet,
    title: 'Monte sua estratégia',
    text:
      'No Painel de Estratégia você decide pessoal, investimentos, estoque e preços da rodada — sempre de olho no saldo disponível para não pagar juros.',
  },
  {
    icon: Trophy,
    title: 'Veja o ranking',
    text:
      'Assim que todas as empresas confirmam, o resultado da rodada aparece no ranking. As rodadas se repetem e vence quem tiver o melhor desempenho.',
  },
];

const DECISIONS = [
  {
    icon: Users,
    title: 'Dimensionamento de pessoal',
    text:
      'Defina quantos operadores de caixa e de serviço sua empresa terá. Cada operador tem um custo fixo — equipe demais pesa no caixa, equipe de menos trava as vendas.',
  },
  {
    icon: ShieldAlert,
    title: 'Investimentos (CAPEX)',
    text:
      'Compre infraestrutura: segurança, balança/freezer, redes, site, self checkout e melhoria contínua. Itens não adquiridos podem gerar incidentes e perdas na rodada.',
  },
  {
    icon: Boxes,
    title: 'Abastecimento (estoque)',
    text:
      'Compre estoque por categoria — Perecíveis, Mercearia, Eletro e Hipel — respeitando o disponível. Produtos não vendidos acumulam e geram quebras e custos de aging.',
  },
  {
    icon: Tag,
    title: 'Preços e margens',
    text:
      'Ajuste a margem de lucro de cada categoria. Isso define o preço de venda da cesta: margem alta dá mais lucro por venda, mas pode afastar a demanda.',
  },
];

const CATEGORIES = [
  {
    icon: Apple,
    title: 'Perecíveis',
    desc:
      'Frutas, carnes e laticínios. Giro rápido e boa margem, mas alta taxa de quebra e aging — encalhou, estragou.',
  },
  {
    icon: ShoppingCart,
    title: 'Mercearia',
    desc:
      'Produtos secos e básicos do dia a dia. Demanda estável e perdas baixas: a base segura do seu mix.',
  },
  {
    icon: Tv,
    title: 'Eletro',
    desc:
      'Eletrônicos e eletrodomésticos. Margem alta e imposto alto, com ticket elevado e demanda mais sensível ao preço.',
  },
  {
    icon: Sparkles,
    title: 'Hipel',
    desc:
      'Higiene e limpeza. Compra recorrente e perdas moderadas, ótima para equilibrar o faturamento da cesta.',
  },
];

const GLOSSARY = [
  {
    term: 'Cesta',
    def:
      'A soma dos preços de venda das quatro categorias. É o preço final que o cliente enxerga.',
  },
  {
    term: 'Margem (%)',
    def:
      'Percentual de lucro que você adiciona sobre o custo unitário para formar o preço de venda.',
  },
  {
    term: 'CAPEX',
    def:
      'Investimentos em infraestrutura (segurança, redes, freezer...). Gasto único que evita incidentes.',
  },
  {
    term: 'Quebras (%)',
    def:
      'Produtos perdidos por avaria, furto ou validade. Reduzem o estoque que você consegue vender.',
  },
  {
    term: 'Aging (%)',
    def:
      'Perda de valor do estoque que envelhece sem vender — quanto mais tempo parado, mais custa.',
  },
  {
    term: 'Disponibilidade (%)',
    def:
      'O quanto do estoque disponível você comprou. Pouco estoque limita as vendas da rodada.',
  },
  {
    term: 'Imposto (%)',
    def:
      'Tributo aplicado por categoria sobre as vendas. Varia bastante — Eletro costuma ser o mais pesado.',
  },
  {
    term: 'Juros (%)',
    def:
      'Cobrança sobre o excedente. Se os gastos passam do caixa, o valor a mais vira dívida com juros.',
  },
];

const FACILITATOR_STEPS = [
  {
    title: 'Crie a sala',
    text:
      'No menu "Criar", defina o caixa inicial, a taxa de juros e quantas rodadas a partida terá.',
  },
  {
    title: 'Configure os parâmetros',
    text:
      'Ajuste custos unitários, impostos, quebras, aging, valores de CAPEX e o estoque disponível por categoria.',
  },
  {
    title: 'Distribua as vendas e eventos',
    text:
      'Defina a % da demanda em cada rodada (somando 100%) e adicione eventos que podem atingir as empresas.',
  },
  {
    title: 'Inicie e acompanhe',
    text:
      'Compartilhe o PIN, espere as empresas entrarem, inicie o jogo e acompanhe tudo pelo painel e ranking.',
  },
];

const FAQ = [
  {
    q: 'Preciso instalar algo para jogar?',
    a: 'Não. O jogo roda no navegador. Basta o link da plataforma e o PIN que o facilitador compartilha.',
  },
  {
    q: 'Posso jogar sozinho?',
    a: 'O jogo é feito para várias empresas competindo. Você precisa de um facilitador para criar a sala e de outras empresas para a disputa fazer sentido.',
  },
  {
    q: 'O que acontece se eu gastar mais do que tenho?',
    a: 'O valor excedente vira dívida e sofre juros na rodada. Dá pra fazer, mas só estrategicamente — o juros corrói seu resultado.',
  },
  {
    q: 'Minhas decisões valem para sempre?',
    a: 'Estratégias como margens e pessoal são mantidas entre rodadas, mas o estoque zera e precisa ser comprado de novo a cada rodada.',
  },
  {
    q: 'Como sei se estou ganhando?',
    a: 'Ao fim de cada rodada o ranking mostra a posição de todas as empresas. O desempenho acumulado ao longo das rodadas define o vencedor.',
  },
];

const TIPS = [
  'Nunca gaste mais do que o seu caixa: o excedente vira dívida com juros.',
  'Equilibre preço e demanda — a cesta mais cara nem sempre vende mais.',
  'Não ignore o CAPEX: economizar em infraestrutura pode custar caro em incidentes.',
  'Controle o estoque para evitar quebras de perecíveis e custos de aging.',
];

const Tutorial = () => {
  const navigate = useNavigate();

  return (
    <div className="tut-wrapper">
      {/* Header */}
      <header className="tut-header">
        <nav className="tut-nav">
          <Link to="/" className="tut-logo">
            <img src={logoCencosud} alt="Cencosud Logo" />
          </Link>
          <div className="tut-nav-actions">
            <button
              type="button"
              className="tut-nav-link"
              onClick={() => navigate('/lobby')}
            >
              Entrar com PIN
            </button>
            <Link to="/lobby" className="tut-btn-primary">
              Começar agora
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="tut-hero">
        <div className="tut-container">
          <span className="tut-badge">
            <Gamepad2 size={16} /> Como jogar
          </span>
          <h1>
            Aprenda a jogar o <span>Cencosud Learning</span>
          </h1>
          <p>
            Uma simulação de gestão de supermercado: cada empresa toma decisões
            de pessoal, investimentos, estoque e preços ao longo de várias
            rodadas. Quem administra melhor os recursos vence.
          </p>
        </div>
      </section>

      <main className="tut-container tut-main">
        {/* Papéis */}
        <section className="tut-section">
          <h2 className="tut-section-title">Quem é quem no jogo</h2>
          <p className="tut-section-sub">
            Toda partida tem dois papéis. Veja onde você se encaixa.
          </p>
          <div className="tut-grid tut-grid-2">
            {ROLES.map((role) => {
              const Icon = role.icon;
              return (
                <div className="tut-card tut-card-role" key={role.title}>
                  <div className="tut-card-icon">
                    <Icon size={26} />
                  </div>
                  <h3>{role.title}</h3>
                  <p>{role.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Passo a passo */}
        <section className="tut-section">
          <h2 className="tut-section-title">O passo a passo</h2>
          <p className="tut-section-sub">
            Do PIN ao ranking, é assim que uma partida acontece.
          </p>
          <div className="tut-steps">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div className="tut-step" key={step.title}>
                  <div className="tut-step-number">{i + 1}</div>
                  <div className="tut-step-body">
                    <div className="tut-step-head">
                      <Icon size={20} />
                      <h3>{step.title}</h3>
                    </div>
                    <p>{step.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Decisões da rodada */}
        <section className="tut-section">
          <h2 className="tut-section-title">As decisões de cada rodada</h2>
          <p className="tut-section-sub">
            No Painel de Estratégia você define quatro frentes. Todas consomem o
            seu caixa.
          </p>
          <div className="tut-grid tut-grid-2">
            {DECISIONS.map((decision) => {
              const Icon = decision.icon;
              return (
                <div className="tut-card" key={decision.title}>
                  <div className="tut-card-icon tut-card-icon-orange">
                    <Icon size={24} />
                  </div>
                  <h3>{decision.title}</h3>
                  <p>{decision.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Categorias de produtos */}
        <section className="tut-section">
          <h2 className="tut-section-title">As categorias de produtos</h2>
          <p className="tut-section-sub">
            Seu supermercado vende quatro categorias, cada uma com seu
            comportamento de custo, margem e perdas.
          </p>
          <div className="tut-grid tut-grid-4">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <div className="tut-card tut-card-cat" key={cat.title}>
                  <div className="tut-card-icon">
                    <Icon size={24} />
                  </div>
                  <h3>{cat.title}</h3>
                  <p>{cat.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Para o facilitador */}
        <section className="tut-section">
          <div className="tut-facilitator">
            <div className="tut-facilitator-head">
              <Settings2 size={22} />
              <div>
                <h2>É você quem vai conduzir? (Facilitador)</h2>
                <p>
                  Antes de todo mundo entrar, o facilitador monta a partida em
                  quatro passos.
                </p>
              </div>
            </div>
            <div className="tut-facilitator-grid">
              {FACILITATOR_STEPS.map(({ title, text }, i) => (
                <div className="tut-facilitator-item" key={title}>
                  <span className="tut-facilitator-num">{i + 1}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Glossário */}
        <section className="tut-section">
          <h2 className="tut-section-title">Glossário rápido</h2>
          <p className="tut-section-sub">
            Os termos que você vai encontrar no Painel de Estratégia.
          </p>
          <div className="tut-glossary">
            {GLOSSARY.map(({ term, def }) => (
              <div className="tut-glossary-item" key={term}>
                <span className="tut-glossary-term">{term}</span>
                <span className="tut-glossary-def">{def}</span>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="tut-section">
          <h2 className="tut-section-title">Perguntas frequentes</h2>
          <p className="tut-section-sub">As dúvidas mais comuns de quem está começando.</p>
          <div className="tut-faq">
            {FAQ.map(({ q, a }) => (
              <details className="tut-faq-item" key={q}>
                <summary>
                  <HelpCircle size={18} />
                  <span>{q}</span>
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Dicas */}
        <section className="tut-section">
          <div className="tut-tips">
            <div className="tut-tips-head">
              <Lightbulb size={22} />
              <h2>Dicas para vencer</h2>
            </div>
            <ul className="tut-tips-list">
              {TIPS.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* CTA */}
        <section className="tut-cta">
          <h2>Pronto para administrar sua empresa?</h2>
          <p>Pegue o PIN com o facilitador e entre na sala.</p>
          <Link to="/lobby" className="tut-btn-cta">
            Começar agora <ArrowRight size={18} />
          </Link>
        </section>
      </main>

      <footer className="tut-footer">
        <p>© 2026 Cencosud Learning</p>
      </footer>
    </div>
  );
};

export default Tutorial;
