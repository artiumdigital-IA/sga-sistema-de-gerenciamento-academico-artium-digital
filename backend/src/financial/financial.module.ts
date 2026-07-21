import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { ContratoController } from './contrato/contrato.controller';
import { ContratoService } from './contrato/contrato.service';
import { ParcelaController } from './parcela/parcela.controller';
import { ParcelaService } from './parcela/parcela.service';
import { ContaBancariaController } from './conta-bancaria/conta-bancaria.controller';
import { ContaBancariaService } from './conta-bancaria/conta-bancaria.service';
import { CategoriaReceitaController } from './categoria-receita/categoria-receita.controller';
import { CategoriaReceitaService } from './categoria-receita/categoria-receita.service';
import { BolsistaController } from './bolsista/bolsista.controller';
import { BolsistaService } from './bolsista/bolsista.service';
import { BoletoController } from './cnab/boleto/boleto.controller';
import { BoletoService } from './cnab/boleto/boleto.service';
import { RemessaController } from './cnab/remessa/remessa.controller';
import { RemessaService } from './cnab/remessa/remessa.service';

@Module({
  imports: [AuditModule],
  controllers: [ContratoController, ParcelaController, ContaBancariaController, CategoriaReceitaController, BolsistaController, BoletoController, RemessaController],
  providers: [ContratoService, ParcelaService, ContaBancariaService, CategoriaReceitaService, BolsistaService, BoletoService, RemessaService],
  // ContratoService exportado pro DiscenteModule reaproveitar a listagem de
  // contratos/parcelas (autoatendimento — "Financeiro" do aluno, somente leitura).
  exports: [ContratoService],
})
export class FinancialModule {}
