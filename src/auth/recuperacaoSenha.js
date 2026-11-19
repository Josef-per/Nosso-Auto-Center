// Autorização efêmera na memória desta aba, estabelecida apenas pelo SDK Auth.
// Uma sessão comum ou parâmetros de URL não habilitam a redefinição.
export function criarRecuperacaoSenha(auth, limparRetorno = () => {}) {
  let estado = { status: 'verificando' };
  const listeners = new Set();
  function publicar(next) {
    estado = next;
    for (const listener of listeners) listener();
  }
  const { data: { subscription } } = auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY' && session?.user?.id) {
      publicar({ status: 'valido', usuarioId: session.user.id });
      limparRetorno();
    } else if (event === 'SIGNED_OUT' || event === 'SIGNED_IN'
      || (estado.status === 'valido' && session?.user?.id !== estado.usuarioId)) {
      publicar({ status: 'invalido' });
    }
  });
  // O SDK processa automaticamente o retorno (implicit atual ou PKCE, se configurado).
  // A assinatura acima antecede a inicialização e o carregamento lazy das páginas.
  const inicializacao = auth.getSession().then(() => new Promise((resolve) => {
    setTimeout(() => {
      if (estado.status === 'verificando') publicar({ status: 'invalido' });
      limparRetorno();
      resolve();
    }, 0);
  }), () => { publicar({ status: 'invalido' }); limparRetorno(); });

  return {
    inicializacao,
    getSnapshot: () => estado,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    invalidar() { publicar({ status: 'invalido' }); },
    async conferir() {
      const permitido = estado;
      if (permitido.status !== 'valido') throw new Error('recuperacao_invalida');
      const { data, error } = await auth.getUser();
      if (error) {
        if (error.status === 401 || error.status === 403 || ['session_not_found', 'session_expired', 'bad_jwt', 'user_not_found', 'refresh_token_not_found'].includes(error.code)) {
          publicar({ status: 'invalido' });
        }
        throw error;
      }
      if (!data?.user || data.user.id !== permitido.usuarioId || estado !== permitido) {
        publicar({ status: 'invalido' });
        throw new Error('recuperacao_invalida');
      }
    },
    dispose() { subscription.unsubscribe(); listeners.clear(); },
  };
}
