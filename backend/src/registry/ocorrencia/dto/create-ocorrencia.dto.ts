import { IsString, IsOptional, IsUUID, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOcorrenciaDto {
  @ApiProperty()
  @IsUUID()
  alunoId: string;

  @ApiProperty()
  @IsUUID()
  motivoId: string;

  @ApiProperty({ example: '2026-07-04' })
  @IsDateString()
  data: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descricao?: string;
}
