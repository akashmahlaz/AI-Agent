# Operon Deployment Guide

> ⚠️ **CRITICAL**: This file contains sensitive configuration. Keep it private and never commit actual secret values to version control.

---

## Account Information

**DO NOT confuse this with Julian's/client's AWS account. This is Akash's personal account.**

| Field | Value |
|-------|-------|
| **AWS Account** | akashmahlax |
| **AWS Account ID** | 727646466929 |
| **Region** | us-east-1 (N. Virginia) |
| **Instance IP** | 18.207.124.3 |
| **Instance Name** | operon-server |

---

## Access Credentials

### SSH Key
- **Location**: `~/.ssh/operon-key.pem`
- **Command**: `ssh -i ~/.ssh/operon-key.pem ubuntu@18.207.124.3`

### AWS Access Keys
```
Access Key ID:     AKIA2S2Y36NY3MLJFRVP
Secret Access Key: [stored in ~/.aws/credentials on the server]
```

### AWS Console Login
- **URL**: https://727646466929.signin.aws.amazon.com/console
- **Username**: akashmahlax
- **Password**: akash@#1234 (to be given by Akash directly)

---

## Server Details

### SSH Access
```bash
ssh -i ~/.ssh/operon-key.pem -o StrictHostKeyChecking=no ubuntu@18.207.124.3
```

### Directory Structure on Server
- **Project Root**: `/opt/operon`
- **Docker Data**: `/opt/operon/data` (volumes)
- **Logs**: via `sudo docker logs <container>`

### Docker Containers Running
| Container | Description |
|-----------|-------------|
| `operon-postgres` | PostgreSQL 16 database |
| `operon-backend` | Rust API server |
| `operon-frontend` | Next.js frontend |
| `operon-caddy` | Caddy reverse proxy (HTTPS) |

---

## URLs & Domains

| URL | Description |
|-----|-------------|
| https://bematterfull.fireclaw.in | Primary (live) |
| https://operon.18-207-124-3.sslip.io | Backup (IP-based) |

---

## Deployment Commands

### Connect to Server
```bash
ssh -i ~/.ssh/operon-key.pem ubuntu@18.207.124.3
```

### Navigate to Project
```bash
cd /opt/operon
```

### Check Container Status
```bash
sudo docker ps --format 'table {{.Names}}\t{{.Status}}'
```

### View Logs

**Backend (Rust API)**:
```bash
sudo docker logs operon-backend --tail 50
```

**Frontend (Next.js)**:
```bash
sudo docker logs operon-frontend --tail 50
```

**All containers**:
```bash
sudo docker logs operon-backend --tail 3 && echo '---' && sudo docker logs operon-frontend --tail 3
```

### Restart Services

**All services**:
```bash
cd /opt/operon && sudo docker compose -f docker-compose.prod.yml restart
```

**Specific service**:
```bash
cd /opt/operon && sudo docker compose -f docker-compose.prod.yml restart backend
```

### Rebuild & Redeploy

**Frontend** (most common - when you change Next.js code):
```bash
cd /opt/operon && sudo docker compose -f docker-compose.prod.yml build web && sudo docker compose -f docker-compose.prod.yml up -d --no-deps web
```

**Backend** (when you change Rust server):
```bash
cd /opt/operon && sudo docker compose -f docker-compose.prod.yml build backend && sudo docker compose -f docker-compose.prod.yml up -d --no-deps backend
```

**Full rebuild** (rare - when docker-compose.yml changes):
```bash
cd /opt/operon && sudo docker compose -f docker-compose.prod.yml up -d --build
```

### Pull Latest Code from GitHub
```bash
cd /opt/operon && sudo git pull origin main && sudo docker compose -f docker-compose.prod.yml up -d --build
```

---

## Environment Variables (on Server)

The `.env` file on the server at `/opt/operon/.env` contains sensitive values. To view current env:
```bash
sudo nano /opt/operon/.env
```

Key variables:
| Variable | Description |
|----------|-------------|
| `POSTGRES_PASSWORD` | PostgreSQL password |
| `JWT_SECRET` | JWT signing secret |
| `AUTH_SECRET` | NextAuth secret |
| `AUTH_GOOGLE_ID` | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth secret |
| `LINKEDIN_CLIENT_ID` | LinkedIn OAuth client ID |
| `LINKEDIN_CLIENT_SECRET` | LinkedIn OAuth secret |
| `OPENAI_API_KEY` | OpenAI API key |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini API key |
| `CLOUDINARY_*` | Cloudinary media config |

---

## Docker Compose File Location

The production deployment uses:
```
/opt/operon/docker-compose.prod.yml
```

NOT the root `docker-compose.yml` (that's for local dev).

---

## Common Issues & Fixes

### Frontend API calls failing (ERR_CONNECTION_REFUSED in browser)
- **Cause**: Wrong `NEXT_PUBLIC_API_URL` baked into JS bundle
- **Fix**: Rebuild frontend with correct build arg:
  ```bash
  cd /opt/operon && sudo docker compose -f docker-compose.prod.yml build web && sudo docker compose -f docker-compose.prod.yml up -d --no-deps web
  ```

### Backend not responding
- Check if container is running: `sudo docker ps`
- Check logs: `sudo docker logs operon-backend --tail 30`
- Restart: `sudo docker compose -f docker-compose.prod.yml restart backend`

### Database connection issues
- Check postgres health: `sudo docker exec operon-postgres pg_isready -U operon`
- Restart order: postgres → backend → frontend

---

## CI/CD (GitHub Actions)

GitHub Actions deploys automatically on push to `main` branch. Workflow file: `.github/workflows/deploy.yml`

---

## Vercel (Frontend Hosting Alternative)

If deploying frontend to Vercel instead of Docker, the token is stored in Akash's credential store. Ask Akash for the Vercel token when needed.

---

## Backup

Backups are stored in the Docker volume `postgres_data`. For full server backup, snapshot the EC2 instance via AWS Console.

---

## Contacts

- **Akash**: For AWS account issues, domain changes, or urgent problems
- **Julian**: Client - NOT related to this deployment's infrastructure