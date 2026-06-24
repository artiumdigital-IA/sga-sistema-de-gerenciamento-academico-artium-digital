import { IsDateString, IsEnum, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Semestre } from '@prisma/client';

export class CreatePeriodoLetivoDto {
  @ApiProperty({ example: 2026 })
  @IsInt()
  @Min(2000)
  ano: number;

  @ApiProperty({ enum: Semestre, example: Semestre.S1 })
  @IsEnum(Semestre)
  semestre: Semestre;

  @ApiProperty({ example: '2026-02-01' })
  @IsDateString()
  dataInicio: string;

  @ApiProperty({ example: '2026-06-30' })
  @IsDateString()
  dataFim: string;
}
