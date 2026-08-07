import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatAmount } from '@/lib/finance/format';
import type { FinancialIntelligenceReport } from '@/lib/insights/intelligence';
import type { FinancialForecast } from '@/lib/finance/forecast';
import type { FinancialScoreResult } from '@/lib/finance/score';
import type { InsightTone } from '@/lib/insights/generate';

export interface Recommendation {
  id: string;
  tone: InsightTone;
  title: string;
  body: string;
}

interface CategorySpend {
  categoryId: string;
  current: number;
  average: number;
}

/**
 * Conseils chiffrés et personnalisés (jamais génériques — voir la règle du cahier des
 * charges : "uniquement des recommandations pertinentes, chiffrées et personnalisées").
 * Purement déterministe : combine le rapport d'intelligence, les prévisions et le score.
 */
export function generateRecommendations(params: {
  intelligence: FinancialIntelligenceReport;
  forecast: FinancialForecast;
  score: FinancialScoreResult;
  categorySpends: CategorySpend[]; // mois courant vs moyenne des 3 mois précédents, par catégorie
  currency?: string;
}): Recommendation[] {
  const currency = params.currency || 'GNF';
  const recs: Recommendation[] = [];

  // 1. Catégorie en forte hausse : combien économiser en la réduisant de 15%
  const topIncrease = params.categorySpends
    .filter(c => c.average > 30000 && c.current > c.average * 1.2)
    .map(c => ({ ...c, ratio: (c.current - c.average) / c.average }))
    .sort((a, b) => b.ratio - a.ratio)[0];
  if (topIncrease) {
    const potentialSavings = Math.round(topIncrease.current * 0.15);
    recs.push({
      id: 'category-reduction',
      tone: 'warning',
      // Titre stable (nom de catégorie seul) : le % fluctue à chaque recalcul, et
      // upsertNotification dédoublonne par titre — un titre qui varie créait une
      // nouvelle alerte à chaque petit changement au lieu de mettre à jour l'existante.
      title: `Hausse de dépenses : ${topIncrease.categoryId}`,
      body: `Vous dépensez ${Math.round(topIncrease.ratio * 100)}% de plus que d'habitude dans cette catégorie. En la réduisant de 15%, vous économiseriez environ ${formatAmount(potentialSavings, currency)} par mois.`,
    });
  }

  // 2. Catégorie dominante trop concentrée
  const dom = params.intelligence.dominantCategory;
  if (dom && dom.percentOfExpenses >= 40) {
    recs.push({
      id: 'dominant-category',
      tone: 'info',
      title: `Catégorie dominante : ${dom.categoryId}`,
      body: `Représente ${dom.percentOfExpenses}% de vos dépenses — votre poste le plus important (${formatAmount(dom.totalAmount, currency)} sur 3 mois). Vérifiez qu'il correspond bien à vos priorités.`,
    });
  }

  // 3. Coût annualisé des paiements récurrents détectés
  const topRecurring = [...params.intelligence.recurringExpenses].sort((a, b) => b.averageAmount - a.averageAmount)[0];
  if (topRecurring) {
    const annualCost = Math.round((topRecurring.averageAmount / topRecurring.intervalDays) * 365);
    recs.push({
      id: 'recurring-cost',
      tone: 'info',
      title: `Paiement récurrent : "${topRecurring.label}"`,
      body: `Revient environ tous les ${topRecurring.intervalDays} jours, ${formatAmount(topRecurring.averageAmount, currency)} à chaque fois, soit ${formatAmount(annualCost, currency)} par an.`,
    });
  }

  // 4. Revenu manquant détecté
  if (params.intelligence.missingIncome) {
    recs.push({
      id: 'missing-income',
      tone: 'critical',
      title: 'Revenu récurrent non reçu',
      body: `"${params.intelligence.missingIncome.label}" attendu vers le ${format(new Date(params.intelligence.missingIncome.nextExpectedDate), 'd MMMM', { locale: fr })} n'a pas encore été enregistré.`,
    });
  }

  // 5. Baisse de revenu
  if (params.intelligence.incomeChange?.direction === 'down') {
    recs.push({
      id: 'income-down',
      tone: 'warning',
      title: 'Baisse de revenus',
      body: `En baisse de ${params.intelligence.incomeChange.percent}% comparé à votre moyenne des 3 derniers mois. Vos dépenses au rythme actuel : ${formatAmount(Math.round(params.forecast.dailyAvgExpense * 30), currency)}/mois.`,
    });
  }

  // 6. Solde incohérent (données à vérifier)
  const balanceIssue = params.intelligence.unusualBalances[0];
  if (balanceIssue) {
    recs.push({
      id: 'unusual-balance',
      tone: 'warning',
      title: `Solde à vérifier : ${balanceIssue.accountName}`,
      body: `Le solde affiché (${formatAmount(balanceIssue.storedBalance, currency)}) diffère de ${formatAmount(balanceIssue.deviation, currency)} par rapport à l'historique des transactions enregistrées.`,
    });
  }

  // 7. Doublons potentiels
  if (params.intelligence.duplicates.length > 0) {
    const dup = params.intelligence.duplicates[0];
    recs.push({
      id: 'duplicates',
      tone: 'warning',
      title: 'Transactions potentiellement en double',
      body: `${params.intelligence.duplicates.length} groupe(s) détecté(s) — par exemple ${formatAmount(dup.amount, currency)} enregistré ${dup.transactions.length} fois le même jour dans "${dup.categoryId}".`,
    });
  }

  // 8. Renforcement positif si le score est bon et l'épargne solide
  if (params.score.factors.savings >= 80 && params.forecast.dailyAvgIncome > 0) {
    const savingsRate = Math.round((1 - params.forecast.dailyAvgExpense / params.forecast.dailyAvgIncome) * 100);
    if (savingsRate > 0) {
      recs.push({
        id: 'savings-good',
        tone: 'positive',
        title: 'Vous épargnez bien',
        body: `Vous épargnez ${savingsRate}% de vos revenus — bien au-dessus du seuil de 20% généralement recommandé. À ce rythme : ${formatAmount(params.forecast.points.find(p => p.daysAhead === 90)?.projectedSavings || 0, currency)} économisés sur 3 mois.`,
      });
    }
  }

  return recs;
}
