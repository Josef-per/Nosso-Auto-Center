export const limiteComentario = 1000;
export function validarAvaliacao(nota, comentario = '') {
  if (!Number.isInteger(nota) || nota < 1 || nota > 5) throw new Error('Escolha uma nota de 1 a 5 estrelas.');
  if (typeof comentario !== 'string' || [...comentario].length > limiteComentario) throw new Error('O comentário deve ter até 1.000 caracteres.');
  return { nota, comentario: comentario.trim() || null };
}
