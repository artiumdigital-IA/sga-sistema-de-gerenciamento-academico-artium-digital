import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateCategoriaDespesaDto {
  @ApiProperty() @IsString() nome: string;
  @ApiPropertyOptional() @IsOptional() @IsString() descricao?: string;
  @ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean() ativa?: boolean;
}

export class UpdateCategoriaDespesaDto extends PartialType(CreateCategoriaDespesaDto) {}
