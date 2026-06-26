import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { StatusProcesso } from '@prisma/client';
import { CreateProcessoSeletivoDto } from './create-processo-seletivo.dto';

export class UpdateProcessoSeletivoDto extends PartialType(CreateProcessoSeletivoDto) {
  @IsOptional() @IsEnum(StatusProcesso) status?: StatusProcesso;
}
