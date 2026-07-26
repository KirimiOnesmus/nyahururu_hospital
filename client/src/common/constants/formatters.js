
export const formatDate = (
  d,
  opts = { day: "2-digit", month: "short", year: "numeric" }
) => (d ? new Date(d).toLocaleDateString("en-KE", opts) : "—");

export const formatKES = (amount) =>
  typeof amount === "number"
    ? `KSh ${amount.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`
    : "—";


export const truncateText = (str, n = 80) =>
  str && str.length > n ? str.slice(0, n) + "…" : str;
