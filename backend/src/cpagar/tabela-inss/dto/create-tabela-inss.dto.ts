import { IsArray, IsBoolean, IsDateString, IsNumber, IsOptional, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FaixaInssDto {
  @ApiProperty() @IsNumber() ordem: number;
  @ApiProperty() @IsNumber() @Min(0) limiteInicial: number;
  @ApiPropertyOptional({ description: 'null = última faixa, sem teto' }) @IsOptional() @IsNumber() limiteFinal?: number;
  @ApiProperty() @IsNumber() @Min(0) aliquota: number;
}

export class CreateTabelaInssDto {
  @ApiProperty() @IsDateString() vigenciaInicio: string;
  @ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean() ativa?: boolean;
  @ApiProperty({ type: [FaixaInssDto] }) @IsArray() @ValidateNested({ each: true }) @Type(() => FaixaInssDto) faixas: FaixaInssDto[];
}
