import { NavLink, useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutDashboard, PlusCircle, ListOrdered, PiggyBank, Landmark, Moon, Sun, LogOut, Wallet, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../context/TemaContext';
import SelectorAcento from './SelectorAcento';

const RUTAS = [
  { to: '/', etiqueta: 'Dashboard', icono: LayoutDashboard },
  { to: '/nuevo', etiqueta: 'Registrar', corto: 'Nuevo', icono: PlusCircle },
  { to: '/registros', etiqueta: 'Registros', icono: ListOrdered },
  { to: '/presupuestos', etiqueta: 'Presupuestos', icono: PiggyBank },
  { to: '/creditos', etiqueta: 'Créditos', icono: Landmark },
];

// Barra inferior del celular: el botón "+" queda en el centro.
const ORDEN_MOVIL = ['/', '/registros', '/nuevo', '/presupuestos', '/creditos'];
const RUTAS_MOVIL = ORDEN_MOVIL.map((to) => RUTAS.find((r) => r.to === to));

function Marca() {
  return (
    <div className="marca">
      <span className="marca-logo"><Wallet size={20} /></span>
      Mis Gastos
    </div>
  );
}

function BotonTema() {
  const { tema, alternar } = useTema();
  return (
    <button className="btn-icono" onClick={alternar} title="Cambiar tema" aria-label="Cambiar tema">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={tema}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 90, opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{ display: 'grid' }}
        >
          {tema === 'oscuro' ? <Sun size={19} /> : <Moon size={19} />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
export { BotonTema };

export default function Layout() {
  const { usuario, logout } = useAuth();
  const { tema, alternar } = useTema();
  const location = useLocation();
  const outlet = useOutlet();

  return (
    <div className="app">
      <aside className="sidebar">
        <Marca />
        {RUTAS.map(({ to, etiqueta, icono: Icono }) => (
          <NavLink key={to} to={to} end className={({ isActive }) => `nav-item ${isActive ? 'activo' : ''}`}>
            {({ isActive }) => (
              <>
                {isActive && <motion.span layoutId="nav-fondo" className="nav-fondo" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                <Icono size={19} />
                <span>{etiqueta}</span>
              </>
            )}
          </NavLink>
        ))}

        <div className="sidebar-pie">
          <button className="nav-item" onClick={alternar}>
            {tema === 'oscuro' ? <Sun size={19} /> : <Moon size={19} />}
            <span>{tema === 'oscuro' ? 'Modo claro' : 'Modo oscuro'}</span>
          </button>
          <SelectorAcento etiqueta="Color del tema" lado="arriba-izquierda" className="nav-item" />
          <button className="nav-item" onClick={logout}>
            <LogOut size={19} /><span>Cerrar sesión</span>
          </button>
          <div className="usuario-chip">
            <span className="avatar">{usuario?.nombre?.[0]?.toUpperCase()}</span>
            <div className="info">
              <div className="nombre">{usuario?.nombre}</div>
              <div className="email">{usuario?.email}</div>
            </div>
          </div>
        </div>
      </aside>

      <div style={{ flex: 1, minWidth: 0 }}>
        <header className="barra-movil">
          <Marca />
          <div style={{ display: 'flex', gap: 4 }}>
            <SelectorAcento />
            <BotonTema />
            <button className="btn-icono" onClick={logout} aria-label="Cerrar sesión"><LogOut size={19} /></button>
          </div>
        </header>

        <main className="contenido">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {outlet}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <nav className="nav-movil">
        {RUTAS_MOVIL.map(({ to, etiqueta, corto, icono: Icono }) =>
          to === '/nuevo' ? (
            <NavLink key={to} to={to} className="nav-agregar" aria-label={etiqueta}><Plus size={26} /></NavLink>
          ) : (
            <NavLink key={to} to={to} end className={({ isActive }) => `nav-item ${isActive ? 'activo' : ''}`}>
              <Icono size={21} /><span>{corto || etiqueta}</span>
            </NavLink>
          )
        )}
      </nav>
    </div>
  );
}
