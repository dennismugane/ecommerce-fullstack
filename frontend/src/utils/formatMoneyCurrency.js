export function formatMoneyCurrency(amount) {
  const converted = amount * 80;
  const rounded = Math.round(converted);
  const formatted = new Intl.NumberFormat("en-KE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(rounded));

  return rounded < 0 ? `-Ksh ${formatted}` : `Ksh ${formatted}`;
}

export function OrderFormatMoneyCurrency(amount) {
  const rounded = Math.round(amount);
  const formatted = new Intl.NumberFormat("en-KE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(rounded));

  return rounded < 0 ? `-Ksh ${formatted}` : `Ksh ${formatted}`;
}
