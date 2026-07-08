import { IsString, IsEmail, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Titulacao, RegimeTrabalho, CorRaca } from '@prisma/client';

export { Titulacao, RegimeTrabalho, CorRaca };

export class CreateProfessorDto {
  @ApiProperty() @IsString() nome: string;
  @ApiProperty() @IsString() cpf: string;
  @ApiProperty({ enum: Titulacao }) @IsEnum(Titulacao) titulacao: Titulacao;
  @ApiProperty({ enum: RegimeTrabalho }) @IsEnum(RegimeTrabalho) regimeTrabalho: RegimeTrabalho;
  @ApiProperty({ enum: CorRaca }) @IsEnum(CorRaca) corRaca: CorRaca;
  @ApiPropertyOptional() @IsOptional() @IsString() lattes?: string;
  @ApiProperty() @IsEmail() email: string;
  @ApiPropertyOptional() @IsOptional() @IsString() tel