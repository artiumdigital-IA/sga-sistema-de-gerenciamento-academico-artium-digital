import { IsString, IsOptional, IsNumber, Min, IsDateString, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateGastoVariavelDto {
  @ApiProperty() @IsString() @IsNotEmpty() categoriaId: string;
  @ApiProperty() @IsString() @IsNotEmpty() descricao: string;
  @ApiProperty() @IsNumber() @Min(0.01) valor: number;
  @ApiProperty() @IsDateString() data: string;
  @ApiPropertyOptional() @IsOptional() @IsString() observacoes?: string;
}

export class UpdateGastoVariavelDto extends PartialType(CreateGastoVariavelDto) {}
