import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { dinero, dineroCorto, MESES, MESES_CORTOS } from '../utils/formato';

const ejes = { stroke: 'var(--texto-3)', fontSize: 12, tickLine: false, axisLine: false };

function TooltipDinero({ active, payload, etiqueta }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="tooltip-grafica">
      <div className="t">{etiqueta(payload[0].payload)}</div>
      <div>{dinero(payload[0].value)}</div>
    </div>
  );
}

function TooltipMes({ active, payload }) {
  if (!active || !payload?.length) return null;
  const fila = payload[0].payload;
  return (
    <div className="tooltip-grafica">
      <div className="t">{MESES[fila.mes - 1]}</div>
      <div><span className="punto" style={{ background: 'var(--primario-2)', display: 'inline-block', marginRight: 6 }} />Gastos {dinero(fila.total)}</div>
      <div><span className="punto" style={{ background: 'var(--exito)', display: 'inline-block', marginRight: 6 }} />Ingresos {dinero(fila.ingresos)}</div>
    </div>
  );
}

// Gastos (color del tema) e ingresos (verde) de cada mes.
// Tocar una barra selecciona el mes; tocar el mes ya seleccionado lo quita (lo decide `onClickMes`).
export function GraficaMensual({ datos, mesActivo, onClickMes }) {
  const sinSeleccion = !mesActivo;
  return (
    <div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={datos} margin={{ top: 8, right: 4, left: -8, bottom: 0 }} barGap={2}>
          <CartesianGrid vertical={false} stroke="var(--borde)" strokeDasharray="4 4" />
          <XAxis dataKey="mes" tickFormatter={(m) => MESES_CORTOS[m - 1]} {...ejes} />
          <YAxis tickFormatter={dineroCorto} width={64} {...ejes} />
          <Tooltip cursor={{ fill: 'var(--superficie-2)' }} content={<TooltipMes />} />
          <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={20} animationDuration={700} onClick={(d) => onClickMes?.(d.mes)} style={{ cursor: onClickMes ? 'pointer' : 'default' }}>
            {datos.map((d) => (
              <Cell key={d.mes} fill={d.mes === mesActivo ? 'url(#gradBarra)' : 'var(--primario-suave)'} />
            ))}
          </Bar>
          <Bar dataKey="ingresos" radius={[6, 6, 0, 0]} maxBarSize={20} animationDuration={700} onClick={(d) => onClickMes?.(d.mes)} style={{ cursor: onClickMes ? 'pointer' : 'default' }}>
            {datos.map((d) => (
              <Cell key={d.mes} fill="var(--exito)" fillOpacity={sinSeleccion || d.mes === mesActivo ? 0.9 : 0.28} />
            ))}
          </Bar>
          <defs>
            <linearGradient id="gradBarra" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" style={{ stopColor: 'color-mix(in oklch, var(--ac-1) 60%, white)' }} />
              <stop offset="100%" style={{ stopColor: 'var(--ac-1)' }} />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
      <div className="leyenda-mini">
        <span><i className="punto" style={{ background: 'var(--ac-1)' }} /> Gastos</span>
        <span><i className="punto" style={{ background: 'var(--exito)' }} /> Ingresos</span>
      </div>
    </div>
  );
}

export function GraficaDiaria({ datos }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={datos} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="gradArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: 'var(--primario-2)' }} stopOpacity={0.4} />
            <stop offset="100%" style={{ stopColor: 'var(--primario-2)' }} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--borde)" strokeDasharray="4 4" />
        <XAxis dataKey="dia" interval="preserveStartEnd" minTickGap={14} {...ejes} />
        <YAxis tickFormatter={dineroCorto} width={64} {...ejes} />
        <Tooltip content={<TooltipDinero etiqueta={(p) => `Día ${p.dia}`} />} />
        <Area type="monotone" dataKey="total" stroke="var(--primario-2)" strokeWidth={2.5} fill="url(#gradArea)" animationDuration={800} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// `seleccionada` es el id de la categoría resaltada (o null). Tocar una porción o una fila de la
