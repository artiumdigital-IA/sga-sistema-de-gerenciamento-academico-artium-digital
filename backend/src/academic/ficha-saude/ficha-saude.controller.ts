import { Controller, Get, Put, Param, Body, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { FichaSaudeService } from './ficha-saude.service';
import { UpsertFichaSaudeDto } from './dto/upsert-ficha-saude.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';

// Dado sensível (LGPD) — restrito a ADMIN/SECRETARIA em toda a rota, leitura inclusive.
@ApiTags('fichas-saude')
@ApiBearerAuth()
@Roles(Perfil.ADMIN, Perfil.SECRETARIA)
@Controller('fichas-saude')
export class FichaSaudeController {
  constructor(private readonly service: FichaSaudeService) {}

  @Get(':alunoId')
  @ApiOperation({ summary: 'Buscar ficha de saúde do aluno (ADMIN/SECRETARIA)' })
  findByAluno(@Param('alunoId') alunoId: string) {
    return this.service.findByAluno(alunoId);
  }

  @Put(':alunoId')
  @ApiOperation({ summary: 'Criar ou atualizar ficha de saúde do aluno (ADMIN/SECRETARIA)' })
  upsert(@Param('alunoId') alunoId: string, @Body() dto: UpsertFichaSaudeDto, @Request() req: any) {
    return this.service.upsert(alunoId, dto, req.user?.id);
  }
}
