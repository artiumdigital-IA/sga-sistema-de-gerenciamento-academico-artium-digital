import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateItemFolhaDto {
  @ApiPropertyOptional() @IsOptional() @IsString() professorId?: string; // id do Professor (não do DadosFolhaProfessor)
  @ApiPropertyOptional() @IsOptional() @IsString() colaboradorId?: string;
}
