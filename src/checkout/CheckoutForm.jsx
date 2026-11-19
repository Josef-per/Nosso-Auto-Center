import SelectField from '../components/SelectField';
import { useEffect, useRef, useState } from 'react';
import { MapPin, UserRound } from 'lucide-react';
import FormField from '../components/FormField';
import PaymentOptions from '../components/PaymentOptions';
import ShippingEstimate from '../components/ShippingEstimate';
import { consultarCep } from '../services/cepService';
import { estados } from '../lib/enderecoEntrega';
import { apenasDigitos, mascararCep, mascararCpf } from '../lib/identificacao';

const campos = [
  { nome: 'logradouro', rotulo: 'Logradouro', autoComplete: 'address-line1' },
  { nome: 'numero', rotulo: 'Número', maxLength: 30 },
  { nome: 'bairro', rotulo: 'Bairro (opcional)', autoComplete: 'address-level3', opcional: true },
  { nome: 'complemento', rotulo: 'Complemento (opcional)', autoComplete: 'address-line2', opcional: true },
  { nome: 'cidade', rotulo: 'Cidade', autoComplete: 'address-level2' },
];
export default function CheckoutForm({ onSubmit, erroCampo, enviando, bloqueado, endereco, onEndereco, pagamento, onPagamento, frete }) {
  const [cpf, setCpf] = useState('');
  const [consulta, setConsulta] = useState({});
  const pedido = useRef(null);
  useEffect(() => () => pedido.current?.abort(), []);
  function editar(campo, valor) {
    pedido.current?.abort();
    setConsulta({});
    onEndereco({ ...endereco, [campo]: valor });
  }
  async function buscar() {
    pedido.current?.abort();
    const controller = new AbortController();
    pedido.current = controller;
    if (apenasDigitos(endereco.cep).length !== 8) {
      setConsulta({ erro: 'Informe um CEP com 8 dígitos.' });
      return;
    }
    setConsulta({ carregando: true });
    try {
      const dados = await consultarCep(endereco.cep, { signal: controller.signal });
      if (!controller.signal.aborted) {
        onEndereco({ ...endereco, ...dados });
        setConsulta({ texto: 'Endereço preenchido. Confira os dados e informe o número. Você pode corrigir todos os campos.' });
      }
    } catch (error) {
      if (!controller.signal.aborted) setConsulta({ erro: error.message });
    }
  }
  return <section className="panel" aria-labelledby="titulo-endereco">
    <p className="eyebrow">DADOS PARA O PEDIDO</p><h2 id="titulo-endereco">Identificação e entrega</h2>
    <form className="checkout-form" onSubmit={onSubmit} noValidate>
      <fieldset disabled={enviando}>
        <h3 className="form-section-title"><UserRound size={19} aria-hidden="true" />Identificação</h3>
        <FormField id="entrega-cpf" name="cpf" label="CPF" value={cpf} onChange={(e) => setCpf(mascararCpf(e.target.value))}
          inputMode="numeric" autoComplete="off" maxLength={14} required error={erroCampo?.campo === 'cpf' ? erroCampo.erro : undefined}
          hint="Conferimos apenas os dígitos verificadores. Isso não verifica identidade. O CPF não será armazenado no pedido." />
        <h3 className="form-section-title"><MapPin size={19} aria-hidden="true" />Endereço de entrega</h3><div className="cep-search">
          <FormField id="entrega-cep" name="cep" label="CEP" value={endereco.cep} onChange={(e) => editar('cep', mascararCep(e.target.value))}
            inputMode="numeric" autoComplete="postal-code" maxLength={9} required onBlur={() => { if (apenasDigitos(endereco.cep).length === 8) buscar(); }}
            error={erroCampo?.campo === 'cep' ? erroCampo.erro : consulta.erro} />
          <button className="pill" type="button" onClick={buscar} disabled={consulta.carregando}>{consulta.carregando ? 'Consultando…' : 'Consultar CEP'}</button>
        </div>
        <p className="text-muted">A consulta ao ViaCEP auxilia o preenchimento do endereço. Ela não verifica a identidade do comprador.</p>
        {(consulta.carregando || consulta.texto) && <p className="cart-feedback" role="status">{consulta.carregando ? 'Consultando CEP…' : consulta.texto}</p>}
        <div className="checkout-fields">
          {campos.map(({ nome, rotulo, opcional, ...atributos }) => <FormField key={nome} id={'entrega-' + nome} name={nome} label={rotulo}
            className={nome === 'logradouro' || nome === 'complemento' ? 'checkout-wide' : ''}
            value={endereco[nome]} onChange={(e) => editar(nome, e.target.value)} required={!opcional} maxLength={200}
            error={erroCampo?.campo === nome ? erroCampo.erro : undefined} {...atributos} />)}
          <div><label className="field" htmlFor="entrega-uf">UF</label><SelectField id="entrega-uf" name="uf" className="forminput" value={endereco.uf}
            onChange={(e) => editar('uf', e.target.value)} required aria-invalid={erroCampo?.campo === 'uf' || undefined}
            aria-describedby={erroCampo?.campo === 'uf' ? 'erro-uf' : undefined}>
            <option value="">Selecione</option>{estados.map((uf) => <option value={uf} key={uf}>{uf}</option>)}
          </SelectField>{erroCampo?.campo === 'uf' && <p className="field-error" id="erro-uf" role="alert">{erroCampo.erro}</p>}</div>
        </div>
        <ShippingEstimate value={frete} />
        <PaymentOptions value={pagamento} onChange={onPagamento} />
        {erroCampo?.campo === 'pagamento' && <p className="field-error" role="alert">{erroCampo.erro}</p>}
        <button className="pill primary" type="submit" disabled={bloqueado || consulta.carregando}>{enviando ? 'Confirmando pedido…' : 'Registrar pedido demonstrativo'}</button>
      </fieldset>
    </form>
  </section>;
}
