import {
  isAbortError,
  resolveGithubFetchTimeoutMs,
} from './github-fetch-timeout';

describe('resolveGithubFetchTimeoutMs', () => {
  afterEach(() => {
    delete process.env.GITHUB_FETCH_TIMEOUT_MS;
  });

  it('defaults when unset', () => {
    expect(resolveGithubFetchTimeoutMs()).toBe(25_000);
  });

  it('parses GITHUB_FETCH_TIMEOUT_MS', () => {
    process.env.GITHUB_FETCH_TIMEOUT_MS = '12000';
    expect(resolveGithubFetchTimeoutMs()).toBe(12_000);
  });

  it('ignores invalid env values', () => {
    process.env.GITHUB_FETCH_TIMEOUT_MS = 'not-a-number';
    expect(resolveGithubFetchTimeoutMs()).toBe(25_000);
  });

  it('ignores non-positive values', () => {
    process.env.GITHUB_FETCH_TIMEOUT_MS = '0';
    expect(resolveGithubFetchTimeoutMs()).toBe(25_000);
  });
});

describe('isAbortError', () => {
  it('returns true for AbortError', () => {
    const err = new Error('Aborted');
    err.name = 'AbortError';
    expect(isAbortError(err)).toBe(true);
  });

  it('returns false for other errors', () => {
    expect(isAbortError(new Error('boom'))).toBe(false);
  });
});
