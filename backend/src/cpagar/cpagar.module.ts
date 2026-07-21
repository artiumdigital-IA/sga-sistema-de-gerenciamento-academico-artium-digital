import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { ColaboradorController } from './colaborador/colaborador.controller';
import { ColaboradorService } from './colaborador/colaborador.service';
import { DadosFolhaProfessorController } from './dados-folha-professor/dados-folha-professor.controller';
import { DadosFolhaProfessorService } from './dados-folha-professor/dados-folha-professor.service';

@Module({
  imports: [AuditModule],
  controllers: [ColaboradorController, DadosFolhaProfessorController],
  providers: [ColaboradorService, DadosFolhaProfessorService],
})
export class CpagarModule {}
