import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // TENANTS
    await queryRunner.query(`
      CREATE TABLE "tenants" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "subdomain" character varying NOT NULL UNIQUE,
        "name" character varying NOT NULL,
        "phone" character varying,
        "email" character varying,
        "plan" character varying NOT NULL DEFAULT 'trial',
        "niche" character varying NOT NULL DEFAULT 'general',
        "status" character varying NOT NULL DEFAULT 'trial',
        "planLimits" jsonb NOT NULL DEFAULT '{}',
        "currentUsage" jsonb NOT NULL DEFAULT '{}',
        "settings" jsonb NOT NULL DEFAULT '{}',
        "whatsappInstance" jsonb,
        "trialEndsAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tenants" PRIMARY KEY ("id")
      )
    `);

    // USERS
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenantId" uuid,
        "name" character varying NOT NULL,
        "email" character varying NOT NULL UNIQUE,
        "passwordHash" character varying NOT NULL,
        "role" character varying NOT NULL DEFAULT 'attendant',
        "permissions" jsonb NOT NULL DEFAULT '{}',
        "isActive" boolean NOT NULL DEFAULT true,
        "avatarUrl" character varying,
        "lastLoginAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "FK_users_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL
      )
    `);

    // CLIENTS
    await queryRunner.query(`
      CREATE TABLE "clients" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenantId" character varying NOT NULL,
        "phone" character varying NOT NULL,
        "name" character varying,
        "email" character varying,
        "profile" jsonb NOT NULL DEFAULT '{}',
        "tags" text[],
        "notes" text,
        "stats" jsonb NOT NULL DEFAULT '{}',
        "isBlocked" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_clients" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_clients_tenant_phone" UNIQUE ("tenantId", "phone")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_clients_tenantId" ON "clients" ("tenantId")`);

    // CONVERSATIONS
    await queryRunner.query(`
      CREATE TABLE "conversations" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenantId" character varying NOT NULL,
        "clientId" uuid NOT NULL,
        "status" character varying NOT NULL DEFAULT 'open',
        "channel" character varying NOT NULL DEFAULT 'whatsapp',
        "assignedToId" uuid,
        "activeFlowId" character varying,
        "activeFlowNodeId" character varying,
        "collectedData" jsonb NOT NULL DEFAULT '{}',
        "aiContext" jsonb NOT NULL DEFAULT '[]',
        "metadata" jsonb NOT NULL DEFAULT '{}',
        "resolvedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_conversations" PRIMARY KEY ("id"),
        CONSTRAINT "FK_conversations_client" FOREIGN KEY ("clientId") REFERENCES "clients"("id"),
        CONSTRAINT "FK_conversations_user" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_conversations_tenantId" ON "conversations" ("tenantId")`);

    // MESSAGES
    await queryRunner.query(`
      CREATE TABLE "messages" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenantId" character varying NOT NULL,
        "conversationId" character varying NOT NULL,
        "clientId" character varying NOT NULL,
        "direction" character varying NOT NULL,
        "type" character varying NOT NULL DEFAULT 'text',
        "sender" character varying NOT NULL,
        "text" text,
        "mediaUrl" character varying,
        "transcription" text,
        "externalId" character varying,
        "detectedIntent" character varying,
        "metadata" jsonb NOT NULL DEFAULT '{}',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_messages" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_messages_tenantId" ON "messages" ("tenantId")`);
    await queryRunner.query(`CREATE INDEX "IDX_messages_conversationId" ON "messages" ("conversationId")`);

    // FLOWS
    await queryRunner.query(`
      CREATE TABLE "flows" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenantId" character varying NOT NULL,
        "name" character varying NOT NULL,
        "description" character varying,
        "entryNodeId" character varying NOT NULL,
        "nodes" jsonb NOT NULL DEFAULT '[]',
        "triggers" jsonb NOT NULL DEFAULT '[]',
        "isActive" boolean NOT NULL DEFAULT true,
        "executionCount" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_flows" PRIMARY KEY ("id")
      )
    `);

    // RESOURCES
    await queryRunner.query(`
      CREATE TABLE "resources" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenantId" character varying NOT NULL,
        "name" character varying NOT NULL,
        "type" character varying NOT NULL,
        "availability" jsonb NOT NULL DEFAULT '{}',
        "metadata" jsonb NOT NULL DEFAULT '{}',
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_resources" PRIMARY KEY ("id")
      )
    `);

    // BOOKINGS
    await queryRunner.query(`
      CREATE TABLE "bookings" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenantId" character varying NOT NULL,
        "clientId" character varying NOT NULL,
        "resourceId" character varying NOT NULL,
        "scheduledAt" TIMESTAMP NOT NULL,
        "durationMinutes" integer NOT NULL DEFAULT 30,
        "status" character varying NOT NULL DEFAULT 'pending',
        "notes" text,
        "previousBookingId" character varying,
        "remindersSent" jsonb NOT NULL DEFAULT '[]',
        "npsScore" integer,
        "npsFeedback" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_bookings" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_bookings_tenantId" ON "bookings" ("tenantId")`);

    // AUTOMATIONS
    await queryRunner.query(`
      CREATE TABLE "automations" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenantId" character varying NOT NULL,
        "name" character varying NOT NULL,
        "description" character varying,
        "trigger" jsonb NOT NULL,
        "conditions" jsonb NOT NULL DEFAULT '[]',
        "actions" jsonb NOT NULL DEFAULT '[]',
        "isActive" boolean NOT NULL DEFAULT true,
        "executionCount" integer NOT NULL DEFAULT 0,
        "lastExecutedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_automations" PRIMARY KEY ("id")
      )
    `);

    // AI CONFIGS
    await queryRunner.query(`
      CREATE TABLE "ai_configs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenantId" character varying NOT NULL UNIQUE,
        "assistantName" character varying NOT NULL DEFAULT 'Assistente',
        "systemPrompt" text NOT NULL DEFAULT '',
        "tone" character varying NOT NULL DEFAULT 'friendly',
        "provider" character varying NOT NULL DEFAULT 'openai',
        "model" character varying NOT NULL DEFAULT 'gpt-4o-mini',
        "temperature" double precision NOT NULL DEFAULT 0.7,
        "businessContext" jsonb NOT NULL DEFAULT '{}',
        "faqs" jsonb NOT NULL DEFAULT '[]',
        "humanHandoffKeywords" text[],
        "maxTokens" integer NOT NULL DEFAULT 500,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ai_configs" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "ai_configs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "automations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "bookings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "resources"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "flows"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "messages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "conversations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "clients"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tenants"`);
  }
}
