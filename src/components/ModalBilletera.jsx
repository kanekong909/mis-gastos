import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';
import { api } from '../api';
import { COLORES, dinero } from '../utils/formato';
import Modal from './Modal';
import { SelectorColor } from './Controles';
import InputMonto from './InputMonto';

// Crear o editar una billetera. El saldo inicial es lo que tenías antes de
// registrar gastos; "Agregar dinero" lo incrementa (recargas, salario, etc.).
export default function ModalBilletera({ abierto, billetera, onCerrar, onGuardado }) {
  const [form, setForm] = useState({ nombre: '', saldo_inicial: '', color: COLORES[0] });
  const [recarga, setRecarga] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    setRecarga('');
    setForm(billetera
      ? { nombre: billetera.nombre, saldo_inicial: String(Number(billetera.saldo_inicial)), color: billetera.color }
      : { nombre: '', saldo_inicial: '', color: COLORES[Math.floor(Math.random() * COLORES.length)] });
  }, [abierto, billetera]);

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const datos = { ...form, saldo_inicial: (Number(form.saldo_inicial) || 0) + (Number(recarga) || 0) };
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
        <div className="fila-campos">
          <div className="campo">
            <label>Saldo inicial</label>
            <InputMonto value={form.saldo_inicial} onChange={(saldo_inicial) => setForm({ ...form, saldo_inicial })} placeholder="0" />
          </div>
          {billetera && (
            <div className="campo">
              <label>Agregar dinero</label>
              <InputMonto value={recarga} onChange={setRecarga} placeholder="+ 0" />
            </div>
          )}
        </div>
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
