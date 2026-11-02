import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Wallet, CalendarDays, TrendingDown, Receipt, Plus, FileDown, X } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { dinero, MESES, ahoraLocal } from '../utils/formato';
import { exportarGastosPDF } from '../utils/pdf';
import { Segmentado, SelectorPeriodo } from '../components/Controles';
import { GraficaCategorias, GraficaDiaria, GraficaMensual, GraficaPresupuestos } from '../components/Graficas';
import ListaGastos, { SinGastos } from '../components/ListaGastos';
import ModalBilletera from '../components/ModalBilletera';

const aparecer = (i) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.05, duration: 0.35 },
});

function Stat({ icono: Icono, etiqueta, valor, nota, color, destacada, i, soloEscritorio }) {
  return (
    <motion.div className={`tarjeta stat ${destacada ? 'stat-destacada' : ''} ${soloEscritorio ? 'solo-escritorio' : ''}`} {...aparecer(i)}>
      <span className="etq">
        <span className="icono-burbuja" style={{ background: destacada ? 'rgba(255,255,255,.18)' : `${color}1f`, color: destacada ? 'white' : color }}>
          <Icono size={18} />
        </span>
        {etiqueta}
      </span>
      <span className="valor">{valor}</span>
      {nota && <span className="nota">{nota}</span>}
    </motion.div>
  );
}

