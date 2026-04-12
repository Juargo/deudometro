function useCurrency() {
  const formatter = new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0
  });
  function formatCLP(amount) {
    return formatter.format(amount);
  }
  return { formatCLP };
}

export { useCurrency as u };
//# sourceMappingURL=useCurrency-BsHzhGz3.mjs.map
