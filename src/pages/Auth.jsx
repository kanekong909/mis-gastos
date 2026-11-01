import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Mail, Lock, User, Wallet, TrendingDown, PieChart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BotonTema } from '../components/Layout';
import SelectorAcento from '../components/SelectorAcento';

export default function Auth() {
  const { login, registro } = useAuth();
  const [modo, setModo] = useState('login');
  const [form, setForm] = useState({ nombre: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const esRegistro = modo === 'registro';

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      await (esRegistro ? registro(form) : login(form));
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  const campo = (k) => ({ value: form[k], onChange: (e) => setForm({ ...form, [k]: e.target.value }) });

  return (
    <div className="auth">
      <div className="auth-arte">
        <motion.span className="burbuja" style={{ width: 320, height: 320, right: -90, top: -90 }} animate={{ y: [0, 20, 0] }} transition={{ duration: 8, repeat: Infinity }} />
        <motion.span className="burbuja" style={{ width: 200, height: 200, left: -60, bottom: 80 }} animate={{ y: [0, -18, 0] }} transition={{ duration: 6, repeat: Infinity }} />
        <div className="marca" style={{ padding: 0, position: 'relative' }}>
          <span className="marca-logo" style={{ background: 'rgba(255,255,255,.18)' }}><Wallet size={20} /></span>
          Mis Gastos
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} style={{ position: 'relative' }}>
          <h2>Cada peso cuenta. Sabe a dónde se va.</h2>
          <p>Registra tus gastos del día en segundos, organiza tus billeteras y controla tus presupuestos mes a mes.</p>
          <div style={{ display: 'flex', gap: 24, marginTop: 32, flexWrap: 'wrap' }}>
            {[[TrendingDown, 'Gastos diarios'], [PieChart, 'Gráficos claros'], [Wallet, 'Varias billeteras']].map(([Icono, t]) => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}><Icono size={18} /> {t}</div>
            ))}
          </div>
        </motion.div>
        <span style={{ opacity: 0.6, fontSize: '.85rem', position: 'relative' }}>© {new Date().getFullYear()} Mis Gastos</span>
      </div>

      <div className="auth-form-wrap">
        <div className="auth-tema"><SelectorAcento /><BotonTema /></div>
        <motion.form className="auth-form" onSubmit={enviar} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <AnimatePresence mode="wait">
            <motion.div key={modo} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>
              <h1>{esRegistro ? 'Crea tu cuenta' : 'Bienvenido de nuevo'}</h1>
              <p className="sub">{esRegistro ? 'Empieza a controlar tus gastos hoy.' : 'Ingresa para ver tus finanzas.'}</p>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence>
            {error && (
              <motion.div className="error-form" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence initial={false}>
            {esRegistro && (
              <motion.div className="campo" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0, marginBottom: 0 }}>
                <label>Nombre</label>
                <div className="input-icono"><User size={18} /><input className="input" required {...campo('nombre')} placeholder="Tu nombre" autoComplete="name" /></div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="campo">
            <label>Correo</label>
            <div className="input-icono"><Mail size={18} /><input className="input" type="email" required {...campo('email')} placeholder="tu@correo.com" autoComplete="email" /></div>
          </div>
          <div className="campo">
            <label>Contraseña</label>
            <div className="input-icono">
              <Lock size={18} />
              <input className="input" type="password" required minLength={esRegistro ? 6 : undefined} {...campo('password')} placeholder={esRegistro ? 'Mínimo 6 caracteres' : '••••••••'} autoComplete={esRegistro ? 'new-password' : 'current-password'} />
            </div>
          </div>

          <button className="btn btn-primario btn-bloque" disabled={enviando} style={{ marginTop: 6 }}>
            {enviando ? 'Un momento…' : esRegistro ? 'Crear cuenta' : 'Iniciar sesión'}
          </button>

          <p className="auth-cambio">
            {esRegistro ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}{' '}
            <button type="button" className="btn-link" onClick={() => { setModo(esRegistro ? 'login' : 'registro'); setError(''); }}>
              {esRegistro ? 'Inicia sesión' : 'Regístrate'}
            </button>
          </p>
        </motion.form>
      </div>
    </div>
  );
}
