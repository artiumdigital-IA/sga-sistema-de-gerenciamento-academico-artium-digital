import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Turno } from '@prisma/client';

export class CreateOfertaDto {
  @ApiProperty({ description: 'ID da disciplina' })
  @IsUUID()
  disciplinaId: string;

  @ApiProperty({ description: 'ID do período letivo' })
  @IsUUID()
  periodoLetivoId: string;

  @ApiProperty({ description: 'ID do professor responsável' })
  @IsUUID()
  professorId: string;

  @ApiProperty({ example: 40 })
  @IsInt()
  @Min(1)
  vagas: number;

  @ApiProperty({ enum: Turno, example: Turno.NOITE })
  @IsEnum(Turno)
  turno: Turno;

  @ApiPropertyOptional({ example: 'SEG/QUA/SEX 19:00-22:00' })
  @IsOptional()
  @IsString()
  horario?: string;

  @ApiPropertyOptional({ example: 'Sala 301' })
  @IsOptional()
  @IsString()
  sala?: string;
}
