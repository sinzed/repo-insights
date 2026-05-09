# Repo Insights — Backend

NestJS HTTP API for searching Git repositories via the [GitHub Search API](https://docs.github.com/en/rest/search/search?apiVersion=2022-11-28#search-repositories). Results are filtered by language and recent push activity, then **re-ranked** using stars, forks, and recency.

## Requirements

- Node.js (compatible with the versions supported by NestJS 11 in this repo)
- npm

## Install

```bash
npm install
```

## Run

```bash
# development (watch)
npm run start:dev

# production build + run
npm run build
npm run start:prod
```

The server listens on **`PORT`** if set, otherwise **3000**.

## API overview

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/git-repos` | Search repositories (GitHub-backed) |

Interactive docs: **`GET /swagger`** (Swagger UI).

### `GET /git-repos`

Queries GitHub with `language:<language> pushed:><changedAfter>`, sorted by stars on GitHub’s side, then the backend assigns each item a **`rankScore`** and returns items sorted by that score (descending).

**Query parameters**

| Parameter | Required | Description |
|-----------|----------|-------------|
| `language` | Yes | GitHub language qualifier (e.g. `typescript`, `javascript`). |
| `changedAfter` | Yes | Calendar date **YYYY-MM-DD**; only repos with push activity after this date. Must be a valid calendar date. |
| `page` | No | Page number (integer ≥ 1). Default: `1`. |
| `perPage` | No | Page size (integer 1–100). Default: `30`. |

**Example**

```bash
curl -s "http://localhost:3000/git-repos?language=typescript&changedAfter=2026-01-01&page=1&perPage=10"
```

**Response shape**

- `totalCount` — total matches reported by GitHub for the search.
- `items[]` — array of repositories with fields such as `id`, `name`, `fullName`, `htmlUrl`, `description`, `stargazersCount`, `forksCount`, `language`, `createdAt`, `updatedAt`, and **`rankScore`**.

Invalid or missing query parameters yield **400** with validation messages.

Upstream GitHub failures (rate limit, bad query, invalid JSON, etc.) are surfaced as **502 Bad Gateway** with a structured body (`code` values such as `GITHUB_UPSTREAM_ERROR`, `GITHUB_INVALID_PAYLOAD`).

## Ranking (`rankScore`)

Each item gets a server-side score (higher is better), roughly:

- Stars: `log1p(stars) × 8`
- Forks: `log1p(forks) × 5`
- Recency from `updatedAt`: `exp(-daysSinceUpdate / 30) × 15`

The sum is rounded to two decimal places. Items in the response are ordered by **`rankScore`** descending.

## CORS

Allowed origins (see `src/main.ts`): `http://localhost:4200` and `http://127.0.0.1:4200` (typical local Angular dev server).

## GitHub usage

Requests use the public Search API with `Accept: application/vnd.github+json` and a fixed `User-Agent`. **Unauthenticated** calls are subject to GitHub’s lower rate limits; for heavier use, extend the service to send an authorization header (for example from an environment variable).

## Tests

```bash
npm run test          # unit tests
npm run test:e2e      # e2e tests
npm run test:cov      # coverage
```

## Project layout (high level)

- `src/git-repos/` — controller, DTOs, GitHub search orchestration, ranking
- `src/infrastructure/` — GitHub response types and mapping to API DTOs

Built with [NestJS](https://nestjs.com/).
