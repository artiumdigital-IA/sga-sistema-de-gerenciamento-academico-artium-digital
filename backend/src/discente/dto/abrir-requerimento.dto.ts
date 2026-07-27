import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Abertura de requerimento pelo PRÓPRIO aluno (autoatendimento — Menu
 * Discente > Requerimentos), escolhendo um item da tabela de preços (ver
 * TipoRequerimentoCatalogo). Sem `alunoId` — o backend força o alunoId do
 * usuário autenticado (ver DiscenteService.abrirRequerimento).
 */
export class AbrirRequerimentoDto {
  @ApiProperty({ description: 'ID do tipo de requerimento (ver GET /discente/requerimentos/tipos)' })
  @IsUUID()
  tipoCatalogoId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descricao?: string;
}
