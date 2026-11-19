export const LIMITE_IMAGEM_PRODUTO = 2 * 1024 * 1024;
export const TIPOS_IMAGEM_PRODUTO = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export function urlImagemPermitida(url) {
  return !url || /^(https:\/\/[^\s]+|\/images\/[^\s]+)$/.test(url);
}

export async function validarImagemProduto(arquivo) {
  if (!arquivo || !TIPOS_IMAGEM_PRODUTO[arquivo.type]) throw new Error('Selecione uma imagem JPG, PNG ou WebP. SVG não é aceito.');
  if (!arquivo.size || arquivo.size > LIMITE_IMAGEM_PRODUTO) throw new Error('A imagem deve ter conteúdo e no máximo 2 MB.');
  const bytes = new Uint8Array(await arquivo.slice(0, 12).arrayBuffer());
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte);
  const webp = String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  if (!({ 'image/jpeg': jpeg, 'image/png': png, 'image/webp': webp }[arquivo.type])) {
    throw new Error('O conteúdo do arquivo não corresponde a uma imagem JPG, PNG ou WebP válida.');
  }
  return TIPOS_IMAGEM_PRODUTO[arquivo.type];
}
