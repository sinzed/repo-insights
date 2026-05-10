import { HttpException, HttpStatus } from '@nestjs/common';
import type { GithubSearchGitReposRaw } from '../infrastructure/github/github-search-repository.raw';
import { GithubApiRateLimiter } from '../infrastructure/github/github-api-rate-limiter';
import { GithubSearchGitReposMapper } from '../infrastructure/mappers/github-search-git-repos.mapper';
import { GitReposService } from './git-repos.service';
import { RepositoryScoringService } from './repository-scoring.service';

/** Matches {@link GitReposService} retry backoff. */
const GITHUB_ERROR_RETRY_DELAY_MS = 6_000;

function fetchArgToUrlString(arg: Parameters<typeof fetch>[0]): string {
  if (typeof arg === 'string') return arg;
  if (arg instanceof URL) return arg.href;
  return arg.url;
}

function githubSuccessPayload(): GithubSearchGitReposRaw {
  return {
    total_count: 2,
    incomplete_results: false,
    items: [
      {
        id: 1,
        name: 'older-stars',
        full_name: 'o/older-stars',
        html_url: 'https://github.com/o/older-stars',
        description: null,
        stargazers_count: 500,
        forks_count: 50,
        language: 'TypeScript',
        created_at: '2019-01-01T00:00:00Z',
        updated_at: '2026-05-01T00:00:00Z',
      },
      {
        id: 2,
        name: 'newer-stars',
        full_name: 'o/newer-stars',
        html_url: 'https://github.com/o/newer-stars',
        description: 'x',
        stargazers_count: 50,
        forks_count: 5,
        language: 'TypeScript',
        created_at: '2020-01-01T00:00:00Z',
        updated_at: '2026-05-01T00:00:00Z',
      },
    ],
  };
}

