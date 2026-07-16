import { Module } from '@nestjs/common';
import { TipoChamadoManutencaoController } from './tipo-chamado-manutencao.controller';
import { TipoChamadoManutencaoService } from './tipo-chamado-manutencao.service';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [TipoChamadoManutencaoController],
  providers: [TipoChamadoManutencaoService],
  exports: [TipoChamadoManutencaoService],
})
export class TipoChamadoManutencaoModule {}
