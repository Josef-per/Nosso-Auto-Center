import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BrowserRouter,
  Routes,
  Route,
} from 'react-router-dom';

import './css/global.css';
import './css/estrutura.css';

import { RotaProtegida, RotaVisitante } from './auth/RotasConta';
import SessaoProvider from './auth/SessaoProvider';
import Layout from './components/Layout';
import Acesso from './pages/Acesso';
import Home from './pages/Home';
import Loja from './pages/Loja';
import MinhaConta from './pages/MinhaConta';
import NaoEncontrada from './pages/NaoEncontrada';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <SessaoProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="loja" element={<Loja />} />
            <Route element={<RotaVisitante />}>
              <Route path="login" element={<Acesso key="login" />} />
              <Route path="cadastro" element={<Acesso key="cadastro" cadastro />} />
            </Route>
            <Route element={<RotaProtegida />}>
              <Route path="minha-conta" element={<MinhaConta />} />
            </Route>
            <Route path="*" element={<NaoEncontrada />} />
          </Route>
        </Routes>
      </SessaoProvider>
    </BrowserRouter>
  </StrictMode>
);
