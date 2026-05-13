import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10) || 3000,
  url: process.env.APP_URL || 'http://localhost:3000',
  sessionTtlMinutes: parseInt(process.env.SESSION_TTL_MINUTES || '30', 10) || 30,
  useSqlite: process.env.USE_SQLITE === 'true',
  useRedisMock: process.env.USE_REDIS_MOCK === 'true',
}));

export const dbConfig = registerAs('db', () => ({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10) || 5432,
  user: process.env.DB_USER || 'postgres',
  pass: process.env.DB_PASS || 'postgres',
  name: process.env.DB_NAME || 'omnidesk',
}));

export const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
}));

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'dev-secret-change-in-prod',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
}));

export const aiConfig = registerAs('ai', () => ({
  openaiApiKey: process.env.OPENAI_API_KEY,
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  openaiAudioModel: process.env.OPENAI_AUDIO_MODEL || 'whisper-1',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
}));

export const evolutionConfig = registerAs('evolution', () => ({
  url: process.env.EVOLUTION_API_URL || 'http://localhost:8080',
  apiKey: process.env.EVOLUTION_API_KEY,
}));

export const storageConfig = registerAs('storage', () => ({
  endpoint: process.env.S3_ENDPOINT,
  accessKey: process.env.S3_ACCESS_KEY,
  secretKey: process.env.S3_SECRET_KEY,
  bucket: process.env.S3_BUCKET || 'omnidesk',
}));
