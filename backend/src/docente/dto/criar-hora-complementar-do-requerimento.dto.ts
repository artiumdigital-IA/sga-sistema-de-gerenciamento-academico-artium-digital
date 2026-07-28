import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CriarHoraComplementarDoRequerimentoDto {
  @ApiProperty({ description: 'ID do Requerimento de Hora Complementar (com certificado já anexado pelo aluno)' })
  @IsUUID()
  requerimentoId: string;

  @ApiProperty({ example: 4, description: 'Quantidade de horas a lançar' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  horas: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacoes?: string;
}
