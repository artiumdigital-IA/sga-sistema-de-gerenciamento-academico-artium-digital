import { Module } from '@nestjs/common';
import { RequerimentoController } from './requerimento.controller';
import { RequerimentoService } from './requerimento.service';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [RequerimentoController],
  providers: [RequerimentoService],
})
export class RequerimentoModule {}
