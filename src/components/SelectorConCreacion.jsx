import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Check, X, WalletMinimal, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import { colorLibre, COLORES, dinero } from '../utils/formato';
import { SelectorColor } from './Controles';
import InputMonto from './InputMonto';

// Lista de chips con la opción de crear uno nuevo ahí mismo.
export default function SelectorConCreacion({ etiqueta, items, valor, onCambio, onCrear, conSaldo, textoNinguna, onGestionar }) {
  const [creando, setCreando] = useState(false);
  const [nombre, setNombre] = useState('');
  const [color, setColor] = useState(COLORES[0]);
  const [saldo, setSaldo] = useState('');
  const [guardando, setGuardando] = useState(false);

  const coloresUsados = items.map((it) => it.color);
  // Al abrir el creador se propone un color que ninguna otra billetera/categoría use.
  const alternarCreador = () => {
    if (!creando) setColor(colorLibre(coloresUsados));
    setCreando((c) => !c);
  };

  const crear = async () => {
    if (!nombre.trim()) return;
    setGuardando(true);
    try {
      await onCrear({ nombre: nombre.trim(), color, saldo_inicial: Number(saldo) || 0 });
      setNombre(''); setSaldo(''); setCreando(false);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="campo">
      <div className="campo-cab">
        <label>{etiqueta}</label>
        {onGestionar && (
          <button type="button" className="btn-link" onClick={onGestionar}><Pencil size={13} /> Editar</button>
        )}
      </div>
      <div className="chips">
        {textoNinguna && (
          <motion.button
            layout
            type="button"
            className={`chip ${valor === null ? 'activo' : ''}`}
            onClick={() => onCambio(null)}
            whileTap={{ scale: 0.95 }}
          >
            <WalletMinimal size={15} className="texto-3" />
            {textoNinguna}
          </motion.button>
        )}
        {items.map((it) => (
          <motion.button
            layout
            type="button"
            key={it.id}
            className={`chip ${valor === it.id ? 'activo' : ''}`}
            style={{ '--chip-color': it.color }}
            onClick={() => onCambio(it.id)}
            whileTap={{ scale: 0.95 }}
          >
            <span className="punto" style={{ background: it.color }} />
            {it.nombre}
            {conSaldo && <span className="texto-3" style={{ fontWeight: 500 }}>{dinero(it.saldo)}</span>}
          </motion.button>
        ))}
        <button type="button" className="chip chip-nuevo" onClick={alternarCreador}>
          {creando ? <X size={15} /> : <Plus size={15} />} {creando ? 'Cancelar' : 'Nueva'}
        </button>
      </div>

      <AnimatePresence>
        {creando && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="creador-rapido" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input
                  className="input"
                  placeholder={`Nombre de la ${etiqueta.toLowerCase()}`}
                  value={nombre}
                  autoFocus
                  onChange={(e) => setNombre(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); crear(); } }}
                />
                {conSaldo && (
                  <InputMonto placeholder="Saldo inicial" value={saldo} onChange={setSaldo} />
                )}
                <button type="button" className="btn btn-primario" onClick={crear} disabled={guardando || !nombre.trim()}>
                  <Check size={16} /> Crear
                </button>
              </div>
              <SelectorColor valor={color} onCambio={setColor} usados={coloresUsados} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
