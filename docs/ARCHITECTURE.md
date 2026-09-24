# ZYBRILKA — Architecture

Status: **approved** (2026-09-24). This document is the reference for all implementation stages.
Changes to the architecture must be proposed, approved, and recorded here.

---

## 1. Principles

One repository, one database, a few processes on one server. No microservices, no Kubernetes.
Priorities (from CLAUDE.md): correctness → security → stable architecture → performance → mobile UX → clean code → visuals → speed.

## 2. Architecture overview

```
Browser / Telegram WebView
        │  (same origin: zybrilka.ru  and  zybrilka.ru/api)
        ▼
  Caddy (HTTPS, static files, gzip/brotli)
   ├── /        → web (static SPA build)
   └── /api/*   → api (Node, Fastify)  ── PostgreSQL
                                          ▲
  worker (same codebase): import pipeline,│ analytics rollups,
  Telegram bots, scheduled jobs  ─────────┘ (pg-boss queue in Postgres)
  Object storage (S3-compatible): task images, uploaded PDFs/DOCX
```

## 3. Technology stack

| Layer | Choice | Why |
|---|---|---|
| Language | **TypeScript 6.0** throughout | Shared types and validation between frontend and backend. Not 7.x yet: typescript-eslint supports `<6.1` |
| Monorepo | **pnpm workspaces** | Simple and fast, no extra tooling (Nx/Turbo) |
| Frontend | **React + Vite**, TanStack Router + Query, CSS Modules + CSS variables for design tokens | Small static SPA, fast in Telegram WebView and Safari, CDN-cacheable, per-route code splitting |
| UI extras | KaTeX (formulas), lightweight charts (uPlot or Recharts, lazy-loaded), Canvas + Pointer Events for the scratchboard | Small bundle |
| Backend | **Fastify** (Node 22 LTS) | Fast, mature, schema validation, rate limiting, WebSockets later for battles |
| Validation | **Zod** in `packages/shared` | One schema validates on client and server |
| Database | **PostgreSQL 16** | Reliable relational data, JSONB where flexible, strong analytics queries |
| ORM / migrations | **Drizzle ORM + drizzle-kit** | Typed, SQL-like, plain reviewable SQL migrations |
| Local/test DB | **PGlite** (Postgres in WASM) or Docker Postgres | Same dialect → test-to-production is only a connection-string change |
| Job queue | **pg-boss** (on Postgres) | No Redis. Imports, rollups, bot notifications. Added with the first real job |
| Telegram | **grammY** | Typed. Mini App bot and support/admin bot |
| Tests | Vitest (unit, API), Playwright (e2e, mobile viewports) | |
| CI | GitHub Actions: lint, typecheck, test, build | |
| Deployment | One VPS + Docker Compose (Caddy, api, worker, postgres) + S3-compatible storage | Cheap, simple, automatic HTTPS |

**What runs where**
- Locally / in dev containers: everything (web, api, worker, PGlite or Postgres).
- Needs a server: production DB, HTTPS (required by Telegram Mini Apps), bot webhook, backups.
- Migration to production: set `DATABASE_URL` to real Postgres → `pnpm db:migrate` → deploy Docker images.

Public SEO landing pages, if needed, are added later as prerendered static pages.

## 4. Database schema (main tables)

