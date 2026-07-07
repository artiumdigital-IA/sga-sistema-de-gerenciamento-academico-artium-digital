import { IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpsertNotaPautaDto {
  @ApiPropertyOptional({ example: 8.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  av1?: number;

  @ApiPropertyOptional({ example: 8.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  av2?: number;

  @ApiPropertyOptional({ example: 8.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  av3?: number;

  @ApiPropertyOptional({ example: 8.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  av4?: number;

  @ApiPropertyOptional({ example: 8.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  av5?: number;

  @ApiPropertyOptional({ example: 7.5, description: '2ª chamada — substitui a AV5 na fórmula quando > 0' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  segundaChamada?: number;

  @ApiPropertyOptional({ example: 7.0, description: 'Recuperação — substitui a média se ela for maior e a média < 6' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  recuperacao?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  faltas?: number;
}
