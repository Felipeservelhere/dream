# OmniDesk AI — Guia Completo de Deploy

Repositório: https://github.com/Felipeservelhere/dream

---

## Arquitetura de Produção

```
WhatsApp ──► Evolution API (VPS) ──► Backend NestJS (Railway)
                                           │
                                    PostgreSQL (Supabase)
                                    Redis (Upstash)
                                           │
                              Frontend Next.js (Vercel) ◄── usuário
```

---

## 1. PostgreSQL — Supabase (gratuito)

1. Acesse https://supabase.com → **New Project**
2. Escolha nome, senha forte, região **South America (São Paulo)**
3. Após criar, vá em **Settings → Database**
4. Copie a **Connection String** (URI) no formato:
   ```
   postgresql://postgres:[SENHA]@db.[ID].supabase.co:5432/postgres
   ```
5. Guarde essa string — vai em `DATABASE_URL` no Railway

---

## 2. Redis — Upstash (gratuito)

1. Acesse https://upstash.com → **Create Database**
2. Tipo: **Redis**, região: **São Paulo** ou **US-East**
3. Após criar, copie a **Redis URL** no formato:
   ```
   rediss://default:[TOKEN]@[HOST].upstash.io:6379
   ```
4. Guarde essa string — vai em `REDIS_URL` no Railway

---

## 3. Backend — Railway

1. Acesse https://railway.app → **New Project → Deploy from GitHub repo**
2. Selecione o repo **dream**, pasta raiz: `backend`
3. Railway vai detectar o Dockerfile automaticamente
4. Vá em **Variables** e adicione todas as variáveis abaixo:

```env
# Banco de dados (Supabase)
DATABASE_URL=postgresql://postgres:[SENHA]@db.[ID].supabase.co:5432/postgres
USE_SQLITE=false

# Redis (Upstash)
REDIS_URL=rediss://default:[TOKEN]@[HOST].upstash.io:6379
USE_REDIS_MOCK=false

# JWT — gere um segredo forte (ex: openssl rand -hex 32)
JWT_SECRET=coloque_um_segredo_muito_longo_e_aleatorio_aqui
JWT_EXPIRES_IN=7d

# OpenAI
OPENAI_API_KEY=sk-...

# Evolution API (preencher após passo 4)
EVOLUTION_API_URL=https://evolution.seudominio.com
EVOLUTION_API_KEY=sua_api_key_aqui

# App
NODE_ENV=production
PORT=3000
CORS_ORIGINS=https://seu-frontend.vercel.app
```

5. Clique em **Deploy** — o Railway vai buildar e subir o container
6. Vá em **Settings → Networking → Generate Domain** para pegar a URL pública
   - Exemplo: `https://dream-backend.railway.app`
7. Guarde essa URL — vai em `NEXT_PUBLIC_API_URL` no Vercel

### Rodar as migrations

Após o deploy, no Railway abra o **Shell** (aba Shell no projeto) e execute:

```bash
npm run typeorm migration:run -- -d src/database/datasource.ts
```

> Isso cria todas as 10 tabelas no Supabase automaticamente.

---

## 4. Evolution API — VPS (obrigatório para WhatsApp)

A Evolution API precisa de um servidor dedicado pois gerencia a sessão do WhatsApp.

**Opção recomendada: Hetzner CX11 (~€4/mês) ou DigitalOcean Droplet ($6/mês)**

### Instalar na VPS

```bash
# Conectar na VPS via SSH
ssh root@IP_DA_VPS

# Instalar Docker
curl -fsSL https://get.docker.com | sh

# Baixar e rodar Evolution API
docker run -d \
  --name evolution-api \
  --restart always \
  -p 8080:8080 \
  -e AUTHENTICATION_API_KEY=sua_chave_secreta_aqui \
  -e AUTHENTICATION_TYPE=apikey \
  -e DATABASE_ENABLED=false \
  -e REDIS_ENABLED=false \
  atendai/evolution-api:latest

# Verificar se está rodando
docker logs evolution-api
```

### Apontar domínio (opcional mas recomendado)

