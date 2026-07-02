import { Module } from '@nestjs/common';
import { DocumentoAlunoController } from './documento-aluno.controller';
import { DocumentoAlunoService } from './documento-aluno.service';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [DocumentoAlunoController],
  providers: [DocumentoAlunoService],
})
export class DocumentoAlunoModule {}
