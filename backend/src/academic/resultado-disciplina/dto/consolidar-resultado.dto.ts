import { IsInt, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ConsolidarResultadoDto {
  @ApiProperty({ example: 5, description: 'Total de faltas do aluno na disciplina' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  faltas: number;

  @ApiProperty({ example: 60, description: 'Total de aulas ministradas (para cálculo de frequência)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  totalAulas: number;
}
