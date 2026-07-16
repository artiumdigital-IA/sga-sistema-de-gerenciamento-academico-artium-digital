import { Module } from '@nestjs/common';
import { ChamadoManutencaoController } from './chamado-manutencao.controller';
import { ChamadoManutencaoService } from './chamado-manutencao.service';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [ChamadoManutencaoController],
  providers: [ChamadoManutencaoService],
  exports: [ChamadoManutencaoService],
})
export class ChamadoManutencaoModule {}
