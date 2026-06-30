import { Module } from '@nestjs/common';
import { RequerimentoModule } from './requerimento/requerimento.module';
import { DocumentoModule } from './documento/documento.module';
import { AvisoModule } from './aviso/aviso.module';

@Module({
  imports: [RequerimentoModule, DocumentoModule, AvisoModule],
})
export class RegistryModule {}
