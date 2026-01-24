/**
 * Format a very small number using subscript notation
 * e.g., 0.0000123 -> 0.0₄123
 */
export function formatSmallNumber(value: number): string {
  if (value >= 0.001) {
    return value.toFixed(4);
  }

  const str = value.toString();
  const match = str.match(/^(\d+)\.0+(\d+)$/);

  if (!match) {
    return value.toExponential(2);
  }

  const [, intPart, fracPart] = match;
  const zeroCount = str.split('.')[1]?.match(/^0+/)?.[0].length || 0;

  // Create subscript for zero count
  const subscript = zeroCount.toString().split('').map(d =>
    String.fromCharCode(0x2080 + parseInt(d))
  ).join('');

  // Show 3 significant digits
  const significantDigits = fracPart.slice(0, 3);

  return `${intPart}.0${subscript}${significantDigits}`;
}

/**
 * Format cost display with currency symbol
 * WAL costs are in smallest unit (MIST), so divide by 10^9
 */
export function formatCostDisplay(cost: string, currency: 'WAL' | 'SUI' = 'WAL'): string {
  if (cost === '---' || !cost) {
    return '---';
  }

  try {
    const numValue = parseFloat(cost);
    if (isNaN(numValue)) {
      return '---';
    }

    // Convert from MIST to WAL (divide by 10^9)
    const walValue = currency === 'WAL' ? numValue / 1_000_000_000 : numValue;
    const formatted = walValue < 0.001 ? formatSmallNumber(walValue) : walValue.toFixed(4);
    return `${formatted} ${currency}`;
  } catch {
    return '---';
  }
}

/**
 * Format total cost combining SUI (tip) and WAL (storage cost)
 * WAL costs are in smallest unit (MIST), so divide by 10^9
 */
export function formatTotalCost(walCost: string, suiTip: number): string {
  if (walCost === '---' || !walCost) {
    return '---';
  }

  try {
    const walValue = parseFloat(walCost);
    if (isNaN(walValue)) {
      return '---';
    }

    // Convert from MIST to WAL (divide by 10^9)
    const walConverted = walValue / 1_000_000_000;
    const walFormatted = walConverted < 0.001 ? formatSmallNumber(walConverted) : walConverted.toFixed(4);
    const suiFormatted = formatSmallNumber(suiTip);

    return `${walFormatted} WAL + ${suiFormatted} SUI`;
  } catch {
    return '---';
  }
}
