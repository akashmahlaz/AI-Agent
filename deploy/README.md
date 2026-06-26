# BeMatterfull — AWS Deploy

Two EC2 instances, two ECR images, two GitHub Actions workflows. `git push` to `main` builds + deploys both.

## Topology

```
                  ┌────────────────────────────────────┐
   Browser ─────► │  app.bematterfull.com   (FE EC2)  │
                  │  nginx :443 → next.js :3000       │
                  └─────────────┬──────────────────────┘
                                │  HTTPS + Bearer
                                ▼
                  ┌────────────────────────────────────┐
                  │  api.bematterfull.com   (BE EC2)  │
                  │  nginx :443 → rust :8080          │
                  └─────────────┬──────────────────────┘
                                │
                                ▼
                          Postgres
```

## One-time setup per EC2 instance

```bash
# Install Docker
sudo apt update && sudo apt install -y docker.io nginx certbot python3-certbot-nginx
sudo usermod -aG docker $USER
newgrp docker

# Install AWS CLI for ECR pulls
sudo apt install -y awscli

# Pick an instance role with ECR read OR add AWS keys to ~/.aws/credentials

# Create the deploy directory
sudo mkdir -p /opt/bematterfull/{frontend,backend}
sudo chown $USER /opt/bematterfull/{frontend,backend}

# Drop the .env.production file (see examples)
scp .env.production.frontend  user@<fe-ip>:/opt/bematterfull/frontend/.env.production
scp .env.production.backend   user@<be-ip>:/opt/bematterfull/backend/.env.production
```

## One-time setup on each instance: nginx + TLS

```bash
# On the FE instance
sudo cp deploy/nginx/frontend.conf /etc/nginx/sites-available/bematterfull
sudo ln -sf /etc/nginx/sites-available/bematterfull /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d app.bematterfull.com

# On the BE instance
sudo cp deploy/nginx/backend.conf /etc/nginx/sites-available/bematterfull-api
sudo ln -sf /etc/nginx/sites-available/bematterfull-api /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d api.bematterfull.com
```

## GitHub secrets (Repo → Settings → Secrets and variables → Actions)

| Secret | Purpose |
|--------|---------|
| `AWS_ACCESS_KEY_ID` | ECR push + ECS/SSO |
| `AWS_SECRET_ACCESS_KEY` | ECR push + ECS/SSO |
| `AWS_REGION` | e.g. `us-east-1` |
| `AWS_ACCOUNT_ID` | 12-digit AWS account number |
| `FRONTEND_EC2_HOST` | Public IP / DNS of FE instance |
| `FRONTEND_EC2_USER` | SSH user (e.g. `ubuntu`) |
| `FRONTEND_EC2_SSH_KEY` | Private SSH key (PEM, full newlines) |
| `BACKEND_EC2_HOST` | Public IP / DNS of BE instance |
| `BACKEND_EC2_USER` | SSH user (e.g. `ubuntu`) |
| `BACKEND_EC2_SSH_KEY` | Private SSH key (PEM, full newlines) |

## Deploy flow

```bash
git add -A
git commit -m "feat: ..."
git push origin main
```

The two workflows:
- `.github/workflows/deploy-frontend.yml` — triggered by changes under `app/`, `components/`, `lib/`, `hooks/`, `public/`, `package.json`, `pnpm-lock.yaml`, `Dockerfile.frontend`, `next.config.ts`.
- `.github/workflows/deploy-backend.yml` — triggered by any change under `server/`.

Each one: builds the image → pushes to ECR → SSH-pulls + restarts the container on the matching EC2 instance.

## Public-dashboard bypass

Both the FE and BE must have the public-dashboard flag set for unauthenticated access to work end-to-end:

- **BE**: `OPERON_PUBLIC_DASHBOARD=1` in `/opt/bematterfull/backend/.env.production`
- **FE**: `NEXT_PUBLIC_PUBLIC_DASHBOARD=1` in `/opt/bematterfull/frontend/.env.production` (already inlined at build time)

To turn it off, set both to `0` (or remove) and re-deploy. The FE will then redirect to `/login` as before.

## Security group rules

| Instance | Port | Source |
|----------|------|--------|
| FE EC2 | 22 (SSH) | Your IP only |
| FE EC2 | 80 + 443 | 0.0.0.0/0 |
| BE EC2 | 22 (SSH) | Your IP only |
| BE EC2 | 80 + 443 | 0.0.0.0/0 (or only FE EC2's IP for tighter security) |
| Postgres | 5432 | BE EC2 security group only |

## Troubleshooting

- **CORS error in browser** → confirm `OPERON_WEB_ORIGIN` on the BE includes the FE's exact origin (`https://app.bematterfull.com`, no trailing slash). The browser rejects mismatches silently.
- **401 on every request** → token issue. Check the FE's `NEXT_PUBLIC_API_URL` matches the BE's public URL, and that `OPERON_COOKIE_SECURE=true` is set on the BE (HTTPS only cookies).
- **SSE / streaming stops mid-response** → confirm `proxy_buffering off;` and the 600s timeouts are in the BE nginx config.
- **ECR login fails on EC2** → instance role must have `AmazonEC2ContainerRegistryReadOnly` policy attached, or you must configure AWS credentials manually.
