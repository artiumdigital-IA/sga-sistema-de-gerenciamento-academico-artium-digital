import { IsEnum, IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SituacaoVinculo } from '@prisma/client';

export class MudarSituacaoDto {
  @ApiProperty({ enum: SituacaoVinculo })
  @IsEnum(SituacaoVinculo)
  situacaoNova: SituacaoVinculo;

  @ApiProperty({ example: '2026-07-01' })
  @IsDateString()
  data: string;

  @ApiPropertyOptional({ example: 'Trancamento a pedido do aluno — requerimento nº 1234.' })
  @IsOptional()
  @IsString()
  motivo?: string;
}
