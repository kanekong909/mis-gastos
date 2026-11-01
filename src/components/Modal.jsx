import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

export default function Modal({ abierto, onCerrar, titulo, children }) {
  useEffect(() => {
    if (!abierto) return;
    const alPresionar = (e) => e.key === 'Escape' && onCerrar();
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, [abierto, onCerrar]);

  return createPortal(
    <AnimatePresence>
      {abierto && (
        <motion.div
          className="modal-fondo"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}
        >
          <motion.div
            className="modal"
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          >
            <div className="modal-cab">
              <h3>{titulo}</h3>
              <button className="btn-icono" onClick={onCerrar} aria-label="Cerrar"><X size={20} /></button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export function Confirmar({ abierto, onCerrar, onConfirmar, titulo = '¿Estás seguro?', mensaje, textoBoton = 'Eliminar', cargando }) {
  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo={titulo}>
      <p className="texto-2" style={{ marginBottom: 20 }}>{mensaje}</p>
      <div className="modal-pie">
        <button className="btn btn-secundario" onClick={onCerrar}>Cancelar</button>
        <button className="btn btn-peligro" onClick={onConfirmar} disabled={cargando}>{textoBoton}</button>
      </div>
    </Modal>
  );
}
