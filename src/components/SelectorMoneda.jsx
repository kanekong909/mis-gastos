import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, CircleDollarSign, RefreshCw } from 'lucide-react';
import { useMoneda } from '../context/MonedaContext';
import { MONEDAS } from '../utils/moneda';

const fechaLarga = (f) => {
  if (!f) return '';
  const [y, m, d] = String(f).slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Botón con un menú para elegir la moneda en que se ven y escriben los montos.
export default function SelectorMoneda({ etiqueta, lado = 'abajo-derecha', className = 'btn-icono' }) {
  const { moneda, cambiarMoneda, info, recargar } = useMoneda();
  const [abierto, setAbierto] = useState(false);
  const [recargando, setRecargando] = useState(false);
  const caja = useRef(null);

  useEffect(() => {
    if (!abierto) return;
    const cerrar = (e) => {
      if (e.type === 'keydown' ? e.key === 'Escape' : !caja.current?.contains(e.target)) setAbierto(false);
    };
    document.addEventListener('mousedown', cerrar);
    document.addEventListener('keydown', cerrar);
    return () => {
      document.removeEventListener('mousedown', cerrar);
      document.removeEventListener('keydown', cerrar);
    };
  }, [abierto]);

  const reintentar = async () => {
    setRecargando(true);
    await recargar();
    setRecargando(false);
  };

  const detalle = (codigo) => {
    if (codigo === 'COP') return 'Moneda base';
    const t = info.tasas?.[codigo];
    return t ? `1 ${codigo} = $${Math.round(t).toLocaleString('es-CO')}` : 'Sin tasa';
  };

  return (
    <div className="acento-caja" ref={caja}>
      <button className={className} onClick={() => setAbierto((a) => !a)} title="Moneda" aria-label="Moneda" aria-expanded={abierto}>
        <CircleDollarSign size={19} />
        {etiqueta ? <span>{etiqueta} · {moneda}</span> : <span className="moneda-codigo">{moneda}</span>}
      </button>
      <AnimatePresence>
        {abierto && (
          <motion.div
            className={`acento-menu moneda-menu acento-${lado}`}
            initial={{ opacity: 0, scale: 0.92, y: lado.startsWith('arriba') ? 8 : -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.15 }}
          >
            <div className="acento-titulo">Moneda</div>
            <div className="moneda-opciones">
              {Object.values(MONEDAS).map((m) => (
                <button
                  key={m.codigo}
                  type="button"
                  className={`moneda-opcion ${moneda === m.codigo ? 'activo' : ''}`}
                  onClick={() => { cambiarMoneda(m.codigo); setAbierto(false); }}
                  aria-pressed={moneda === m.codigo}
                >
                  <span className="moneda-cod">{m.codigo}</span>
                  <span className="moneda-det"><b>{m.nombre}</b><small>{detalle(m.codigo)}</small></span>
                  {moneda === m.codigo && <Check size={16} strokeWidth={3} />}
                </button>
              ))}
            </div>
            <p className="moneda-nota">
              Tus montos se guardan en pesos (COP) y se convierten con la tasa de cambio del día.
              {info.fecha && <> Tasa del {fechaLarga(info.fecha)}.</>}
            </p>
            {info.estado === 'desactualizada' && <p className="moneda-aviso">No se pudo actualizar; se usa la última tasa guardada.</p>}
            {info.estado === 'sin-tasas' && <p className="moneda-aviso">No se pudieron obtener las tasas de cambio.</p>}
            {(info.estado === 'desactualizada' || info.estado === 'sin-tasas') && (
              <button type="button" className="btn-link" onClick={reintentar} disabled={recargando}>
                <RefreshCw size={13} /> {recargando ? 'Actualizando…' : 'Reintentar'}
              </button>
            )}
            {info.fuente === 'ExchangeRate-API' && (
              <p className="moneda-nota"><a href="https://www.exchangerate-api.com" target="_blank" rel="noreferrer">Tasas de ExchangeRate-API</a></p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
