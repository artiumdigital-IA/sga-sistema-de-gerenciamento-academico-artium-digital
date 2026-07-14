import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLivroDto {
  @ApiProperty({ example: 'Direito Constitucional Esquematizado' }) @IsString() titulo: string;
  @ApiProperty({ example: 'Pedro Lenza' }) @IsString() autor: string;
  @ApiPropertyOptional() @IsOptional() @IsString() editora?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() isbn?: string;
  @ApiPropertyOptional({ example: 'Direito' }) @IsOptional() @IsString() categoria?: string;
  @ApiPropertyOptional({ example: 2024 }) @IsOptional() @IsInt() @Min(0) anoPublicacao?: number;
}
