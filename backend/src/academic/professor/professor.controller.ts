import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProfessorService } from './professor.service';
import { CreateProfessorDto } from './dto/create-professor.dto';
import { UpdateProfessorDto } from './dto/update-professor.dto';

@ApiTags('professores')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('professores')
export class ProfessorController {
  constructor(private readonly service: ProfessorService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastrar professor' })
  create(@Body() dto: CreateProfessorDto, @Request() req: any) {
    return this.service.create(dto, req.user?.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar professores' })
  findAll() { return this.service.findAll(); }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar professor por ID' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar professor' })
  update(@Param('id') id: string, @Body() dto: UpdateProfessorDto, @Request() req: any) {
    return this.service.update(id, dto, req.user?.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover professor' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(id, req.user?.id);
  }
}
