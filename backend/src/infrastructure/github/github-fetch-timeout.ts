const DEFAULT_GITHUB_FETCH_TIMEOUT_MS = 25_000;

export function resolveGithubFetchTimeoutMs(): number {
  const raw = process.env.GITHUB_FETCH_TIMEOUT_MS?.trim();
  if (raw !== undefined && raw !== '') {
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) {
      return Math.floor(n);
    }
  }
  return DEFAULT_GITHUB_FETCH_TIMEOUT_MS;
}

export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}
