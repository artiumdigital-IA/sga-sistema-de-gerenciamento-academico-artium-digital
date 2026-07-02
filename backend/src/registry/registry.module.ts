import { Module } from '@nestjs/common';
import { RequerimentoModule } from './requerimento/requerimento.module';
import { DocumentoModule } from './documento/documento.module';
import { AvisoModule } from './aviso/aviso.module';
import { DocumentoAlunoModule } from './documento-aluno/documento-aluno.module';
import { TipoProtocoloModule } from './tipo-protocolo/tipo-protocolo.module';
import { ProtocoloModule } from './protocolo/protocolo.module';
import { MotivoOcorrenciaModule } from './motivo-ocorrencia/motivo-ocorrencia.module';
import { OcorrenciaModule } from './ocorrencia/ocorrencia.module';
import { MensagemModule } from './mensagem/mensagem.module';
import { ObservacaoFinanceiraModule } from './observacao-financeira/observacao-financeira.module';
import { RamalModule } from './ramal/ramal.module';

@Module({
  imports: [
    RequerimentoModule,
    DocumentoModule,
    AvisoModule,
    DocumentoAlunoModule,
    TipoProtocoloModule,
    ProtocoloModule,
    MotivoOcorrenciaModule,
    OcorrenciaModule,
    MensagemModule,
    ObservacaoFinanceiraModule,
    RamalModule,
  ],
})
export class RegistryModule {}
