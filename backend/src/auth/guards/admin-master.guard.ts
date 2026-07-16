import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

/**
 * E-mail da conta admin original, sempre autorizada a mexer na matriz de
 * permissoes de tela (quem enxerga o que no menu, por perfil) -- alem dela,
 * qualquer usuario com perfil MASTER tambem tem acesso (Jul/2026). Ainda
 * deliberadamente restrito -- nao ao perfil ADMIN em geral -- pra essa area
 * sensivel nao ficar exposta a toda conta administrativa que a instituicao
 * venha a criar no futuro.
 */
const EMAIL_ADMIN_MASTER = 'admin@fiurj.edu.br';

@Injectable()
export class AdminMasterGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();
    if (!user || (user.email !== EMAIL_ADMIN_MASTER && user.perfil !== 'MASTER')) {
      throw new ForbiddenException('Acesso restrito ao administrador principal.');
    }
    return true;
  }
}