describe('GitReposService', () => {
  let service: GitReposService;
  let fetchSpy: jest.SpiedFunction<typeof fetch>;

  beforeEach(() => {
    fetchSpy = jest.spyOn(global, 'fetch');
    service = new GitReposService(
      new GithubSearchGitReposMapper(),
      new RepositoryScoringService(),
      new GithubApiRateLimiter(),
    );
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    jest.useRealTimers();
  });

  it('rejects disallowed language before calling GitHub', async () => {
    try {
      await service.searchGitRepos('zig', '2026-05-01');
      throw new Error('expected HttpException');
    } catch (e) {
      expect(e).toBeInstanceOf(HttpException);
      expect((e as HttpException).getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect((e as HttpException).getResponse()).toEqual(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          message:
            'language must be one of the supported GitHub language values',
        }),
      );
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('requests GitHub search with expected query parameters', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(githubSuccessPayload()),
    } as Response);

    await service.searchGitRepos('typescript', '2026-01-01', 2, 25);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const url = fetchArgToUrlString(fetchSpy.mock.calls[0][0]);
    expect(url).toContain('https://api.github.com/search/repositories');
    const q = new URL(url).searchParams.get('q');
    expect(q).toBe('language:typescript pushed:>2026-01-01');
    expect(url).toContain('page=2');
    expect(url).toContain('per_page=25');
    expect(url).toContain('sort=stars');
    expect(url).toContain('order=desc');
  });

  it('maps JSON, assigns rankScore, and sorts items by rankScore descending', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(githubSuccessPayload()),
    } as Response);

    const result = await service.searchGitRepos('typescript', '2026-05-01');

    expect(result.totalCount).toBe(2);
    expect(result.items.map((i) => i.id)).toEqual([1, 2]);
    expect(result.items[0].rankScore).toBeGreaterThanOrEqual(
      result.items[1].rankScore,
    );
    expect(result.items.every((i) => typeof i.rankScore === 'number')).toBe(
      true,
    );
  });

  it('retries once after HTTP error then returns successful payload', async () => {
    jest.useFakeTimers();

    fetchSpy
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(githubSuccessPayload()),
      } as Response);

    const pending = service.searchGitRepos('typescript', '2026-05-01');
    await jest.advanceTimersByTimeAsync(GITHUB_ERROR_RETRY_DELAY_MS);
    const result = await pending;

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(result.items).toHaveLength(2);

    jest.useRealTimers();
  });

  it('throws BAD_GATEWAY with GITHUB_UPSTREAM_ERROR after repeated HTTP failures', async () => {
    jest.useFakeTimers();

    fetchSpy.mockResolvedValue({
      ok: false,
      status: 403,
    } as Response);

    const settled = service.searchGitRepos('typescript', '2026-05-01').then(
      () => {
        throw new Error('expected HttpException');
      },
      (e: unknown) => {
        expect(e).toBeInstanceOf(HttpException);
        expect((e as HttpException).getResponse()).toEqual(
          expect.objectContaining({
            statusCode: HttpStatus.BAD_GATEWAY,
            code: 'GITHUB_UPSTREAM_ERROR',
            message:
              'GitHub declined the request (authentication, rate limit, or access).',
          }),
        );
      },
    );

    await jest.advanceTimersByTimeAsync(GITHUB_ERROR_RETRY_DELAY_MS * 2);
    await settled;

    expect(fetchSpy).toHaveBeenCalledTimes(3);

    jest.useRealTimers();
  });

  it('throws BAD_GATEWAY with GITHUB_INVALID_PAYLOAD when JSON body is invalid', async () => {
    jest.useFakeTimers();

    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.reject(new SyntaxError('invalid json')),
    } as Response);

    const settled = service.searchGitRepos('typescript', '2026-05-01').then(
      () => {
        throw new Error('expected HttpException');
      },
      (e: unknown) => {
        expect(e).toBeInstanceOf(HttpException);
        expect((e as HttpException).getResponse()).toEqual(
          expect.objectContaining({
            statusCode: HttpStatus.BAD_GATEWAY,
            code: 'GITHUB_INVALID_PAYLOAD',
          }),
        );
      },
    );

    await jest.advanceTimersByTimeAsync(GITHUB_ERROR_RETRY_DELAY_MS * 2);
    await settled;

    jest.useRealTimers();
  });

  it('throws BAD_GATEWAY when fetch fails after retries', async () => {
    jest.useFakeTimers();

    fetchSpy.mockRejectedValue(new Error('network down'));

    const settled = service.searchGitRepos('typescript', '2026-05-01').then(
      () => {
        throw new Error('expected HttpException');
      },
      (e: unknown) => {
        expect(e).toBeInstanceOf(HttpException);
        expect((e as HttpException).getResponse()).toEqual(
          expect.objectContaining({
            statusCode: HttpStatus.BAD_GATEWAY,
            code: 'GITHUB_UPSTREAM_ERROR',
            message: 'Could not reach GitHub after retries.',
          }),
        );
      },
    );

    await jest.advanceTimersByTimeAsync(GITHUB_ERROR_RETRY_DELAY_MS * 2);
    await settled;

    jest.useRealTimers();
  });

  it('classifies AbortError as timeout messaging after retries', async () => {
    jest.useFakeTimers();

    const abort = new Error('Aborted');
    abort.name = 'AbortError';
    fetchSpy.mockRejectedValue(abort);

    const settled = service.searchGitRepos('typescript', '2026-05-01').then(
      () => {
        throw new Error('expected HttpException');
      },
      (e: unknown) => {
        expect(e).toBeInstanceOf(HttpException);
        expect((e as HttpException).getResponse()).toEqual(
          expect.objectContaining({
            statusCode: HttpStatus.BAD_GATEWAY,
            code: 'GITHUB_UPSTREAM_ERROR',
            message: 'GitHub did not respond in time after retries.',
          }),
        );
      },
    );

    await jest.advanceTimersByTimeAsync(GITHUB_ERROR_RETRY_DELAY_MS * 2);
    await settled;

    jest.useRealTimers();
  });
});
