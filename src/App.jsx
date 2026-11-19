import RotaAdmin from './auth/RotaAdmin';
import { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { RotaProtegida, RotaVisitante } from './auth/RotasConta';
import SessaoProvider from './auth/SessaoProvider';
import CarrinhoProvider from './carrinho/CarrinhoProvider';
import Layout from './components/Layout';
import Home from './pages/Home';
import MinhaConta from './pages/MinhaConta';
import NaoEncontrada from './pages/NaoEncontrada';

const Admin = lazy(() => import('./pages/Admin'));
const Acesso = lazy(() => import('./pages/Acesso'));
const Carrinho = lazy(() => import('./pages/Carrinho'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Loja = lazy(() => import('./pages/Loja'));
const PedidoConfirmado = lazy(() => import('./pages/PedidoConfirmado'));
const Produto = lazy(() => import('./pages/Produto'));
const Sobre = lazy(() => import('./pages/Sobre'));
const EsqueciSenha = lazy(() => import('./pages/EsqueciSenha'));
const RedefinirSenha = lazy(() => import('./pages/RedefinirSenha'));

export default function App() {
  return (
    <SessaoProvider>
      <CarrinhoProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="loja" element={<Loja />} />
            <Route path="sobre" element={<Sobre />} />
            <Route path="produto/:id" element={<Produto />} />
            <Route path="carrinho" element={<Carrinho />} />
            <Route path="esqueci-senha" element={<EsqueciSenha />} />
            <Route path="redefinir-senha" element={<RedefinirSenha />} />
            <Route element={<RotaVisitante />}>
              <Route path="login" element={<Acesso key="login" />} />
              <Route path="cadastro" element={<Acesso key="cadastro" cadastro />} />
            </Route>
            <Route element={<RotaProtegida />}>
              <Route element={<RotaAdmin />}><Route path="admin" element={<Admin />} /></Route>
              <Route path="minha-conta" element={<MinhaConta />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="pedido-confirmado/:id" element={<PedidoConfirmado />} />
            </Route>
            <Route path="*" element={<NaoEncontrada />} />
          </Route>
        </Routes>
      </CarrinhoProvider>
    </SessaoProvider>
  );
}
