import { IsEnum, IsString, IsNumber, Min, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TipoLancamentoFolha } from '@prisma/client';

export { TipoLancamentoFolha };

export class CreateLancamentoDto {
  @ApiProperty({ enum: TipoLancamentoFolha }) @IsEnum(TipoLancamentoFolha) tipo: TipoLancamentoFolha;
  @ApiProperty() @IsString() @IsNotEmpty() descricao: string;
  @ApiProperty() @IsNumber() @Min(0.01) valor: number;
}
