import { useState } from 'react';
import { formatearMonto } from './InputMonto';
import { Segmentado } from './Controles';
import { monedaActual, tasaMoneda } from '../utils/moneda';

// Valores de los botones: en pesos son miles; en dólares o euros, unidades.
const VALORES = {
  COP: [100, 200, 500, 1000, 2000, 10000, 20000, 50000],
  USD: [1, 2, 5, 10, 20, 50, 100, 200],
  EUR: [1, 2, 5, 10, 20, 50, 100, 200],
};
const redondear = (n) => Math.round(n * 100) / 100;

// Botones para ir armando el monto sin teclear: suman o restan al valor actual.
// `valor` usa el mismo formato crudo que InputMonto ("20000.5"). `onAjustar(fn)` recibe una
// función que calcula el monto nuevo a partir del anterior: así varios toques seguidos se
// acumulan bien aunque React aún no haya vuelto a pintar entre uno y otro.
export default function MontosRapidos({ valor, onAjustar }) {
  const [modo, setModo] = useState('sumar');
  const resta = modo === 'restar';
  const actual = Number(valor) || 0;

  const tasa = tasaMoneda();
  const aplicar = (cantidad) => onAjustar((anteriorPesos) => {
    // La cuenta se hace en la moneda elegida (en centavos, para no arrastrar errores de decimales
    // como 0.1 + 0.2) y el resultado vuelve a pesos. Nunca queda negativo.
    const centavos = Math.round(redondear(anteriorPesos / tasa) * 100) + (resta ? -cantidad : cantidad) * 100;
    return centavos > 0 ? String(redondear((centavos / 100) * tasa)) : '';
  });

  return (
    <div className="montos-rapidos">
      <Segmentado
        valor={modo}
        onCambio={setModo}
        opciones={[{ valor: 'sumar', etiqueta: '＋' }, { valor: 'restar', etiqueta: '−' }]}
      />
      {VALORES[monedaActual()].map((v) => (
        <button
          key={v}
          type="button"
          className={`monto-rapido ${resta ? 'resta' : ''}`}
          onClick={() => aplicar(v)}
          disabled={resta && actual === 0}
          aria-label={`${resta ? 'Restar' : 'Sumar'} ${formatearMonto(v)}`}
        >
          {resta ? '−' : '+'}{formatearMonto(v)}
        </button>
      ))}
      <button type="button" className="monto-rapido borrar" onClick={() => onAjustar(() => '')} disabled={!actual} aria-label="Borrar monto">
        Borrar
      </button>
    </div>
  );
}
