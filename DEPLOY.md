# OmniDesk AI — Guia Completo de Deploy

Repositório: https://github.com/Felipeservelhere/dream

---

## Arquitetura de Produção

```
WhatsApp ──► Evolution API (VPS) ──► Backend NestJS ─┐
                                                      │  Vercel (mesmo domínio)
                               Usuário ──► Frontend Next.js ─┘
                                              │
                                    PostgreSQL (Supabase)
                                    Redis (Upstash)
```

O `vercel.json` com `experimentalServices` faz o Vercel hospedar os dois serviços no mesmo domínio:
- `/` → Frontend Next.js
- `/_/backend` → Backend NestJS

Sem Railway. Tudo no Vercel.

---

## 1. PostgreSQL — Supabase (gratuito)

1. Acesse https://supabase.com → **New Project**
2. Nome, senha forte, região **South America (São Paulo)**
3. Após criar: **Settings → Database → Connection String (URI)**
   ```
   postgresql://postgres:[SENHA]@db.[ID].supabase.co:5432/postgres
   ```
4. Guarde — vai em `DATABASE_URL` nas env vars do Vercel

### Criar as tabelas

No Supabase, vá em **SQL Editor** e execute o conteúdo do arquivo:
`backend/src/database/migrations/1700000000000-InitialSchema.ts`

Copie apenas o conteúdo dentro do método `up()` (os `await queryRunner.query(...)`) e cole o SQL de cada tabela no SQL Editor do Supabase.

**Ou** rode via CLI localmente com a `DATABASE_URL` do Supabase:
```bash
cd backend
DATABASE_URL="postgresql://postgres:[SENHA]@db.[ID].supabase.co:5432/postgres" \
  npm run typeorm migration:run -- -d src/database/datasource.ts
```

---

## 2. Redis — Upstash (gratuito)

1. Acesse https://upstash.com → **Create Database**
2. Tipo: **Redis**, região: **São Paulo** ou **US-East-1**
3. Copie a **Redis URL**:
   ```
   rediss://default:[TOKEN]@[HOST].upstash.io:6379
   ```
4. Guarde — vai em `REDIS_URL` nas env vars do Vercel

---

## 3. Vercel — Frontend + Backend juntos

1. Acesse https://vercel.com → **New Project → Import Git Repository**
2. Selecione o repo **dream**
3. **Root Directory**: deixe em branco (raiz do repo — o `vercel.json` está na raiz)
4. Framework: Vercel detecta automaticamente via `vercel.json`
5. Vá em **Environment Variables** e adicione **todas** as variáveis abaixo:

### Variáveis de Ambiente no Vercel

| Variável | Valor |
|----------|-------|
| `DATABASE_URL` | `postgresql://postgres:[SENHA]@db.[ID].supabase.co:5432/postgres` |
| `USE_SQLITE` | `false` |
| `REDIS_URL` | `rediss://default:[TOKEN]@[HOST].upstash.io:6379` |
| `USE_REDIS_MOCK` | `false` |
| `JWT_SECRET` | string aleatória longa (ex: rode `openssl rand -hex 32`) |
| `JWT_EXPIRES_IN` | `7d` |
| `OPENAI_API_KEY` | `sk-...` (sua chave da OpenAI) |
| `EVOLUTION_API_URL` | URL da Evolution API (após passo 4) |
| `EVOLUTION_API_KEY` | API key da Evolution API |
| `NODE_ENV` | `production` |
| `NEXT_PUBLIC_API_URL` | `/_/backend/api/v1` |

6. Clique em **Deploy**

Após o deploy, a URL será algo como `https://dream.vercel.app`.
- Painel admin: `https://dream.vercel.app/login`
- API backend: `https://dream.vercel.app/_/backend/api/v1`
- Swagger docs: `https://dream.vercel.app/_/backend/api/docs`

---

## 4. Evolution API — VPS (obrigatório para WhatsApp)

A Evolution API precisa de um servidor próprio pois mantém a sessão ativa do WhatsApp.

**Opções baratas**: Hetzner CX11 (~€4/mês) ou DigitalOcean Droplet ($6/mês)

### Instalar na VPS

```bash
ssh root@IP_DA_VPS

# Instalar Docker
curl -fsSL https://get.docker.com | sh

# Rodar Evolution API
docker run -d \
  --name evolution-api \
  --restart always \
  -p 8080:8080 \
  -e AUTHENTICATION_API_KEY=sua_chave_secreta_aqui \
  -e AUTHENTICATION_TYPE=apikey \
  atendai/evolution-api:latest
```

### Conectar WhatsApp

```bash
# 1. Criar instância
curl -X POST http://IP_DA_VPS:8080/instance/create \
  -H "apikey: sua_chave_secreta_aqui" \
  -H "Content-Type: application/json" \
  -d '{"instanceName": "demo-clinica", "qrcode": true}'

# 2. Pegar QR Code
curl http://IP_DA_VPS:8080/instance/qrcode/demo-clinica \
  -H "apikey: sua_chave_secreta_aqui"
```

Abra o WhatsApp → Dispositivos Conectados → Escanear QR Code.

### Configurar Webhook para o Vercel

```bash
curl -X POST http://IP_DA_VPS:8080/webhook/set/demo-clinica \
  -H "apikey: sua_chave_secreta_aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://dream.vercel.app/_/backend/api/v1/webhook/demo-clinica",
    "webhook_by_events": false,
    "events": ["MESSAGES_UPSERT"]
  }'
```

Após configurar a VPS, volte no Vercel e atualize:
- `EVOLUTION_API_URL` = `http://IP_DA_VPS:8080`
- `EVOLUTION_API_KEY` = `sua_chave_secreta_aqui`

---

## 5. Checklist Final

- [ ] Supabase criado e `DATABASE_URL` copiada
- [ ] Tabelas criadas no Supabase (via SQL Editor ou CLI)
- [ ] Upstash criado e `REDIS_URL` copiada
- [ ] Vercel: repo `dream` importado, todas as env vars adicionadas, deploy feito
- [ ] VPS com Evolution API rodando
- [ ] WhatsApp conectado via QR Code
- [ ] Webhook apontando para `https://dream.vercel.app/_/backend/api/v1/webhook/...`

---

## 6. Primeiro Acesso

O seed cria automaticamente na primeira inicialização:

| Campo | Valor |
|-------|-------|
| URL | `https://dream.vercel.app/login` |
| Email | `demo@clinica.com` |
| Senha | `demo123` |

> Troque a senha imediatamente após o primeiro login.

---

## 7. Custos Estimados

| Serviço | Plano | Custo |
|---------|-------|-------|
| Supabase | Free | $0/mês |
| Upstash | Free | $0/mês |
| Vercel | Hobby | $0/mês |
| VPS Evolution API | Hetzner CX11 | ~€4/mês |
| **Total** | | **~$5/mês** |

---

## Desenvolvimento Local

```bash
# Backend (SQLite + Redis mock — sem Docker)
cd backend
cp .env.example .env   # USE_SQLITE=true, USE_REDIS_MOCK=true
npm install
npm run start:dev

# Frontend (outro terminal)
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Acesse: http://localhost:3001 (frontend) | http://localhost:3000/api/docs (Swagger)
