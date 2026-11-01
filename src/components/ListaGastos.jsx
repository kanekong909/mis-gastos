import { AnimatePresence, motion } from 'framer-motion';
import { Pencil, Trash2, Receipt } from 'lucide-react';
import { dinero, diaClave, fechaLarga, hora } from '../utils/formato';

function FilaGasto({ g, onEditar, onEliminar, indice = 0 }) {
  return (
    <motion.div
      layout
      className="gasto"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ duration: 0.22, delay: Math.min(indice, 12) * 0.025 }}
    >
      <div className="gasto-icono" style={{ background: `${g.categoria_color}22`, color: g.categoria_color }}>
        {g.categoria?.[0]}
      </div>
      <div className="gasto-info">
        <div className="gasto-desc">{g.descripcion || g.categoria}</div>
        <div className="gasto-meta">
          <span>{g.categoria}</span>·<span>{g.billetera}</span>·<span>{hora(g.fecha)}</span>
        </div>
      </div>
      <div className="gasto-monto">-{dinero(g.monto)}</div>
      {(onEditar || onEliminar) && (
        <div className="gasto-acciones">
          {onEditar && <button className="btn-icono" onClick={() => onEditar(g)} aria-label="Editar"><Pencil size={16} /></button>}
          {onEliminar && <button className="btn-icono peligro" onClick={() => onEliminar(g)} aria-label="Eliminar"><Trash2 size={16} /></button>}
        </div>
      )}
    </motion.div>
  );
}

export function SinGastos({ texto = 'No hay gastos en este periodo' }) {
  return (
    <div className="vacio">
      <Receipt size={42} />
      <span>{texto}</span>
    </div>
  );
}

// Lista agrupada por día con el total de cada día.
export default function ListaGastos({ gastos, onEditar, onEliminar, agrupar = true }) {
  if (!gastos.length) return <SinGastos />;

  if (!agrupar) {
    return (
      <div className="lista-gastos">
        <AnimatePresence initial={false}>
          {gastos.map((g, i) => <FilaGasto key={g.id} g={g} indice={i} onEditar={onEditar} onEliminar={onEliminar} />)}
        </AnimatePresence>
      </div>
    );
  }

  const grupos = [];
  gastos.forEach((g) => {
    const clave = diaClave(g.fecha);
    let grupo = grupos[grupos.length - 1];
    if (!grupo || grupo.clave !== clave) grupos.push((grupo = { clave, fecha: g.fecha, items: [], total: 0 }));
    grupo.items.push(g);
    grupo.total += Number(g.monto);
  });

  return (
    <div className="lista-gastos">
      {grupos.map((gr) => (
        <div className="grupo-dia" key={gr.clave}>
          <div className="grupo-dia-cab">
            <span>{fechaLarga(gr.fecha)}</span>
            <span>{dinero(gr.total)}</span>
          </div>
          <AnimatePresence initial={false}>
            {gr.items.map((g, i) => <FilaGasto key={g.id} g={g} indice={i} onEditar={onEditar} onEliminar={onEliminar} />)}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
