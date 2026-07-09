import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsString } from 'class-validator';
import { Perfil } from '@prisma/client';

export class AlternarPermissaoDto {
  @ApiProperty({ enum: Perfil })
  @IsEnum(Perfil)
  perfil: Perfil;

  @ApiProperty({ description: 'Chave estável da tela (ver telas-sistema.ts)', example: 'alunos' })
  @IsString()
  chaveTela: string;

  @ApiProperty()
  @IsBoolean()
  habilitada: boolean;
}
