import { Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import { Cargando } from './components/Controles';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import NuevoGasto from './pages/NuevoGasto';
import Registros from './pages/Registros';
import Presupuestos from './pages/Presupuestos';
import Creditos from './pages/Creditos';

export default function App() {
  const { usuario, cargando } = useAuth();

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: 'var(--superficie)', color: 'var(--texto)', border: '1px solid var(--borde)', borderRadius: 14, fontWeight: 600 },
        }}
      />
      {cargando ? (
        <Cargando />
      ) : !usuario ? (
        <Auth />
      ) : (
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="nuevo" element={<NuevoGasto />} />
            <Route path="registros" element={<Registros />} />
            <Route path="presupuestos" element={<Presupuestos />} />
            <Route path="creditos" element={<Creditos />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      )}
    </>
  );
}
