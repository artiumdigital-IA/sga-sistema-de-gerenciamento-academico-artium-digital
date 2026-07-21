import { IsNumber, IsOptional, IsBoolean, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpsertDadosFolhaProfessorDto {
  @ApiProperty() @IsNumber() @Min(0) salarioBase: number;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsNumber() @Min(0) numeroDependentes?: number;
  @ApiProperty() @IsDateString() dataAdmissao: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dataDemissao?: string;
  @ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean() ativo?: boolean;
}
