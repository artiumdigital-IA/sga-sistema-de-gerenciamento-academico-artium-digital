import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const TIPOS_PROVA = ['AV1', 'AV2', 'AV3', 'AV4', 'AV5', 'RECUPERACAO', 'SEGUNDA_CHAMADA'] as const;
const TIPOS_QUESTAO = ['MULTIPLA_ESCOLHA', 'DISSERTATIVA'] as const;

export class QuestaoProvaDto {
  @ApiProperty({ enum: TIPOS_QUESTAO })
  @IsIn(TIPOS_QUESTAO)
  tipo: (typeof TIPOS_QUESTAO)[number];

  @ApiProperty({ example: 'Sobre o princípio da legalidade, é correto afirmar que:' })
  @IsString()
  enunciado: string;

  @ApiProperty({ example: 0.5 })
  @IsNumber()
  @Min(0)
  valor: number;

  // Só usado quando tipo === 'MULTIPLA_ESCOLHA'. Texto de cada alternativa,
  // na ordem — a letra (a, b, c...) é derivada do índice no array, não
  // armazenada. Não obrigatório ter todas preenchidas (o front já filtra
  // alternativa vazia antes de enviar).
  @ApiPropertyOptional({ type: [String], example: ['Primeira opção', 'Segunda opção'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  alternativas?: string[];
}

export class CriarProvaGeradaDto {
  @ApiProperty({ enum: TIPOS_PROVA })
  @IsIn(TIPOS_PROVA)
  tipoProva: (typeof TIPOS_PROVA)[number];

  @ApiProperty({ example: 'DIREITO' })
  @IsString()
  curso: string;

  @ApiProperty({ example: 'Direito Constitucional I' })
  @IsString()
  disciplina: string;

  @ApiProperty({ example: 'DRN-02' })
  @IsString()
  turma: string;

  @ApiProperty({ example: '2026-08-10' })
  @IsDateString()
  data: string;

  @ApiProperty()
  @IsString()
  observacoes: string;

  @ApiProperty({ type: [QuestaoProvaDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuestaoProvaDto)
  questoes: QuestaoProvaDto[];
}
