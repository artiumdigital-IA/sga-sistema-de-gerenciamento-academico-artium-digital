import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRequerimentoDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() status?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() resposta?: string;

  // Só usado ao deferir um requerimento do tipo de catálogo "Hora Complementar" —
  // vira o "horas" do lançamento de HoraComplementar gerado automaticamente
  // (ver RequerimentoService.update()). Ignorado pra qualquer outro tipo.
  @ApiProperty({ required: false, description: 'Horas concedidas ao deferir um requerimento de Hora Complementar' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) horas?: number;
}
