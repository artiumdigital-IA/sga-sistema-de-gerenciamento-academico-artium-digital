import { IsString, IsOptional, IsNumber, IsBoolean, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBolsistaDto {
  @ApiProperty() @IsString() alunoId: string;
  @ApiProperty({ example: 'PROUNI, FIES, Bolsa Convênio, Bolsa Mérito...' }) @IsString() tipoBolsa: string;
  @ApiProperty({ example: 50 }) @IsNumber() @Min(0) @Max(100) percentual: number;
  @ApiProperty() @IsDateString() dataInicio: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dataFim?: string;
  @ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean() ativo?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() observacoes?: string;
}
