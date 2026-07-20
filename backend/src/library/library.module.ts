import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { LivroController } from './livro/livro.controller';
import { LivroService } from './livro/livro.service';
import { EquipamentoController } from './equipamento/equipamento.controller';
import { EquipamentoService } from './equipamento/equipamento.service';
import { EmprestimoController } from './emprestimo/emprestimo.controller';
import { EmprestimoService } from './emprestimo/emprestimo.service';

@Module({
  imports: [AuditModule],
  controllers: [LivroController, EquipamentoController, EmprestimoController],
  providers: [LivroService, EquipamentoService, EmprestimoService],
  exports: [LivroService],
})
export class LibraryModule {}
