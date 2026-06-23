import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { AcademicModule } from './academic/academic.module';
import { AuditModule } from './audit/audit.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    // Configuração global — carrega .env automaticamente
    ConfigModule.forRoot({ isGlobal: true }),

    // Módulos de domínio
    PrismaModule,
    AuditModule,
    AuthModule,
    AcademicModule,
  ],
})
export class AppModule {}
