import { IsUUID, IsOptional, IsNumber, IsBoolean, IsString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInscricaoDto {
  @ApiProperty() @IsUUID() candidatoId: string;
  @ApiProperty() @IsUUID() processoSeletivoId: string;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() @Min(0) @Max(1000) notaEnem?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() documentosOk?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsString() observacoes?: string;
}
