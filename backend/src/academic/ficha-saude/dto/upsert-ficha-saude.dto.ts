import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpsertFichaSaudeDto {
  @ApiPropertyOptional({ example: 'O+' }) @IsOptional() @IsString() tipoSanguineo?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() alergias?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() medicamentosUso?: string;
  @ApiPropertyOptional({ example: 'Auditiva, Visual' }) @IsOptional() @IsString() deficiencia?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() planoSaude?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() contatoEmergenciaNome?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() contatoEmergenciaTelefone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() observacoes?: string;
}
