export function formatTime(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function formatLongDate(value: string | Date = new Date()) {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
}

export function getPeriodFromDate(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  const hour = date.getHours();
  if (hour < 6) return "Madrugada";
  if (hour < 12) return "Manhã";
  if (hour < 18) return "Tarde";
  return "Noite";
}

export function toLocalInputDateTime(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
