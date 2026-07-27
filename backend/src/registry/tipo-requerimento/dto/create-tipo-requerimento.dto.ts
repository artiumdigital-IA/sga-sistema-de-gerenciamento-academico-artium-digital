import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTipoRequerimentoDto {
  @ApiProperty({ example: 'Declaração de Matrícula' })
  @IsString()
  @MinLength(2)
  nome: string;

  @ApiPropertyOptional({ example: 5, description: 'Prazo de entrega em dias' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  prazoDias?: number;

  @ApiPropertyOptional({ example: 'Secretaria' })
  @IsOptional()
  @IsString()
  local?: string;

  @ApiProperty({ example: 80.0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  taxa: number;

  @ApiPropertyOptional({ example: 'POR DISCIPLINA' })
  @IsOptional()
  @IsString()
  observacaoTaxa?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @ApiPropertyOptional({ example: 0, description: 'Ordem de exibição na tabela' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  ordem?: number;
}
