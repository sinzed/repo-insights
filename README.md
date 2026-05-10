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

- `stargazersCount` and `forksCount` are clamped to `>= 0`; missing values are treated as `0`.
- `daysSinceUpdate` is derived from `updatedAt`. Unparseable or future dates are treated as `0` days (i.e., maximum recency boost).
- The log scale (`log1p`) keeps the score bounded for very popular repos: doubling stars adds a constant amount rather than doubling the contribution.

### Quick examples

| Stars | Forks | Days since update | rankScore |
| ----: | ----: | ----------------: | --------: |
|     0 |     0 |                 0 |     15.00 |
|   100 |    20 |                 7 |     64.02 |
| 10000 |  2000 |                30 |    117.21 |
| 50000 | 10000 |               365 |    132.61 |

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
