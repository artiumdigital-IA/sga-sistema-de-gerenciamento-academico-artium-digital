import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AlunoModule } from '../academic/aluno/aluno.module';
import { ProtocoloModule } from '../registry/protocolo/protocolo.module';
import { DocumentoAlunoModule } from '../registry/documento-aluno/documento-aluno.module';
import { DocumentoModule } from '../registry/documento/documento.module';
import { FinancialModule } from '../financial/financial.module';
import { DiscenteController } from './discente.controller';
import { DiscenteService } from './discente.service';

/**
 * Módulo de autoatendimento do aluno ("Menu Discente"). Não define models
 * novos — reaproveita os serviços já existentes de cada domínio (Aluno,
 * Protocolo, DocumentoAluno, Documento/Carteirinha, Contrato), só que
 * restringindo tudo ao próprio aluno logado (ver DiscenteService.meuAlunoId).
 */
@Module({
  imports: [PrismaModule, AlunoModule, ProtocoloModule, DocumentoAlunoModule, DocumentoModule, FinancialModule],
  controllers: [DiscenteController],
  providers: [DiscenteService],
})
export class DiscenteModule {}
