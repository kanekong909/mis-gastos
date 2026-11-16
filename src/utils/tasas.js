// Tasas de cambio reales, de APIs públicas y gratuitas (sin llave). Se consultan desde el
// navegador, se guardan 6 horas y, si ninguna responde, se usa la última guardada.
// El resultado son pesos por cada 1 USD y por cada 1 EUR.

const CLAVE = 'tasas_cambio';
const VIGENCIA_MS = 6 * 3600 * 1000;
const ESPERA_MS = 8000;

const deMonedaBase = (d) => ({ USD: 1 / d.cop.usd, EUR: 1 / d.cop.eur, fecha: d.date });

// Se prueban en orden; las dos primeras son la misma base de datos en dos CDN distintos.
const FUENTES = [
  { nombre: 'Currency API', url: 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/cop.min.json', leer: deMonedaBase },
  { nombre: 'Currency API', url: 'https://latest.currency-api.pages.dev/v1/currencies/cop.min.json', leer: deMonedaBase },
  {
    nombre: 'ExchangeRate-API',
    url: 'https://open.er-api.com/v6/latest/COP',
    leer: (d) => ({ USD: 1 / d.rates.USD, EUR: 1 / d.rates.EUR, fecha: new Date(d.time_last_update_unix * 1000).toISOString().slice(0, 10) }),
  },
];

const valida = (t) => [t.USD, t.EUR].every((n) => Number.isFinite(n) && n > 1);

export function leerCache() {
  try {
    const c = JSON.parse(localStorage.getItem(CLAVE));
    return c && valida(c.tasas) ? c : null;
  } catch {
    return null;
  }
}

const guardar = (c) => { try { localStorage.setItem(CLAVE, JSON.stringify(c)); } catch { /* sin storage */ } };

async function pedir(fuente) {
  const control = new AbortController();
  const reloj = setTimeout(() => control.abort(), ESPERA_MS);
  try {
    const res = await fetch(fuente.url, { signal: control.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { fecha, ...tasas } = fuente.leer(await res.json());
    if (!valida(tasas)) throw new Error('tasas no válidas');
    return { tasas, fecha, fuente: fuente.nombre, guardado: Date.now() };
  } finally {
    clearTimeout(reloj);
  }
}

// Devuelve { tasas, fecha, fuente, estado } con estado 'actual' | 'desactualizada' | 'sin-tasas'.
export async function obtenerTasas({ forzar = false } = {}) {
  const cache = leerCache();
  if (cache && !forzar && Date.now() - cache.guardado < VIGENCIA_MS) return { ...cache, estado: 'actual' };

  for (const fuente of FUENTES) {
    try {
      const nuevo = await pedir(fuente);
      guardar(nuevo);
      return { ...nuevo, estado: 'actual' };
    } catch {
      /* se prueba la siguiente fuente */
    }
  }
  return cache ? { ...cache, estado: 'desactualizada' } : { tasas: null, fecha: null, fuente: null, estado: 'sin-tasas' };
}
