import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateAcordoPagarDto {
  @ApiProperty() @IsString() fornecedorNome: string;
  @ApiPropertyOptional() @IsOptional() @IsString() cnpjCpf?: string;
  @ApiProperty() @IsNumber() valorTotal: number;
  @ApiProperty() @IsNumber() @Min(1) @Max(60) numeroParcelas: number;
  @ApiProperty() @IsNumber() @Min(1) @Max(28) diaVencimento: number;
  @ApiPropertyOptional() @IsOptional() @IsString() observacoes?: string;
}

export class UpdateAcordoPagarDto extends PartialType(CreateAcordoPagarDto) {}