Configure um subdomínio `evolution.seudominio.com` apontando para o IP da VPS no seu DNS.

Depois instale Nginx + Certbot para HTTPS:

```bash
apt install -y nginx certbot python3-certbot-nginx
certbot --nginx -d evolution.seudominio.com
```

### Criar instância WhatsApp

```bash
# Criar instância
curl -X POST https://evolution.seudominio.com/instance/create \
  -H "apikey: sua_chave_secreta_aqui" \
  -H "Content-Type: application/json" \
  -d '{"instanceName": "demo-clinica", "qrcode": true}'

# Pegar QR Code para conectar o WhatsApp
curl https://evolution.seudominio.com/instance/qrcode/demo-clinica \
  -H "apikey: sua_chave_secreta_aqui"
```

Abra o WhatsApp no celular → Dispositivos conectados → Escanear QR Code.

### Configurar Webhook

```bash
curl -X POST https://evolution.seudominio.com/webhook/set/demo-clinica \
  -H "apikey: sua_chave_secreta_aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://dream-backend.railway.app/api/v1/webhook/demo-clinica",
    "webhook_by_events": false,
    "events": ["MESSAGES_UPSERT"]
  }'
```

---

## 5. Frontend — Vercel

1. Acesse https://vercel.com → **New Project → Import Git Repository**
2. Selecione o repo **dream**
3. Configure:
   - **Root Directory**: `frontend`
   - **Framework**: Next.js (detectado automaticamente)
4. Vá em **Environment Variables** e adicione:

```env
NEXT_PUBLIC_API_URL=https://dream-backend.railway.app/api/v1
```

5. Clique em **Deploy**
6. Após deploy, copie a URL do Vercel (ex: `https://dream.vercel.app`)
7. Volte no Railway e atualize `CORS_ORIGINS` com essa URL

---

## 6. Checklist Final

- [ ] Supabase criado e `DATABASE_URL` copiada
- [ ] Upstash criado e `REDIS_URL` copiada
- [ ] Railway backend deployado com todas as variáveis
- [ ] Migrations rodadas no Railway Shell
- [ ] VPS com Evolution API rodando
- [ ] Domínio apontado para VPS (opcional)
- [ ] Instância WhatsApp criada e QR Code escaneado
- [ ] Webhook configurado no Evolution API
- [ ] Vercel frontend deployado
- [ ] `CORS_ORIGINS` no Railway atualizado com URL do Vercel

---

## 7. Primeiro Acesso

Após tudo configurado, o seed cria automaticamente uma conta demo:

| Campo  | Valor              |
|--------|--------------------|
| URL    | https://dream.vercel.app/login |
| Email  | demo@clinica.com   |
| Senha  | demo123            |

> **Troque a senha imediatamente após o primeiro login!**

---

## 8. Variáveis de Ambiente — Resumo Completo

### Backend (Railway)

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | PostgreSQL connection string do Supabase |
| `USE_SQLITE` | `false` em produção |
| `REDIS_URL` | Redis URL do Upstash |
| `USE_REDIS_MOCK` | `false` em produção |
| `JWT_SECRET` | String aleatória longa (min 32 chars) |
| `JWT_EXPIRES_IN` | `7d` |
| `OPENAI_API_KEY` | Chave da OpenAI (sk-...) |
| `EVOLUTION_API_URL` | URL da sua Evolution API |
| `EVOLUTION_API_KEY` | API key da Evolution API |
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `CORS_ORIGINS` | URL do Vercel |

### Frontend (Vercel)

| Variável | Descrição |
|----------|-----------|
| `NEXT_PUBLIC_API_URL` | URL do backend Railway + `/api/v1` |

---

## 9. Custos Estimados

| Serviço | Plano | Custo |
|---------|-------|-------|
| Supabase | Free | $0/mês |
| Upstash | Free | $0/mês |
| Railway | Starter | ~$5/mês |
| Vercel | Hobby | $0/mês |
| VPS (Evolution) | Hetzner CX11 | ~€4/mês |
| **Total** | | **~$9/mês** |

---

## Suporte

Dúvidas? Abra uma issue em: https://github.com/Felipeservelhere/dream/issues
