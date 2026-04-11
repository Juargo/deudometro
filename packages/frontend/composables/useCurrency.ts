export function useCurrency() {
  const formatter = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  });

  function formatCLP(amount: number): string {
    return formatter.format(amount);
  }

  return { formatCLP };
}
