import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PagamentoPrestadorService } from './pagamento-prestador.service';
import { CreatePagamentoPrestadorDto } from './dto/create-pagamento-prestador.dto';
import { UpdatePagamentoPrestadorDto } from './dto/update-pagamento-prestador.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Perfil } from '@prisma/client';
import { Tela } from '../../permissoes-tela/decorators/tela.decorator';

@ApiTags('CPagar — Pagamentos de Prestador')
@ApiBearerAuth()
@Roles(Perfil.ADMIN, Perfil.FINANCEIRO)
@Controller('cpagar/pagamentos-prestador')
@Tela('cpagar-prestadores')
export class PagamentoPrestadorController {
  constructor(private readonly service: PagamentoPrestadorService) {}

  @Post()
  create(@Body() dto: CreatePagamentoPrestadorDto, @Request() req: any) {
    return this.service.create(dto, req.user?.sub);
  }

  @Get()
  @ApiQuery({ name: 'colaboradorId', required: false })
  findAll(@Query('colaboradorId') colaboradorId?: string) {
    return this.service.findAll(colaboradorId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePagamentoPrestadorDto, @Request() req: any) {
    return this.service.update(id, dto, req.user?.sub);
  }

  @Patch(':id/pagar')
  marcarPago(@Param('id') id: string, @Request() req: any) {
    return this.service.marcarPago(id, req.user?.sub);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(id, req.user?.sub);
  }
}
