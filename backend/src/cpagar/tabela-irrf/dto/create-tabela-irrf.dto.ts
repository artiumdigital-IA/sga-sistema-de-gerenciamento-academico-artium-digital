import { IsArray, IsBoolean, IsDateString, IsNumber, IsOptional, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FaixaIrrfDto {
  @ApiProperty() @IsNumber() ordem: number;
  @ApiProperty() @IsNumber() @Min(0) limiteInicial: number;
  @ApiPropertyOptional({ description: 'null = última faixa, sem teto' }) @IsOptional() @IsNumber() limiteFinal?: number;
  @ApiProperty() @IsNumber() @Min(0) aliquota: number;
  @ApiProperty() @IsNumber() @Min(0) parcelaDeduzir: number;
}

export class CreateTabelaIrrfDto {
  @ApiProperty() @IsDateString() vigenciaInicio: string;
  @ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean() ativa?: boolean;
  @ApiProperty() @IsNumber() @Min(0) valorDeducaoPorDependente: number;
  @ApiProperty({ type: [FaixaIrrfDto] }) @IsArray() @ValidateNested({ each: true }) @Type(() => FaixaIrrfDto) faixas: FaixaIrrfDto[];
}
