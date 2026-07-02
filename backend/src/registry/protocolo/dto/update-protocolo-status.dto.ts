import { IsIn, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProtocoloStatusDto {
  @ApiProperty({ enum: ['ABERTO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO'] })
  @IsIn(['ABERTO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO'])
  status: 'ABERTO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descricao?: string;
}
