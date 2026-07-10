import { Module } from '@nestjs/common';
import { DocumentoController } from './documento.controller';
import { DocumentoService } from './documento.service';

@Module({
  controllers: [DocumentoController],
  providers: [DocumentoService],
  // Exportado pro DiscenteModule reaproveitar getCarteirinha() (mesmo código
  // de validação/QR usado pela secretaria) na "Carteira de Estudante" do
  // autoatendimento do aluno.
  exports: [DocumentoService],
})
export class DocumentoModule {}
