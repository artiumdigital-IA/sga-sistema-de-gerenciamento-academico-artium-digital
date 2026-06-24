import { IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMatriculaDisciplinaDto {
  @ApiProperty({ description: 'ID do aluno' })
  @IsUUID()
  alunoId: string;

  @ApiProperty({ description: 'ID da oferta' })
  @IsUUID()
  ofertaId: string;

  @ApiPropertyOptional({ default: false, description: 'Matrícula como dependência (DP)' })
  @IsOptional()
  @IsBoolean()
  isDependencia?: boolean;
}
