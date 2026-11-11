import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowDownUp, Landmark } from 'lucide-react';
import { api } from '../api';
import { ahoraLocal, aInputFecha, dinero } from '../utils/formato';
import InputMonto from './InputMonto';
import MontosRapidos from './MontosRapidos';
import FechaHora from './FechaHora';

// Una fila de chips con las billeteras.
function ChipsBilletera({ etiqueta, billeteras, valor, onCambio }) {
  return (
    <div className="campo">
      <label>{etiqueta}</label>
      <div className="chips">
        {billeteras.map((b) => (
          <button
            key={b.id}
            type="button"
            className={`chip ${valor === b.id ? 'activo' : ''}`}
            style={{ '--chip-color': b.color }}
            onClick={() => onCambio(b.id)}
          >
            <span className="punto" style={{ background: b.color }} />
            {b.nombre}
            <span className="texto-3" style={{ fontWeight: 500 }}>{dinero(b.saldo)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Pasar dinero de una billetera a otra. No es gasto ni ingreso: solo mueve saldo.
export default function FormTransferencia({ inicial, onGuardado, textoBoton = 'Transferir' }) {
  const [billeteras, setBilleteras] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState(() => ({
    monto: inicial ? String(Number(inicial.monto)) : '',
    origen_id: inicial?.origen_id ?? null,
    destino_id: inicial?.destino_id ?? null,
    fecha: inicial ? aInputFecha(inicial.fecha) : ahoraLocal(),
    descripcion: inicial?.descripcion ?? '',
  }));

  const cargar = async () => {
    const b = await api.billeteras.listar();
    setBilleteras(b);
    return b;
  };

  useEffect(() => {
    cargar()
      .then((b) => {
        // Al crear, se propone sacar de la billetera con más plata hacia otra, para ahorrar toques.
        if (!inicial && b.length > 1) {
          const origen = b.reduce((mayor, x) => (Number(x.saldo) > Number(mayor.saldo) ? x : mayor), b[0]);
          const destino = b.find((x) => x.id !== origen.id);
          setForm((f) => ({ ...f, origen_id: f.origen_id ?? origen.id, destino_id: f.destino_id ?? destino.id }));
        }
      })
      .catch((e) => toast.error(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (campo) => (v) => setForm((f) => ({ ...f, [campo]: v }));
  const intercambiar = () => setForm((f) => ({ ...f, origen_id: f.destino_id, destino_id: f.origen_id }));

  // Al elegir una billetera que ya está en la otra fila, se intercambian en vez de chocar.
  const elegirOrigen = (id) => setForm((f) => (id === f.destino_id ? { ...f, origen_id: id, destino_id: f.origen_id } : { ...f, origen_id: id }));
  const elegirDestino = (id) => setForm((f) => (id === f.origen_id ? { ...f, destino_id: id, origen_id: f.destino_id } : { ...f, destino_id: id }));

  if (billeteras === null) return <div className="cargando" style={{ minHeight: 160 }}><div className="spinner" /></div>;

  if (billeteras.length < 2) {
    return (
      <div className="vacio">
        <Landmark size={40} />
        <span>Necesitas al menos dos billeteras para transferir entre ellas.</span>
        <span className="texto-3" style={{ fontSize: '.85rem' }}>Créalas desde el Dashboard o al registrar un gasto.</span>
      </div>
    );
  }

  const origen = billeteras.find((b) => b.id === form.origen_id);
  const destino = billeteras.find((b) => b.id === form.destino_id);
  const monto = Number(form.monto) || 0;
  // Vista previa de cómo quedarían los saldos (solo al crear: al editar el saldo ya incluye la transferencia).
  const vista = !inicial && origen && destino && monto > 0;

  const enviar = async (e) => {
    e.preventDefault();
    if (!(monto > 0)) return toast.error('Ingresa un monto mayor a cero');
    if (!form.origen_id || !form.destino_id) return toast.error('Escoge las dos billeteras');
    if (form.origen_id === form.destino_id) return toast.error('Escoge dos billeteras distintas');
    setGuardando(true);
    try {
      const datos = { ...form, monto, fecha: form.fecha.replace('T', ' ') };
      if (inicial) await api.transferencias.editar(inicial.id, datos);
      else await api.transferencias.crear(datos);
      toast.success(inicial ? 'Transferencia actualizada' : `Transferiste ${dinero(monto)} a ${destino.nombre}`);
      if (!inicial) {
        setForm((f) => ({ ...f, monto: '', descripcion: '', fecha: ahoraLocal() }));
        cargar();
      }
      onGuardado?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={enviar}>
      <div className="monto-caja transferencia">
        <label htmlFor="monto-transf">Monto</label>
        <InputMonto
          id="monto-transf"
          className="input input-monto"
          placeholder="$0"
          value={form.monto}
          onChange={set('monto')}
          autoFocus={!inicial}
        />
        <MontosRapidos valor={form.monto} onAjustar={(calcular) => setForm((f) => ({ ...f, monto: calcular(Number(f.monto) || 0) }))} />
      </div>

      <ChipsBilletera etiqueta="Sale de" billeteras={billeteras} valor={form.origen_id} onCambio={elegirOrigen} />
      <div className="transf-intercambio">
        <button type="button" className="btn btn-secundario" onClick={intercambiar} aria-label="Intercambiar origen y destino">
          <ArrowDownUp size={16} /> Intercambiar
        </button>
      </div>
      <ChipsBilletera etiqueta="Entra a" billeteras={billeteras} valor={form.destino_id} onCambio={elegirDestino} />

      {vista && (
        <div className="transf-vista">
          <div><span className="punto" style={{ background: origen.color }} /> {origen.nombre}: {dinero(origen.saldo)} → <b>{dinero(Number(origen.saldo) - monto)}</b></div>
          <div><span className="punto" style={{ background: destino.color }} /> {destino.nombre}: {dinero(destino.saldo)} → <b>{dinero(Number(destino.saldo) + monto)}</b></div>
        </div>
      )}

      <div className="campo">
        <label htmlFor="desc-transf">Descripción (opcional)</label>
        <input
          id="desc-transf"
          className="input"
          placeholder="Ej: retiro del cajero, pasar al ahorro…"
          maxLength={255}
          value={form.descripcion}
          onChange={(e) => set('descripcion')(e.target.value)}
        />
      </div>
      <div className="campo">
        <label>Fecha y hora</label>
        <FechaHora value={form.fecha} onChange={set('fecha')} />
      </div>

      <button className="btn btn-primario btn-bloque" disabled={guardando}>
        {guardando ? 'Transfiriendo…' : textoBoton}
      </button>
    </form>
  );
}
