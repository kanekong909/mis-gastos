import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { CalendarDays } from 'lucide-react';
import { api } from '../api';
import { dinero } from '../utils/formato';
import InputMonto from './InputMonto';
import { Calendario } from './FechaHora';

const pad = (n) => String(n).padStart(2, '0');
const claveDia = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const haceDias = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return claveDia(d); };
const textoFecha = (clave) => {
  const [y, m, d] = clave.split('-').map(Number);
  const t = new Date(y, m - 1, d).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  return t.charAt(0).toUpperCase() + t.slice(1);
};
const num = (v) => Number(v) || 0;
const redondear = (n) => Math.round(n * 100) / 100;

// Lo que la hoja de Excel calculaba: deuda = valor + interés; pago mensual = deuda / cuotas + manejo.
const sugeridas = (f, deudaEscrita) => {
  const deuda = redondear(num(f.valor) + num(f.interes));
  const base = deudaEscrita ?? deuda;
  const cuotas = Math.max(1, Math.round(num(f.cuotas)) || 1);
  return { deuda, pago: redondear(base / cuotas + num(f.manejo_tarjeta)) };
};

const aTexto = (v) => (v === null || v === undefined || Number(v) === 0 ? '' : String(Number(v)));

// Crear o editar un crédito. Todos los campos se pueden escribir; la deuda total y el pago mensual
// se sugieren solos mientras no los toques.
export default function FormCredito({ inicial, prestadores = [], onGuardado }) {
  const [form, setForm] = useState(() => ({
    fecha: inicial ? String(inicial.fecha).slice(0, 10) : haceDias(0),
    prestador: inicial?.prestador ?? '',
    valor: aTexto(inicial?.valor),
    cuotas: inicial ? String(inicial.cuotas) : '1',
    interes: aTexto(inicial?.interes),
    interes_pct: aTexto(inicial?.interes_pct),
    manejo_tarjeta: aTexto(inicial?.manejo_tarjeta),
    pago_mensual: aTexto(inicial?.pago_mensual),
    deuda_total: aTexto(inicial?.deuda_total),
  }));
  // Al editar, un valor que ya no coincide con la sugerencia cuenta como escrito a mano.
  const [tocados, setTocados] = useState(() => {
    if (!inicial) return { deuda: false, pago: false };
    const s = sugeridas({ valor: inicial.valor, interes: inicial.interes, cuotas: inicial.cuotas, manejo_tarjeta: inicial.manejo_tarjeta }, Number(inicial.deuda_total));
    const sinPago = sugeridas({ valor: inicial.valor, interes: inicial.interes, cuotas: inicial.cuotas, manejo_tarjeta: inicial.manejo_tarjeta });
    return { deuda: redondear(Number(inicial.deuda_total)) !== sinPago.deuda, pago: redondear(Number(inicial.pago_mensual)) !== s.pago };
  });
  const [calendario, setCalendario] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const set = (campo) => (valor) => setForm((f) => ({ ...f, [campo]: valor }));

  const sug = sugeridas(form, tocados.deuda ? num(form.deuda_total) : undefined);
  const deudaMostrada = tocados.deuda ? form.deuda_total : (sug.deuda > 0 ? String(sug.deuda) : '');
  const pagoMostrado = tocados.pago ? form.pago_mensual : (sug.pago > 0 ? String(sug.pago) : '');

  const hoy = haceDias(0);
  const ayer = haceDias(1);
  const otroDia = form.fecha !== hoy && form.fecha !== ayer;

  const enviar = async (e) => {
    e.preventDefault();
    if (!form.prestador.trim()) return toast.error('Escribe quién te prestó');
    if (!(num(form.valor) > 0)) return toast.error('Ingresa el valor del crédito');
    const cuotas = Math.round(num(form.cuotas));
    if (cuotas < 1 || cuotas > 360) return toast.error('Las cuotas deben estar entre 1 y 360');
    setGuardando(true);
    try {
      const datos = {
        fecha: form.fecha,
        prestador: form.prestador,
        valor: num(form.valor),
        cuotas,
        interes: num(form.interes),
        interes_pct: form.interes_pct === '' ? null : num(form.interes_pct),
        manejo_tarjeta: num(form.manejo_tarjeta),
        pago_mensual: num(pagoMostrado),
        deuda_total: num(deudaMostrada),
      };
      if (inicial) await api.creditos.editar(inicial.id, datos);
      else await api.creditos.crear(datos);
      toast.success(inicial ? 'Crédito actualizado' : 'Crédito registrado');
      onGuardado?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const Sugerencia = ({ activo, actual, sugerida, alUsar }) =>
    activo && sugerida > 0 && redondear(num(actual)) !== sugerida ? (
      <button type="button" className="btn-link sugerido" onClick={alUsar}>Sugerido {dinero(sugerida)} · usar</button>
    ) : null;

  return (
    <form onSubmit={enviar} className="form-credito">
      <div className="campo">
        <label>Fecha</label>
        <div className="chips">
          {[[hoy, 'Hoy'], [ayer, 'Ayer']].map(([clave, texto]) => (
            <button key={texto} type="button" className={`chip ${form.fecha === clave ? 'activo' : ''}`}
              onClick={() => { set('fecha')(clave); setCalendario(false); }}>{texto}</button>
          ))}
          <button type="button" className={`chip ${otroDia ? 'activo' : ''}`} onClick={() => setCalendario((c) => !c)}>
            <CalendarDays size={15} /> {otroDia ? textoFecha(form.fecha) : 'Otro día'}
          </button>
        </div>
        <AnimatePresence initial={false}>
          {calendario && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
              <Calendario seleccionado={form.fecha} onElegir={(f) => { set('fecha')(f); setCalendario(false); }} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="campo">
        <label htmlFor="cred-prestador">Prestador</label>
        <input
          id="cred-prestador" className="input" list="cred-prestadores" maxLength={120} autoFocus={!inicial}
          placeholder="Ej: Combarranquilla, Bancolombia, tarjeta Falabella"
          value={form.prestador} onChange={(e) => set('prestador')(e.target.value)}
        />
        <datalist id="cred-prestadores">{prestadores.map((p) => <option key={p} value={p} />)}</datalist>
      </div>

      <div className="fila-campos">
        <div className="campo">
          <label>Valor</label>
          <InputMonto value={form.valor} onChange={set('valor')} placeholder="0" />
        </div>
        <div className="campo">
          <label htmlFor="cred-cuotas">Cuotas</label>
          <input id="cred-cuotas" className="input" inputMode="numeric" maxLength={3} placeholder="1"
            value={form.cuotas} onChange={(e) => set('cuotas')(e.target.value.replace(/\D/g, ''))} />
        </div>
      </div>

      <div className="fila-campos">
        <div className="campo">
          <label>Interés</label>
          <InputMonto value={form.interes} onChange={set('interes')} placeholder="0" />
        </div>
        <div className="campo">
          <label>% interés fijo</label>
          <InputMonto value={form.interes_pct} onChange={set('interes_pct')} placeholder="0" />
        </div>
      </div>

      <div className="fila-campos">
        <div className="campo">
          <label>Manejo tarjeta</label>
          <InputMonto value={form.manejo_tarjeta} onChange={set('manejo_tarjeta')} placeholder="0" />
        </div>
        <div className="campo">
          <label>Pago mensual</label>
          <InputMonto
            value={pagoMostrado}
            onChange={(v) => { setTocados((t) => ({ ...t, pago: true })); set('pago_mensual')(v); }}
            placeholder="0"
          />
          <Sugerencia activo={tocados.pago} actual={pagoMostrado} sugerida={sug.pago} alUsar={() => setTocados((t) => ({ ...t, pago: false }))} />
        </div>
      </div>

      <div className="campo">
        <label>Deuda total</label>
        <InputMonto
          value={deudaMostrada}
          onChange={(v) => { setTocados((t) => ({ ...t, deuda: true })); set('deuda_total')(v); }}
          placeholder="0"
        />
        <Sugerencia activo={tocados.deuda} actual={deudaMostrada} sugerida={sug.deuda} alUsar={() => setTocados((t) => ({ ...t, deuda: false }))} />
      </div>

      <button className="btn btn-primario btn-bloque" disabled={guardando}>
        {guardando ? 'Guardando…' : inicial ? 'Guardar cambios' : 'Guardar crédito'}
      </button>
    </form>
  );
}
