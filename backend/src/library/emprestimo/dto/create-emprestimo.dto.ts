import { IsString, IsOptional, IsEnum, IsDateString, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoItemEmprestimo } from '@prisma/client';

export class CreateEmprestimoDto {
  @ApiProperty({ enum: TipoItemEmprestimo }) @IsEnum(TipoItemEmprestimo) tipoItem: TipoItemEmprestimo;
  @ApiProperty({ description: 'ID do ExemplarLivro (se tipoItem=LIVRO) ou do Equipamento (se tipoItem=EQUIPAMENTO)' })
  @IsString() itemId: string;
  @ApiProperty({ description: 'ID do usuário (aluno ou professor) que está pegando o item emprestado' })
  @IsString() usuarioId: string;
  @ApiPropertyOptional({ description: 'Se omitido, calculado automaticamente: 7 dias (livro) ou 15 dias (equipamento). Ignorado se usoPorAluno=true.' })
  @IsOptional() @IsDateString() dataPrevistaDevolucao?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() observacoes?: string;
  @ApiPropertyOptional({ default: false, description: 'Uso da instituição — exige observações preenchidas' })
  @IsOptional() @IsBoolean() usoInstitucional?: boolean;
  @ApiPropertyOptional({ default: false, description: 'Uso por aluno — devolução obrigatória no mesmo dia, até o fechamento da instituição (22:20)' })
  @IsOptional() @IsBoolean() usoPorAluno?: boolean;
}
