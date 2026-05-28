"use client";

import * as React from "react";
import { formatRelativeDate } from "@/lib/utils/format";

/**
 * Клиентский компонент для отображения относительного времени.
 *
 * Текст зависит от `Date.now()`, поэтому SSR-снимок и client-render могут
 * разойтись на пару минут. Чтобы избежать hydration mismatch, на сервере
 * рендерим ISO-дату внутри `<time dateTime>`, а после mount подменяем на
 * человекочитаемое значение.
 */
export function RelativeTime({
  date,
  className,
}: {
  date: Date | string;
  className?: string;
}) {
  const iso = React.useMemo(
    () => (typeof date === "string" ? date : date.toISOString()),
    [date]
  );

  const [label, setLabel] = React.useState<string | null>(null);

  React.useEffect(() => {
    const update = () => setLabel(formatRelativeDate(date));
    update();
    const interval = setInterval(update, 30_000);
    return () => clearInterval(interval);
  }, [date]);

  return (
    <time dateTime={iso} className={className} suppressHydrationWarning>
      {label ?? ""}
    </time>
  );
}
