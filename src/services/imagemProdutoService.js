import { supabase } from '../lib/supabaseClient';
import { validarImagemProduto } from '../lib/imagemProduto';
import { verificarAdmin } from './adminService';

export async function enviarImagemProduto(arquivo) {
  const extensao = await validarImagemProduto(arquivo);
  if (await verificarAdmin() !== true) throw new Error('Acesso administrativo não autorizado.');
  const caminho = `catalogo/${crypto.randomUUID()}.${extensao}`;
  const bucket = supabase.storage.from('produtos');
  let resultado;
  try {
    resultado = await bucket.upload(caminho, arquivo, { contentType: arquivo.type, cacheControl: '31536000', upsert: false });
  } catch (error) {
    throw new Error('Não foi possível enviar a imagem. Verifique sua conexão e tente novamente.', { cause: error });
  }
  if (resultado.error) {
    const codigo = String(resultado.error.statusCode ?? resultado.error.status ?? '');
    const mensagem = ['401', '403'].includes(codigo) ? 'O envio não foi autorizado. Verifique sua sessão e as permissões do Storage.'
      : codigo === '404' ? 'O bucket de imagens ainda não está disponível. Aplique a configuração do Storage.'
        : codigo === '413' ? 'A imagem excede o limite de 2 MB permitido pelo Storage.'
          : 'Não foi possível enviar a imagem. Verifique a configuração do Storage e tente novamente.';
    throw new Error(mensagem, { cause: resultado.error });
  }
  const { data } = bucket.getPublicUrl(caminho);
  return { caminho, url: data.publicUrl };
}
