import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Pencil, Tags } from 'lucide-react';
import { api } from '../api';
import Modal from './Modal';
import { SelectorColor } from './Controles';

// Lista de categorías con edición de nombre y color en el mismo lugar.
export default function ModalCategorias({ abierto, onCerrar, onCambio }) {
  const [categorias, setCategorias] = useState(null);
  const [editando, setEditando] = useState(null); // { id, nombre, color }
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(
    () => api.categorias.listar().then(setCategorias).catch((e) => toast.error(e.message)),
    []
  );

  useEffect(() => {
    if (!abierto) return;
    setEditando(null);
    cargar();
  }, [abierto, cargar]);

  const guardar = async (e) => {
    e.preventDefault();
    if (!editando.nombre.trim()) return toast.error('Escribe un nombre');
    setGuardando(true);
    try {
      await api.categorias.editar(editando.id, { nombre: editando.nombre, color: editando.color });
      toast.success('Categoría actualizada');
      setEditando(null);
      await cargar();
      onCambio?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const coloresDeOtras = (id) => (categorias || []).filter((c) => c.id !== id).map((c) => c.color);

  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo="Mis categorías">
      {categorias === null ? (
        <div className="cargando" style={{ minHeight: 120 }}><div className="spinner" /></div>
      ) : categorias.length === 0 ? (
        <div className="vacio"><Tags size={36} /><span>Aún no tienes categorías</span></div>
      ) : (
        <div className="cat-lista">
          {categorias.map((c) => (
            <div key={c.id} className="cat-fila">
              {editando?.id === c.id ? (
                <form className="cat-edicion" onSubmit={guardar}>
                  <input
                    className="input"
                    value={editando.nombre}
                    maxLength={80}
                    autoFocus
                    onChange={(e) => setEditando({ ...editando, nombre: e.target.value })}
                    onKeyDown={(e) => e.key === 'Escape' && (e.stopPropagation(), setEditando(null))}
                    aria-label="Nombre de la categoría"
                  />
                  <SelectorColor
                    valor={editando.color}
                    onCambio={(color) => setEditando({ ...editando, color })}
                    usados={coloresDeOtras(c.id)}
                  />
                  <div className="cat-edicion-pie">
                    <button type="button" className="btn btn-secundario" onClick={() => setEditando(null)}>Cancelar</button>
                    <button className="btn btn-primario" disabled={guardando}>Guardar</button>
                  </div>
                </form>
              ) : (
                <div className="cat-vista">
                  <span className="punto" style={{ background: c.color }} />
                  <span className="cat-nombre">{c.nombre}</span>
                  <span className="texto-3 cat-cuenta">{c.num_gastos} {Number(c.num_gastos) === 1 ? 'gasto' : 'gastos'}</span>
                  <button
                    className="btn-icono"
                    onClick={() => setEditando({ id: c.id, nombre: c.nombre, color: c.color })}
                    aria-label={`Editar ${c.nombre}`}
                  >
                    <Pencil size={16} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
