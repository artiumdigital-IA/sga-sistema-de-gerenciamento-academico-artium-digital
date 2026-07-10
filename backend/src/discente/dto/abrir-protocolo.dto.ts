import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Abertura de protocolo pelo PRÓPRIO aluno (autoatendimento — Menu Discente
 * > Protocolo). Igual ao CreateProtocoloDto usado pela secretaria, mas sem
 * `alunoId` — o backend força o alunoId do usuário autenticado (ver
 * DiscenteService.abrirProtocolo), pra um aluno nunca poder abrir protocolo
 * em nome de outro.
 */
export class AbrirProtocoloDto {
  @ApiProperty({ description: 'ID do tipo de protocolo (ver GET /discente/protocolo/tipos)' })
  @IsUUID()
  tipoId: string;

  @ApiProperty({ example: 'Solicitação de revisão de nota' })
  @IsString()
  assunto: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descricao?: string;
}
