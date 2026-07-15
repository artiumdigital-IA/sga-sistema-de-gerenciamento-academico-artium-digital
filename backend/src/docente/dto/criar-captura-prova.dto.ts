import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CriarCapturaProvaDto {
  @ApiProperty({ description: 'ID do aluno cuja prova está sendo capturada' })
  @IsUUID()
  alunoId: string;

  @ApiProperty({ description: 'ID da oferta (turma/disciplina) — precisa ser uma turma do próprio professor' })
  @IsUUID()
  ofertaId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacoes?: string;
}
