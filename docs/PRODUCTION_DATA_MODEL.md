# Production data model

Added in S3.2. Full detail (filtering, ordering, dedup) is in `docs/ARCHITECTURE.md` §18 —
this is the simple ownership picture.

## Ownership vs. membership

A task belongs to exactly one subject and (optionally) one topic. It can additionally be a
member of any number of variants (in practice: one today, more once a task repeats across
variants later) — membership never copies the task.

```
Subject
  │
  ▼
Task ──────────────┬──── Topic
  │                 └──── Task Number (an ordinary column, tasks.taskNumber)
  │
  ▼ (via variant_tasks: one row per membership, carrying `position`)
VariantTask
  │
  ▼
Variant (e.g. "Вариант 1")
  │
  ▼
Collection (e.g. "ЕГЭ 2026 Ященко")
```

Reading it top-down: every `Task` is owned by a `Subject` and (optionally) a `Topic`, and
carries its own `taskNumber` (the official EGE question number — an ordinary integer column, not
a separate table). Reading it bottom-up: every `Collection` (a publisher's book, e.g. "ЕГЭ 2026
Ященко") has one or more `Variant`s ("Вариант 1", "Вариант 2", …), and each `Variant` is an
ordered list of `Task`s via `VariantTask` (the join row that carries `position` — the task's
1-based slot in that exam, e.g. 1..19).

## One task, many doors in

Задание №5 из "ЕГЭ 2026 Ященко, Вариант 1" is **one** `tasks` row, reachable through all of:

1. Математика (`subjectId`)
2. Задание №5 (`taskNumber`)
3. Сборник "Ященко" (via `variant_tasks` → `variants` → `collections`)
4. ЕГЭ 2026 (`collections.year`)
5. Вариант 1 (`variants.variantNumber`)
6. Полный вариант №1, position 5 (`variant_tasks.position`)
7. Тренировка → По заданиям / Сборник filters (`GET /tasks?collection=&taskNumber=`)

No copies anywhere in that list — every entry point resolves back to the same `tasks.id`.

## Status gates

`tasks`, `collections`, and `variants` each carry their own `status`. Only `published` is ever
served to a normal user, on all three levels — a published task inside a draft/archived variant,
or a draft task inside a published variant, is excluded, enforced server-side (never left to a
UI-only filter). See `docs/ARCHITECTURE.md` §18 for exactly where this is checked.
