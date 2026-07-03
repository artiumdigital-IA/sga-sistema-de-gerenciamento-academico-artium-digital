import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Garante que as pastas de uploads existam (fotos de perfil, documentos digitalizados, etc.)
  const uploadsDir = join(process.cwd(), 'uploads', 'avatars');
  if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });
  const documentosDir = join(process.cwd(), 'uploads', 'documentos');
  if (!existsSync(documentosDir)) mkdirSync(documentosDir, { recursive: true });
  const brandingDir = join(process.cwd(), 'uploads', 'branding');
  if (!existsSync(brandingDir)) mkdirSync(brandingDir, { recursive: true });

  // Serve arquivos estaticos (uploads) — fora do prefixo /api/v1
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  // Prefixo global da API
  app.setGlobalPrefix('api/v1');

  // Validação automática dos DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS (ajustar origens em produção)
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  });

  // Swagger (apenas em desenvolvimento)
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('FIURJ Plataforma Acadêmica')
      .setDescription('API do sistema acadêmico da FIURJ')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`🚀 Backend rodando em http://localhost:${port}/api/v1`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`📖 Swagger em http://localhost:${port}/api/docs`);
  }
}

bootstrap();
