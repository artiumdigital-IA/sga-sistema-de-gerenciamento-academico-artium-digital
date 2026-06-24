import { IsDecimal, IsEnum, IsUUID, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AvaliacaoTipo } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateAvaliacaoDto {
  @ApiProperty({ description: 'ID da matrícula na disciplina' })
  @IsUUID()
  matriculaDisciplinaId: string;

  @ApiProperty({ enum: AvaliacaoTipo, example: AvaliacaoTipo.PROVA })
  @IsEnum(AvaliacaoTipo)
  tipo: AvaliacaoTipo;

  @ApiProperty({ example: 8.5, description: 'Nota de 0 a 10' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(10)
  nota: number;

  @ApiProperty({ example: 1, description: 'Peso da avaliação' })
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  peso: number;
}
