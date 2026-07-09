import { SetMetadata } from '@nestjs/common';

/**
 * Marca um handler (ou um controller inteiro) com a "chave" de tela
 * correspondente em TELAS_SISTEMA (telas-sistema.ts). O TelaPermissaoGuard
 * usa essa metadata pra bloquear a chamada de API se o perfil do usuario
 * autenticado tiver essa tela desabilitada na matriz de Permissoes de Tela
 * (/dashboard/admin/permissoes).
 *
 * Antes desse guard, desabilitar uma tela na matriz so escondia o
 * icone/link no menu do frontend -- a chamada direta ao endpoint via API
 * continuava funcionando pra quem tivesse o @Roles() do backend liberado.
 * Essa era exatamente a lacuna descrita na nota de seguranca da propria
 * tela de Permissoes.
 *
 * Aplicar no nivel do controller cobre todos os handlers dele. Um handler
 * especifico pode sobrescrever com sua propria @Tela(...) (ex: a rota
 * "mapao" dentro do controller de matriculas usa a chave 'mapao', nao
 * 'matriculas'). Nao aplicar em nada = handler nao e bloqueado por tela --
 * usado de proposito pra rotas de infraestrutura, autoatendimento ("meu
 * perfil", "minha senha") e os poucos widgets compartilhados em toda a
 * aplicacao (Painel inicial, chat de Mensagens, modal de Ramais), que
 * qualquer perfil autenticado precisa conseguir carregar independente de
 * qual tela de gestao esta habilitada pra ele.
 */
export const TELA_PERMISSAO_KEY = 'telaPermissao';
export const Tela = (chave: string) => SetMetadata(TELA_PERMISSAO_KEY, chave);
