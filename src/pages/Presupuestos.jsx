import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Plus, Copy, Pencil, Trash2, PiggyBank, AlertTriangle } from 'lucide-react';
import { api } from '../api';
import { dinero, MESES } from '../utils/formato';
import { SelectorPeriodo, listaAnios } from '../components/Controles';
import Modal, { Confirmar } from '../components/Modal';
import InputMonto from '../components/InputMonto';

function Anillo({ pct, color }) {
  const r = 38;
  const c = 2 * Math.PI * r;
  const lleno = Math.min(pct, 100);
  return (
    <div className="anillo-wrap">
      <svg width="92" height="92" viewBox="0 0 92 92">
        <circle cx="46" cy="46" r={r} fill="none" stroke="var(--superficie-2)" strokeWidth="9" />
        <motion.circle
          cx="46" cy="46" r={r} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (lleno / 100) * c }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          transform="rotate(-90 46 46)"
        />
      </svg>
      <span className="pct" style={{ color: pct > 100 ? 'var(--peligro)' : undefined }}>{Math.round(pct)}%</span>
    </div>
  );
}

function colorEstado(pct, base) {
  if (pct > 100) return 'var(--peligro)';
  if (pct >= 80) return 'var(--alerta)';
  return base;
}

export default function Presupuestos() {
  const hoy = new Date();
  const [periodo, setPeriodo] = useState({ anio: hoy.getFullYear(), mes: hoy.getMonth() + 1 });
  const [lista, setLista] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [modal, setModal] = useState({ abierto: false, item: null });
  const [form, setForm] = useState({ categoria_id: '', monto: '' });
  const [eliminando, setEliminando] = useState(null);

  const cargar = useCallback(() => {
    api.presupuestos.listar(periodo).then(setLista).catch((e) => toast.error(e.message));
  }, [periodo]);

  useEffect(cargar, [cargar]);
  useEffect(() => { api.categorias.listar().then(setCategorias).catch(() => {}); }, []);

  const abrir = (item = null) => {
    const libres = categorias.filter((c) => !lista?.some((p) => p.categoria_id === c.id));
    setForm(item ? { categoria_id: item.categoria_id, monto: String(Number(item.monto)) } : { categoria_id: libres[0]?.id ?? '', monto: '' });
    setModal({ abierto: true, item });
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (!(Number(form.monto) > 0)) return toast.error('Ingresa un monto mayor a cero');
    try {
      if (modal.item) await api.presupuestos.editar(modal.item.id, { monto: Number(form.monto) });
      else await api.presupuestos.crear({ ...periodo, categoria_id: Number(form.categoria_id), monto: Number(form.monto) });
      toast.success('Presupuesto guardado');
      setModal({ abierto: false, item: null });
      cargar();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const copiarAnterior = async () => {
    const desde = periodo.mes === 1 ? { anio: periodo.anio - 1, mes: 12 } : { anio: periodo.anio, mes: periodo.mes - 1 };
    try {
      const r = await api.presupuestos.copiar({ ...periodo, desde_anio: desde.anio, desde_mes: desde.mes });
      toast.success(r.copiados ? `Se copiaron ${r.copiados} presupuesto(s) de ${MESES[desde.mes - 1]}` : `No había presupuestos nuevos en ${MESES[desde.mes - 1]}`);
      cargar();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const eliminar = async () => {
    try {
      await api.presupuestos.eliminar(eliminando.id);
      toast.success('Presupuesto eliminado');
      setEliminando(null);
      cargar();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const totalPres = (lista || []).reduce((s, p) => s + Number(p.monto), 0);
  const totalGast = (lista || []).reduce((s, p) => s + Number(p.gastado), 0);
  const pctTotal = totalPres ? (totalGast / totalPres) * 100 : 0;
  const disponibles = categorias.filter((c) => !lista?.some((p) => p.categoria_id === c.id));

  return (
    <>
      <div className="encabezado">
        <div>
          <h1>Presupuestos</h1>
          <p>Define cuánto quieres gastar por categoría en {MESES[periodo.mes - 1].toLowerCase()} y mira cómo se va llenando.</p>
        </div>
        <div className="acciones">
          <SelectorPeriodo anio={periodo.anio} mes={periodo.mes} anios={listaAnios([periodo.anio + 1])} onCambio={(anio, mes) => setPeriodo({ anio, mes })} />
          <button className="btn btn-secundario" onClick={copiarAnterior} title="Copiar presupuestos del mes anterior"><Copy size={16} /> Copiar mes anterior</button>
          <button className="btn btn-primario" onClick={() => abrir()} disabled={!disponibles.length}><Plus size={17} /> Nuevo</button>
        </div>
      </div>

      {lista?.length > 0 && (
        <motion.div className="tarjeta mb" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="presupuesto-cab">
            <div className="titulo"><PiggyBank size={20} /> Total del mes</div>
            <span className="negrita">{dinero(totalGast)} <span className="texto-3">/ {dinero(totalPres)}</span></span>
          </div>
          <div className="barra" style={{ height: 14 }}>
            <motion.div className="barra-relleno" style={{ background: colorEstado(pctTotal, 'var(--primario)') }} initial={{ width: 0 }} animate={{ width: `${Math.min(pctTotal, 100)}%` }} transition={{ duration: 0.8 }} />
          </div>
          <div className="presupuesto-pie">
            <span>{Math.round(pctTotal)}% usado</span>
            <span className={totalPres - totalGast < 0 ? 'excedido' : ''}>
              {totalPres - totalGast < 0 ? `Excedido por ${dinero(totalGast - totalPres)}` : `Disponible ${dinero(totalPres - totalGast)}`}
            </span>
          </div>
        </motion.div>
      )}

      {lista === null ? (
        <div className="rejilla rejilla-presupuestos">{[1, 2, 3].map((k) => <div key={k} className="esqueleto" style={{ height: 180 }} />)}</div>
      ) : lista.length === 0 ? (
        <div className="tarjeta">
          <div className="vacio">
            <PiggyBank size={46} />
            <span>No tienes presupuestos para {MESES[periodo.mes - 1]} {periodo.anio}</span>
            <div className="acciones" style={{ justifyContent: 'center' }}>
              <button className="btn btn-primario" onClick={() => abrir()}><Plus size={16} /> Crear presupuesto</button>
              <button className="btn btn-secundario" onClick={copiarAnterior}><Copy size={16} /> Copiar mes anterior</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rejilla rejilla-presupuestos">
          <AnimatePresence>
            {lista.map((p, i) => {
              const pct = Number(p.monto) ? (Number(p.gastado) / Number(p.monto)) * 100 : 0;
              const restante = Number(p.monto) - Number(p.gastado);
              const color = colorEstado(pct, p.color);
              return (
                <motion.div
                  key={p.id}
                  layout
                  className="tarjeta presupuesto-tarjeta"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <div className="presupuesto-cab">
                    <div className="titulo"><span className="punto" style={{ background: p.color }} /> {p.categoria}</div>
                    <div className="gasto-acciones">
                      <button className="btn-icono" onClick={() => abrir(p)} aria-label="Editar"><Pencil size={16} /></button>
                      <button className="btn-icono peligro" onClick={() => setEliminando(p)} aria-label="Eliminar"><Trash2 size={16} /></button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                    <Anillo pct={pct} color={color} />
                    <div>
                      <div className="texto-3" style={{ fontSize: '.8rem' }}>Gastado</div>
                      <div className="negrita" style={{ fontSize: '1.25rem' }}>{dinero(p.gastado)}</div>
                      <div className="texto-3" style={{ fontSize: '.8rem' }}>de {dinero(p.monto)}</div>
                    </div>
                  </div>
                  <div>
                    <div className="barra">
                      <motion.div className="barra-relleno" style={{ background: color }} initial={{ width: 0 }} animate={{ width: `${Math.min(pct, 100)}%` }} transition={{ duration: 0.8 }} />
                    </div>
                    <div className="presupuesto-pie">
                      {restante < 0 ? (
                        <span className="excedido"><AlertTriangle size={13} style={{ verticalAlign: -2 }} /> Te pasaste {dinero(-restante)}</span>
                      ) : (
                        <span>Te quedan {dinero(restante)}</span>
                      )}
                      {pct >= 80 && pct <= 100 && <span style={{ color: 'var(--alerta)', fontWeight: 700 }}>Casi al límite</span>}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <Modal abierto={modal.abierto} onCerrar={() => setModal({ abierto: false, item: null })} titulo={modal.item ? 'Editar presupuesto' : 'Nuevo presupuesto'}>
        <form onSubmit={guardar}>
          <div className="campo">
            <label>Categoría</label>
            {modal.item ? (
              <input className="input" value={modal.item.categoria} disabled />
            ) : (
              <select className="select" value={form.categoria_id} onChange={(e) => setForm({ ...form, categoria_id: e.target.value })} required>
                {disponibles.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            )}
          </div>
          <div className="campo">
            <label>Monto máximo para {MESES[periodo.mes - 1]} {periodo.anio}</label>
            <InputMonto required autoFocus value={form.monto} onChange={(monto) => setForm({ ...form, monto })} placeholder="Ej: 400.000" />
          </div>
          <div className="modal-pie">
            <button type="button" className="btn btn-secundario" onClick={() => setModal({ abierto: false, item: null })}>Cancelar</button>
            <button className="btn btn-primario">Guardar</button>
          </div>
        </form>
      </Modal>

      <Confirmar
        abierto={!!eliminando}
        onCerrar={() => setEliminando(null)}
        onConfirmar={eliminar}
        titulo="Eliminar presupuesto"
        mensaje={eliminando && `Se eliminará el presupuesto de ${eliminando.categoria}. Tus gastos no se borran.`}
      />
    </>
  );
}
