import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../api';
import { ahoraLocal } from '../utils/formato';
import FormGasto from '../components/FormGasto';
import ListaGastos from '../components/ListaGastos';

export default function NuevoGasto() {
  const [deHoy, setDeHoy] = useState([]);
  const cargarHoy = () => api.gastos.listar({ dia: ahoraLocal().slice(0, 10) }).then(setDeHoy).catch(() => {});

  useEffect(() => { cargarHoy(); }, []);

  return (
    <>
      <div className="encabezado">
        <div>
          <h1>Registrar gasto</h1>
          <p>Anota lo que gastaste; si la billetera o categoría no existe, créala aquí mismo.</p>
        </div>
      </div>

      <div className="rejilla rejilla-3-1">
        <motion.div className="tarjeta" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <FormGasto onGuardado={cargarHoy} />
        </motion.div>

        <motion.div className="tarjeta" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <div className="tarjeta-cab">
            <h2>Registrados hoy</h2>
            <Link to="/registros" className="btn-link">Ver todo</Link>
          </div>
          <ListaGastos gastos={deHoy} agrupar={false} />
        </motion.div>
      </div>
    </>
  );
}
