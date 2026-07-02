import { Module } from '@nestjs/common';
import { RequerimentoModule } from './requerimento/requerimento.module';
import { DocumentoModule } from './documento/documento.module';
import { AvisoModule } from './aviso/aviso.module';
import { DocumentoAlunoModule } from './documento-aluno/documento-aluno.module';

@Module({
  imports: [RequerimentoModule, DocumentoModule, AvisoModule, DocumentoAlunoModule],
})
export class RegistryModule {}
