import { IsEnum, IsOptional, IsBoolean, IsString, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StatusInscricao } from '@prisma/client';

export class UpdateInscricaoDto {
  @ApiProperty({ enum: StatusInscricao, required: false }) @IsOptional() @IsEnum(StatusInscricao) status?: StatusInscricao;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() @Min(0) @Max(1000) notaEnem?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() documentosOk?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsString() observacoes?: string;
}
