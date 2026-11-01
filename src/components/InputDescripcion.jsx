import { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { History } from 'lucide-react';
import { api } from '../api';

const sinTildes = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// Resalta en negrita las partes de la sugerencia que coinciden con lo escrito.
function Resaltado({ texto, buscado }) {
  const palabras = sinTildes(buscado).split(/\s+/).filter(Boolean);
  if (!palabras.length) return texto;
  const plano = sinTildes(texto); // mismo largo que `texto`: solo se quitan marcas combinadas
  const marcas = new Array(texto.length).fill(false);
  palabras.forEach((p) => {
    let i = plano.indexOf(p);
    while (i !== -1) {
      for (let k = i; k < i + p.length; k++) marcas[k] = true;
      i = plano.indexOf(p, i + p.length);
    }
  });
  const trozos = [];
  for (let i = 0; i < texto.length; ) {
    let j = i;
    while (j < texto.length && marcas[j] === marcas[i]) j++;
    trozos.push([texto.slice(i, j), marcas[i]]);
    i = j;
  }
  return trozos.map(([t, negrita], n) => (negrita ? <strong key={n}>{t}</strong> : <span key={n}>{t}</span>));
}

// Campo de descripción que sugiere descripciones que ya usaste antes.
// `onElegir(sugerencia)` recibe { descripcion, categoria_id, categoria, ... }.
export default function InputDescripcion({ value, onChange, onElegir, ...props }) {
  const [sugerencias, setSugerencias] = useState([]);
  const [abierto, setAbierto] = useState(false);
  const [activa, setActiva] = useState(-1);
  const idLista = useId();
  const peticion = useRef(0);
  const eligiendo = useRef(false); // evita volver a buscar justo después de elegir una sugerencia

  useEffect(() => {
    if (eligiendo.current) { eligiendo.current = false; return; }
    const texto = value.trim();
    if (texto.length < 2) { setSugerencias([]); return; }
    const numero = ++peticion.current;
    const espera = setTimeout(() => {
      api.gastos.sugerir(texto)
        .then((lista) => {
          if (numero !== peticion.current) return; // llegó una respuesta más nueva
          // Si lo escrito ya es exactamente una sugerencia, no tiene caso mostrarla.
          setSugerencias(lista.filter((s) => sinTildes(s.descripcion) !== sinTildes(texto)));
          setActiva(-1);
        })
        .catch(() => setSugerencias([]));
    }, 250);
    return () => clearTimeout(espera);
  }, [value]);

  const elegir = (s) => {
    eligiendo.current = true;
    onChange(s.descripcion);
    onElegir?.(s);
    setAbierto(false);
    setSugerencias([]);
  };

  const alTeclear = (e) => {
    if (!abierto || !sugerencias.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiva((a) => (a + 1) % sugerencias.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiva((a) => (a <= 0 ? sugerencias.length - 1 : a - 1)); }
    else if (e.key === 'Enter' && activa >= 0) { e.preventDefault(); elegir(sugerencias[activa]); }
    else if (e.key === 'Escape') { e.stopPropagation(); setAbierto(false); }
  };

  const visible = abierto && sugerencias.length > 0;

  return (
    <div className="autocompletar">
      <input
        {...props}
        className="input"
        value={value}
        autoComplete="off"
        role="combobox"
        aria-expanded={visible}
        aria-controls={idLista}
        aria-autocomplete="list"
        onChange={(e) => { onChange(e.target.value); setAbierto(true); }}
        onFocus={() => setAbierto(true)}
        onBlur={() => setAbierto(false)}
        onKeyDown={alTeclear}
      />
      <AnimatePresence>
        {visible && (
          <motion.ul
            id={idLista}
            role="listbox"
            className="sugerencias"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
          >
            {sugerencias.map((s, i) => (
              <li
                key={s.descripcion}
                role="option"
                aria-selected={i === activa}
                className={`sugerencia ${i === activa ? 'activa' : ''}`}
                // mousedown (y no click) para que el campo no pierda el foco antes de elegir
                onMouseDown={(e) => { e.preventDefault(); elegir(s); }}
                onMouseEnter={() => setActiva(i)}
              >
                <History size={15} className="texto-3" />
                <span className="sugerencia-texto"><Resaltado texto={s.descripcion} buscado={value} /></span>
                <span className="etiqueta" style={{ '--punto': s.categoria_color }}>{s.categoria}</span>
                {s.veces > 1 && <span className="texto-3 sugerencia-veces">×{s.veces}</span>}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
