import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Perfil, UsuarioStatus } from '@prisma/client';

export class UpdateUsuarioDto {
  @ApiPropertyOptional({ enum: Perfil })
  @IsOptional()
  @IsEnum(Perfil)
  perfil?: Perfil;

  @ApiPropertyOptional({ enum: UsuarioStatus })
  @IsOptional()
  @IsEnum(UsuarioStatus)
  status?: UsuarioStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  alunoId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  professorId?: string;
}
