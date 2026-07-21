import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRemessaDto {
  @ApiProperty() @IsString() @IsNotEmpty() contaBancariaId: string;

  @ApiPropertyOptional({ description: 'Se omitido, inclui todos os boletos EMITIDO dessa conta.' })
  @IsOptional() @IsArray() @IsString({ each: true })
  boletoIds?: string[];
}
