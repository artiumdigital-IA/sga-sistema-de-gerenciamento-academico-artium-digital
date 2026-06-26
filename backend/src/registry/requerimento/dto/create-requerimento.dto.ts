import { IsUUID, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRequerimentoDto {
  @ApiProperty() @IsUUID() alunoId: string;
  @ApiProperty() @IsString() tipo: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() descricao?: string;
}
