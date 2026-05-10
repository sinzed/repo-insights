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

Each repository in the response includes a `rankScore` computed server-side by `RepositoryScoringService` (`backend/src/git-repos/repository-scoring.service.ts`). It blends stars, forks, and how recently the repo was updated so fresher projects can rank above stale-but-popular ones. **Higher `rankScore` is better.**

**Read more:** [full formula, tables, scenarios, edge cases, and tuning notes](docs/rank-score.md).

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
