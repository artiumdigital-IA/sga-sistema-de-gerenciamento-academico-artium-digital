import { IsString, IsEmail, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Titulacao, RegimeTrabalho } from '@prisma/client';

export { Titulacao, RegimeTrabalho };

export class CreateProfessorDto {
  @ApiProperty() @IsString() nome: string;
  @ApiProperty() @IsString() cpf: string;
  @ApiProperty({ enum: Titulacao }) @IsEnum(Titulacao) titulacao: Titulacao;
  @ApiProperty({ enum: RegimeTrabalho }) @IsEnum(RegimeTrabalho) regimeTrabalho: RegimeTrabalho;
  @ApiPropertyOptional() @IsOptional() @IsString() lattes?: string;
  @ApiProperty() @IsEmail() email: string;
  @ApiPropertyOptional() @IsOptional() @IsString() telefone?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() usuarioId?: string;
}
