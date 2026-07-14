import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoItemEmprestimo } from '@prisma/client';

export class CreateEmprestimoDto {
  @ApiProperty({ enum: TipoItemEmprestimo }) @IsEnum(TipoItemEmprestimo) tipoItem: TipoItemEmprestimo;
  @ApiProperty({ description: 'ID do ExemplarLivro (se tipoItem=LIVRO) ou do Equipamento (se tipoItem=EQUIPAMENTO)' })
  @IsString() itemId: string;
  @ApiProperty({ description: 'ID do usuário (aluno ou professor) que está pegando o item emprestado' })
  @IsString() usuarioId: string;
  @ApiPropertyOptional({ description: 'Se omitido, calculado automaticamente: 7 dias (livro) ou 15 dias (equipamento)' })
  @IsOptional() @IsDateString() dataPrevistaDevolucao?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() observacoes?: string;
}
