import { useState } from 'react';
import { formatearMonto } from './InputMonto';
import { Segmentado } from './Controles';

const VALORES = [100, 200, 500, 1000, 2000, 20000, 50000];

// Botones para ir armando el monto sin teclear: suman o restan al valor actual.
// `valor` usa el mismo formato crudo que InputMonto ("20000.5"). `onAjustar(fn)` recibe una
// función que calcula el monto nuevo a partir del anterior: así varios toques seguidos se
// acumulan bien aunque React aún no haya vuelto a pintar entre uno y otro.
export default function MontosRapidos({ valor, onAjustar }) {
  const [modo, setModo] = useState('sumar');
  const resta = modo === 'restar';
  const actual = Number(valor) || 0;

  const aplicar = (cantidad) => onAjustar((anterior) => {
    // En centavos para no arrastrar errores de decimales (0.1 + 0.2). Nunca queda negativo.
    const centavos = Math.round(anterior * 100) + (resta ? -cantidad : cantidad) * 100;
    return centavos > 0 ? String(centavos / 100) : '';
  });

  return (
    <div className="montos-rapidos">
      <Segmentado
        valor={modo}
        onCambio={setModo}
        opciones={[{ valor: 'sumar', etiqueta: '＋' }, { valor: 'restar', etiqueta: '−' }]}
      />
      {VALORES.map((v) => (
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
