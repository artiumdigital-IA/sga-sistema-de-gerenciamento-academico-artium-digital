import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateExemplarDto {
  @ApiProperty({ example: 'BIB-000123' }) @IsString() codigoTombamento: string;
  @ApiPropertyOptional({ example: 'Estante A3' }) @IsOptional() @IsString() localizacao?: string;
}
