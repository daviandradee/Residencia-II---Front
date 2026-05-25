import { useEffect } from 'react';
import { useToast } from '../Toast';

/**
 * ProfessorFeed — dispara toasts educativos baseados nas decisões/resultados.
 * Componente sem UI (renderiza null). Só chama useToast() com efeitos.
 *
 * Props:
 *   context   : 'config' | 'ranking'
 *   decisions : Object  — dados do formulário (CompanyConfigRoom)
 *   results   : Object  — meuResultado (GerenteRanking)
 *   params    : Object  — params da empresa (juros, saldoInicial etc.)
 *   trigger   : any     — muda quando deve disparar (ex: timestamp do save)
 */
const ProfessorFeed = ({ context, decisions = {}, results = {}, params = {}, trigger }) => {
  const { showToast } = useToast();

  useEffect(() => {
    if (!trigger) return;

    const toasts = [];

    // ── Contexto: CompanyConfigRoom (após confirmar estratégia) ──
    if (context === 'config') {
      // CAPEX Segurança não comprado
      if (!decisions.capexSegurancaValor) {
        toasts.push({
          msg: '👨‍🏫 Você não investiu em Segurança. Se houver um evento de segurança, sua receita será reduzida em 10%.',
          type: 'warning',
        });
      }

      // Operadores de Serviço = 0
      if ((decisions.operadoresServico || 0) === 0) {
        toasts.push({
          msg: '👨‍🏫 Você não alocou operadores de serviço. Seu CSAT será 0%, independente do resultado do quiz.',
          type: 'warning',
        });
      }

      // Saldo negativo — cheque especial
      const saldoInicial = params.saldoInicial || 0;
      const excedente = decisions._excedente || 0;
      if (excedente > 0) {
        const juros = params.juros || 12;
        const valorJuros = excedente * (juros / 100);
        toasts.push({
          msg: `📊 Você entrou no cheque especial. Juros de ${juros}% serão aplicados sobre o excedente de R$ ${excedente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, gerando R$ ${valorJuros.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em juros.`,
          type: 'warning',
        });
      }

      // Margens muito altas (> 50%)
      const cats = ['Pereciveis', 'Mercearia', 'Eletro', 'Hipel'];
      const altasMargem = cats.filter(c => (decisions[`margem${c}`] || 0) > 50);
      if (altasMargem.length > 0) {
        toasts.push({
          msg: `📊 Suas margens em ${altasMargem.join(', ')} estão acima de 50%. Isso pode reduzir seu ranking de preço e capturar menos demanda.`,
          type: 'info',
        });
      }
    }

    // ── Contexto: GerenteRanking (ao carregar resultados) ──
    if (context === 'ranking') {
      // Penalidade sofrida
      if ((results.valorPenalidade || 0) > 0) {
        const eventos = (results.eventosAplicados || []).join(', ');
        toasts.push({
          msg: `👨‍🏫 Você sofreu penalidade por: ${eventos}. Sem o CAPEX de proteção, sua receita foi reduzida em ${results.percentualPenalidade || 10}%.`,
          type: 'warning',
        });
      }

      // Deixou de vender
      const totalDeixouVender =
        (results.deixouDeVenderPereciveis || 0) +
        (results.deixouDeVenderMercearia || 0) +
        (results.deixouDeVenderEletro || 0) +
        (results.deixouDeVenderHipel || 0);

      if (totalDeixouVender > 0) {
        toasts.push({
          msg: `📊 Você deixou de vender ${totalDeixouVender.toLocaleString('pt-BR')} unidades por falta de estoque. A demanda capturada foi maior que sua disponibilidade.`,
          type: 'info',
        });
      }

      // Melhor preço (rank 1)
      if (results.rankPreco === 1) {
        toasts.push({
          msg: '👨‍🏫 Você teve o melhor preço da cesta esta rodada. Isso garantiu pontos extras no ranking de demanda.',
          type: 'info',
        });
      }

      // Pior preço (rank = último)
      if (results.rankPreco && results.totalEmpresas && results.rankPreco === results.totalEmpresas) {
        toasts.push({
          msg: '📊 Você teve o maior preço da cesta esta rodada. Isso reduziu seus pontos no ranking de demanda.',
          type: 'info',
        });
      }
    }

    // Dispara máximo 3 toasts com delay escalonado
    const maxToasts = toasts.slice(0, 3);
    maxToasts.forEach((t, i) => {
      setTimeout(() => {
        showToast(t.msg, t.type, 5000);
      }, i * 700);
    });
  }, [trigger]);

  return null;
};

export default ProfessorFeed;
