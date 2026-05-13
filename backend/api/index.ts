import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { AppModule } from '../src/app.module';

const server = express();
let initialized = false;

async function bootstrap() {
  if (initialized) return;
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(server),
    { logger: ['error', 'warn'] },
  );
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.enableCors({ origin: '*', credentials: true });
  app.setGlobalPrefix('api/v1');
  await app.init();
  initialized = true;
}

export default async (req: any, res: any) => {
  req.url = req.url.replace(/^\/_\/backend/, '') || '/';
  await bootstrap();
  server(req, res);
};