```
── Users & auth
users(id, created_at, last_seen_at, display_name, avatar_url, role[user|moderator|admin],
      onboarding_completed, diagnostic_completed_at, xp, level, timezone, is_banned)
auth_identities(id, user_id, provider[telegram|guest|email], provider_user_id UNIQUE, created_at)
sessions(id, user_id, token_hash, expires_at, user_agent_hash, created_at)
user_subjects(user_id, subject_id, target_score, exam_year)

── Content
subjects(id, slug, name, exam_year_active)
exam_formats(id, subject_id, year, spec_source_url, is_current)   -- keeps each year's format separate
task_numbers(id, subject_id, year, number, part[1|2], answer_type, max_score, title)
topics(id, subject_id, parent_id, slug, name)                     -- topic → subtopic tree
tasks(id, subject_id, year, task_number_id, topic_id, subtopic_id, difficulty(1-5),
      difficulty_rating, condition_md, options JSONB, answer_type,
      correct_answer JSONB, answer_rules JSONB,   -- answer normalization/comparison rules
      explanation_md, explanation_source[official|human|ai_verified],
      source_id, source_ref, source_url, content_hash, normalized_text,
      status[draft|review|published|hidden|archived], date_added,
      solve_count, correct_count, complaint_count, version)
task_images(id, task_id, storage_key, width, height, alt)
task_similarity(task_id, similar_task_id, score, kind[manual|auto])

── Learning
attempts(id, user_id, task_id, session_id, answer_raw, answer_normalized, is_correct,
         time_spent_ms, hint_used, explanation_opened,
         context[training|diagnostic|mistakes|review|variant|battle],
         is_similar_followup, parent_attempt_id, created_at)
mistakes(id, user_id, task_id, first_attempt_id, last_attempt_id, times_wrong,
         status[open|reviewing|resolved], next_review_at, interval_days, ease,   -- spaced repetition
         similar_task_result, error_type)
user_topic_stats(user_id, topic_id, attempts, correct, recent_correct_ewma,
                 mastery (Elo-style), last_practiced_at, updated_at)   -- input for adaptive training
training_sessions(id, user_id, mode, filters JSONB, planned_task_ids int[], started_at, finished_at, score)
diagnostics(id, user_id, subject_id, started_at, completed_at, result JSONB)   -- per-topic %

── Gamification
achievements(id, slug, name, description, rule JSONB, icon, is_active)
user_achievements(user_id, achievement_id, unlocked_at)
achievement_rarity(achievement_id, active_users_base, unlocked_count, computed_at)
streaks(user_id, current, longest, last_active_date)
xp_events(id, user_id, amount, reason, ref_id, created_at)        -- append-only, auditable XP
leaderboard_snapshots(period, period_start, user_id, score, rank)

── Battles (later phase)
battles(id, mode[fast|rated], status, task_ids int[], created_at, started_at, finished_at, seed)
battle_players(battle_id, user_id, score, correct, total_time_ms, rating_before, rating_after, result)
battle_answers(battle_id, user_id, task_index, answer, is_correct, server_received_at,
               UNIQUE(battle_id, user_id, task_index))
user_ratings(user_id, subject_id, rating, rd, games)

── Moderation
complaints(id, task_id, user_id, reason, comment, status[new|accepted|rejected|fixed],
           admin_id, admin_note, tg_message_id, created_at, resolved_at)
admin_audit_log(id, admin_id, action, entity, entity_id, diff JSONB, created_at)

── Import center
sources(id, name, kind[manual|official_api|export|url], base_url, license_notes,
        automation_allowed, storage_allowed, attribution, is_active)
imports(id, source_id, admin_id, kind[pdf|docx|json|csv|images|url], file_key,
        status[queued|parsing|parsed|reviewing|done|failed], stats JSONB, error, created_at)
import_items(id, import_id, raw JSONB, parsed JSONB, warnings JSONB, confidence,
             duplicate_of_task_id, dup_score, decision[pending|add|merge|skip],
             resulting_task_id, reviewed_by, reviewed_at)

── Analytics
events(id BIGSERIAL, user_id, anon_id, name, props JSONB, platform[web|tg], created_at)  -- monthly partitions later
daily_stats(date, metric, dimension, value)   -- precomputed rollups for the admin dashboard
```

**Foundation (S0):** the first migration creates only `app_settings` (runtime key/value settings). Each product table above is added by the stage that uses it.

**Rules**
- The correct answer and explanation are **never sent to the client before the attempt is recorded on the server.**
- Every schema change goes through a migration.

