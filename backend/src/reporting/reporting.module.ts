import { Module } from '@nestjs/common';
import { CensoController } from './censo.controller';
import { CensoService } from './censo.service';
import { FinanceiroRelatoriosController } from './financeiro.controller';
import { FinanceiroRelatoriosService } from './financeiro.service';

@Module({
  controllers: [CensoController, FinanceiroRelatoriosController],
  providers: [CensoService, FinanceiroRelatoriosService],
})
export class ReportingModule {}
