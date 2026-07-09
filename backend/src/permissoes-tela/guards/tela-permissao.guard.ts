import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TELA_PERMISSAO_KEY } from '../decorators/tela.decorator';
import { PermissoesTelaService } from '../permissoes-tela.service';

/**
 * Guard global (registrado em app.module.ts via APP_GUARD, depois do
 * JwtAuthGuard e do RolesGuard) que fecha a lacuna descrita na nota de
 * seguranca da tela de Permissoes: uma tela desabilitada pra um perfil na
 * matriz (/dashboard/admin/permissoes) agora bloqueia tambem a chamada
 * direta ao endpoint de API por tras dela, nao so o icone/link no menu.
 *
 * So entra em acao em rotas marcadas com @Tela('chave') (ver
 * tela.decorator.ts). Rotas sem essa marcacao passam direto -- e assim que
 * ficam de fora, de proposito, endpoints de infraestrutura/autoatendimento
 * e os poucos widgets compartilhados em toda a aplicacao (Painel inicial,
 * chat de Mensagens, modal de Ramais).
 */
@Injectable()
export class TelaPermissaoGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissoesTelaService: PermissoesTelaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const chaveTela = this.reflector.getAllAndOverride<string>(TELA_PERMISSAO_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Sem @Tela() -- rota de infraestrutura, autoatendimento ou widget
    // compartilhado em toda a aplicacao. Nao e bloqueada por tela.
    if (!chaveTela) return true;

    const { user } = context.switchToHttp().getRequest();
    // Sem usuario aqui nao deveria acontecer (JwtAuthGuard ja rodou antes
    // na cadeia de guards globais), mas por seguranca deixamos passar --
    // esse guard nao deve mascarar um 401 de autenticacao com um 403 de
    // permissao de tela.
    if (!user?.perfil) return true;

    const habilitadas = await this.permissoesTelaService.minhasChavesHabilitadas(user.perfil);
    if (!habilitadas.includes(chaveTela)) {
      throw new ForbiddenException(`Sua conta nao tem acesso a tela "${chaveTela}".`);
    }
    return true;
  }
}
