import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { TemaProvider } from './context/TemaContext';
import { MonedaProvider } from './context/MonedaContext';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <TemaProvider>
        <AuthProvider>
          <MonedaProvider>
            <App />
          </MonedaProvider>
        </AuthProvider>
      </TemaProvider>
    </BrowserRouter>
  </StrictMode>
);
