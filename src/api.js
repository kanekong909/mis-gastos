const BASE = import.meta.env.VITE_API_URL || 'http://localhost/mis-gastos/api';

export const tokenGuardado = {
  get: () => { try { return localStorage.getItem('token'); } catch { return null; } },
  set: (t) => { try { t ? localStorage.setItem('token', t) : localStorage.removeItem('token'); } catch { /* sin storage */ } },
};

// Se dispara cuando la API responde 401 para que AuthContext cierre la sesión.
export const EVENTO_SESION_EXPIRADA = 'sesion-expirada';

async function peticion(ruta, { method = 'GET', body, params } = {}) {
  const url = new URL(`${BASE}/${ruta}`);
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  });

  const token = tokenGuardado.get();
  let res;
  try {
    res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}`, 'X-Auth-Token': token } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('No hay conexión con el servidor. ¿Está Apache encendido en XAMPP?');
  }

  const datos = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA));
    throw new Error(datos.error || `Error ${res.status}`);
  }
  return datos;
}

const recurso = (archivo) => ({
  listar: (params) => peticion(archivo, { params }),
  crear: (body) => peticion(archivo, { method: 'POST', body }),
  editar: (id, body) => peticion(archivo, { method: 'PUT', body, params: { id } }),
  eliminar: (id) => peticion(archivo, { method: 'DELETE', params: { id } }),
});

export const api = {
  registro: (body) => peticion('auth.php', { method: 'POST', body, params: { accion: 'registro' } }),
  login: (body) => peticion('auth.php', { method: 'POST', body, params: { accion: 'login' } }),
  yo: () => peticion('auth.php', { params: { accion: 'yo' } }),
  logout: () => peticion('auth.php', { method: 'POST', params: { accion: 'logout' } }),

  billeteras: recurso('billeteras.php'),
  categorias: recurso('categorias.php'),
  gastos: {
    ...recurso('gastos.php'),
    resumenAnios: () => peticion('gastos.php', { params: { resumen: 'anios' } }),
    sugerir: (texto) => peticion('gastos.php', { params: { sugerir: texto } }),
    recientes: () => peticion('gastos.php', { params: { recientes: 1 } }),
  },
  fuentes: recurso('fuentes.php'),
  ingresos: {
    ...recurso('ingresos.php'),
    resumenAnios: () => peticion('ingresos.php', { params: { resumen: 'anios' } }),
  },
  atajos: {
    ...recurso('atajos.php'),
    usar: (id, fecha) => peticion('atajos.php', { method: 'POST', body: { fecha }, params: { accion: 'usar', id } }),
  },
  presupuestos: {
    ...recurso('presupuestos.php'),
    copiar: (body) => peticion('presupuestos.php', { method: 'POST', body, params: { accion: 'copiar' } }),
  },
  dashboard: (anio, mes) => peticion('dashboard.php', { params: { anio, mes } }),
};
