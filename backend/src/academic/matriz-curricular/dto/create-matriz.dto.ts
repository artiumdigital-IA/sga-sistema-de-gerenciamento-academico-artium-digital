import { IsInt, IsString, Min, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMatrizDto {
  @ApiProperty({ example: 'uuid-do-curso' })
  @IsString()
  cursoId: string;

  @ApiProperty({ example: '2024.1' })
  @IsString()
  @MinLength(1)
  versao: string;

  @ApiProperty({ example: 2024 })
  @IsInt()
  @Min(2000)
  anoVigencia: number;
}
