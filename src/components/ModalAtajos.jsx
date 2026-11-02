import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Pencil, Plus, Trash2, Zap } from 'lucide-react';
import { api } from '../api';
import { dinero } from '../utils/formato';
import Modal from './Modal';
import InputMonto from './InputMonto';

const VACIO = { nombre: '', monto: '', cantidad: 1, categoria_id: '', billetera_id: '' };
const MAX_CANTIDAD = 10;

// Crear, editar y borrar los atajos de registro rápido.
export default function ModalAtajos({ abierto, onCerrar, onCambio }) {
  const [atajos, setAtajos] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [billeteras, setBilleteras] = useState([]);
  const [form, setForm] = useState(null); // null = lista; objeto = creando/editando
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const [a, c, b] = await Promise.all([api.atajos.listar(), api.categorias.listar(), api.billeteras.listar()]);
      setAtajos(a);
      setCategorias(c);
      setBilleteras(b);
      return { a, c, b };
    } catch (e) {
      toast.error(e.message);
    }
  }, []);

  useEffect(() => {
    if (!abierto) return;
    setForm(null);
    cargar();
  }, [abierto, cargar]);

  const nuevo = () => setForm({
    ...VACIO,
    categoria_id: categorias[0]?.id ?? '',
    billetera_id: billeteras[0]?.id ?? '',
  });

  const editar = (a) => setForm({
    id: a.id,
    nombre: a.nombre,
    monto: String(Number(a.monto)),
    cantidad: a.cantidad,
    categoria_id: a.categoria_id,
    billetera_id: a.billetera_id ?? '',
  });

  const guardar = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return toast.error('Ponle un nombre al atajo');
    if (!(Number(form.monto) > 0)) return toast.error('Ingresa un monto mayor a cero');
    if (!form.categoria_id) return toast.error('Escoge una categoría');
    setGuardando(true);
    try {
      const datos = {
        nombre: form.nombre,
        monto: Number(form.monto),
        cantidad: form.cantidad,
        categoria_id: Number(form.categoria_id),
        billetera_id: form.billetera_id === '' ? null : Number(form.billetera_id),
      };
      if (form.id) await api.atajos.editar(form.id, datos);
      else await api.atajos.crear(datos);
      toast.success(form.id ? 'Atajo actualizado' : 'Atajo creado');
      setForm(null);
      await cargar();
      onCambio?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const borrar = async (a) => {
    try {
      await api.atajos.eliminar(a.id);
      toast.success(`«${a.nombre}» eliminado`);
      setForm(null);
      await cargar();
      onCambio?.();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const set = (campo) => (valor) => setForm((f) => ({ ...f, [campo]: valor }));
  const total = form ? (Number(form.monto) || 0) * form.cantidad : 0;

  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo={form ? (form.id ? 'Editar atajo' : 'Nuevo atajo') : 'Atajos de registro rápido'}>
      {atajos === null ? (
        <div className="cargando" style={{ minHeight: 120 }}><div className="spinner" /></div>
      ) : form ? (
        <form onSubmit={guardar} className="atajo-form">
          <div className="campo">
            <label htmlFor="atajo-nombre">Nombre</label>
            <input
              id="atajo-nombre" className="input" autoFocus maxLength={80} value={form.nombre}
              onChange={(e) => set('nombre')(e.target.value)} placeholder="Ej: Pasaje de bus, Gasolina moto"
            />
          </div>
          <div className="fila-campos">
            <div className="campo">
              <label>Monto de cada gasto</label>
              <InputMonto value={form.monto} onChange={set('monto')} placeholder="0" />
            </div>
            <div className="campo">
              <label>Cuántos por toque</label>
              <div className="contador">
                <button type="button" disabled={form.cantidad <= 1} onClick={() => set('cantidad')(form.cantidad - 1)} aria-label="Menos">−</button>
                <span>{form.cantidad}</span>
                <button type="button" disabled={form.cantidad >= MAX_CANTIDAD} onClick={() => set('cantidad')(form.cantidad + 1)} aria-label="Más">+</button>
              </div>
            </div>
          </div>
          <div className="fila-campos">
            <div className="campo">
              <label htmlFor="atajo-cat">Categoría</label>
              <select id="atajo-cat" className="select" value={form.categoria_id} onChange={(e) => set('categoria_id')(e.target.value)}>
                {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div className="campo">
              <label htmlFor="atajo-bil">Billetera</label>
              <select id="atajo-bil" className="select" value={form.billetera_id} onChange={(e) => set('billetera_id')(e.target.value)}>
                <option value="">Sin billetera</option>
                {billeteras.map((b) => <option key={b.id} value={b.id}>{b.nombre}</option>)}
              </select>
            </div>
          </div>
          {total > 0 && (
            <p className="texto-2" style={{ fontSize: '.88rem', marginBottom: 12 }}>
              Cada toque registrará {form.cantidad > 1 ? `${form.cantidad} gastos de ${dinero(form.monto)} ` : `un gasto `}
              (<b>{dinero(total)}</b> en total).
            </p>
          )}
          <div className="modal-pie">
            {form.id && (
              <button type="button" className="btn btn-secundario" style={{ marginRight: 'auto', color: 'var(--peligro)' }}
                onClick={() => borrar(form)}>
                <Trash2 size={16} /> Eliminar
              </button>
            )}
            <button type="button" className="btn btn-secundario" onClick={() => setForm(null)}>Cancelar</button>
            <button className="btn btn-primario" disabled={guardando}>Guardar</button>
          </div>
        </form>
      ) : (
        <>
          {atajos.length === 0 ? (
            <div className="vacio"><Zap size={36} /><span>Aún no tienes atajos</span></div>
          ) : (
            <div>
              {atajos.map((a) => (
                <div className="atajo-fila" key={a.id}>
                  <span className="atajo-icono" style={{ background: `${a.categoria_color}22`, color: a.categoria_color }}>
                    {a.nombre[0]?.toUpperCase()}
                  </span>
                  <span className="atajo-texto">
                    <span className="atajo-nombre">
                      {a.nombre}
                      {a.cantidad > 1 && <span className="atajo-veces">×{a.cantidad}</span>}
                    </span>
                    <span className="atajo-monto">
                      {dinero(Number(a.monto) * a.cantidad)} · {a.categoria} · {a.billetera || 'Sin billetera'}
                    </span>
                  </span>
                  <button className="btn-icono" onClick={() => editar(a)} aria-label={`Editar ${a.nombre}`}><Pencil size={16} /></button>
                </div>
              ))}
            </div>
          )}
          <div className="modal-pie" style={{ marginTop: 14 }}>
            <button className="btn btn-primario" onClick={nuevo} disabled={categorias.length === 0}>
              <Plus size={16} /> Nuevo atajo
            </button>
          </div>
          {categorias.length === 0 && <p className="texto-3" style={{ fontSize: '.8rem', textAlign: 'right' }}>Primero crea una categoría.</p>}
        </>
      )}
    </Modal>
  );
}
