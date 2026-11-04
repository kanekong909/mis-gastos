import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../api';
import { ahoraLocal, aInputFecha } from '../utils/formato';
import SelectorConCreacion from './SelectorConCreacion';
import InputMonto from './InputMonto';
import MontosRapidos from './MontosRapidos';
import FechaHora from './FechaHora';
import ModalCategorias from './ModalCategorias';

// Registrar o editar un ingreso: de qué fuente viene y a qué billetera entró.
export default function FormIngreso({ inicial, onGuardado, textoBoton = 'Guardar ingreso' }) {
  const [billeteras, setBilleteras] = useState([]);
  const [fuentes, setFuentes] = useState([]);
  const [gestionando, setGestionando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState(() => ({
    monto: inicial ? String(Number(inicial.monto)) : '',
    billetera_id: inicial?.billetera_id ?? null,
    fuente_id: inicial?.fuente_id ?? null,
    fecha: inicial ? aInputFecha(inicial.fecha) : ahoraLocal(),
    descripcion: inicial?.descripcion ?? '',
  }));

  const cargar = async () => {
    const [b, f] = await Promise.all([api.billeteras.listar(), api.fuentes.listar()]);
    setBilleteras(b);
    setFuentes(f);
    return [b, f];
  };

  useEffect(() => {
    cargar()
      .then(([b]) => {
        // Al registrar, se preselecciona la primera billetera para agilizar.
        if (!inicial && b.length) setForm((f) => ({ ...f, billetera_id: f.billetera_id ?? b[0].id }));
      })
      .catch((e) => toast.error(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (campo) => (v) => setForm((f) => ({ ...f, [campo]: v }));

  const crearBilletera = async (datos) => {
    const r = await api.billeteras.crear(datos);
    await cargar();
    set('billetera_id')(r.id);
    toast.success(`Billetera "${datos.nombre}" creada`);
  };
  const crearFuente = async (datos) => {
    const r = await api.fuentes.crear({ nombre: datos.nombre, color: datos.color });
    await cargar();
    set('fuente_id')(r.id);
    toast.success(`Fuente "${datos.nombre}" creada`);
  };

  const enviar = async (e) => {
    e.preventDefault();
    if (!(Number(form.monto) > 0)) return toast.error('Ingresa un monto mayor a cero');
    if (!form.fuente_id) return toast.error('Escoge de dónde viene el ingreso');
    setGuardando(true);
    try {
      const datos = { ...form, monto: Number(form.monto), fecha: form.fecha.replace('T', ' ') };
      if (inicial) await api.ingresos.editar(inicial.id, datos);
      else await api.ingresos.crear(datos);
      toast.success(inicial ? 'Ingreso actualizado' : 'Ingreso registrado');
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
      <div className="monto-caja ingreso">
        <label htmlFor="monto-ingreso">Monto</label>
        <InputMonto
          id="monto-ingreso"
          className="input input-monto"
          placeholder="$0"
          value={form.monto}
          onChange={set('monto')}
          autoFocus={!inicial}
        />
        <MontosRapidos valor={form.monto} onAjustar={(calcular) => setForm((f) => ({ ...f, monto: calcular(Number(f.monto) || 0) }))} />
      </div>

      <SelectorConCreacion
        etiqueta="Fuente"
        items={fuentes}
        valor={form.fuente_id}
        onCambio={set('fuente_id')}
        onCrear={crearFuente}
        onGestionar={() => setGestionando(true)}
      />
      <SelectorConCreacion
        etiqueta="Billetera"
        items={billeteras}
        valor={form.billetera_id}
        onCambio={set('billetera_id')}
        onCrear={crearBilletera}
        conSaldo
        textoNinguna="Sin billetera"
      />
      <ModalCategorias
        abierto={gestionando}
        onCerrar={() => setGestionando(false)}
        onCambio={cargar}
        recurso={api.fuentes}
        titulo="Mis fuentes de ingreso"
        singular="Fuente"
        plural="fuentes"
        unidad="ingreso"
      />

      <div className="campo">
        <label htmlFor="desc-ingreso">Descripción</label>
        <input
          id="desc-ingreso"
          className="input"
          placeholder="Ej: pago de noviembre, venta de un equipo…"
          maxLength={255}
          value={form.descripcion}
          onChange={(e) => set('descripcion')(e.target.value)}
        />
      </div>
      <div className="campo">
        <label>Fecha y hora</label>
        <FechaHora value={form.fecha} onChange={set('fecha')} />
      </div>

      <button className="btn btn-primario btn-bloque btn-ingreso" disabled={guardando}>
        {guardando ? 'Guardando…' : textoBoton}
      </button>
    </form>
  );
}
