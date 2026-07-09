import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

/**
 * E-mail da unica conta autorizada a mexer na matriz de permissoes de tela
 * (quem enxerga o que no menu, por perfil). Deliberadamente restrito a UMA
 * conta especifica -- nao ao perfil ADMIN em geral -- pra essa area sensivel
 * nao ficar exposta a toda conta administrativa que a instituicao venha a
 * criar no futuro.
 */
const EMAIL_ADMIN_MASTER = 'admin@fiurj.edu.br';

@Injectable()
export class AdminMasterGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();
    if (!user || user.email !== EMAIL_ADMIN_MASTER) {
      throw new ForbiddenException('Acesso restrito ao administrador principal.');
    }
    return true;
  }
}
