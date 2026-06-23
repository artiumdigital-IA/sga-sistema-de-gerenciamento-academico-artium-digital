import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDisciplinaDto {
  @ApiProperty({ example: 'uuid-da-matriz' })
  @IsUUID()
  matrizCurricularId: string;

  @ApiProperty({ example: 'DIR101' })
  @IsString()
  @MinLength(1)
  codigo: string;

  @ApiProperty({ example: 'Introdução ao Direito' })
  @IsString()
  @MinLength(2)
  nome: string;

  @ApiProperty({ example: 60 })
  @IsInt()
  @Min(1)
  cargaHoraria: number;

  @ApiProperty({ example: 4 })
  @IsInt()
  @Min(1)
  creditos: number;

  @ApiPropertyOptional({ example: 'Fundamentos do ordenamento jurídico...' })
  @IsOptional()
  @IsString()
  ementa?: string;

  @ApiProperty({ example: 1, description: 'Período sugerido (semestre)' })
  @IsInt()
  @Min(1)
  periodoSugerido: number;
}
