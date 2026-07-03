import { Module } from '@nestjs/common';
import { BolsistaService } from './bolsista.service';
import { BolsistaController } from './bolsista.controller';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [BolsistaController],
  providers: [BolsistaService],
  exports: [BolsistaService],
})
export class BolsistaModule {}
