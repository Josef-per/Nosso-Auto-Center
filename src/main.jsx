import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BrowserRouter,
  Routes,
  Route,
} from 'react-router-dom';

import "./css/global.css"

import Home from './pages/Home';
import Loja from './pages/Loja';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Loja" element={<Loja />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