// leyenda la selecciona; tocar la misma otra vez, o el centro de la dona, la quita.
export function GraficaCategorias({ datos, seleccionada = null, onSeleccionar }) {
  const total = datos.reduce((s, d) => s + Number(d.total), 0);
  const filas = datos.map((d) => ({ ...d, total: Number(d.total) }));
  const activa = filas.find((d) => d.id === seleccionada) || null;
  const alternar = (id) => onSeleccionar?.(id === seleccionada ? null : id);
  return (
    <div>
      <div style={{ position: 'relative' }}>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={filas} dataKey="total" nameKey="nombre" innerRadius={62} outerRadius={90} paddingAngle={3} cornerRadius={6}
              stroke="none" animationDuration={800} style={{ cursor: onSeleccionar ? 'pointer' : 'default', outline: 'none' }}
              onClick={(d) => alternar(d.id)}
            >
              {filas.map((d) => <Cell key={d.id} fill={d.color} fillOpacity={activa && activa.id !== d.id ? 0.28 : 1} />)}
            </Pie>
            {/* Con una categoría seleccionada el centro ya muestra su monto: el globo del tooltip
                (que en el celular se queda pegado al tocar) se encimaba con ese texto. */}
            {!activa && <Tooltip content={<TooltipDinero etiqueta={(p) => p.nombre} />} wrapperStyle={{ outline: 'none', zIndex: 5 }} />}
          </PieChart>
        </ResponsiveContainer>
        {/* El centro también quita la selección: es el lugar más natural donde tocar para "soltar" */}
        <button
          type="button"
          className="dona-centro"
          onClick={() => activa && onSeleccionar?.(null)}
          disabled={!activa}
          aria-label={activa ? `Quitar selección de ${activa.nombre}` : undefined}
        >
          <span className="texto-3" style={{ fontSize: '.75rem' }}>{activa ? activa.nombre : 'Total'}</span>
          <span className="negrita">{dineroCorto(activa ? activa.total : total)}</span>
          {activa && <span className="dona-quitar">Quitar ✕</span>}
        </button>
      </div>
      <div className="leyenda">
        {filas.map((d) => (
          <button
            type="button"
            key={d.id}
            className={`leyenda-item ${activa?.id === d.id ? 'activo' : ''} ${activa && activa.id !== d.id ? 'atenuado' : ''}`}
            onClick={() => alternar(d.id)}
            aria-pressed={activa?.id === d.id}
          >
            <span className="punto" style={{ background: d.color }} />
            <span className="nombre">{d.nombre}</span>
            <span className="valor">{dinero(d.total)}</span>
            <span className="pct">{total ? Math.round((d.total / total) * 100) : 0}%</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function GraficaPresupuestos({ datos }) {
  const filas = datos.map((p) => ({ nombre: p.categoria, Presupuesto: Number(p.monto), Gastado: Number(p.gastado), color: p.color }));
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, filas.length * 54)}>
      <BarChart data={filas} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }} barGap={-14}>
        <CartesianGrid horizontal={false} stroke="var(--borde)" strokeDasharray="4 4" />
        <XAxis type="number" tickFormatter={dineroCorto} {...ejes} />
        <YAxis type="category" dataKey="nombre" width={92} {...ejes} />
        <Tooltip
          cursor={{ fill: 'var(--superficie-2)' }}
          content={({ active, payload }) => active && payload?.length ? (
            <div className="tooltip-grafica">
              <div className="t">{payload[0].payload.nombre}</div>
              <div>Gastado: {dinero(payload[0].payload.Gastado)}</div>
              <div>Presupuesto: {dinero(payload[0].payload.Presupuesto)}</div>
            </div>
          ) : null}
        />
        <Bar dataKey="Presupuesto" fill="var(--superficie-2)" radius={8} barSize={14} animationDuration={600} />
        <Bar dataKey="Gastado" radius={8} barSize={14} animationDuration={900}>
          {filas.map((f) => <Cell key={f.nombre} fill={f.Gastado > f.Presupuesto ? 'var(--peligro)' : f.color} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// Ingresos por fuente: una barra horizontal por cada una, con su parte del total.
export function BarrasFuentes({ datos }) {
  const total = datos.reduce((s, d) => s + Number(d.total), 0);
  return (
    <div className="fuentes-barras">
      {datos.map((d) => {
        const pct = total ? (Number(d.total) / total) * 100 : 0;
        return (
          <div className="fuente-fila" key={d.id}>
            <div className="fuente-cab">
              <span className="punto" style={{ background: d.color }} />
              <span className="nombre">{d.nombre}</span>
              <span className="valor">{dinero(d.total)}</span>
              <span className="pct">{Math.round(pct)}%</span>
            </div>
            <div className="barra"><div className="barra-relleno" style={{ width: `${pct}%`, background: d.color }} /></div>
          </div>
        );
      })}
    </div>
  );
}
