import { GithubSearchGitReposMapper } from './github-search-git-repos.mapper';
import type { GithubSearchGitReposRaw } from '../github/github-search-repository.raw';

describe('GithubSearchGitReposMapper', () => {
  let mapper: GithubSearchGitReposMapper;

  beforeEach(() => {
    mapper = new GithubSearchGitReposMapper();
  });

  it('maps GitHub fields onto DTO field names', () => {
    const raw: GithubSearchGitReposRaw = {
      total_count: 42,
      incomplete_results: false,
      items: [
        {
          id: 99,
          name: 'demo',
          full_name: 'acme/demo',
          html_url: 'https://github.com/acme/demo',
          description: 'Hello',
          stargazers_count: 10,
          forks_count: 2,
          language: 'Rust',
          created_at: '2020-06-01T00:00:00Z',
          updated_at: '2026-05-01T12:00:00Z',
        },
      ],
    };

    const mapped = mapper.mapGithubSearchResponse(raw);

    expect(mapped.totalCount).toBe(42);
    expect(mapped.items).toHaveLength(1);
    expect(mapped.items[0]).toEqual({
      id: 99,
      name: 'demo',
      fullName: 'acme/demo',
      htmlUrl: 'https://github.com/acme/demo',
      description: 'Hello',
      stargazersCount: 10,
      forksCount: 2,
      language: 'Rust',
      createdAt: '2020-06-01T00:00:00Z',
      updatedAt: '2026-05-01T12:00:00Z',
    });
  });

  it('preserves nullable description and language', () => {
    const raw: GithubSearchGitReposRaw = {
      total_count: 0,
      incomplete_results: false,
      items: [
        {
          id: 1,
          name: 'x',
          full_name: 'o/x',
          html_url: 'https://github.com/o/x',
          description: null,
          stargazers_count: 0,
          forks_count: 0,
          language: null,
          created_at: '2020-01-01T00:00:00Z',
          updated_at: '2020-01-02T00:00:00Z',
        },
      ],
    };

    const mapped = mapper.mapGithubSearchResponse(raw);

    expect(mapped.items[0].description).toBeNull();
    expect(mapped.items[0].language).toBeNull();
  });

  it('maps an empty items array', () => {
    const raw: GithubSearchGitReposRaw = {
      total_count: 0,
      incomplete_results: false,
      items: [],
    };

    expect(mapper.mapGithubSearchResponse(raw)).toEqual({
      totalCount: 0,
      items: [],
    });
  });

  it('throws when items is missing (runtime-malformed payload)', () => {
    const raw = {
      total_count: 0,
      incomplete_results: false,
    } as GithubSearchGitReposRaw;

    expect(() => mapper.mapGithubSearchResponse(raw)).toThrow();
  });
});
