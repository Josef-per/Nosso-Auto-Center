import { Link } from 'react-router-dom';
import { SobreEmpresa, GaleriaEmpresa, ConfiancaEmpresa, ContatoEmpresa } from '../components/EmpresaSections';
export default function Sobre() {
  return <div className="institutional-page"><div className="container page-heading"><nav className="crumb" aria-label="Localização"><Link to="/">Início</Link> / Sobre nós</nav><p className="eyebrow">NOSSO AUTO CENTER</p><h1>De Franca, para o<br />seu próximo caminho.</h1><p className="text-muted">Autopeças, oficina e uma história que começou em 2018.</p></div><SobreEmpresa completa /><ConfiancaEmpresa /><GaleriaEmpresa /><ContatoEmpresa /></div>;
}
