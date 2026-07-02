import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TransferirTurmaDto {
  @ApiProperty({ description: 'ID da oferta (turma) de destino — deve ser da mesma disciplina.' })
  @IsUUID()
  novaOfertaId: string;

  @ApiPropertyOptional({ example: 'Conflito de horário com outra disciplina.' })
  @IsOptional()
  @IsString()
  motivo?: string;
}
