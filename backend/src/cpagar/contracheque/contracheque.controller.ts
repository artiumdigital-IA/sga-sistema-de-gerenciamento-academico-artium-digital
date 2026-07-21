import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ContrachequeService } from './contracheque.service';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';
import { Tela } from '../../permissoes-tela/decorators/tela.decorator';

@ApiTags('CPagar — Contracheque')
@ApiBearerAuth()
@Roles(Perfil.ADMIN, Perfil.FINANCEIRO)
@Controller('cpagar/contracheque')
@Tela('cpagar-folha')
export class ContrachequeController {
  constructor(private readonly service: ContrachequeService) {}

  @Get(':itemFolhaId')
  @ApiOperation({ summary: 'Dados do contracheque de um item de folha, pra impressão' })
  getContracheque(@Param('itemFolhaId') itemFolhaId: string) {
    return this.service.getContracheque(itemFolhaId);
  }
}
