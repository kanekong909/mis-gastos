import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ChevronDown, FileDown, Search, CalendarRange } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { dinero, MESES } from '../utils/formato';
import { exportarGastosPDF } from '../utils/pdf';
import { Segmentado } from '../components/Controles';
import ListaGastos, { SinGastos } from '../components/ListaGastos';
import FormGasto from '../components/FormGasto';
import Modal, { Confirmar } from '../components/Modal';

function Anio({ datos, abierto, onAlternar, seleccion, onElegir }) {
  return (
    <div className="anio">
      <button className="anio-cab" onClick={onAlternar}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <motion.span animate={{ rotate: abierto ? 180 : 0 }} style={{ display: 'grid' }}><ChevronDown size={20} /></motion.span>
          {datos.anio}
        </span>
        <span className="total">{dinero(datos.total)} · {datos.cantidad} gastos</span>
      </button>
      <AnimatePresence initial={false}>
        {abierto && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
            <div className="meses-rejilla">
              <button
                className={`mes-tarjeta ${seleccion.anio === datos.anio && !seleccion.mes ? 'activo' : ''}`}
                onClick={() => onElegir({ anio: datos.anio, mes: 0 })}
              >
                <div className="nombre"><CalendarRange size={15} style={{ verticalAlign: -2 }} /> Todo el año</div>
                <div className="total">{dinero(datos.total)}</div>
                <div className="cant">{datos.cantidad} gastos</div>
              </button>
              {[...datos.meses].sort((a, b) => a.mes - b.mes).map((m) => (
                <button
                  key={m.mes}
                  className={`mes-tarjeta ${seleccion.anio === datos.anio && seleccion.mes === m.mes ? 'activo' : ''}`}
                  onClick={() => onElegir({ anio: datos.anio, mes: m.mes })}
                >
                  <div className="nombre">{MESES[m.mes - 1]}</div>
                  <div className="total">{dinero(m.total)}</div>
                  <div className="cant">{m.cantidad} gastos</div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Registros() {
  const { usuario } = useAuth();
  const hoy = new Date();
  const actual = { anio: hoy.getFullYear(), mes: hoy.getMonth() + 1 };
  const [pestana, setPestana] = useState('actual');
  const [seleccion, setSeleccion] = useState(actual);
  const [resumen, setResumen] = useState([]);
  const [abiertos, setAbiertos] = useState({ [actual.anio]: true });
  const [gastos, setGastos] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [billeteras, setBilleteras] = useState([]);
  const [filtro, setFiltro] = useState({ q: '', categoria_id: '', billetera_id: '' });
  const [editando, setEditando] = useState(null);
  const [eliminando, setEliminando] = useState(null);

  const cargar = useCallback(() => {
    api.gastos.listar({ anio: seleccion.anio, mes: seleccion.mes || undefined }).then(setGastos).catch((e) => toast.error(e.message));
    api.gastos.resumenAnios().then(setResumen).catch(() => {});
  }, [seleccion]);

  useEffect(cargar, [cargar]);
  useEffect(() => {
    api.categorias.listar().then(setCategorias).catch(() => {});
    api.billeteras.listar().then(setBilleteras).catch(() => {});
  }, []);

  const cambiarPestana = (p) => {
    setPestana(p);
    if (p === 'actual') setSeleccion(actual);
  };

  const filtrados = useMemo(() => {
    if (!gastos) return [];
    const q = filtro.q.trim().toLowerCase();
    return gastos.filter((g) =>
      (!q || g.descripcion.toLowerCase().includes(q) || g.categoria.toLowerCase().includes(q)) &&
      (!filtro.categoria_id || g.categoria_id === Number(filtro.categoria_id)) &&
      (!filtro.billetera_id || (filtro.billetera_id === 'ninguna' ? g.billetera_id === null : g.billetera_id === Number(filtro.billetera_id)))
    );
  }, [gastos, filtro]);

  const total = filtrados.reduce((s, g) => s + Number(g.monto), 0);
  const nombrePeriodo = seleccion.mes ? `${MESES[seleccion.mes - 1]} ${seleccion.anio}` : `Año ${seleccion.anio}`;

  const confirmarEliminar = async () => {
    try {
      await api.gastos.eliminar(eliminando.id);
      toast.success('Gasto eliminado');
      setEliminando(null);
      cargar();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const descargarPDF = () => {
    if (!filtrados.length) return toast('No hay gastos para exportar');
    exportarGastosPDF({ titulo: `Gastos ${nombrePeriodo}`, subtitulo: 'Registro de gastos', gastos: filtrados, usuario: usuario?.nombre });
  };

  return (
    <>
      <div className="encabezado">
        <div>
          <h1>Registros</h1>
          <p>Consulta, edita o elimina tus gastos.</p>
        </div>
        <Segmentado
          valor={pestana}
          onCambio={cambiarPestana}
          opciones={[{ valor: 'actual', etiqueta: 'Mes actual' }, { valor: 'historial', etiqueta: 'Años y meses' }]}
        />
      </div>

      <AnimatePresence mode="wait">
        {pestana === 'historial' && (
          <motion.div key="hist" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb">
            {resumen.length ? resumen.map((a) => (
              <Anio
                key={a.anio}
                datos={a}
                abierto={!!abiertos[a.anio]}
                onAlternar={() => setAbiertos((o) => ({ ...o, [a.anio]: !o[a.anio] }))}
                seleccion={seleccion}
                onElegir={setSeleccion}
              />
            )) : <div className="tarjeta"><SinGastos texto="Aún no tienes gastos registrados" /></div>}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="tarjeta">
        <div className="tarjeta-cab">
          <div>
            <h2>{nombrePeriodo}</h2>
            <span className="sub">{filtrados.length} gasto(s) · {dinero(total)}</span>
          </div>
          <button className="btn btn-secundario" onClick={descargarPDF}><FileDown size={17} /> <span className="solo-escritorio">Descargar </span>PDF</button>
        </div>

        <div className="filtros">
          <div className="buscador">
            <Search size={17} />
            <input className="input" placeholder="Buscar por descripción…" value={filtro.q} onChange={(e) => setFiltro({ ...filtro, q: e.target.value })} />
          </div>
          <select className="select select-mini" value={filtro.categoria_id} onChange={(e) => setFiltro({ ...filtro, categoria_id: e.target.value })}>
            <option value="">Todas las categorías</option>
            {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <select className="select select-mini" value={filtro.billetera_id} onChange={(e) => setFiltro({ ...filtro, billetera_id: e.target.value })}>
            <option value="">Todas las billeteras</option>
            <option value="ninguna">Sin billetera</option>
            {billeteras.map((b) => <option key={b.id} value={b.id}>{b.nombre}</option>)}
          </select>
        </div>

        {gastos === null ? (
          <div className="rejilla">{[1, 2, 3].map((k) => <div key={k} className="esqueleto" style={{ height: 56 }} />)}</div>
        ) : (
          <ListaGastos gastos={filtrados} onEditar={setEditando} onEliminar={setEliminando} />
        )}
      </div>

      <Modal abierto={!!editando} onCerrar={() => setEditando(null)} titulo="Editar gasto">
        {editando && (
          <FormGasto
            key={editando.id}
            inicial={editando}
            textoBoton="Guardar cambios"
            onGuardado={() => { setEditando(null); cargar(); }}
          />
        )}
      </Modal>

      <Confirmar
        abierto={!!eliminando}
        onCerrar={() => setEliminando(null)}
        onConfirmar={confirmarEliminar}
        titulo="Eliminar gasto"
        mensaje={eliminando && `Se eliminará "${eliminando.descripcion || eliminando.categoria}" por ${dinero(eliminando.monto)}. Esta acción no se puede deshacer.`}
      />
    </>
  );
}
