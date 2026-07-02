import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { ContratoController } from './contrato/contrato.controller';
import { ContratoService } from './contrato/contrato.service';
import { ParcelaController } from './parcela/parcela.controller';
import { ParcelaService } from './parcela/parcela.service';
import { ContaBancariaController } from './conta-bancaria/conta-bancaria.controller';
import { ContaBancariaService } from './conta-bancaria/conta-bancaria.service';

@Module({
  imports: [AuditModule],
  controllers: [ContratoController, ParcelaController, ContaBancariaController],
  providers: [ContratoService, ParcelaService, ContaBancariaService],
})
export class FinancialModule {}
