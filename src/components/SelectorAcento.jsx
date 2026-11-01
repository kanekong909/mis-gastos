import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Palette } from 'lucide-react';
import { useTema } from '../context/TemaContext';
import { ACENTOS } from '../utils/acentos';

// Botón con un menú para elegir el color del tema.
// `etiqueta` muestra un texto junto al icono (menú lateral);
// `lado` indica hacia dónde se abre el menú.
export default function SelectorAcento({ etiqueta, lado = 'abajo-derecha', className = 'btn-icono' }) {
  const { acento, setAcento } = useTema();
  const [abierto, setAbierto] = useState(false);
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

  return (
    <div className="acento-caja" ref={caja}>
      <button className={className} onClick={() => setAbierto((a) => !a)} title="Color del tema" aria-label="Color del tema" aria-expanded={abierto}>
        <Palette size={19} />
        {etiqueta && <span>{etiqueta}</span>}
      </button>
      <AnimatePresence>
        {abierto && (
          <motion.div
            className={`acento-menu acento-${lado}`}
            initial={{ opacity: 0, scale: 0.92, y: lado.startsWith('arriba') ? 8 : -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.15 }}
          >
            <div className="acento-titulo">Color del tema</div>
            <div className="acento-opciones">
              {ACENTOS.map((a) => (
                <button
                  key={a.id}
                  data-acento={a.id}
                  className={`acento-muestra ${acento === a.id ? 'activo' : ''}`}
                  onClick={() => setAcento(a.id)}
                  title={a.nombre}
                  aria-label={a.nombre}
                  aria-pressed={acento === a.id}
                >
                  {acento === a.id && <Check size={16} strokeWidth={3} />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
