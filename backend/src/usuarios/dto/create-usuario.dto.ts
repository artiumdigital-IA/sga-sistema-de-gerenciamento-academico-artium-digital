import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Perfil } from '@prisma/client';

export class CreateUsuarioDto {
  @ApiProperty({ example: 'joao@fiurj.edu.br' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Senha@2026', minLength: 8 })
  @IsString()
  @MinLength(8)
  senha: string;

  @ApiProperty({ enum: Perfil })
  @IsEnum(Perfil)
  perfil: Perfil;

  @ApiPropertyOptional({ description: 'ID do aluno para vincular (perfil ALUNO)' })
  @IsOptional()
  @IsUUID()
  alunoId?: string;

  @ApiPropertyOptional({ description: 'ID do professor para vincular (perfil PROFESSOR)' })
  @IsOptional()
  @IsUUID()
  professorId?: string;
}
