import { IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFolhaDto {
  @ApiProperty({ minimum: 1, maximum: 12 }) @IsInt() @Min(1) @Max(12) competenciaMes: number;
  @ApiProperty() @IsInt() @Min(2000) competenciaAno: number;
}
