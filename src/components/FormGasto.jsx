import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarClock } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../api';
import { ahoraLocal, aInputFecha } from '../utils/formato';
import SelectorConCreacion from './SelectorConCreacion';
import InputMonto from './InputMonto';
import MontosRapidos from './MontosRapidos';
import FechaHora from './FechaHora';
import ModalCategorias from './ModalCategorias';
import InputDescripcion from './InputDescripcion';
import { sugerirFecha } from '../utils/sugerirFecha';

export default function FormGasto({ inicial, onGuardado, textoBoton = 'Guardar gasto' }) {
  const [billeteras, setBilleteras] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [form, setForm] = useState(() => ({
    monto: inicial ? String(Number(inicial.monto)) : '',
    billetera_id: inicial?.billetera_id ?? null,
    categoria_id: inicial?.categoria_id ?? null,
    fecha: inicial ? aInputFecha(inicial.fecha) : ahoraLocal(),
    descripcion: inicial?.descripcion ?? '',
  }));
  const [guardando, setGuardando] = useState(false);
  const [gestionando, setGestionando] = useState(false);
  // Para sugerir el mes: últimos gastos ingresados y los meses que el usuario ya rechazó.
  const [recientes, setRecientes] = useState([]);
  const [rechazadas, setRechazadas] = useState([]);

  const cargar = async () => {
    const [b, c] = await Promise.all([api.billeteras.listar(), api.categorias.listar()]);
    setBilleteras(b);
    setCategorias(c);
    return [b, c];
  };

  const cargarRecientes = () => {
    if (!inicial) api.gastos.recientes().then(setRecientes).catch(() => {});
  };

  useEffect(() => {
    cargarRecientes();
    cargar()
      .then(([b]) => {
        // Preselecciona la primera billetera para agilizar el registro.
        if (!inicial && b.length) setForm((f) => ({ ...f, billetera_id: f.billetera_id ?? b[0].id }));
      })
      .catch((e) => toast.error(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (campo) => (v) => setForm((f) => ({ ...f, [campo]: v }));

  // Al elegir una descripción anterior, si aún no hay categoría se usa la que tenía.
  const elegirSugerencia = (s) => {
    setForm((f) => (f.categoria_id || !categorias.some((c) => c.id === s.categoria_id) ? f : { ...f, categoria_id: s.categoria_id }));
  };

  // Mes sugerido (solo al registrar, no al editar), salvo que ya se haya dicho que no.
  const sugerenciaFecha = useMemo(() => {
    if (inicial) return null;
    const sug = sugerirFecha({ descripcion: form.descripcion, fechaForm: form.fecha, recientes });
    return sug && !rechazadas.includes(sug.clave) ? sug : null;
  }, [inicial, form.descripcion, form.fecha, recientes, rechazadas]);

  const crearBilletera = async (datos) => {
    const r = await api.billeteras.crear(datos);
    await cargar();
    set('billetera_id')(r.id);
    toast.success(`Billetera "${datos.nombre}" creada`);
  };
  const crearCategoria = async (datos) => {
    const r = await api.categorias.crear(datos);
    await cargar();
    set('categoria_id')(r.id);
    toast.success(`Categoría "${datos.nombre}" creada`);
  };

  const enviar = async (e) => {
    e.preventDefault();
    if (!(Number(form.monto) > 0)) return toast.error('Ingresa un monto mayor a cero');
    if (!form.categoria_id) return toast.error('Escoge una categoría');
    setGuardando(true);
    try {
      const datos = { ...form, monto: Number(form.monto), fecha: form.fecha.replace('T', ' ') };
      if (inicial) await api.gastos.editar(inicial.id, datos);
      else await api.gastos.crear(datos);
      toast.success(inicial ? 'Gasto actualizado' : 'Gasto registrado');
      if (!inicial) {
        setForm((f) => ({ ...f, monto: '', descripcion: '', fecha: ahoraLocal() }));
        cargar();
        cargarRecientes();
      }
      onGuardado?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={enviar}>
      <div className="monto-caja">
        <label htmlFor="monto">Monto</label>
        <InputMonto
          id="monto"
          className="input input-monto"
          placeholder="$0"
          value={form.monto}
          onChange={set('monto')}
          autoFocus={!inicial}
        />
        <MontosRapidos valor={form.monto} onAjustar={(calcular) => setForm((f) => ({ ...f, monto: calcular(Number(f.monto) || 0) }))} />
      </div>

      <SelectorConCreacion
        etiqueta="Billetera"
        items={billeteras}
        valor={form.billetera_id}
        onCambio={set('billetera_id')}
        onCrear={crearBilletera}
        conSaldo
        textoNinguna="Sin billetera"
      />
      <SelectorConCreacion
        etiqueta="Categoría"
        items={categorias}
        valor={form.categoria_id}
        onCambio={set('categoria_id')}
        onCrear={crearCategoria}
        onGestionar={() => setGestionando(true)}
      />
      <ModalCategorias abierto={gestionando} onCerrar={() => setGestionando(false)} onCambio={cargar} />

      <div className="campo">
        <label htmlFor="desc">Descripción</label>
        <InputDescripcion
          id="desc"
          placeholder="Ej: almuerzo, taxi, mercado…"
          maxLength={255}
          value={form.descripcion}
          onChange={set('descripcion')}
          onElegir={elegirSugerencia}
        />
      </div>
      <div className="campo">
        <label>Fecha y hora</label>
        <FechaHora value={form.fecha} onChange={set('fecha')} />
        <AnimatePresence>
          {sugerenciaFecha && (
            <motion.div
              className="sugerencia-fecha"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <CalendarClock size={20} className="sugerencia-fecha-icono" />
              <div className="sugerencia-fecha-texto">
                <strong>¿Este registro es de {sugerenciaFecha.etiqueta}?</strong>
                <span>
                  {sugerenciaFecha.motivo === 'descripcion'
                    ? 'Lo mencionas en la descripción.'
                    : 'Tus últimos registros son de ese mes.'}
                </span>
              </div>
              <div className="sugerencia-fecha-botones">
                <button type="button" className="btn btn-primario" onClick={() => set('fecha')(sugerenciaFecha.fecha)}>
                  Usar {sugerenciaFecha.diaTexto}
                </button>
                <button type="button" className="btn btn-secundario" onClick={() => setRechazadas((r) => [...r, sugerenciaFecha.clave])}>
                  No
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button className="btn btn-primario btn-bloque" disabled={guardando}>
        {guardando ? 'Guardando…' : textoBoton}
      </button>
    </form>
  );
}
