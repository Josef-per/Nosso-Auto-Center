import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { filtrarProdutos } from '../src/catalogo/filtrarProdutos.js';
import { validarAvaliacao } from '../src/lib/avaliacoes.js';
import { destinoAposAcesso } from '../src/auth/destinoAcesso.js';

test('avaliações: retorno ao produto mantém allowlist interna após autenticação', () => {
  assert.equal(destinoAposAcesso('?continuar=/produto/1'), '/produto/1');
  for(const path of ['//externo.test/produto/1','https://externo.test','/produto/1/../../admin','/produto/0','/produto/1?externo=sim']) assert.equal(destinoAposAcesso(new URLSearchParams({continuar:path})), '/minha-conta');
});

test('catálogo: filtros combinados, busca, estoque e preço sem mutar a origem', () => {
  const produtos = [
    { id: 1, name: 'Pastilha', brand: 'Marca A', category: 'Freios', stock: 2, price: 90 },
    { id: 2, name: 'Disco', brand: 'Marca A', category: 'Freios', stock: 0, price: 80 },
    { id: 3, name: 'Filtro', brand: 'Marca B', category: 'Motor', stock: 3, price: 30 },
  ];
  assert.deepEqual(filtrarProdutos(produtos, {category:'Freios',brand:'Marca A',stockOnly:true,maxPrice:100}).map(p=>p.id), [1]);
  assert.deepEqual(filtrarProdutos(produtos, {search:'  MARCA b  '}).map(p=>p.id), [3]);
  assert.deepEqual(filtrarProdutos(produtos, {sort:'high'}).map(p=>p.id), [1,2,3]);
  assert.deepEqual(filtrarProdutos(produtos, {sort:'low'}).map(p=>p.id), [3,2,1]);
  assert.deepEqual(filtrarProdutos(produtos, {category:'inexistente'}), []);
  assert.deepEqual(produtos.map(p=>p.id), [1,2,3]);
});

test('avaliações: nota inteira, comentário opcional e limite Unicode', () => {
  for(const nota of [0,6,-1,1.5,NaN,undefined,'5']) assert.throws(()=>validarAvaliacao(nota), /1 a 5/);
  assert.deepEqual(validarAvaliacao(5,'  Muito boa  '), {nota:5,comentario:'Muito boa'});
  assert.deepEqual(validarAvaliacao(1,'  '), {nota:1,comentario:null});
  assert.equal(validarAvaliacao(3,'😀'.repeat(1000)).comentario.length,2000);
  assert.throws(()=>validarAvaliacao(3,'a'.repeat(1001)), /1.000/);
});

test('avaliações: RPC ausente, erros, escrita sem autoria e conflito de duplicidade', async (t) => {
  const server=await createServer({server:{middlewareMode:true,hmr:false,ws:false,watch:null},appType:'custom'});
  try {
    const {supabase}=await server.ssrLoadModule('/src/lib/supabaseClient.js');
    const service=await server.ssrLoadModule('/src/services/avaliacaoService.js');
    let response={data:null,error:{code:'PGRST202'}};
    t.mock.method(supabase,'rpc',async(name,args)=>{assert.equal(name,'consultar_avaliacoes');assert.equal(args.p_produto_id,1);return response;});
    assert.equal(await service.consultarAvaliacoes(1),null);
    response={data:{total:0,media:null,comentarios:[]},error:null};
    assert.equal((await service.consultarAvaliacoes(1)).total,0);
    response={error:{code:'NETWORK'}};
    await assert.rejects(service.consultarAvaliacoes(1), /carregar/);
    const operations=[];
    t.mock.method(supabase,'from',(table)=>{
      assert.equal(table,'avaliacoes_produtos');
      return {
        insert(values){operations.push(['insert',values]);return this;},
        update(values){operations.push(['update',values]);return this;},
        delete(){operations.push(['delete']);return this;},
        eq(k,v){operations.push(['eq',k,v]);return this;},
        select(){return this;},
        single:async()=>response,
      };
    });
    response={data:{id:'teste'},error:null};
    await service.salvarAvaliacao(1,'cliente-a',5,'Bom');
    assert.deepEqual(operations[0],['insert',{produto_id:1,nota:5,comentario:'Bom'}]);
    operations.length=0;
    await service.salvarAvaliacao(1,'cliente-a',4,'Revisto',true);
    assert.deepEqual(operations[0],['update',{nota:4,comentario:'Revisto'}]);
    assert.ok(operations.some(x=>x[0]==='eq'&&x[1]==='usuario_id'&&x[2]==='cliente-a'));
    response={error:{code:'23505'}};
    await assert.rejects(service.salvarAvaliacao(1,'cliente-a',5,''), /já avaliou/);
    await assert.rejects(service.salvarAvaliacao(1,null,5,''), /Entre/);
    await assert.rejects(service.salvarAvaliacao(1,'cliente-a',8,''), /1 a 5/);
    response={data:{id:'teste'},error:null};
    operations.length=0;
    await service.removerAvaliacao(1,'cliente-a');
    assert.equal(operations[0][0],'delete');
    assert.ok(operations.some(x=>x[1]==='usuario_id'&&x[2]==='cliente-a'));
  } finally {await server.close();}
});
