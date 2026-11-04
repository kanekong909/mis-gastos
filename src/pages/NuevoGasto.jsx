import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../api';
import { ahoraLocal } from '../utils/formato';
import FormGasto from '../components/FormGasto';
import FormIngreso from '../components/FormIngreso';
import ListaGastos from '../components/ListaGastos';
import AtajosRapidos from '../components/AtajosRapidos';
import { Segmentado } from '../components/Controles';

// Los ingresos se muestran con la misma lista de los gastos: se les da su forma y la marca "ingreso".
const comoFila = (i) => ({ ...i, tipo: 'ingreso', categoria: i.fuente, categoria_color: i.fuente_color });

export default function NuevoGasto() {
  const [tipo, setTipo] = useState('gasto'); // 'gasto' | 'ingreso'
  const [deHoy, setDeHoy] = useState([]);
  const esIngreso = tipo === 'ingreso';

  const cargarHoy = () => {
    const dia = ahoraLocal().slice(0, 10);
    const pedir = esIngreso ? api.ingresos.listar({ dia }).then((l) => l.map(comoFila)) : api.gastos.listar({ dia });
    return pedir.then(setDeHoy).catch(() => {});
  };

  useEffect(() => {
    setDeHoy([]);
    cargarHoy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo]);

  return (
    <>
      <div className="encabezado">
        <div>
          <h1>{esIngreso ? 'Registrar ingreso' : 'Registrar gasto'}</h1>
          <p>
            {esIngreso
              ? 'Anota el dinero que te entra, de qué fuente viene y a qué billetera llegó.'
              : 'Anota lo que gastaste; si la billetera o categoría no existe, créala aquí mismo.'}
          </p>
        </div>
        <Segmentado
          valor={tipo}
          onCambio={setTipo}
          opciones={[{ valor: 'gasto', etiqueta: 'Gasto' }, { valor: 'ingreso', etiqueta: 'Ingreso' }]}
        />
      </div>

      {!esIngreso && <AtajosRapidos onRegistrado={cargarHoy} />}

      <div className="rejilla rejilla-3-1">
        <motion.div className="tarjeta" key={tipo} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          {esIngreso ? <FormIngreso onGuardado={cargarHoy} /> : <FormGasto onGuardado={cargarHoy} />}
        </motion.div>

        <motion.div className="tarjeta" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <div className="tarjeta-cab">
            <h2>{esIngreso ? 'Ingresos de hoy' : 'Registrados hoy'}</h2>
            <Link to="/registros" className="btn-link">Ver todo</Link>
          </div>
          <ListaGastos gastos={deHoy} agrupar={false} />
        </motion.div>
      </div>
    </>
  );
}
