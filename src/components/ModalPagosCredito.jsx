import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, Trash2 } from 'lucide-react';
import { api } from '../api';
import { ahoraLocal, dinero, fechaCorta } from '../utils/formato';
import Modal, { Confirmar } from './Modal';
import InputMonto from './InputMonto';
import FechaHora from './FechaHora';

// Pagos de un crédito: cada pago registrado cuenta como una cuota, descuenta de la deuda y se anota
// como gasto (categoría "Créditos"). `credito` viene de la lista, así que el avance se actualiza solo.
export default function ModalPagosCredito({ abierto, credito, onCerrar, onCambio }) {
  const [pagos, setPagos] = useState(null);
  const [billeteras, setBilleteras] = useState([]);
  const [form, setForm] = useState({ monto: '', fecha: ahoraLocal(), billetera_id: '' });
  const [guardando, setGuardando] = useState(false);
  const [deshaciendo, setDeshaciendo] = useState(null);

  const cargar = useCallback(async () => {
    if (!credito) return;
    try {
      setPagos(await api.pagosCredito.listar({ credito_id: credito.id }));
    } catch (e) {
      toast.error(e.message);
    }
  }, [credito?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!abierto || !credito) return;
    setPagos(null);
    setForm({ monto: String(Number(credito.pago_mensual) || ''), fecha: ahoraLocal(), billetera_id: '' });
    cargar();
    api.billeteras.listar().then((b) => {
      setBilleteras(b);
      // Por defecto, la primera billetera (igual que al registrar un gasto).
      if (b.length) setForm((f) => ({ ...f, billetera_id: b[0].id }));
    }).catch(() => {});
  }, [abierto, credito?.id, cargar]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!credito) return null;

  const pagadas = credito.pagadas;
  const completo = pagadas >= credito.cuotas;
  const pagado = Number(credito.pagado);
  const pendiente = Math.max(0, Number(credito.deuda_total) - pagado);
  const avance = credito.cuotas ? Math.min(100, (pagadas / credito.cuotas) * 100) : 0;

  const pagar = async (e) => {
    e.preventDefault();
    if (!(Number(form.monto) > 0)) return toast.error('Ingresa el monto del pago');
    setGuardando(true);
    try {
      const r = await api.pagosCredito.crear({
        credito_id: credito.id,
        monto: Number(form.monto),
        fecha: form.fecha.replace('T', ' '),
        billetera_id: form.billetera_id === '' ? null : Number(form.billetera_id),
      });
      toast.success(r.pagadas >= r.cuotas ? '¡Último pago! Crédito pagado' : `Cuota ${r.numero} de ${r.cuotas} pagada`);
      setForm((f) => ({ ...f, fecha: ahoraLocal() }));
      await cargar();
      onCambio?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const deshacer = async () => {
    try {
      await api.pagosCredito.eliminar(deshaciendo.id);
      toast.success('Pago deshecho');
      setDeshaciendo(null);
      await cargar();
      onCambio?.();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <Modal abierto={abierto} onCerrar={onCerrar} titulo={`Pagos · ${credito.prestador}`}>
        <div className="avance-credito">
          <div className="avance-cifras">
            <strong>{pagadas} de {credito.cuotas} cuotas</strong>
            <span className="texto-3">Pendiente {dinero(pendiente)}</span>
          </div>
          <div className="barra"><div className="barra-relleno" style={{ width: `${avance}%`, background: completo ? 'var(--exito)' : 'var(--primario-2)' }} /></div>
          <div className="avance-pie texto-3">
            <span>Pagado {dinero(pagado)}</span>
            <span>Deuda total {dinero(credito.deuda_total)}</span>
          </div>
        </div>

        {completo ? (
          <div className="credito-pagado"><CheckCircle2 size={20} /> Crédito pagado por completo</div>
        ) : (
          <form onSubmit={pagar} className="form-pago">
            <h4>Pagar cuota {pagadas + 1}</h4>
            <div className="fila-campos">
              <div className="campo">
                <label>Monto</label>
                <InputMonto value={form.monto} onChange={(monto) => setForm((f) => ({ ...f, monto }))} placeholder="0" />
              </div>
              <div className="campo">
                <label htmlFor="pago-billetera">Sale de</label>
                <select id="pago-billetera" className="select" value={form.billetera_id} onChange={(e) => setForm((f) => ({ ...f, billetera_id: e.target.value }))}>
                  <option value="">Sin billetera</option>
                  {billeteras.map((b) => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                </select>
              </div>
            </div>
            <div className="campo">
              <label>Fecha y hora</label>
              <FechaHora value={form.fecha} onChange={(fecha) => setForm((f) => ({ ...f, fecha }))} />
            </div>
            <button className="btn btn-primario btn-bloque" disabled={guardando}>
              {guardando ? 'Registrando…' : `Registrar pago de ${dinero(form.monto || 0)}`}
            </button>
            <p className="texto-3 pista" style={{ fontSize: '.78rem', marginTop: 8 }}>Se anota también como gasto en la categoría «Créditos».</p>
          </form>
        )}

        <h4 style={{ margin: '18px 0 4px' }}>Pagos hechos</h4>
        {pagos === null ? (
          <div className="cargando" style={{ minHeight: 80 }}><div className="spinner" /></div>
        ) : pagos.length === 0 ? (
          <p className="texto-3" style={{ fontSize: '.9rem' }}>Todavía no has pagado ninguna cuota.</p>
        ) : (
          <div className="pagos-lista">
            {pagos.map((p) => (
              <div className="pago-fila" key={p.id}>
                <span className="pago-numero">{p.numero}</span>
                <span className="atajo-texto">
                  <span className="atajo-nombre">{dinero(p.monto)}</span>
                  <span className="atajo-monto">{fechaCorta(p.fecha)} · {p.billetera || 'Sin billetera'}</span>
                </span>
                <button className="btn-icono peligro" onClick={() => setDeshaciendo(p)} aria-label={`Deshacer el pago de la cuota ${p.numero}`}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Confirmar
        abierto={!!deshaciendo}
        onCerrar={() => setDeshaciendo(null)}
        onConfirmar={deshacer}
        titulo="Deshacer pago"
        textoBoton="Deshacer"
        mensaje={deshaciendo && `Se quitará la cuota pagada por ${dinero(deshaciendo.monto)} y también el gasto que se anotó. La deuda vuelve a subir.`}
      />
    </>
  );
}
