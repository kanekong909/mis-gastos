import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { CalendarClock, FileText, Landmark, Pencil, Percent, Plus, Trash2 } from 'lucide-react';
import { api } from '../api';
import { dinero, aFecha, MESES_CORTOS } from '../utils/formato';
import FormCredito from '../components/FormCredito';
import Modal, { Confirmar } from '../components/Modal';

const pct = (v) => (v === null || v === undefined ? '—' : `${Number(v).toLocaleString('es-CO', { maximumFractionDigits: 3 })} %`);
const dineroOGuion = (v) => (Number(v) ? dinero(v) : '—');
// "23 oct 2026": corta, para que la tabla no se ensanche.
const fechaTabla = (f) => { const d = aFecha(f); return `${d.getDate()} ${MESES_CORTOS[d.getMonth()].toLowerCase()} ${d.getFullYear()}`; };
const suma = (lista, campo) => lista.reduce((s, c) => s + Number(c[campo]), 0);

function Resumen({ icono: Icono, etiqueta, valor, color, destacada, i }) {
  return (
    <motion.div className={`tarjeta stat ${destacada ? 'stat-destacada' : ''}`} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
      <span className="etq">
        <span className="icono-burbuja" style={{ background: destacada ? 'rgba(255,255,255,.18)' : `${color}1f`, color: destacada ? 'white' : color }}>
          <Icono size={18} />
        </span>
        {etiqueta}
      </span>
      <span className="valor">{valor}</span>
    </motion.div>
  );
}

