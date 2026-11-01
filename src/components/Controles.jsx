import { useId } from 'react';
import { motion } from 'framer-motion';
import { COLORES, MESES } from '../utils/formato';

export function Segmentado({ opciones, valor, onCambio }) {
  const id = useId();
  return (
    <div className="segmentado">
      {opciones.map((o) => (
        <button key={o.valor} type="button" className={valor === o.valor ? 'activo' : ''} onClick={() => onCambio(o.valor)}>
          {valor === o.valor && <motion.span layoutId={`seg-${id}`} className="seg-fondo" transition={{ type: 'spring', stiffness: 450, damping: 35 }} />}
          <span>{o.etiqueta}</span>
        </button>
      ))}
    </div>
  );
}

// `meses` limita las opciones de mes (números 1-12); sin él se muestran los 12.
export function SelectorPeriodo({ anio, mes, anios, meses, onCambio, permitirAnioCompleto }) {
  const opciones = meses ? [...new Set([...meses, mes])].filter(Boolean).sort((a, b) => a - b) : MESES.map((_, i) => i + 1);
  return (
    <div className="acciones">
      <select className="select select-mini" value={mes} onChange={(e) => onCambio(anio, Number(e.target.value))}>
        {permitirAnioCompleto && <option value={0}>Todo el año</option>}
        {opciones.map((m) => <option key={m} value={m}>{MESES[m - 1]}</option>)}
      </select>
      <select className="select select-mini" value={anio} onChange={(e) => onCambio(Number(e.target.value), mes)}>
        {anios.map((a) => <option key={a} value={a}>{a}</option>)}
      </select>
    </div>
  );
}

// `usados`: colores que ya tienen otras billeteras/categorías; no se pueden elegir.
export function SelectorColor({ valor, onCambio, usados = [] }) {
  const tomados = new Set(usados.map((c) => String(c).toLowerCase()));
  // Si el color actual no está en la paleta (p. ej. uno generado), se muestra igual.
  const opciones = COLORES.includes(valor) || !valor ? COLORES : [valor, ...COLORES];
  return (
    <div className="colores">
      {opciones.map((c) => {
        const ocupado = tomados.has(c.toLowerCase()) && c !== valor;
        return (
          <button
            key={c}
            type="button"
            disabled={ocupado}
            className={`color-opcion ${valor === c ? 'activo' : ''} ${ocupado ? 'ocupado' : ''}`}
            style={{ backgroundColor: c }}
            onClick={() => onCambio(c)}
            title={ocupado ? 'Ya está en uso' : undefined}
            aria-label={ocupado ? `Color ${c} (en uso)` : `Color ${c}`}
          />
        );
      })}
    </div>
  );
}

export function Cargando() {
  return <div className="cargando"><div className="spinner" /></div>;
}

// Años desde el actual hacia atrás, combinados con los que tienen datos.
export function listaAnios(conDatos = []) {
  const actual = new Date().getFullYear();
  const set = new Set([actual, actual - 1, ...conDatos]);
  return [...set].sort((a, b) => b - a);
}
