import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProtocoloDto {
  @ApiProperty()
  @IsUUID()
  tipoId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  alunoId?: string;

  @ApiProperty({ example: 'Solicitação de revisão de nota' })
  @IsString()
  assunto: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descricao?: string;
}