export default function Creditos() {
  const [creditos, setCreditos] = useState(null);
  const [formulario, setFormulario] = useState({ abierto: false, credito: null });
  const [eliminando, setEliminando] = useState(null);

  const cargar = useCallback(() => {
    api.creditos.listar().then(setCreditos).catch((e) => toast.error(e.message));
  }, []);
  useEffect(cargar, [cargar]);

  const prestadores = useMemo(() => [...new Set((creditos || []).map((c) => c.prestador))], [creditos]);
  const lista = creditos || [];

  const abrir = (credito = null) => setFormulario({ abierto: true, credito });
  const cerrar = () => setFormulario((f) => ({ ...f, abierto: false }));

  const eliminar = async () => {
    try {
      await api.creditos.eliminar(eliminando.id);
      toast.success('Crédito eliminado');
      setEliminando(null);
      cargar();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const acciones = (c) => (
    <div className="gasto-acciones">
      <button className="btn-icono" onClick={() => abrir(c)} aria-label={`Editar crédito de ${c.prestador}`}><Pencil size={16} /></button>
      <button className="btn-icono peligro" onClick={() => setEliminando(c)} aria-label={`Eliminar crédito de ${c.prestador}`}><Trash2 size={16} /></button>
    </div>
  );

  return (
    <>
      <div className="encabezado">
        <div>
          <h1>Créditos</h1>
          <p>Lo que debes: préstamos y compras a cuotas, con sus intereses y pagos.</p>
        </div>
        <button className="btn btn-primario" onClick={() => abrir()}><Plus size={17} /> Nuevo crédito</button>
      </div>

      {creditos === null ? (
        <div className="rejilla">{[1, 2, 3].map((k) => <div key={k} className="esqueleto" style={{ height: 90 }} />)}</div>
      ) : lista.length === 0 ? (
        <div className="tarjeta">
          <div className="vacio">
            <Landmark size={46} />
            <span>Aún no tienes créditos registrados</span>
            <button className="btn btn-primario" onClick={() => abrir()}><Plus size={16} /> Registrar el primero</button>
          </div>
        </div>
      ) : (
        <>
          <div className="rejilla rejilla-stats mb">
            <Resumen i={0} destacada icono={Landmark} etiqueta="Deuda total" valor={dinero(suma(lista, 'deuda_total'))} />
            <Resumen i={1} icono={CalendarClock} color="#f59e0b" etiqueta="Pago mensual" valor={dinero(suma(lista, 'pago_mensual'))} />
            <Resumen i={2} icono={Percent} color="#ef4444" etiqueta="Intereses" valor={dinero(suma(lista, 'interes'))} />
            <Resumen i={3} icono={FileText} color="#6366f1" etiqueta="Créditos" valor={lista.length} />
          </div>

          {/* Escritorio: tabla con las columnas de la hoja de Excel */}
          <motion.div className="tarjeta tabla-creditos-caja" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
            <table className="tabla-creditos">
              <thead>
                <tr>
                  <th>Fecha</th><th>Prestador</th><th className="num">Valor</th><th className="num">Cuotas</th>
                  <th className="num">Interés</th><th className="num">% fijo</th><th className="num">Manejo tarjeta</th>
                  <th className="num">Pago mensual</th><th className="num">Deuda total</th><th />
                </tr>
              </thead>
              <tbody>
                {lista.map((c) => (
                  <tr key={c.id}>
                    <td>{fechaTabla(c.fecha)}</td>
                    <td className="prestador">{c.prestador}</td>
                    <td className="num">{dinero(c.valor)}</td>
                    <td className="num">{c.cuotas}</td>
                    <td className="num">{dineroOGuion(c.interes)}</td>
                    <td className="num">{pct(c.interes_pct)}</td>
                    <td className="num">{dineroOGuion(c.manejo_tarjeta)}</td>
                    <td className="num">{dineroOGuion(c.pago_mensual)}</td>
                    <td className="num total">{dinero(c.deuda_total)}</td>
                    <td>{acciones(c)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2}>Total</td>
                  <td className="num">{dinero(suma(lista, 'valor'))}</td>
                  <td />
                  <td className="num">{dinero(suma(lista, 'interes'))}</td>
                  <td />
                  <td className="num">{dineroOGuion(suma(lista, 'manejo_tarjeta'))}</td>
                  <td className="num">{dinero(suma(lista, 'pago_mensual'))}</td>
                  <td className="num total">{dinero(suma(lista, 'deuda_total'))}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </motion.div>

          {/* Celular: una tarjeta por crédito */}
          <div className="creditos-tarjetas">
            {lista.map((c, i) => (
              <motion.div key={c.id} className="tarjeta credito" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04 }}>
                <div className="credito-cab">
                  <div className="credito-quien">
                    <strong>{c.prestador}</strong>
                    <span className="texto-3">{fechaTabla(c.fecha)}</span>
                  </div>
                  <div className="credito-deuda">
                    <span className="texto-3">Deuda total</span>
                    <strong>{dinero(c.deuda_total)}</strong>
                  </div>
                </div>
                <dl className="credito-datos">
                  <div><dt>Valor</dt><dd>{dinero(c.valor)}</dd></div>
                  <div><dt>Cuotas</dt><dd>{c.cuotas}</dd></div>
                  <div><dt>Interés</dt><dd>{dineroOGuion(c.interes)}{c.interes_pct !== null && <small> · {pct(c.interes_pct)}</small>}</dd></div>
                  <div><dt>Manejo tarjeta</dt><dd>{dineroOGuion(c.manejo_tarjeta)}</dd></div>
                  <div className="credito-mensual"><dt>Pago mensual</dt><dd>{dineroOGuion(c.pago_mensual)}</dd></div>
                </dl>
                <div className="credito-pie">{acciones(c)}</div>
              </motion.div>
            ))}
          </div>
        </>
      )}

      <Modal abierto={formulario.abierto} onCerrar={cerrar} titulo={formulario.credito ? 'Editar crédito' : 'Nuevo crédito'}>
        {formulario.abierto && (
          <FormCredito
            key={formulario.credito?.id ?? 'nuevo'}
            inicial={formulario.credito}
            prestadores={prestadores}
            onGuardado={() => { cerrar(); cargar(); }}
          />
        )}
      </Modal>

      <Confirmar
        abierto={!!eliminando}
        onCerrar={() => setEliminando(null)}
        onConfirmar={eliminar}
        titulo="Eliminar crédito"
        mensaje={eliminando && `Se eliminará el crédito de ${eliminando.prestador} por ${dinero(eliminando.valor)}. Esta acción no se puede deshacer.`}
      />
    </>
  );
}
