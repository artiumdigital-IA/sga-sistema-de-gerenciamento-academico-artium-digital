import { IsString, IsOptional, IsInt, IsUUID, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMateriaEquiparadaDto {
  @ApiProperty() @IsUUID() alunoId: string;
  @ApiProperty() @IsUUID() disciplinaId: string;
  @ApiProperty({ example: 'Universidade Autônoma de Lisboa' }) @IsString() instituicaoOrigem: string;
  @ApiProperty({ example: 'Introdução ao Direito' }) @IsString() disciplinaOrigem: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) cargaHorariaOrigem?: number;
  @ApiProperty() @IsDateString() dataAprovacao: string;
  @ApiPropertyOptional() @IsOptional() @IsString() observacoes?: string;
}
