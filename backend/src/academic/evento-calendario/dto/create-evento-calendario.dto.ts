import { IsDateString, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEventoCalendarioDto {
  @ApiProperty({ example: 'a1b2c3d4-...' })
  @IsString()
  periodoLetivoId: string;

  @ApiPropertyOptional({ example: 'Exames Finais', description: 'Agrupador opcional (ex.: Exames Finais / Exames de 2ª Época)' })
  @IsOptional()
  @IsString()
  grupo?: string;

  @ApiProperty({ example: 'Início das Aulas' })
  @IsString()
  @MinLength(2)
  titulo: string;

  @ApiProperty({ example: '2026-02-09' })
  @IsDateString()
  dataInicio: string;

  @ApiPropertyOptional({ example: '2026-02-20' })
  @IsOptional()
  @IsDateString()
  dataFim?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacoes?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  ordem?: number;
}
