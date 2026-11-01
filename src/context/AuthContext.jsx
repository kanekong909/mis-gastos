import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, tokenGuardado, EVENTO_SESION_EXPIRADA } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(Boolean(tokenGuardado.get()));

  const cerrarSesionLocal = useCallback(() => {
    tokenGuardado.set(null);
    setUsuario(null);
  }, []);

  // Restaura la sesión si hay un token guardado.
  useEffect(() => {
    if (!tokenGuardado.get()) return;
    api.yo()
      .then((r) => setUsuario(r.usuario))
      .catch(cerrarSesionLocal)
      .finally(() => setCargando(false));
  }, [cerrarSesionLocal]);

  useEffect(() => {
    window.addEventListener(EVENTO_SESION_EXPIRADA, cerrarSesionLocal);
    return () => window.removeEventListener(EVENTO_SESION_EXPIRADA, cerrarSesionLocal);
  }, [cerrarSesionLocal]);

  const entrar = async (fn, datos) => {
    const r = await fn(datos);
    tokenGuardado.set(r.token);
    setUsuario(r.usuario);
  };

  const valor = {
    usuario,
    cargando,
    login: (datos) => entrar(api.login, datos),
    registro: (datos) => entrar(api.registro, datos),
    logout: async () => {
      try { await api.logout(); } catch { /* igual se cierra localmente */ }
      cerrarSesionLocal();
    },
  };

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
