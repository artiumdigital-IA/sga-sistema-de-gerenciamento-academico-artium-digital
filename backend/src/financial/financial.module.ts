import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { ContratoController } from './contrato/contrato.controller';
import { ContratoService } from './contrato/contrato.service';
import { ParcelaController } from './parcela/parcela.controller';
import { ParcelaService } from './parcela/parcela.service';

@Module({
  imports: [AuditModule],
  controllers: [ContratoController, ParcelaController],
  providers: [ContratoService, ParcelaService],
})
export class FinancialModule {}
