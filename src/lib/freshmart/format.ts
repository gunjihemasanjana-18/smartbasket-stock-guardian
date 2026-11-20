const TZ = "Asia/Kolkata";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

export const formatCurrency = (n: number) => currency.format(n);

const keyFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
export const dayKey = (d: Date | string) => keyFmt.format(new Date(d));

const dateTimeFmt = new Intl.DateTimeFormat("en-IN", {
  timeZone: TZ,
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
export const formatDateTime = (d: string) => dateTimeFmt.format(new Date(d));

const dayLabelFmt = new Intl.DateTimeFormat("en-IN", {
  timeZone: TZ,
  weekday: "short",
  day: "numeric",
});
export const dayLabel = (key: string) => dayLabelFmt.format(new Date(`${key}T12:00:00+05:30`));

export const startOfDayIST = (d: Date) => Date.parse(`${dayKey(d)}T00:00:00+05:30`);

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