## 5. API structure

Base path `/api/v1`, JSON, all input validated with Zod.
`GET /health` is served outside `/api` for container/uptime probes: version, uptime, DB status; `503` when the DB is down.

```
Auth
POST /auth/telegram        {initData} → server-side validation → session
POST /auth/guest           → anonymous user (web), linkable to Telegram later
POST /auth/telegram-login  (Telegram Login Widget, website)
POST /auth/logout          GET /me   PATCH /me

Onboarding / diagnostic
PUT  /me/subjects
POST /diagnostics                  → start (adaptive: server picks the next task)
POST /diagnostics/:id/answer       → next task or final profile
GET  /diagnostics/:id/result

Content
GET /subjects   GET /subjects/:id/topics   GET /subjects/:id/task-numbers

Training
POST /training/sessions            {mode: topic|mistakes|review|smart|variant, filters}
GET  /training/sessions/:id/next
POST /attempts                     {taskId, sessionId, answer, timeSpentMs}
                                   → {correct, correctAnswer, explanation, topic, errorType}
POST /attempts/:id/explanation-opened
GET  /tasks/:id/similar
POST /training/sessions/:id/finish

Progress
GET /progress/summary   GET /progress/topics   GET /progress/timeline?period=
GET /mistakes           GET /achievements      GET /leaderboard?period=&subject=

Complaints
POST /tasks/:id/complaints

Admin (/api/v1/admin/*, role admin|moderator, every write audited)
GET/POST/PATCH /tasks, POST /tasks/:id/publish|hide
GET /complaints, PATCH /complaints/:id
GET /stats/users|tasks|activity|funnel|retention?from=&to=
GET/POST /sources
POST /imports (upload), GET /imports/:id, GET /imports/:id/items
PATCH /import-items/:id {decision, edits}, POST /imports/:id/publish

Telegram
POST /telegram/webhook/:secret     (bot updates, verified by secret token header)

Battles (later): WS /battles/ws + POST /battles/queue
```

## 6. Project structure

```
Zybrilka/
├── apps/
│   ├── web/            React SPA: app + /admin (lazy-loaded) + Telegram adapter
│   │   └── src/{routes,features/{onboarding,training,progress,achievements,scratchboard,admin},ui,lib}
│   ├── api/            Fastify: src/{modules/<domain>/{routes,service,repo}.ts, plugins/{auth,rateLimit,security}}
│   └── worker/         pg-boss jobs: import pipeline, rollups, achievements, bots
├── packages/
│   ├── db/             Drizzle schema, migrations/, seed/; `@zybrilka/db/testing` (PGlite for tests)
│   ├── shared/         Zod schemas, API types, answer normalization/checking, constants
│   └── adaptive/       pure functions: priority scoring, mastery updates, spaced repetition
├── design/             5 concept prototypes → chosen design tokens
├── docs/               ARCHITECTURE.md, DECISIONS.md, SOURCES.md (legal status per content source)
├── infra/              docker-compose.yml, Caddyfile, backup scripts
├── .github/workflows/  ci.yml
└── CLAUDE.md
```

Workspace packages export compiled `dist/` by default and their TypeScript source under the custom `@zybrilka/source` export condition. Dev tools (Vite, Vitest, tsx, `tsc --noEmit`) use the source condition, so development and tests never depend on a prior build; production runs the compiled output.

## 7. Telegram Mini App

- **One SPA, two environments.** A `platform` adapter detects `window.Telegram.WebApp`: Telegram theme parameters, BackButton/MainButton, haptics, viewport and safe-area insets. On the web: normal navigation.
- **Authentication:** the client sends raw `initData`. The server verifies the HMAC-SHA256 signature (secret key = `HMAC_SHA256("WebAppData", BOT_TOKEN)`), rejects stale `auth_date` (~24h), upserts `auth_identities(telegram, tg_id)` and issues a session token. **`initDataUnsafe` is never trusted.**
- **Sessions:**
  - Telegram: token in the `Authorization` header, kept in memory with a `sessionStorage` fallback; on expiry the client re-sends `initData`. Avoids cookie issues in the Telegram iframe and Safari ITP.
  - Web: httpOnly, Secure, SameSite=Lax cookie on the same origin.
