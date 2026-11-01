import { createContext, useContext, useEffect, useState } from 'react';
import { ACENTOS, ACENTO_INICIAL, iconoSvg } from '../utils/acentos';

const TemaContext = createContext(null);

const leerAcento = () => {
  const guardado = document.documentElement.dataset.acento;
  return ACENTOS.some((a) => a.id === guardado) ? guardado : ACENTO_INICIAL;
};

export function TemaProvider({ children }) {
  const [tema, setTema] = useState(() => document.documentElement.dataset.tema || 'claro');
  const [acento, setAcento] = useState(leerAcento);

  useEffect(() => {
    document.documentElement.dataset.tema = tema;
    try { localStorage.setItem('tema', tema); } catch { /* sin storage */ }
  }, [tema]);

  useEffect(() => {
    document.documentElement.dataset.acento = acento;
    try { localStorage.setItem('acento', acento); } catch { /* sin storage */ }

    // Barra del navegador y favicon con el color elegido.
    const { hex } = ACENTOS.find((a) => a.id === acento);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', hex);
    const icono = document.querySelector('link[rel="icon"]');
    if (icono) icono.href = `data:image/svg+xml,${encodeURIComponent(iconoSvg(hex))}`;
  }, [acento]);

  const alternar = () => setTema((t) => (t === 'oscuro' ? 'claro' : 'oscuro'));

  return <TemaContext.Provider value={{ tema, alternar, acento, setAcento }}>{children}</TemaContext.Provider>;
}

export const useTema = () => useContext(TemaContext);
