# Deployment

Production deployment of `apps/web` (S1 static build) to a VPS:
GitHub → Docker → Zybrilka Web → Caddy → HTTPS → `zybrilka.ru`.

Only the web app is covered here. API/worker/Postgres/Redis/Telegram
join in a later phase, as their own compose services.

## Prerequisites

- A VPS with Docker Engine + the Compose plugin installed (`docker compose version`).
  Nothing else needs installing on the host — Node/pnpm only run inside the build.
- DNS: `zybrilka.ru` and `www.zybrilka.ru` A/AAAA records pointing at the VPS's public IP.
- Ports 80 and 443 open and free on the VPS (Caddy needs both for HTTP→HTTPS redirect and ACME).
- A clone of this repo on the VPS, on the branch you intend to run.

## Build

```bash
git clone <repo-url> zybrilka && cd zybrilka
docker compose -f infra/docker-compose.yml build
```

Builds `apps/web/Dockerfile`: a Node 22 + pnpm 10.33.0 stage runs
`pnpm install --frozen-lockfile` and `vite build`, then only the
compiled `dist/` is copied into a minimal `nginx:1.27-alpine` runtime
image — no Node, pnpm or dev dependencies ship in the final image.

## Start

```bash
docker compose -f infra/docker-compose.yml up -d
```

Starts two containers: `web` (nginx serving the static build,
reachable only on the internal Docker network) and `caddy` (the only
container publishing `80`/`443`), which reverse-proxies to `web` and
obtains/renews its own TLS certificate automatically.

## Stop

```bash
docker compose -f infra/docker-compose.yml down
```

Leaves the `caddy_data`/`caddy_config` volumes (and the built image)
in place, so certificates aren't re-requested on the next `up`.

## Restart

```bash
docker compose -f infra/docker-compose.yml restart        # both
docker compose -f infra/docker-compose.yml restart web    # just web
```

## Logs

```bash
docker compose -f infra/docker-compose.yml logs -f web
docker compose -f infra/docker-compose.yml logs -f caddy
```

## Update from Git

```bash
git fetch origin
git checkout <branch>
git pull
docker compose -f infra/docker-compose.yml up -d --build web
```

Rebuilds only the `web` image from the new commit and replaces the
running container; `caddy` is untouched.

## Caddy

`infra/Caddyfile` defines both hosts:

- `www.zybrilka.ru` — permanent redirect to the apex domain.
- `zybrilka.ru` — reverse-proxied to `web:80`, with gzip/zstd
  encoding. Client-side route fallback (unknown paths → `index.html`)
  is handled by `web`'s own nginx config, not by Caddy.

Validate the file without starting anything:

```bash
docker run --rm -v "$(pwd)/infra/Caddyfile:/etc/caddy/Caddyfile:ro" caddy:2-alpine \
  caddy validate --config /etc/caddy/Caddyfile
```

## DNS requirements

Both `zybrilka.ru` and `www.zybrilka.ru` must resolve to the VPS's
public IP **before** `caddy` starts, so Let's Encrypt's HTTP-01
challenge can reach it on port 80.

## HTTPS

Fully automatic — Caddy requests and renews Let's Encrypt certificates
for both hosts on first request and redirects HTTP → HTTPS by default.
No manual certificate generation or renewal cron job needed.

## Rollback

```bash
git log --oneline -5                 # find the previous good commit
git checkout <previous-commit-or-tag>
docker compose -f infra/docker-compose.yml up -d --build web
```

`caddy` and its certificates are unaffected by a `web` rollback.
