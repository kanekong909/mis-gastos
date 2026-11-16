import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { tasaMoneda } from '../utils/moneda';

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

const redondear = (n) => Math.round(n * 100) / 100;
// Pesos (crudo) -> texto crudo en la moneda elegida, sin ceros de más ("12.5").
const pesosATexto = (cop, tasa) => (cop === '' || cop === null || cop === undefined || Number.isNaN(Number(cop)) ? '' : String(redondear(Number(cop) / tasa)));
const textoAPesos = (texto, tasa) => (texto === '' || Number.isNaN(Number(texto)) ? '' : String(redondear(Number(texto) * tasa)));
const normalizar = (v) => (v === '' || v === null || v === undefined ? '' : String(Number(v)));

// Input de dinero que muestra 20.000 mientras se escribe. `value` y el argumento de `onChange`
// son SIEMPRE pesos en valor crudo (string numérico sin formato), pero si la moneda elegida es
// otra (USD, EUR) lo que se ve y se escribe es esa moneda y se convierte con la tasa del día.
// `sinConversion` es para números que no son dinero (por ejemplo, un porcentaje).
export default function InputMonto({ value, onChange, className = 'input', sinConversion = false, ...props }) {
  const ref = useRef(null);
  const tasa = sinConversion ? 1 : tasaMoneda();
  const convierte = tasa !== 1;
  // Lo escrito en la moneda elegida; se conserva aparte para no perder, por ejemplo, la coma de "10,".
  const [texto, setTexto] = useState(() => (convierte ? pesosATexto(value, tasa) : ''));
  // Cuántos dígitos/comas había antes del cursor, para devolverlo a su sitio
  // después de que el formato agregue o quite puntos.
  const cursor = useRef(null);

  // Si el valor cambia desde afuera (botones rápidos, reinicio del formulario…), se recalcula el texto.
  useEffect(() => {
    if (convierte && textoAPesos(texto, tasa) !== (normalizar(value) === '' ? '' : String(redondear(Number(value))))) {
      setTexto(pesosATexto(value, tasa));
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

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
    const { value: escrito, selectionStart } = e.target;
    cursor.current = escrito.slice(0, selectionStart).replace(/[^\d,]/g, '').length;
    const limpio = limpiarMonto(escrito);
    if (!convierte) return onChange(limpio);
    setTexto(limpio);
    onChange(textoAPesos(limpio, tasa));
  };

  return (
    <input
      ref={ref}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      className={className}
      value={formatearMonto(convierte ? texto : value)}
      onChange={alCambiar}
      {...props}
    />
  );
}
