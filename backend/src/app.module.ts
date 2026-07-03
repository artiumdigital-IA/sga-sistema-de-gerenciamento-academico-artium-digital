import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { AcademicModule } from './academic/academic.module';
import { AuditModule } from './audit/audit.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { EnrollmentModule } from './enrollment/enrollment.module';
import { RegistryModule } from './registry/registry.module';
import { ReportingModule } from './reporting/reporting.module';
import { FinancialModule } from './financial/financial.module';
import { SystemModule } from './system/system.module';
import { BrandingModule } from './branding/branding.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuditModule,
    AuthModule,
    AcademicModule,
    UsuariosModule,
    EnrollmentModule,
    RegistryModule,
    ReportingModule,
    FinancialModule,
    SystemModule,
    BrandingModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
