# Repo Insights

Small full-stack app to **search GitHub repositories** by language and last-activity date, show results in an **Angular** UI, and expose a **NestJS** API that wraps the GitHub Search API. Responses are augmented with a simple **rank score** on the server.

## Stack

| Part       | Tech        | Default URL              |
| ---------- | ----------- | ------------------------ |
| Frontend   | Angular 21  | http://localhost:4200    |
| Backend    | NestJS 11   | http://localhost:3000    |
| API docs   | Swagger UI  | http://localhost:3000/swagger |

## Prerequisites

- **Node.js** and **npm** (versions compatible with the subprojects; see `frontend/package.json` and `backend/package.json`).

## Quick start

From the repository root, run the API and the SPA in two terminals.

**1. Backend**

```bash
cd backend
npm install
npm run start:dev
```

**2. Frontend**

```bash
cd frontend
npm install
npm start
```

Open the app at [http://localhost:4200](http://localhost:4200). In development, Angular proxies `/git-repos` to the backend (`frontend/proxy.conf.json` → `http://localhost:3000`).

## Project layout

- `backend/` — NestJS app: `GET /git-repos` (query: `language`, `changedAfter`, optional `page`, `perPage` capped at 100).
- `frontend/` — Angular app: search form, list, pagination, error handling for API failures.

## API and Swagger

- **Search:** `GET /git-repos?language=…&changedAfter=…&page=1&perPage=30`
- **OpenAPI / try-it:** [http://localhost:3000/swagger](http://localhost:3000/swagger) (with the backend running).

## Rank score

Each repository in the response is augmented with a `rankScore` field computed server-side by `RepositoryScoringService` (`backend/src/git-repos/repository-scoring.service.ts`). The score blends popularity with how recently the repo was updated, so an active project with moderate stars can outrank a more popular but stale one.

**Higher `rankScore` is better** — all three components are non-negative and added together, so a larger value means a more popular and/or more recently updated repository.

### Formula

```text
rankScore = 8 * ln(1 + stars)
          + 5 * ln(1 + forks)
          + 15 * exp(-daysSinceUpdate / 30)
```

The result is rounded to 2 decimal places.

### Components

| Component       | Expression                       | Weight | Intuition                                                                 |
| --------------- | -------------------------------- | ------ | ------------------------------------------------------------------------- |
| Stars score     | `ln(1 + stargazersCount) * 8`    | 8      | Rewards popularity, with diminishing returns (log scale).                 |
| Forks score     | `ln(1 + forksCount) * 5`         | 5      | Rewards reuse/derivation, also on a log scale and weighted lower than stars. |
| Recency score   | `exp(-daysSinceUpdate / 30) * 15`| 15     | Exponential decay with a 30-day time constant; freshly updated repos get the full 15, ~5.52 after 30 days, ~2.03 after 60 days, ~0.75 after 90 days. |

### Inputs and edge cases

- `stargazersCount` and `forksCount` are clamped to `>= 0`; missing or negative values are treated as `0`.
- `daysSinceUpdate` is derived from `updatedAt`. **Future** timestamps are clamped to `0` days (max recency boost). **Unparseable/empty** timestamps fall back to epoch `0`, which makes `daysSinceUpdate` enormous and recency effectively `0` (i.e., the repo is treated as ancient).
- The log scale (`log1p`) keeps the score bounded for very popular repos: each 10× increase in stars adds only `8 × ln(10) ≈ 18.42` points.

> All numeric tables below are produced by the unit tests in `backend/src/git-repos/repository-scoring.service.spec.ts` with the system clock pinned to `2026-01-31T00:00:00Z` via `jest.setSystemTime`. To regenerate or verify, run `cd backend && npx jest --testPathPatterns=repository-scoring`.

### Recency decay over time (stars=200, forks=25)

This isolates the recency term — popularity is held constant while `updatedAt` slides into the past. The popularity baseline is `42.43 + 16.29 = 58.72` and recency adds the rest.

| Days since update | Recency contribution | **rankScore** |
| ----------------: | -------------------: | ------------: |
|                 0 |                15.00 |     **73.72** |
|                 7 |                11.88 |     **70.60** |
|                14 |                 9.41 |     **68.12** |
|                30 |                 5.52 |     **64.24** |
|                60 |                 2.03 |     **60.75** |
|                90 |                 0.75 |     **59.46** |
|               180 |                 0.04 |     **58.75** |
|               365 |                 0.00 |     **58.72** |

Backed by the parametrized test `'recency decay curve (stars=200, forks=25)'` (8 cases).

### Popularity scaling at fixed recency (today, forks = stars / 10)

This isolates the popularity term — every row gets the full `+15` recency boost, so the spread comes entirely from `8·ln(1+stars) + 5·ln(1+forks)`. Notice the diminishing returns: each 10× jump in stars adds only ~30 points to the total.

| Stars   | Forks | Stars score | Forks score | **rankScore** |
| ------: | ----: | ----------: | ----------: | ------------: |
|       0 |     0 |        0.00 |        0.00 |     **15.00** |
|      10 |     1 |       19.18 |        3.47 |     **37.65** |
|     100 |    10 |       36.92 |       11.99 |     **63.91** |
|   1 000 |   100 |       55.27 |       23.08 |     **93.35** |
|  10 000 | 1 000 |       73.68 |       34.54 |    **123.23** |
| 100 000 |10 000 |       92.10 |       46.05 |    **153.16** |

Backed by `'popularity scaling at fixed recency'` (6 cases).

### Real-world archetypes

A side-by-side ranking of representative GitHub repos. The order matches the test `'orders archetypes from least to most relevant'`, which asserts each row scores strictly higher than the one above it.

| Archetype                        | Stars  | Forks | Days since update | Stars score | Forks score | Recency score | **rankScore** |
| -------------------------------- | -----: | ----: | ----------------: | ----------: | ----------: | ------------: | ------------: |
| Hot new project                  |     50 |     5 |                 1 |       31.45 |        8.96 |         14.51 |     **54.92** |
| Niche, maintained                |    500 |    30 |                14 |       49.73 |       17.17 |          9.41 |     **76.31** |
| Active mainstream library        |  5 000 |   500 |                 7 |       68.14 |       31.08 |         11.88 |    **111.10** |
| Famous but stale                 | 80 000 | 8 000 |               730 |       90.32 |       44.94 |          0.00 |    **135.25** |
| Veteran, still active            | 80 000 | 8 000 |                 0 |       90.32 |       44.94 |         15.00 |    **150.25** |
| Mega-popular, weekly maintenance |200 000 |40 000 |                 7 |       97.65 |       52.98 |         11.88 |    **162.51** |

A few things this table makes concrete:

- A "famous but stale" repo (135.25) still outranks an "active mainstream library" (111.10) — popularity at this scale (~80k stars) outweighs even maximum recency.
- Refreshing the same famous repo (`Veteran, still active`) adds exactly `+15.00`, the recency cap.
- The tightest contest is between `Niche, maintained` (76.31) and a hypothetical fresh `Hot new project` with 50 stars (54.92): an underdog needs both stars and freshness to break into the mid-pack.

### When recency outranks popularity

The recency component contributes **at most 15 points** (when `days = 0`) and decays toward `0` over months. So recency can flip the ranking only when the popularity gap is smaller than that ~15-point freshness budget.

**Scenario 1 — Recent underdog beats stale leader** (recency wins)

| Repo            | Stars | Forks | Updated         | Stars score | Forks score | Recency score | **rankScore** |
| --------------- | ----: | ----: | --------------- | ----------: | ----------: | ------------: | ------------: |
| A (stale)       | 1000  | 100   | 365 days ago    |       55.27 |       23.08 |          0.00 |     **78.35** |
| B (fresh)       |  500  |  50   | today           |       49.73 |       19.66 |         15.00 |     **84.39** |

Repo B has half the stars and half the forks, yet wins by ~6 points because the full `+15` recency boost more than offsets the ~9-point popularity deficit. Backed by `'recency can outrank larger stars/forks within the freshness budget'`.

**Scenario 2 — Recency cannot overcome a 100x gap** (popularity wins)

| Repo            | Stars  | Forks | Updated         | Stars score | Forks score | Recency score | **rankScore** |
| --------------- | -----: | ----: | --------------- | ----------: | ----------: | ------------: | ------------: |
| A (stale)       | 10000  | 1000  | 365 days ago    |       73.68 |       34.54 |          0.00 |    **108.23** |
| B (fresh)       |   100  |   10  | today           |       36.92 |       11.99 |         15.00 |     **63.91** |

Here the popularity advantage is ~44 points — far above the 15-point freshness budget — so no amount of recency can flip the ranking. Backed by `'recency cannot overcome a ~100x popularity gap'`.

**Scenario 3 — Same repo, fresh vs. stale** (recency is the only differentiator)

| Repo            | Stars | Forks | Updated         | **rankScore** |
| --------------- | ----: | ----: | --------------- | ------------: |
| A (fresh)       | 500   | 50    | today           |     **84.39** |
| B (stale)       | 500   | 50    | 365 days ago    |     **69.39** |

The exact 15-point gap shows the maximum reward the recency term can deliver between two otherwise-identical repos. (Same as the recency-decay table at `days=0` vs `days=365`, but with stars=500/forks=50.)

### Edge cases (verified)

| Input                                            | Recency contribution | **rankScore** | Notes                                           |
| ------------------------------------------------ | -------------------: | ------------: | ----------------------------------------------- |
| `stars=0, forks=0, updatedAt=now`                |                15.00 |     **15.00** | Floor for any "fresh" repo.                     |
| `stars=0, forks=0, updatedAt=10 years ago`       |                 0.00 |      **0.00** | Floor for an empty, ancient repo.               |
| `stars=-100, forks=-50, updatedAt=now`           |                15.00 |     **15.00** | Negative inputs clamped to `0`.                 |
| `updatedAt` 30 days **in the future**            |                15.00 |     **15.00** | Future timestamps clamp to `0` days (max boost). |
| `updatedAt='not-a-date'`                         |                 0.00 |      **0.00** | Unparseable falls back to epoch → ancient.      |

Backed by the `'edge cases'` describe block (5 cases).

### Tuning notes

- The relative weights `8 / 5 / 15` set the trade-off between stars, forks, and freshness. To make stale-but-popular repos always win, lower the recency weight (`15`) or shrink the time constant denominator (`30`); to favor activity more aggressively, do the opposite.
- Because stars and forks are on a `log1p` scale, the popularity contribution grows slowly: going from 100 → 1 000 stars adds ~18 points, and 1 000 → 10 000 adds ~18 more. That's what keeps the 15-point recency budget meaningful even for large repos.
- The current parameters mean the recency boost is roughly equivalent to a **~6× multiplier on stars** for a small repo (e.g., 50 → 300 stars adds ~14.3 points), but only a **~10% multiplier** for a 10 000-star repo. Recency is mainly a tiebreaker once popularity is in the thousands.

## Configuration

- **Backend port:** `PORT` (defaults to `3000`). CORS allows the Angular dev origins `http://localhost:4200` and `http://127.0.0.1:4200`.
- **GitHub:** The server calls GitHub’s REST API without embedding tokens in this repo. Unauthenticated requests are subject to **GitHub rate limits**; for heavy use, configure authentication upstream as appropriate.

## GitHub search behavior (good to know)

- Match counts can be large, but the **Search API only returns the first 1,000 items** for a given query; deep “page” navigation in the UI will hit that wall before the theoretical last page.
- Errors such as **403** / **429** usually indicate rate limiting or access policy from GitHub.

## Useful scripts

| Location  | Command           | Purpose        |
| --------- | ----------------- | -------------- |
| `backend` | `npm run build`   | Production build |
| `backend` | `npm test`        | Unit tests     |
| `frontend`| `npm run build`   | Production build |
| `frontend`| `npm test`        | Unit tests     |

More detail lives in `backend/README.md` and `frontend/README.md` (CLI-generated notes).
