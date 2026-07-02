import { IsString, IsUUID, IsArray, ValidateNested, IsInt, Min, IsDateString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class RegistroAlunoDto {
  @ApiProperty()
  @IsUUID()
  alunoId: string;

  @ApiProperty({ example: 0 })
  @IsInt()
  @Min(0)
  faltas: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacao?: string;
}

export class LancarFrequenciaDto {
  @ApiProperty()
  @IsUUID()
  ofertaId: string;

  @ApiProperty({ example: '2026-07-04' })
  @IsDateString()
  data: string;

  @ApiProperty({ example: 2, description: 'Quantidade de aulas ministradas nesse dia' })
  @IsInt()
  @Min(1)
  quantidadeAulas: number;

  @ApiProperty({ type: [RegistroAlunoDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RegistroAlunoDto)
  registros: RegistroAlunoDto[];
}
