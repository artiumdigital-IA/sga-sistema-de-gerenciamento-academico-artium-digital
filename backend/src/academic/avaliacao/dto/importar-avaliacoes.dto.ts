import { IsString, IsUUID, IsArray, ValidateNested, IsNumber, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class LinhaImportacaoDto {
  @ApiProperty({ example: '20260001', description: 'RA do aluno' })
  @IsString()
  ra: string;

  @ApiProperty({ enum: ['PROVA', 'TRABALHO', 'EXAME_FINAL'] })
  @IsIn(['PROVA', 'TRABALHO', 'EXAME_FINAL'])
  tipo: 'PROVA' | 'TRABALHO' | 'EXAME_FINAL';

  @ApiProperty({ example: 8.5 })
  @IsNumber()
  @Min(0)
  @Max(10)
  nota: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(0.1)
  peso: number;
}

export class ImportarAvaliacoesDto {
  @ApiProperty()
  @IsUUID()
  ofertaId: string;

  @ApiProperty({ type: [LinhaImportacaoDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LinhaImportacaoDto)
  linhas: LinhaImportacaoDto[];
}
