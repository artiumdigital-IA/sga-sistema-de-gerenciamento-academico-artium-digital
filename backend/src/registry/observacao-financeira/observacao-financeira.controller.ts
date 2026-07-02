import { Controller, Get, Post, Delete, Body, Param, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ObservacaoFinanceiraService } from './observacao-financeira.service';
import { CreateObservacaoFinanceiraDto } from './dto/create-observacao-financeira.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';

@ApiTags('Observações Financeiras')
@ApiBearerAuth()
@Roles(Perfil.ADMIN, Perfil.FINANCEIRO, Perfil.SECRETARIA)
@Controller('observacoes-financeiras')
export class ObservacaoFinanceiraController {
  constructor(private readonly service: ObservacaoFinanceiraService) {}

  @Get(':alunoId')
  @ApiOperation({ summary: 'Listar observações financeiras do aluno' })
  findByAluno(@Param('alunoId') alunoId: string) {
    return this.service.findByAluno(alunoId);
  }

  @Post(':alunoId')
  @ApiOperation({ summary: 'Registrar observação financeira do aluno' })
  create(@Param('alunoId') alunoId: string, @Body() dto: CreateObservacaoFinanceiraDto, @Request() req: any) {
    return this.service.create(alunoId, dto, req.user?.id);
  }

  @Delete('item/:id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(id, req.user?.id);
  }
}
