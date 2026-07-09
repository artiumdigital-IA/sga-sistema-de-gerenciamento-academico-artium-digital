import { Body, Controller, Get, Patch, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Perfil } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminMasterGuard } from '../auth/guards/admin-master.guard';
import { PermissoesTelaService } from './permissoes-tela.service';
import { AlternarPermissaoDto } from './dto/alternar-permissao.dto';

@ApiTags('Permissoes de Tela')
@ApiBearerAuth()
@Controller('permissoes-tela')
export class PermissoesTelaController {
  constructor(private readonly service: PermissoesTelaService) {}

  // Qualquer usuário autenticado — usado pelo frontend pra filtrar o próprio
  // menu. Rota literal ANTES de qualquer rota com guard mais restritivo do
  // mesmo controller pra não colidir (aqui não há conflito de path, mas
  // mantém o padrão já usado em usuarios.controller.ts).
  @Get('minhas')
  @ApiOperation({ summary: 'Chaves de tela habilitadas pro perfil do usuário autenticado' })
  async minhas(@Request() req: any): Promise<string[]> {
    return this.service.minhasChavesHabilitadas(req.user.perfil as Perfil);
  }

  // ── Gestão da matriz (só admin@fiurj.edu.br) ────────────────────────────

  @Roles(Perfil.ADMIN)
  @UseGuards(AdminMasterGuard)
  @Get()
  @ApiOperation({ summary: 'Matriz completa tela × perfil (admin master)' })
  async matriz() {
    return this.service.matriz();
  }

  @Roles(Perfil.ADMIN)
  @UseGuards(AdminMasterGuard)
  @Patch()
  @ApiOperation({ summary: 'Habilitar/desabilitar uma tela pra um perfil (admin master)' })
  async alternar(@Body() dto: AlternarPermissaoDto, @Request() req: any) {
    return this.service.alternar(dto, req.user?.id);
  }
}