export default function Dashboard() {
  const { usuario } = useAuth();
  const hoy = new Date();
  const [periodo, setPeriodo] = useState({ anio: hoy.getFullYear(), mes: hoy.getMonth() + 1 });
  const [datos, setDatos] = useState(null);
  const [vista, setVista] = useState('mes');
  const [dia, setDia] = useState(ahoraLocal().slice(0, 10));
  const [gastos, setGastos] = useState([]);
  const [modalBilletera, setModalBilletera] = useState({ abierto: false, billetera: null });
  const [categoriaSel, setCategoriaSel] = useState(null);

  const cargar = useCallback(() => {
    api.dashboard(periodo.anio, periodo.mes).then(setDatos).catch((e) => toast.error(e.message));
  }, [periodo]);

  useEffect(cargar, [cargar]);

  // La categoría seleccionada solo vale si existe en el periodo que se está viendo.
  const categoriaActiva = datos?.por_categoria.find((c) => c.id === categoriaSel) || null;
  const categoriaId = categoriaActiva?.id;

  useEffect(() => {
    const params = vista === 'dia' ? { dia } : { anio: periodo.anio, mes: periodo.mes || undefined };
    api.gastos.listar({ ...params, categoria_id: categoriaId }).then(setGastos).catch((e) => toast.error(e.message));
  }, [vista, dia, periodo, categoriaId]);

  const nombrePeriodo = periodo.mes ? `${MESES[periodo.mes - 1]} ${periodo.anio}` : `Año ${periodo.anio}`;

  const descargarPDF = async () => {
    try {
      const lista = await api.gastos.listar({ anio: periodo.anio, mes: periodo.mes || undefined });
      if (!lista.length) return toast('No hay gastos para exportar en este periodo');
      exportarGastosPDF({
        titulo: `Gastos ${nombrePeriodo}`,
        subtitulo: 'Reporte de gastos',
        gastos: lista,
        usuario: usuario?.nombre,
        presupuestos: datos?.presupuestos,
      });
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (!datos) {
    return (
      <div className="rejilla">
        <div className="esqueleto" style={{ height: 60 }} />
        <div className="esqueleto" style={{ height: 120 }} />
        <div className="rejilla rejilla-stats">{[1, 2, 3, 4].map((k) => <div key={k} className="esqueleto" style={{ height: 110 }} />)}</div>
        <div className="esqueleto" style={{ height: 300 }} />
      </div>
    );
  }

  const mesesDe = (anio) => datos.meses_con_registros[anio] || [];
  const t = datos.totales;
  const diasMes = periodo.mes ? datos.por_dia.length : 365;
  const esMesActual = periodo.anio === hoy.getFullYear() && periodo.mes === hoy.getMonth() + 1;
  const diasTranscurridos = esMesActual ? hoy.getDate() : diasMes;

  return (
    <>
      <div className="encabezado">
        <div>
          <h1>Hola, {usuario?.nombre?.split(' ')[0]} 👋</h1>
          <p>Este es el resumen de {nombrePeriodo.toLowerCase()}.</p>
        </div>
        <div className="acciones">
          <SelectorPeriodo
            anio={periodo.anio}
            mes={periodo.mes}
            anios={datos.anios_disponibles}
            meses={mesesDe(periodo.anio)}
            onCambio={(anio, mes) => {
              // Al cambiar de año, salta al último mes con registros de ese año.
              if (anio !== periodo.anio && mes) {
                const conDatos = mesesDe(anio);
                if (!conDatos.includes(mes)) mes = conDatos[conDatos.length - 1] ?? 0;
              }
              setPeriodo({ anio, mes });
            }}
            permitirAnioCompleto
          />
          <button className="btn btn-secundario" onClick={descargarPDF}><FileDown size={17} /> PDF</button>
        </div>
      </div>

      {/* Billeteras */}
      <div className="tarjeta mb">
        <div className="tarjeta-cab">
          <h2>Mis billeteras</h2>
          <span className="sub pista">Toca una para editarla o agregar dinero</span>
        </div>
        <div className="billeteras">
          {datos.billeteras.map((b, i) => (
            <motion.button
              key={b.id}
              className="billetera"
              style={{ background: `linear-gradient(135deg, ${b.color}, ${b.color}cc)` }}
              onClick={() => setModalBilletera({ abierto: true, billetera: b })}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.97 }}
              {...aparecer(i)}
            >
              <div className="nombre"><Wallet size={16} /> {b.nombre}</div>
              <div className="saldo">{dinero(b.saldo)}</div>
              <div className="nota">Saldo disponible</div>
            </motion.button>
          ))}
          <button className="billetera-nueva" onClick={() => setModalBilletera({ abierto: true, billetera: null })}>
            <span style={{ display: 'grid', placeItems: 'center', gap: 6 }}><Plus size={22} /> Nueva</span>
          </button>
        </div>
      </div>

      <div className="rejilla rejilla-stats mb">
        <Stat i={0} destacada icono={Wallet} etiqueta="Saldo total" valor={dinero(datos.saldo_total)} nota={`${datos.billeteras.length} billetera(s)`} />
        <Stat i={1} icono={TrendingDown} color="#ef4444" etiqueta={periodo.mes ? 'Gastado en el mes' : 'Gastado en el año'} valor={dinero(t.total)} nota={`Promedio diario ${dinero(t.total / Math.max(1, diasTranscurridos))}`} />
        <Stat i={2} icono={CalendarDays} color="#f59e0b" etiqueta="Gastado hoy" valor={dinero(datos.hoy.total)} nota={`${datos.hoy.cantidad} gasto(s) hoy`} />
        <Stat i={3} soloEscritorio icono={Receipt} color="#10b981" etiqueta="Registros" valor={t.cantidad} nota={`Mayor gasto ${dinero(t.mayor)}`} />
      </div>

      <div className="rejilla rejilla-3-1 mb">
        <motion.div className="tarjeta" {...aparecer(2)}>
          <div className="tarjeta-cab">
            <h2>Gastos por mes · {periodo.anio}</h2>
            {periodo.mes > 0 ? (
              <button className="chip-quitar" onClick={() => setPeriodo((p) => ({ ...p, mes: 0 }))} title="Ver todo el año">
                {MESES[periodo.mes - 1]} <X size={14} />
              </button>
            ) : (
              <span className="sub pista">Toca una barra para ver ese mes</span>
            )}
          </div>
          <GraficaMensual
            datos={datos.por_mes}
            mesActivo={periodo.mes}
            onClickMes={(mes) => {
              // Tocar la barra seleccionada la quita (vuelve a todo el año).
              if (mes === periodo.mes) return setPeriodo((p) => ({ ...p, mes: 0 }));
              if (mesesDe(periodo.anio).includes(mes)) setPeriodo((p) => ({ ...p, mes }));
            }}
          />
        </motion.div>
        <motion.div className="tarjeta" {...aparecer(3)}>
          <div className="tarjeta-cab">
            <h2>Por categoría</h2>
            {categoriaActiva ? (
              <button className="chip-quitar" onClick={() => setCategoriaSel(null)} title="Quitar selección">
                <span className="punto" style={{ background: categoriaActiva.color }} />{categoriaActiva.nombre} <X size={14} />
              </button>
            ) : datos.por_categoria.length > 0 && <span className="sub pista">Toca una para filtrar</span>}
          </div>
          {datos.por_categoria.length
            ? <GraficaCategorias datos={datos.por_categoria} seleccionada={categoriaActiva?.id ?? null} onSeleccionar={setCategoriaSel} />
            : <SinGastos />}
        </motion.div>
      </div>

      <div className="rejilla rejilla-2 mb">
        {periodo.mes > 0 && (
          <motion.div className="tarjeta" {...aparecer(4)}>
            <div className="tarjeta-cab"><h2>Evolución diaria</h2><span className="sub pista">{nombrePeriodo}</span></div>
            <GraficaDiaria datos={datos.por_dia} />
          </motion.div>
        )}
        <motion.div className="tarjeta" {...aparecer(5)}>
          <div className="tarjeta-cab">
            <h2>Presupuestos</h2>
            <Link to="/presupuestos" className="btn-link">Gestionar</Link>
          </div>
          {datos.presupuestos.length ? (
            <GraficaPresupuestos datos={datos.presupuestos} />
          ) : (
            <div className="vacio">
              <span>{periodo.mes ? 'No hay presupuestos para este mes' : 'Elige un mes para ver los presupuestos'}</span>
              {periodo.mes > 0 && <Link to="/presupuestos" className="btn btn-secundario">Crear presupuesto</Link>}
            </div>
          )}
        </motion.div>
      </div>

      <motion.div className="tarjeta" {...aparecer(6)}>
        <div className="tarjeta-cab">
          <h2>
            Gastos
            {categoriaActiva && <span className="texto-3" style={{ fontWeight: 500 }}> · {categoriaActiva.nombre}</span>}
          </h2>
          <div className="acciones">
            {categoriaActiva && (
              <button className="chip-quitar" onClick={() => setCategoriaSel(null)} title="Quitar filtro">
                <span className="punto" style={{ background: categoriaActiva.color }} />{categoriaActiva.nombre} <X size={14} />
              </button>
            )}
            {vista === 'dia' && <input type="date" className="input select-mini" value={dia} onChange={(e) => setDia(e.target.value)} />}
            <Segmentado
              valor={vista}
              onCambio={setVista}
              opciones={[{ valor: 'dia', etiqueta: 'Por día' }, { valor: 'mes', etiqueta: periodo.mes ? 'Por mes' : 'Por año' }]}
            />
          </div>
        </div>
        <ListaGastos gastos={gastos.slice(0, 50)} />
        {gastos.length > 50 && (
          <div style={{ textAlign: 'center', marginTop: 12 }}><Link to="/registros" className="btn-link">Ver todos ({gastos.length})</Link></div>
        )}
      </motion.div>

      <ModalBilletera
        abierto={modalBilletera.abierto}
        billetera={modalBilletera.billetera}
        onCerrar={() => setModalBilletera((m) => ({ ...m, abierto: false }))}
        onGuardado={cargar}
      />
    </>
  );
}
