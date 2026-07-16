import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SystemService } from './system.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';
import { Tela } from '../permissoes-tela/decorators/tela.decorator';

@ApiTags('Sistema')
@ApiBearerAuth()
@Roles(Perfil.ADMIN, Perfil.MASTER)
@Controller('sistema')
@Tela('sistema')
export class SystemController {
  constructor(private readonly service: SystemService) {}

  @Get('status')
  @ApiOperation({ summary: 'Painel de verificação geral: backend, SO/VPS, disco, banco de dados e contagens' })
  getStatus() {
    return this.service.getStatus();
  }
}
