import { IsString, IsOptional, IsBoolean, IsNumber, Min, Max, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateGastoFixoDto {
  @ApiProperty() @IsString() @IsNotEmpty() categoriaId: string;
  @ApiProperty() @IsString() @IsNotEmpty() descricao: string;
  @ApiProperty() @IsNumber() @Min(0.01) valorMensal: number;
  @ApiProperty() @IsNumber() @Min(1) @Max(28) diaVencimento: number;
  @ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean() ativo?: boolean;
}

export class UpdateGastoFixoDto extends PartialType(CreateGastoFixoDto) {}
