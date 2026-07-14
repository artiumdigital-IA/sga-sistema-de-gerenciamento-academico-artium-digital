import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoEquipamento } from '@prisma/client';

export class CreateEquipamentoDto {
  @ApiProperty({ example: 'NB-000045' }) @IsString() patrimonio: string;
  @ApiProperty({ enum: TipoEquipamento }) @IsEnum(TipoEquipamento) tipo: TipoEquipamento;
  @ApiProperty({ example: 'Dell Latitude 3420' }) @IsString() modelo: string;
  @ApiPropertyOptional() @IsOptional() @IsString() numeroSerie?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() observacoes?: string;
}
