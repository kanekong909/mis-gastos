export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
export const MESES_CORTOS = MESES.map((m) => m.slice(0, 3));

const formatoDinero = new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', maximumFractionDigits: 0,
});
export const dinero = (v) => formatoDinero.format(Number(v) || 0);

// Formato corto para ejes de gráficas: $1,2 M / $350 mil
export const dineroCorto = (v) => {
  const n = Number(v) || 0;
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toLocaleString('es-CO', { maximumFractionDigits: 1 })} M`;
  if (Math.abs(n) >= 1e3) return `$${Math.round(n / 1e3)} mil`;
  return `$${n}`;
};

// La API entrega 'YYYY-MM-DD HH:MM:SS' en hora local.
export const aFecha = (s) => new Date(String(s).replace(' ', 'T'));

export const fechaLarga = (s) =>
  aFecha(s).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
export const fechaCorta = (s) =>
  aFecha(s).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
export const hora = (s) =>
  aFecha(s).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

// Valor para <input type="datetime-local"> con la hora actual.
export const ahoraLocal = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};
export const aInputFecha = (s) => String(s).replace(' ', 'T').slice(0, 16);
export const diaClave = (s) => String(s).slice(0, 10);

// Debe coincidir con PALETA_COLORES de api/bootstrap.php.
export const COLORES = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#10b981',
  '#14b8a6', '#06b6d4', '#3b82f6', '#64748b', '#a855f7', '#d946ef', '#f43f5e', '#22c55e', '#0ea5e9',
  '#6d28d9', '#be123c', '#b45309', '#4d7c0f', '#0f766e', '#1d4ed8',
];

const hslAHex = (h, s, l) => {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const canal = (n) => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * c).toString(16).padStart(2, '0');
  };
  return `#${canal(0)}${canal(8)}${canal(4)}`;
};

// Primer color que no esté en `usados` (lista de colores ya tomados). Si se
// acaba la paleta, genera colores nuevos repartidos por todo el círculo cromático.
export function colorLibre(usados = []) {
  const tomados = new Set(usados.map((c) => String(c).toLowerCase()));
  const libre = COLORES.find((c) => !tomados.has(c));
  if (libre) return libre;
  for (let i = 0; i < 10000; i++) {
    const c = hslAHex((i * 137.508) % 360, 65, 52);
    if (!tomados.has(c)) return c;
  }
  return COLORES[0];
}
