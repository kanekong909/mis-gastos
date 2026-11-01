import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Clock } from 'lucide-react';
import { MESES, ahoraLocal } from '../utils/formato';

const DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const pad = (n) => String(n).padStart(2, '0');
const claveDia = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const haceDias = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return claveDia(d); };
const textoFecha = (clave) => {
  const [y, m, d] = clave.split('-').map(Number);
  const t = new Date(y, m - 1, d).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' });
  return t.charAt(0).toUpperCase() + t.slice(1);
};

function Calendario({ seleccionado, onElegir }) {
  const [vista, setVista] = useState(() => {
    const [y, m] = seleccionado.split('-').map(Number);
    return { y, m: m - 1 };
  });
  const hoy = claveDia(new Date());
  const primerDia = (new Date(vista.y, vista.m, 1).getDay() + 6) % 7; // lunes = 0
  const diasMes = new Date(vista.y, vista.m + 1, 0).getDate();
  const esMesActual = vista.y === new Date().getFullYear() && vista.m === new Date().getMonth();

  const mover = (delta) => setVista(({ y, m }) => {
    const d = new Date(y, m + delta, 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  return (
    <div className="fh-calendario">
      <div className="fh-cal-cab">
        <button type="button" className="btn-icono" onClick={() => mover(-1)} aria-label="Mes anterior"><ChevronLeft size={18} /></button>
        <span>{MESES[vista.m]} {vista.y}</span>
        <button type="button" className="btn-icono" onClick={() => mover(1)} disabled={esMesActual} aria-label="Mes siguiente"><ChevronRight size={18} /></button>
      </div>
      <div className="fh-cal-rejilla">
        {DIAS.map((d) => <span key={d} className="fh-cal-dia-sem">{d}</span>)}
        {Array.from({ length: primerDia }, (_, i) => <span key={`v${i}`} />)}
        {Array.from({ length: diasMes }, (_, i) => {
          const clave = `${vista.y}-${pad(vista.m + 1)}-${pad(i + 1)}`;
          const futuro = clave > hoy;
          return (
            <button
              type="button"
              key={clave}
              disabled={futuro}
              className={`fh-cal-dia ${clave === seleccionado ? 'activo' : ''} ${clave === hoy ? 'hoy' : ''}`}
              onClick={() => onElegir(clave)}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Rueda({ valor, onSubir, onBajar, etiqueta }) {
  return (
    <div className="fh-rueda">
      <button type="button" onClick={onSubir} aria-label={`Subir ${etiqueta}`}><ChevronUp size={18} /></button>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={valor}
          className="fh-rueda-valor"
          initial={{ y: -8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 8, opacity: 0 }}
          transition={{ duration: 0.12 }}
        >
          {valor}
        </motion.span>
      </AnimatePresence>
      <button type="button" onClick={onBajar} aria-label={`Bajar ${etiqueta}`}><ChevronDown size={18} /></button>
    </div>
  );
}

// Selector de fecha y hora. `value` usa el formato "YYYY-MM-DDTHH:MM".
export default function FechaHora({ value, onChange }) {
  const [fecha, horaMin] = value.split('T');
  const [h, mi] = horaMin.split(':').map(Number);
  const [calendario, setCalendario] = useState(false);

  const hoy = haceDias(0);
  const ayer = haceDias(1);
  const otroDia = fecha !== hoy && fecha !== ayer;
  const pm = h >= 12;

  const setFecha = (f) => onChange(`${f}T${pad(h)}:${pad(mi)}`);
  const setHora = (hh, mm) => onChange(`${fecha}T${pad((hh + 24) % 24)}:${pad((mm + 60) % 60)}`);

  return (
    <div className="fh">
      <div className="chips">
        {[[hoy, 'Hoy'], [ayer, 'Ayer']].map(([clave, texto]) => (
          <button
            key={texto}
            type="button"
            className={`chip ${fecha === clave ? 'activo' : ''}`}
            onClick={() => { setFecha(clave); setCalendario(false); }}
          >
            {texto}
          </button>
        ))}
        <button type="button" className={`chip ${otroDia ? 'activo' : ''}`} onClick={() => setCalendario((c) => !c)}>
          <CalendarDays size={15} />
          {otroDia ? textoFecha(fecha) : 'Otro día'}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {calendario && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
            <Calendario seleccionado={fecha} onElegir={(f) => { setFecha(f); setCalendario(false); }} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fh-hora">
        <Clock size={18} className="texto-3" />
        <Rueda etiqueta="hora" valor={pad(h % 12 || 12)} onSubir={() => setHora(h + 1, mi)} onBajar={() => setHora(h - 1, mi)} />
        <span className="fh-dos-puntos">:</span>
        <Rueda etiqueta="minutos" valor={pad(mi)} onSubir={() => setHora(h, mi + 5 - (mi % 5))} onBajar={() => setHora(h, mi % 5 ? mi - (mi % 5) : mi - 5)} />
        <div className="segmentado fh-ampm">
          {[['a. m.', false], ['p. m.', true]].map(([texto, esPm]) => (
            <button key={texto} type="button" className={pm === esPm ? 'activo fh-ampm-activo' : ''} onClick={() => pm !== esPm && setHora(h + (esPm ? 12 : -12), mi)}>
              <span>{texto}</span>
            </button>
          ))}
        </div>
        <button type="button" className="btn-link fh-ahora" onClick={() => { onChange(ahoraLocal()); setCalendario(false); }}>Ahora</button>
      </div>
    </div>
  );
}
