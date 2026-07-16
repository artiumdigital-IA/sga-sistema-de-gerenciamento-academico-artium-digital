import { IsString, IsOptional, IsUUID, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const PRIORIDADES = ['BAIXA', 'MEDIA', 'ALTA', 'URGENTE'] as const;

export class CreateChamadoManutencaoDto {
  @ApiProperty()
  @IsUUID()
  tipoId: string;

  @ApiProperty({ example: 'Sala 101' })
  @IsString()
  local: string;

  @ApiPropertyOptional({ enum: PRIORIDADES, default: 'MEDIA' })
  @IsOptional()
  @IsIn(PRIORIDADES)
  prioridade?: (typeof PRIORIDADES)[number];

  @ApiProperty({ example: 'Ar-condicionado não liga' })
  @IsString()
  titulo: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descricao?: string;
}
