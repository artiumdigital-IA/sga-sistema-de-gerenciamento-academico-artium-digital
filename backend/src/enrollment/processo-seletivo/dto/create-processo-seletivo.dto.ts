import { IsString, IsEnum, IsUUID, IsInt, IsDateString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TipoProcesso } from '@prisma/client';

export class CreateProcessoSeletivoDto {
  @ApiProperty() @IsString() nome: string;
  @ApiProperty({ enum: TipoProcesso }) @IsEnum(TipoProcesso) tipo: TipoProcesso;
  @ApiProperty() @IsUUID() cursoId: string;
  @ApiProperty() @IsUUID() periodoLetivoId: string;
  @ApiProperty() @IsInt() @Min(1) vagas: number;
  @ApiProperty() @IsDateString() dataAbertura: string;
  @ApiProperty() @IsDateString() dataEncerramento: string;
}
