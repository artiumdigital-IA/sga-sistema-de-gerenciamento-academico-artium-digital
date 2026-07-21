import { IsString, IsOptional, IsNumber, IsDateString, Min, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePagamentoPrestadorDto {
  @ApiProperty() @IsString() @IsNotEmpty() colaboradorId: string;
  @ApiProperty() @IsDateString() data: string;
  @ApiProperty() @IsString() @IsNotEmpty() descricaoServico: string;
  @ApiPropertyOptional() @IsOptional() @IsString() numeroNotaFiscal?: string;
  @ApiProperty() @IsNumber() @Min(0.01) valorBruto: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) valorIssRetido?: number;
}
