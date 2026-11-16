import { createContext, Fragment, useCallback, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { configurarMoneda, MONEDAS } from '../utils/moneda';
import { leerCache, obtenerTasas } from '../utils/tasas';

const MonedaContext = createContext(null);

const guardada = () => {
  try {
    const m = localStorage.getItem('moneda');
    return MONEDAS[m] ? m : 'COP';
  } catch {
    return 'COP';
  }
};

// Moneda elegida + tasas de cambio. Todo el dinero sigue guardándose en pesos: esta pieza solo
// decide en qué moneda se ve y se escribe. Al cambiar de moneda se vuelve a pintar toda la app
// (por eso el `key`), así cada monto se recalcula con la tasa nueva.
export function MonedaProvider({ children }) {
  const [moneda, setMoneda] = useState(guardada);
  // Las tasas guardadas se leen de inmediato para que no haya parpadeo al abrir la app.
  const [info, setInfo] = useState(() => {
    const c = leerCache();
    return c ? { ...c, estado: 'cargando' } : { tasas: null, fecha: null, fuente: null, estado: 'cargando' };
  });

  const cargar = useCallback(async (forzar = false) => {
    const r = await obtenerTasas({ forzar });
    setInfo(r);
    return r;
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // Si no hay tasas para la moneda guardada, se muestra en pesos hasta que lleguen.
  const efectiva = moneda !== 'COP' && info.tasas?.[moneda] ? moneda : 'COP';
  configurarMoneda({ moneda: efectiva, tasas: info.tasas, fecha: info.fecha });

  const cambiarMoneda = (m) => {
    if (m !== 'COP' && !info.tasas?.[m]) {
      toast.error('No se pudieron obtener las tasas de cambio. Revisa tu conexión e inténtalo de nuevo.');
      return;
    }
    try { localStorage.setItem('moneda', m); } catch { /* sin storage */ }
    setMoneda(m);
  };

  return (
    <MonedaContext.Provider value={{ moneda: efectiva, cambiarMoneda, info, recargar: () => cargar(true) }}>
      <Fragment key={efectiva}>{children}</Fragment>
    </MonedaContext.Provider>
  );
}

export const useMoneda = () => useContext(MonedaContext);
