import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TagAviso } from '../../registry/aviso/dto/create-aviso.dto';

export class CriarAvisoTurmaDto {
  @ApiProperty({ description: 'ID da oferta (turma) — precisa ser uma turma do próprio professor' })
  @IsUUID()
  ofertaId: string;

  @ApiProperty()
  @IsString()
  titulo: string;

  @ApiProperty()
  @IsString()
  texto: string;

  @ApiPropertyOptional({ enum: TagAviso })
  @IsOptional()
  @IsEnum(TagAviso)
  tag?: TagAviso;
}
