import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateContratoDto {
  @ApiProperty() @IsString() alunoId: string;
  @ApiProperty() @IsString() periodoLetivoId: string;
  @ApiProperty() @IsNumber() valorTotal: number;
  @ApiProperty() @IsNumber() @Min(1) @Max(24) numeroParcelas: number;
  @ApiProperty() @IsNumber() @Min(1) @Max(28) diaVencimento: number;
  @ApiPropertyOptional() @IsOptional() @IsString() observacoes?: string;
}

export class UpdateContratoDto extends PartialType(CreateContratoDto) {}
