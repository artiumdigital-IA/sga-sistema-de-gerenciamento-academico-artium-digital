import { Module } from '@nestjs/common';
import { ImportacaoLegadoController } from './importacao-legado.controller';
import { ImportacaoLegadoService } from './importacao-legado.service';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [ImportacaoLegadoController],
  providers: [ImportacaoLegadoService],
})
export class ImportacaoLegadoModule {}
