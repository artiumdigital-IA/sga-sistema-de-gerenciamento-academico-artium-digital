import { Module } from '@nestjs/common';
import { RequerimentoModule } from './requerimento/requerimento.module';
import { DocumentoModule } from './documento/documento.module';

@Module({
  imports: [RequerimentoModule, DocumentoModule],
})
export class RegistryModule {}
