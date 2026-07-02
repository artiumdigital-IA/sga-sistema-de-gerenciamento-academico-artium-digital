import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRamalDto {
  @ApiProperty({ example: 'Secretaria Acadêmica' })
  @IsString()
  nome: string;

  @ApiPropertyOptional({ example: 'Atendimento' })
  @IsOptional()
  @IsString()
  setor?: string;

  @ApiProperty({ example: '2010' })
  @IsString()
  numero: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
