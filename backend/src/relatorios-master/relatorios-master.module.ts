import { Module } from '@nestjs/common';
import { RelatoriosMasterController } from './relatorios-master.controller';
import { RelatoriosMasterService } from './relatorios-master.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [RelatoriosMasterController],
  providers: [RelatoriosMasterService],
})
export class RelatoriosMasterModule {}
