import { Module } from '@nestjs/common';
import { RelatoriosMasterController } from './relatorios-master.controller';
import { RelatoriosMasterService } from './relatorios-master.service';
import { AuditModule } from '../audit/audit.module';
import { LibraryModule } from '../library/library.module';

@Module({
  imports: [AuditModule, LibraryModule],
  controllers: [RelatoriosMasterController],
  providers: [RelatoriosMasterService],
})
export class RelatoriosMasterModule {}
