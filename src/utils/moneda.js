// Moneda en la que se MUESTRAN los montos. Todo se guarda en pesos (COP) y se convierte
// con la tasa de cambio del día; aquí vive la configuración activa para que funciones
// como dinero() la usen sin tener que ser componentes de React.

export const MONEDAS = {
  COP: { codigo: 'COP', nombre: 'Peso colombiano', simbolo: '$', decimales: 0 },
  USD: { codigo: 'USD', nombre: 'Dólar estadounidense', simbolo: 'US$', decimales: 2 },
  EUR: { codigo: 'EUR', nombre: 'Euro', simbolo: '€', decimales: 2 },
};

// `tasas[X]` = cuántos pesos vale 1 unidad de X (1 USD = 3.314 COP).
const estado = { moneda: 'COP', tasas: { COP: 1 }, fecha: null };

export function configurarMoneda({ moneda, tasas, fecha }) {
  estado.tasas = { COP: 1, ...(tasas || {}) };
  estado.fecha = fecha || null;
  estado.moneda = moneda && estado.tasas[moneda] ? moneda : 'COP';
}

export const monedaActual = () => estado.moneda;
export const tasaMoneda = (codigo = estado.moneda) => estado.tasas[codigo] || 1;
export const fechaTasas = () => estado.fecha;

const redondear = (n) => Math.round(n * 100) / 100;

// Pesos guardados -> número en la moneda elegida.
export const aMonedaVista = (cop) => (Number(cop) || 0) / tasaMoneda();
// Número escrito en la moneda elegida -> pesos (2 decimales).
export const aCop = (valor) => redondear((Number(valor) || 0) * tasaMoneda());
