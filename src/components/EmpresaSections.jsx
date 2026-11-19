import { ArrowUpRight, MapPin, Phone, Store, Wrench, CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';
import { empresa } from '../content/empresa';

export function SobreEmpresa({ completa = false }) {
  return <section className="container company-section" aria-labelledby="titulo-empresa">
    <div className="company-photo">
      <img src="/images/empresa/fachada-real-768.jpg" width="768" height="278" loading="lazy" decoding="async" alt="Fachada laranja do Nosso Auto Center na Avenida Paulo VI" />
      <span><MapPin size={17} aria-hidden="true" />Franca, São Paulo</span>
    </div>
    <div className="company-copy">
      <p className="eyebrow">A OFICINA POR TRÁS DA MARCA</p>
      <h2 id="titulo-empresa">Uma história feita<br />de cuidado.</h2>
      <p>{completa ? 'O Nosso Auto Center abriu as portas em 3 de janeiro de 2018, em Franca. Uma parceria entre Tony Neto Cordeiro, José Elias Duarte e Rosana Cordeiro, construída a partir da experiência no setor automotivo.' : 'Há uma oficina por trás de cada cuidado. Em Franca, o Nosso Auto Center reúne autopeças e serviços automotivos, com atenção à manutenção e às necessidades de cada veículo.'}</p>
      {completa && <p>A proposta reúne a venda de autopeças e os serviços de oficina em um mesmo lugar. Do pneu à troca de óleo, a equipe atende às necessidades de manutenção do veículo.</p>}
      <Link to={completa ? '/#servicos' : '/sobre'} className="subtlelink">{completa ? 'Conheça nossos serviços' : 'Conheça nossa história'}<ArrowUpRight size={18} aria-hidden="true" /></Link>
    </div>
  </section>;
}

export function GaleriaEmpresa() {
  return <section className="container company-gallery section" aria-labelledby="titulo-galeria">
    <div className="section-head"><div><p className="eyebrow">DE PERTO, NOSSO AUTO CENTER</p><h2 id="titulo-galeria">Portas abertas para você.</h2><p>Conheça a fachada e os serviços nos materiais oficiais da empresa.</p></div></div>
    <div className="gallery-grid">
      <figure><img src="/images/empresa/fachada-real-1440.jpg" width="1440" height="522" loading="lazy" decoding="async" alt="Vista externa da oficina e sua entrada na Avenida Paulo VI" /><figcaption><span>01 /</span> Nossa oficina, em Franca</figcaption></figure>
      <figure><img className="gallery-material" src="/images/empresa/servicos-oficiais.jpg" width="1200" height="675" loading="lazy" decoding="async" alt="Material institucional oficial com registros da equipe realizando serviços na oficina" /><figcaption><span>02 /</span> Serviços e instalações · material institucional</figcaption></figure>
    </div>
  </section>;
}

export function ConfiancaEmpresa() {
  return <section className="container trust-section" aria-labelledby="titulo-confianca">
    <div><p className="eyebrow">PRESENÇA REAL. INFORMAÇÃO CLARA.</p><h2 id="titulo-confianca">Confiança se constrói<br />no dia a dia.</h2></div>
    <div className="trust-items">
      <article><Store aria-hidden="true" /><div><h3>Uma oficina de portas abertas</h3><p>{empresa.endereco}, {empresa.cidade}.</p></div></article>
      <article><CalendarDays aria-hidden="true" /><div><h3>Uma história desde 2018</h3><p>Fundada em 3 de janeiro, com atuação no setor automotivo.</p></div></article>
      <article><Wrench aria-hidden="true" /><div><h3>Peças e serviços no mesmo lugar</h3><p>Manutenção e cuidado com os sistemas do seu veículo.</p></div></article>
    </div>
  </section>;
}

export function ContatoEmpresa() {
  return <section className="contact-band container" aria-labelledby="titulo-contato"><div><p className="eyebrow">VAMOS CONVERSAR?</p><h2 id="titulo-contato">O próximo cuidado começa aqui.</h2><p>Fale com a equipe para consultar serviços e atendimento.</p></div><a href="tel:+551634328200" className="pill primary"><Phone size={18} aria-hidden="true" />{empresa.telefone}</a></section>;
}
