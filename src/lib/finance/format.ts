/** Stocke 150 000 GNF comme 150000 (entier) */
export function parseAmount(input: string): number {
  const cleaned = input.replace(/[^0-9]/g, '');
  const amount = parseInt(cleaned, 10);
  if (isNaN(amount) || amount < 0) throw new Error('Montant invalide');
  return amount;
}

/** Affiche 150000 → "150 000 GNF" */
export function formatAmount(amount: number, currency = 'GNF'): string {
  return `${amount.toLocaleString('fr-GN')} ${currency}`;
}
