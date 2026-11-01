import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';
import { api } from '../api';
import { COLORES, dinero } from '../utils/formato';
import Modal from './Modal';
import { Segmentado, SelectorColor } from './Controles';
import InputMonto from './InputMonto';

// Crear o editar una billetera. El saldo de una billetera es su saldo inicial
// menos los gastos; agregar o retirar dinero a mano mueve el saldo inicial
// (recargas, salario, retiros, efectivo que sacaste, etc.).
export default function ModalBilletera({ abierto, billetera, onCerrar, onGuardado }) {
  const [form, setForm] = useState({ nombre: '', saldo_inicial: '', color: COLORES[0] });
  const [ajuste, setAjuste] = useState('');
  const [tipoAjuste, setTipoAjuste] = useState('agregar');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    setAjuste('');
    setTipoAjuste('agregar');
    setForm(billetera
      ? { nombre: billetera.nombre, saldo_inicial: String(Number(billetera.saldo_inicial)), color: billetera.color }
      : { nombre: '', saldo_inicial: '', color: COLORES[Math.floor(Math.random() * COLORES.length)] });
  }, [abierto, billetera]);

  const delta = (tipoAjuste === 'retirar' ? -1 : 1) * (Number(ajuste) || 0);
  const nuevoSaldo = billetera ? Number(billetera.saldo) + delta : null;

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const datos = { ...form, saldo_inicial: (Number(form.saldo_inicial) || 0) + delta };
      if (billetera) await api.billeteras.editar(billetera.id, datos);
      else await api.billeteras.crear(datos);
      toast.success(billetera ? 'Billetera actualizada' : 'Billetera creada');
      onGuardado();
      onCerrar();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async () => {
    try {
      await api.billeteras.eliminar(billetera.id);
      toast.success('Billetera eliminada');
      onGuardado();
      onCerrar();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo={billetera ? 'Editar billetera' : 'Nueva billetera'}>
      <form onSubmit={guardar}>
        {billetera && (
          <div className="monto-caja">
            <label>Saldo actual</label>
            <div className="input-monto" style={{ fontSize: '2rem' }}>{dinero(billetera.saldo)}</div>
          </div>
        )}
        <div className="campo">
          <label>Nombre</label>
          <input className="input" required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Nequi, Bancolombia, Efectivo" />
        </div>
        {billetera ? (
          <div className="campo">
            <label>Ajustar saldo</label>
            <div className="ajuste-saldo">
              <Segmentado
                valor={tipoAjuste}
                onCambio={setTipoAjuste}
                opciones={[{ valor: 'agregar', etiqueta: 'Agregar' }, { valor: 'retirar', etiqueta: 'Retirar' }]}
              />
              <InputMonto value={ajuste} onChange={setAjuste} placeholder={tipoAjuste === 'retirar' ? '− 0' : '+ 0'} />
            </div>
            {delta !== 0 && (
              <span className="texto-2" style={{ fontSize: '.88rem' }}>
                Nuevo saldo:{' '}
                <b style={{ color: nuevoSaldo < 0 ? 'var(--peligro)' : 'var(--texto)' }}>{dinero(nuevoSaldo)}</b>
              </span>
            )}
          </div>
        ) : (
          <div className="campo">
            <label>Saldo inicial</label>
            <InputMonto value={form.saldo_inicial} onChange={(saldo_inicial) => setForm({ ...form, saldo_inicial })} placeholder="0" />
          </div>
        )}
        <div className="campo">
          <label>Color</label>
          <SelectorColor valor={form.color} onCambio={(color) => setForm({ ...form, color })} />
        </div>
        <div className="modal-pie">
          {billetera && (
            <button type="button" className="btn btn-secundario" onClick={eliminar} style={{ marginRight: 'auto', color: 'var(--peligro)' }}>
              <Trash2 size={16} /> Eliminar
            </button>
          )}
          <button type="button" className="btn btn-secundario" onClick={onCerrar}>Cancelar</button>
          <button className="btn btn-primario" disabled={guardando}>Guardar</button>
        </div>
      </form>
    </Modal>
  );
}
