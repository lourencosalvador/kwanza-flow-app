/**
 * Formatação financeira e de datas.
 * Moeda predefinida: Kwanza Angolano (AOA). Locale: pt-AO (fallback pt-PT).
 * Preparado para múltiplas moedas (parâmetro `currency`).
 */

const LOCALE = "pt-AO";

export type CurrencyCode = "AOA" | "USD" | "EUR" | "BRL";

const CURRENCY_SYMBOL: Record<CurrencyCode, string> = {
  AOA: "Kz",
  USD: "$",
  EUR: "€",
  BRL: "R$",
};

/** Formata um valor como moeda. Ex.: 250000 → "250 000 Kz". */
export function formatCurrency(
  value: number,
  currency: CurrencyCode = "AOA",
  opts: { compact?: boolean; sign?: boolean } = {},
) {
  const { compact = false, sign = false } = opts;

  const formatted = new Intl.NumberFormat(LOCALE, {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: compact ? 1 : 0,
    notation: compact ? "compact" : "standard",
  }).format(Math.abs(value));

  const symbol = CURRENCY_SYMBOL[currency];
  const prefix = value < 0 ? "−" : sign ? "+" : "";
  return `${prefix}${formatted} ${symbol}`;
}

/** Versão compacta: 3 000 000 → "3M Kz". */
export function formatCompact(value: number, currency: CurrencyCode = "AOA") {
  return formatCurrency(value, currency, { compact: true });
}

/** Percentagem amigável: 0.732 → "73%". */
export function formatPercent(ratio: number, decimals = 0) {
  return new Intl.NumberFormat(LOCALE, {
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(ratio);
}

/** Número simples com separador de milhares. */
export function formatNumber(value: number) {
  return new Intl.NumberFormat(LOCALE).format(value);
}

export function formatDate(
  date: Date | string,
  style: "short" | "long" | "month" | "day" = "short",
) {
  const d = typeof date === "string" ? new Date(date) : date;
  const options: Intl.DateTimeFormatOptions =
    style === "long"
      ? { day: "2-digit", month: "long", year: "numeric" }
      : style === "month"
        ? { month: "long", year: "numeric" }
        : style === "day"
          ? { weekday: "short", day: "2-digit", month: "short" }
          : { day: "2-digit", month: "short", year: "numeric" };
  return new Intl.DateTimeFormat(LOCALE, options).format(d);
}

/** Distância relativa simples ("em 3 dias", "há 2 dias"). */
export function formatRelativeDays(target: Date | string, from: Date = new Date()) {
  const d = typeof target === "string" ? new Date(target) : target;
  const diff = Math.round(
    (d.getTime() - from.getTime()) / (1000 * 60 * 60 * 24),
  );
  const rtf = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" });
  return rtf.format(diff, "day");
}

/** Saudação dependente da hora ("Bom dia", "Boa tarde", "Boa noite"). */
export function greeting(date: Date = new Date()) {
  const h = date.getHours();
  if (h < 12) return "Bom dia";
  if (h < 19) return "Boa tarde";
  return "Boa noite";
}
