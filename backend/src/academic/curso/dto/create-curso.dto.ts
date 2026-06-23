import { IsEnum, IsInt, IsString, Min, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Grau, Modalidade } from '@prisma/client';

export class CreateCursoDto {
  @ApiProperty({ example: 'Direito' })
  @IsString()
  @MinLength(2)
  nome: string;

  @ApiProperty({ enum: Grau, example: Grau.BACHARELADO })
  @IsEnum(Grau)
  grau: Grau;

  @ApiProperty({ enum: Modalidade, example: Modalidade.PRESENCIAL })
  @IsEnum(Modalidade)
  modalidade: Modalidade;

  @ApiProperty({ example: '122' })
  @IsString()
  codigoEmec: string;

  @ApiProperty({ example: 3700 })
  @IsInt()
  @Min(1)
  cargaHorariaTotal: number;

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(1)
  prazoIntegralizacaoSemestres: number;
}
