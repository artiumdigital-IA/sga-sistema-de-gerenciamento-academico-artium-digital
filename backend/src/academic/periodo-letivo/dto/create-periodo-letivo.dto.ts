import { IsDateString, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

  @ApiPropertyOptional({ example: 18, description: 'Semanas letivas (metadado do calendário acadêmico)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  semanasLetivas?: number;

  @ApiPropertyOptional({ example: 102, description: 'Dias letivos (metadado do calendário acadêmico)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  diasLetivos?: number;
}
