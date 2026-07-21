import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { ColaboradorController } from './colaborador/colaborador.controller';
import { ColaboradorService } from './colaborador/colaborador.service';
import { DadosFolhaProfessorController } from './dados-folha-professor/dados-folha-professor.controller';
import { DadosFolhaProfessorService } from './dados-folha-professor/dados-folha-professor.service';
import { TabelaInssController } from './tabela-inss/tabela-inss.controller';
import { TabelaInssService } from './tabela-inss/tabela-inss.service';
import { TabelaIrrfController } from './tabela-irrf/tabela-irrf.controller';
import { TabelaIrrfService } from './tabela-irrf/tabela-irrf.service';
import { FolhaPagamentoController } from './folha-pagamento/folha-pagamento.controller';
import { FolhaPagamentoService } from './folha-pagamento/folha-pagamento.service';
import { ContrachequeController } from './contracheque/contracheque.controller';
import { ContrachequeService } from './contracheque/contracheque.service';

@Module({
  imports: [AuditModule],
  controllers: [ColaboradorController, DadosFolhaProfessorController, TabelaInssController, TabelaIrrfController, FolhaPagamentoController, ContrachequeController],
  providers: [ColaboradorService, DadosFolhaProfessorService, TabelaInssService, TabelaIrrfService, FolhaPagamentoService, ContrachequeService],
})
export class CpagarModule {}
