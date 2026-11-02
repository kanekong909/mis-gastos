import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Plus, SlidersHorizontal, Undo2, Zap } from 'lucide-react';
import { api } from '../api';
import { dinero } from '../utils/formato';
import { Segmentado } from './Controles';
import ModalAtajos from './ModalAtajos';

// Fecha y hora para el gasto: ahora, o ayer a la misma hora.
const fechaDe = (dia) => {
  const d = new Date();
  if (dia === 'ayer') d.setDate(d.getDate() - 1);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16).replace('T', ' ');
};

// Gastos que se repiten, listos con un toque. Se configuran en la ventana "Atajos".
export default function AtajosRapidos({ onRegistrado }) {
  const [atajos, setAtajos] = useState(null);
  const [dia, setDia] = useState('hoy');
  const [ocupado, setOcupado] = useState(null); // id del atajo que se está registrando
  const [configurando, setConfigurando] = useState(false);

  const cargar = useCallback(
    () => api.atajos.listar().then(setAtajos).catch((e) => toast.error(e.message)),
    []
  );
  useEffect(() => { cargar(); }, [cargar]);

  const deshacer = async (ids, tid) => {
    toast.dismiss(tid);
    try {
      await Promise.all(ids.map((id) => api.gastos.eliminar(id)));
      toast('Registro deshecho');
      onRegistrado?.();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const usar = async (a) => {
    if (ocupado) return;
    setOcupado(a.id);
    try {
      const r = await api.atajos.usar(a.id, fechaDe(dia));
      onRegistrado?.();
      toast.custom((t) => (
        <div className={`toast-deshacer ${t.visible ? 'entra' : 'sale'}`}>
          <span>
            <strong>{a.nombre}</strong>{r.ids.length > 1 ? ` ×${r.ids.length}` : ''} · −{dinero(r.total)}
            {dia === 'ayer' && ' (ayer)'}
          </span>
          <button onClick={() => deshacer(r.ids, t.id)}><Undo2 size={15} /> Deshacer</button>
        </div>
      ), { duration: 6000 });
    } catch (e) {
      toast.error(e.message);
    } finally {
      setOcupado(null);
    }
  };

  if (atajos === null) return null;

  return (
    <motion.div className="tarjeta atajos" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="tarjeta-cab">
        <h2><Zap size={16} style={{ verticalAlign: -2, marginRight: 6 }} />Rápidos</h2>
        <div className="atajos-cab-acciones">
          {atajos.length > 0 && (
            <Segmentado
              valor={dia}
              onCambio={setDia}
              opciones={[{ valor: 'hoy', etiqueta: 'Hoy' }, { valor: 'ayer', etiqueta: 'Ayer' }]}
            />
          )}
          <button className="btn btn-secundario" onClick={() => setConfigurando(true)}>
            <SlidersHorizontal size={15} /> <span className="solo-escritorio">Configurar</span>
          </button>
        </div>
      </div>

      {atajos.length === 0 ? (
        <div className="atajos-vacio">
          <span className="pista">Crea atajos para registrar con un toque lo que gastas seguido: pasaje, gasolina, almuerzo…</span>
          <button className="btn btn-primario" onClick={() => setConfigurando(true)}><Plus size={16} /> Crear atajo</button>
        </div>
      ) : (
        <div className="atajos-lista">
          {atajos.map((a) => (
            <motion.button
              key={a.id}
              className="atajo"
              onClick={() => usar(a)}
              disabled={ocupado !== null}
              whileTap={{ scale: 0.96 }}
              title={`${a.categoria}${a.billetera ? ` · ${a.billetera}` : ' · Sin billetera'}`}
            >
              <span className="atajo-icono" style={{ background: `${a.categoria_color}22`, color: a.categoria_color }}>
                {a.nombre[0]?.toUpperCase()}
              </span>
              <span className="atajo-texto">
                <span className="atajo-nombre">
                  {a.nombre}
                  {a.cantidad > 1 && <span className="atajo-veces">×{a.cantidad}</span>}
                </span>
                <span className="atajo-monto">{dinero(Number(a.monto) * a.cantidad)}</span>
              </span>
            </motion.button>
          ))}
        </div>
      )}

      <ModalAtajos abierto={configurando} onCerrar={() => setConfigurando(false)} onCambio={cargar} />
    </motion.div>
  );
}

