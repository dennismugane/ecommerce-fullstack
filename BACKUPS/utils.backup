export function formatMoneyCurrency(amount) {
  // Convert to Ksh by multiplying by 80
  const shillings = amount * 80;

  // Format with commas and 2 decimals
  return shillings.toLocaleString("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
  });
}

export function OrderFormatMoneyCurrency(amount) {
  return amount.toLocaleString("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
  });
}