- **Account linking:** a web guest links Telegram via the Login Widget; progress is merged into one account.
- **WebView specifics:** `100dvh`, safe areas, no hover-only interactions, no `alert()`, `expand()`; test on iOS Telegram (WKWebView) and Android Telegram.
- **Bot:** Mini App launch button, `/start` deep links (e.g. `startapp=task_123`), later streak reminders.

## 8. Admin

- Same SPA under `/admin`, a separate lazy-loaded bundle.
- **Protection is server-side:** every `/admin/*` route checks `role`. Hidden UI is not protection.
- Roles: `admin` (everything), `moderator` (tasks, complaints, imports; no user management). All admin writes go to `admin_audit_log`.
- Shorter admin sessions; sensitive actions may require re-authentication. Admins are created by a CLI seed command, never through public sign-up.
- **Dashboard:** reads `daily_stats` rollups plus live queries for "today". Users (new, DAU, activity buckets 1+/2+/10+/50+/100+, entered-but-inactive), tasks by status/subject/number, activity, funnel, retention.
- **Support bot:** new complaint → worker job → message to the admin chat with inline buttons (Open / Accept / Reject / Fixed). The bot checks that the button presser's Telegram ID belongs to an admin before applying the action.

## 9. Import Center

```
upload / source URL → store original file (object storage) → import row (queued)
  → worker: parse (JSON/CSV directly; DOCX via mammoth; PDF via text extraction; images stored)
  → structure: split into items {condition, options, answer, explanation, number, year}
  → answer detection (patterns + answer-key section matching) → confidence score
  → classify: subject/number from metadata; topic by rules + keywords (AI suggestion later, marked "unverified")
  → quality checks: missing answer, broken formulas/images, number not matching the year's format
  → deduplicate: source_ref → content_hash → normalized-text trigram similarity (pg_trgm)
  → import_items (draft) → admin review (preview, warnings, side-by-side duplicate: skip/merge/add)
  → publish → tasks(status=published)
```

- MVP: JSON and CSV import plus manual task entry. Phase 2: DOCX, PDF, images.
- Scheduled source monitoring only when `sources.automation_allowed = true` and the source is reviewed in `docs/SOURCES.md`.
- No scraping where not permitted; never bypass CAPTCHA, authentication or anti-bot protections.
- Uncertain answers and AI-drafted content always go to `review`; never auto-published.
- Every imported task retains its source information.

## 10. Analytics

- Own event log, no third-party trackers.
- Server-side events wherever possible (answer submitted, correct/incorrect, diagnostic, achievement, complaint) — cannot be faked or blocked.
- UI-only events (task opened, explanation opened, similar task opened) via batched `POST /events`, rate-limited, event names allowlisted.
- Worker aggregates `events` into `daily_stats` every 5–15 minutes; the dashboard reads aggregates.
- Retention cohorts and funnel computed from `users.created_at` + `attempts`/`events`.
- Minimal personal data: Telegram ID, display name, optional avatar. No phone numbers or emails in the MVP.

## 11. Adaptive training (summary)

- Per-topic mastery (Elo-style) updated on every attempt against the task's difficulty rating.
- Topic priority combines: error rate, recent errors (exponential decay), repeated errors, attempt count, difficulty, time since last practice, recent improvement, similar-task performance; plus a small exploration share.
- Mistakes are scheduled with spaced repetition (`mistakes.next_review_at`, `interval_days`, `ease`).
- Implemented as pure, unit-tested functions in `packages/adaptive`.

## 12. Security summary

