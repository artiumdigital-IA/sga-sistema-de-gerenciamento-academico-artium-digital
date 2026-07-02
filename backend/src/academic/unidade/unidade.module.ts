import { Module } from '@nestjs/common';
import { UnidadeController } from './unidade.controller';
import { UnidadeService } from './unidade.service';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [UnidadeController],
  providers: [UnidadeService],
})
export class UnidadeModule {}
