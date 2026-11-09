import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { CalendarClock, CheckCircle2, HandCoins, Landmark, Pencil, Plus, Trash2, Wallet } from 'lucide-react';
import { api } from '../api';
import { dinero, aFecha, MESES_CORTOS } from '../utils/formato';
import FormCredito from '../components/FormCredito';
import ModalPagosCredito from '../components/ModalPagosCredito';
import Modal, { Confirmar } from '../components/Modal';

const pct = (v) => (v === null || v === undefined ? '—' : `${Number(v).toLocaleString('es-CO', { maximumFractionDigits: 3 })} %`);
const dineroOGuion = (v) => (Number(v) ? dinero(v) : '—');
// "23 oct 2026": corta, para que la tabla no se ensanche.
const fechaTabla = (f) => { const d = aFecha(f); return `${d.getDate()} ${MESES_CORTOS[d.getMonth()].toLowerCase()} ${d.getFullYear()}`; };
const suma = (lista, campo) => lista.reduce((s, c) => s + Number(c[campo]), 0);

// Lo que falta por pagar: la deuda total menos lo ya pagado (los pagos son gastos enlazados).
const pendienteDe = (c) => (c.pagadas >= c.cuotas ? 0 : Math.max(0, Number(c.deuda_total) - Number(c.pagado)));
const estaPagado = (c) => c.pagadas >= c.cuotas;
const avanceDe = (c) => (c.cuotas ? Math.min(100, (c.pagadas / c.cuotas) * 100) : 0);

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

function Progreso({ credito }) {
  return (
    <div className="progreso-cuotas" title={`${credito.pagadas} de ${credito.cuotas} cuotas pagadas`}>
      <div className="barra"><div className="barra-relleno" style={{ width: `${avanceDe(credito)}%`, background: estaPagado(credito) ? 'var(--exito)' : 'var(--primario-2)' }} /></div>
    </div>
  );
}