- Server-side validation (Zod) on every input; parameterized queries via Drizzle.
- Telegram `initData` validated server-side; role-based authorization; protected admin routes.
- Secrets only in environment variables; never in frontend code or the repository.
- Rate limiting (per IP and per user), secure headers, same-origin API (no permissive CORS), output escaping (React + sanitized Markdown/KaTeX).
- Answers/explanations released only after the attempt is stored.
- Anti-farming: difficulty-weighted XP, daily caps. Battles: server-only scoring, unique constraints on answers, server timestamps.

## 13. MVP roadmap

Each stage ends **tested + committed + pushed to GitHub**.

**MVP**
- **S0 — Foundation:** monorepo, lint/format, TypeScript, Vitest, CI, Drizzle + first migration, `/health`.
- **S1 — Design:** 5 genuinely different concepts as clickable mobile HTML prototypes → selection → design system (tokens + base components).
- **S2 — Task engine:** subjects/topics/tasks schema, seed tasks, answer checker (comma/dot, spaces, ё/е, case, order-insensitive multi-digit answers), task screen, KaTeX, explanation after checking.
- **S3 — Auth:** Telegram `initData` validation, web guest, sessions, rate limiting, security headers.
- **S4 — Onboarding + diagnostic:** subject selection, 10–20 task adaptive diagnostic, skill profile, "Retake diagnostic".
- **S5 — Mistakes + progress:** attempts/mistakes model, "Мои ошибки" as a real training mode, spaced repetition, progress screens.
- **S6 — Adaptive training:** topic priority scoring, "similar task" after a mistake.
- **S7 — Complaints + minimal admin:** "⚠️ Пожаловаться", admin task editing, complaint handling.
- **S8 — Import (JSON/CSV):** with review and duplicate screens.
- **S9 — Scratchboard:** "Расширить поле" — draw, erase, undo, clear; touch and stylus.
- **S10 — Production deploy:** VPS, HTTPS, Mini App registration, backups (requires approval: paid service).

**Phase 2:** XP, streaks, achievements with rarity; full admin dashboard (charts, funnel, retention); support bot with inline buttons; DOCX/PDF import; leaderboards; full EGE variants with timer.

**Later:** PvP battles (fast, then rated); AI-drafted explanations with human review; source monitoring; more subjects; optional ad removal.

## 14. Risks and unknowns

1. **Task content licensing (biggest risk).** Terms of ФИПИ materials and third-party sites (e.g. "Решу ЕГЭ") for storage and republication are unclear or restrictive. Each source needs a documented decision in `docs/SOURCES.md`. Options: official open materials with attribution (to be verified), original tasks, user-uploaded material with rights.
2. **152-ФЗ data localization.** Personal data of Russian citizens generally must first be stored in databases in Russia → prefer a Russian VPS (Selectel / Timeweb / Yandex Cloud). Many users are minors → minimal data collection.
3. **Current exam formats.** 2027 specifications may not be final as of September 2026. The schema separates formats per year; content must be checked against official documents.
4. **Part 2 (written-solution) tasks** cannot be auto-checked. MVP: self-assessment against official criteria, tracked separately in statistics.
5. **Telegram WebView quirks** (iOS keyboard/viewport jumps, cookie restrictions). Mitigation: token sessions, early real-device testing.
6. **Explanation quality at scale.** Writing is slow; AI drafts require review.
7. **Leaderboard farming / battle cheating.** Difficulty-weighted XP, daily caps, server-side results, unique answer constraints.

## 15. Open decisions

- MVP subject(s) — recommendation: профильная математика part 1 first, Russian language second.
- Logo / bison mascot asset — provided by owner, or placeholder for concepts.
- Initial content source with usage rights — or a small original seed set + JSON import.
- Hosting location (Russia recommended for 152-ФЗ), domain, Telegram bot token (server env only).

## 16. First steps

S0 (foundation) → S1 (5 design concepts) → S2 (task engine) on a single subject.
