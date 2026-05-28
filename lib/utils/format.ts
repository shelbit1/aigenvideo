export function formatRelativeDate(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);

  if (diff < 60) return "только что";
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
  if (diff < 86_400) return `${Math.floor(diff / 3600)} ч назад`;
  if (diff < 604_800) return `${Math.floor(diff / 86_400)} дн назад`;

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} КБ`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} МБ`;
  return `${(bytes / 1024 ** 3).toFixed(2)} ГБ`;
}