export default function Creditos() {
  const [creditos, setCreditos] = useState(null);
  const [formulario, setFormulario] = useState({ abierto: false, credito: null });
  const [pagosDe, setPagosDe] = useState(null); // id del crédito cuyos pagos se ven
  const [eliminando, setEliminando] = useState(null);

  const cargar = useCallback(() => {
    api.creditos.listar().then(setCreditos).catch((e) => toast.error(e.message));
  }, []);
  useEffect(cargar, [cargar]);

  const prestadores = useMemo(() => [...new Set((creditos || []).map((c) => c.prestador))], [creditos]);
  const lista = creditos || [];
  const activos = lista.filter((c) => !estaPagado(c));
  const creditoDePagos = lista.find((c) => c.id === pagosDe) || null;

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

  const botonPagar = (c) => (
    estaPagado(c)
      ? <button className="btn btn-secundario btn-pagado" onClick={() => setPagosDe(c.id)}><CheckCircle2 size={15} /> Pagado</button>
      : <button className="btn btn-primario btn-pagar" onClick={() => setPagosDe(c.id)}><HandCoins size={15} /> Pagar</button>
  );

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
          <p>Lo que debes: cada pago que registras cuenta como una cuota y se anota como gasto.</p>
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
            <Resumen i={0} destacada icono={Landmark} etiqueta="Por pagar" valor={dinero(lista.reduce((s, c) => s + pendienteDe(c), 0))} />
            <Resumen i={1} icono={Wallet} color="#10b981" etiqueta="Ya pagado" valor={dinero(suma(lista, 'pagado'))} />
            <Resumen i={2} icono={CalendarClock} color="#f59e0b" etiqueta="Pago mensual" valor={dinero(suma(activos, 'pago_mensual'))} />
            <Resumen i={3} icono={CheckCircle2} color="#6366f1" etiqueta="Créditos activos" valor={`${activos.length} de ${lista.length}`} />
          </div>

          {/* Escritorio: tabla con las columnas de la hoja de Excel */}
          <motion.div className="tarjeta tabla-creditos-caja" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
            <table className="tabla-creditos">
              <thead>
                <tr>
                  <th>Fecha</th><th>Prestador</th><th className="num">Valor</th><th className="num">Cuotas pagadas</th>
                  <th className="num">Interés</th><th className="num">% fijo</th><th className="num">Manejo tarjeta</th>
                  <th className="num">Pago mensual</th><th className="num">Deuda total</th><th className="num">Pendiente</th><th />
                </tr>
              </thead>
              <tbody>
                {lista.map((c) => (
                  <tr key={c.id} className={estaPagado(c) ? 'fila-pagada' : ''}>
                    <td>{fechaTabla(c.fecha)}</td>
                    <td className="prestador">{c.prestador}</td>
                    <td className="num">{dinero(c.valor)}</td>
                    <td className="num celda-cuotas"><span>{c.pagadas} / {c.cuotas}</span><Progreso credito={c} /></td>
                    <td className="num">{dineroOGuion(c.interes)}</td>
                    <td className="num">{pct(c.interes_pct)}</td>
                    <td className="num">{dineroOGuion(c.manejo_tarjeta)}</td>
                    <td className="num">{dineroOGuion(c.pago_mensual)}</td>
                    <td className="num">{dinero(c.deuda_total)}</td>
                    <td className="num total">{dinero(pendienteDe(c))}</td>
                    <td className="celda-acciones">{botonPagar(c)}{acciones(c)}</td>
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
                  <td className="num">{dinero(suma(activos, 'pago_mensual'))}</td>
                  <td className="num">{dinero(suma(lista, 'deuda_total'))}</td>
                  <td className="num total">{dinero(lista.reduce((s, c) => s + pendienteDe(c), 0))}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </motion.div>

          {/* Celular: una tarjeta por crédito */}
          <div className="creditos-tarjetas">
            {lista.map((c, i) => (
              <motion.div key={c.id} className={`tarjeta credito ${estaPagado(c) ? 'credito-pagado-tarjeta' : ''}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04 }}>
                <div className="credito-cab">
                  <div className="credito-quien">
                    <strong>{c.prestador}</strong>
                    <span className="texto-3">{fechaTabla(c.fecha)}</span>
                  </div>
                  <div className="credito-deuda">
                    <span className="texto-3">{estaPagado(c) ? 'Pagado' : 'Pendiente'}</span>
                    <strong>{dinero(pendienteDe(c))}</strong>
                  </div>
                </div>
                <div className="credito-avance">
                  <Progreso credito={c} />
                  <span className="texto-3">{c.pagadas} de {c.cuotas} cuotas</span>
                </div>
                <dl className="credito-datos">
                  <div><dt>Valor</dt><dd>{dinero(c.valor)}</dd></div>
                  <div><dt>Deuda total</dt><dd>{dinero(c.deuda_total)}</dd></div>
                  <div><dt>Interés</dt><dd>{dineroOGuion(c.interes)}{c.interes_pct !== null && <small> · {pct(c.interes_pct)}</small>}</dd></div>
                  <div><dt>Manejo tarjeta</dt><dd>{dineroOGuion(c.manejo_tarjeta)}</dd></div>
                  <div className="credito-mensual"><dt>Pago mensual</dt><dd>{dineroOGuion(c.pago_mensual)}</dd></div>
                </dl>
                <div className="credito-pie">{botonPagar(c)}{acciones(c)}</div>
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

      <ModalPagosCredito abierto={!!creditoDePagos} credito={creditoDePagos} onCerrar={() => setPagosDe(null)} onCambio={cargar} />

      <Confirmar
        abierto={!!eliminando}
        onCerrar={() => setEliminando(null)}
        onConfirmar={eliminar}
        titulo="Eliminar crédito"
        mensaje={eliminando && `Se eliminará el crédito de ${eliminando.prestador} por ${dinero(eliminando.valor)}. Los pagos que ya registraste se quedan como gastos. Esta acción no se puede deshacer.`}
      />
    </>
  );
}
