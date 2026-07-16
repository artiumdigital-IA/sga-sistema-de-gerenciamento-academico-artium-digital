import { IsIn, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const STATUS = ['ABERTO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO'] as const;

export class UpdateChamadoManutencaoStatusDto {
  @ApiProperty({ enum: STATUS })
  @IsIn(STATUS)
  status: (typeof STATUS)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descricao?: string;
}
