import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoriaReceitaDto {
  @ApiProperty({ example: 'Mensalidade' }) @IsString() nome: string;
  @ApiPropertyOptional() @IsOptional() @IsString() descricao?: string;
  @ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean() ativa?: boolean;
}
