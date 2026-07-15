import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum TagAviso { GERAL = 'GERAL', IMPORTANTE = 'IMPORTANTE', APENAS_EQUIPE = 'APENAS_EQUIPE' }

export class CreateAvisoDto {
  @IsString() titulo: string;
  @IsString() texto: string;
  @IsOptional() @IsEnum(TagAviso) tag?: TagAviso;
  @IsOptional() @IsString() autorNome?: string;
  @IsOptional() @IsString() autorId?: string;
  // Presente = "aviso de turma" (só alunos matriculados na oferta veem);
  // ausente = aviso geral, comportamento inalterado. Ver AvisoService.findAll().
  @IsOptional() @IsString() ofertaId?: string;
}
