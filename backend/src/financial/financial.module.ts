import { Module } from '@nestjs/common';
import { ContratoController } from './contrato/contrato.controller';
import { ContratoService } from './contrato/contrato.service';
import { ParcelaController } from './parcela/parcela.controller';
import { ParcelaService } from './parcela/parcela.service';

@Module({
  controllers: [ContratoController, ParcelaController],
  providers: [ContratoService, ParcelaService],
})
export class FinancialModule {}
