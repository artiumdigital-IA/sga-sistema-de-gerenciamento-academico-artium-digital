import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PeriodoStatus } from '@prisma/client';
import { CreatePeriodoLetivoDto } from './create-periodo-letivo.dto';

export class UpdatePeriodoLetivoDto extends PartialType(CreatePeriodoLetivoDto) {
  @IsOptional()
  @IsEnum(PeriodoStatus)
  status?: PeriodoStatus;
}
