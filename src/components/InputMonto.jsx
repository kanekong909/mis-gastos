import { useLayoutEffect, useRef } from 'react';

// Convierte lo que escribe el usuario ("20.000,5") al valor crudo ("20000.5").
// El punto es separador de miles y la coma separa los decimales (máx. 2).
export function limpiarMonto(texto) {
  const s = String(texto).replace(/[^\d,]/g, '');
  const [entero = '', ...resto] = s.split(',');
  const enteroLimpio = entero.replace(/^0+(?=\d)/, '');
  if (!resto.length) return enteroLimpio;
  return `${enteroLimpio || '0'}.${resto.join('').slice(0, 2)}`;
}

// Valor crudo ("20000.5") a texto visible ("20.000,5").
export function formatearMonto(valor) {
  if (valor === '' || valor === null || valor === undefined) return '';
  const [entero, decimales] = String(valor).split('.');
  const conPuntos = entero.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return decimales !== undefined ? `${conPuntos},${decimales}` : conPuntos;
}

// Input de dinero que muestra 20.000 mientras se escribe. `value` y el
// argumento de `onChange` son el valor crudo (string numérico sin formato).
export default function InputMonto({ value, onChange, className = 'input', ...props }) {
  const ref = useRef(null);
  // Cuántos dígitos/comas había antes del cursor, para devolverlo a su sitio
  // después de que el formato agregue o quite puntos.
  const cursor = useRef(null);

  useLayoutEffect(() => {
    const input = ref.current;
    if (cursor.current === null || !input || document.activeElement !== input) return;
    let restantes = cursor.current;
    let pos = 0;
    while (pos < input.value.length && restantes > 0) {
      if (/[\d,]/.test(input.value[pos])) restantes--;
      pos++;
    }
    input.setSelectionRange(pos, pos);
    cursor.current = null;
  });

  const alCambiar = (e) => {
    const { value: texto, selectionStart } = e.target;
    cursor.current = texto.slice(0, selectionStart).replace(/[^\d,]/g, '').length;
    onChange(limpiarMonto(texto));
  };

  return (
    <input
      ref={ref}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      className={className}
      value={formatearMonto(value)}
      onChange={alCambiar}
      {...props}
    />
  );
}
