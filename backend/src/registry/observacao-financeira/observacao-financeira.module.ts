import { Module } from '@nestjs/common';
import { ObservacaoFinanceiraController } from './observacao-financeira.controller';
import { ObservacaoFinanceiraService } from './observacao-financeira.service';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [ObservacaoFinanceiraController],
  providers: [ObservacaoFinanceiraService],
})
export class ObservacaoFinanceiraModule {}
