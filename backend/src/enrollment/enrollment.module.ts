import { Module } from '@nestjs/common';
import { ProcessoSeletivoModule } from './processo-seletivo/processo-seletivo.module';
import { CandidatoModule } from './candidato/candidato.module';
import { InscricaoModule } from './inscricao/inscricao.module';

@Module({ imports: [ProcessoSeletivoModule, CandidatoModule, InscricaoModule] })
export class EnrollmentModule {}
