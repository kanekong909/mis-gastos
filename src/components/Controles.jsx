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

export function SelectorColor({ valor, onCambio }) {
  return (
    <div className="colores">
      {COLORES.map((c) => (
        <button
          key={c}
          type="button"
          className={`color-opcion ${valor === c ? 'activo' : ''}`}
          style={{ background: c }}
          onClick={() => onCambio(c)}
          aria-label={`Color ${c}`}
        />
      ))}
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
