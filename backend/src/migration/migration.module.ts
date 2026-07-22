import { Module } from '@nestjs/common';
import { ImportacaoLegadoModule } from './importacao-legado/importacao-legado.module';

@Module({
  imports: [ImportacaoLegadoModule],
})
export class MigrationModule {}
