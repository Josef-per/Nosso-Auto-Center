export default function DeliveryDetails({ entrega }) {
  return <details className="delivery-details"><summary>Dados de entrega</summary>
    {!entrega ? <p className="text-muted">Dados de entrega indisponíveis nesta consulta. Atualize os dados após aplicar a atualização administrativa.</p> : <dl className="delivery-data">
      <div><dt>Comprador</dt><dd>{entrega.comprador || 'Nome não informado'}</dd></div>
      <div><dt>Telefone</dt><dd>{entrega.telefone || 'Não informado'}</dd></div>
      <div><dt>Endereço registrado no pedido</dt><dd>
        {entrega.endereco ? <address>
          <span>{entrega.endereco.logradouro || 'Logradouro não informado'}{entrega.endereco.numero ? ', ' + entrega.endereco.numero : ''}</span>
          {entrega.endereco.complemento && <span>{entrega.endereco.complemento}</span>}
          {entrega.endereco.bairro && <span>{entrega.endereco.bairro}</span>}
          <span>{[entrega.endereco.cidade, entrega.endereco.uf].filter(Boolean).join(' / ') || 'Cidade e UF não informadas'}</span>
          <span>CEP: {entrega.endereco.cep || 'Não informado'}</span>
        </address> : 'Endereço não informado neste pedido'}
      </dd></div>
    </dl>}
  </details>;
}
