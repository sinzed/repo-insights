import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { githubRestRequestHeaders } from '../infrastructure/github/github-api-headers';
import { GithubApiRateLimiter } from '../infrastructure/github/github-api-rate-limiter';
import {
  isAbortError,
  resolveGithubFetchTimeoutMs,
} from '../infrastructure/github/github-fetch-timeout';
import type { GithubSearchGitReposRaw } from '../infrastructure/github/github-search-repository.raw';
import { GithubSearchGitReposMapper } from '../infrastructure/mappers/github-search-git-repos.mapper';
import {
  RepositoryItemDto,
  SearchGitReposResponseDto,
} from './dto/search-git-repos-response.dto';
import { isAllowedGithubSearchLanguage } from './github-search-language';
import { RepositoryScoringService } from './repository-scoring.service';

/** Wait between retries after any GitHub transport or response error. */
const GITHUB_ERROR_RETRY_DELAY_MS = 6_000;

/** Initial attempt plus retries after {@link GITHUB_ERROR_RETRY_DELAY_MS}. */
const GITHUB_SEARCH_MAX_ATTEMPTS = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@Injectable()
export class GitReposService {
  private readonly searchUrl = 'https://api.github.com/search/repositories';
  private readonly defaultPerPage = 30;

  constructor(
    private readonly githubSearchGitReposMapper: GithubSearchGitReposMapper,
    private readonly repositoryScoringService: RepositoryScoringService,
    private readonly githubApiRateLimiter: GithubApiRateLimiter,
  ) {}

  async searchGitRepos(
    language: string,
    changedAfter: string,
    page = 1,
    perPage = this.defaultPerPage,
  ): Promise<SearchGitReposResponseDto> {
    if (!isAllowedGithubSearchLanguage(language)) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message:
            'language must be one of the supported GitHub language values',
          error: 'Bad Request',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    const q = `language:${language} pushed:>${changedAfter}`;
    const url = new URL(this.searchUrl);
    url.searchParams.set('q', q);
    url.searchParams.set('sort', 'stars');
    url.searchParams.set('order', 'desc');
    url.searchParams.set('page', String(page));
    url.searchParams.set('per_page', String(perPage));

    const headers = githubRestRequestHeaders();

    let raw: GithubSearchGitReposRaw | undefined;
    let lastHttpStatus: number | undefined;
    let hadFetchFailure = false;
    let hadAbortTimeout = false;
    let hadInvalidJson = false;

    const fetchTimeoutMs = resolveGithubFetchTimeoutMs();

    for (let attempt = 0; attempt < GITHUB_SEARCH_MAX_ATTEMPTS; attempt++) {
      if (attempt > 0) {
        await sleep(GITHUB_ERROR_RETRY_DELAY_MS);
      }

      try {
        const response = await this.githubApiRateLimiter.schedule(() =>
          fetch(url, {
            headers,
            signal: AbortSignal.timeout(fetchTimeoutMs),
          }),
        );

        if (!response.ok) {
          lastHttpStatus = response.status;
          continue;
        }

        try {
          raw = (await response.json()) as GithubSearchGitReposRaw;
          break;
        } catch {
          hadInvalidJson = true;
          lastHttpStatus = undefined;
          continue;
        }
      } catch (error: unknown) {
        hadFetchFailure = true;
        lastHttpStatus = undefined;
        if (isAbortError(error)) {
          hadAbortTimeout = true;
        }
        continue;
      }
    }

    if (raw === undefined) {
      if (lastHttpStatus !== undefined) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_GATEWAY,
            message: this.messageForGithubFailure(lastHttpStatus),
            error: 'Bad Gateway',
            code: 'GITHUB_UPSTREAM_ERROR',
          },
          HttpStatus.BAD_GATEWAY,
        );
      }
      if (hadInvalidJson) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_GATEWAY,
            message: 'Received an invalid response from GitHub.',
            error: 'Bad Gateway',
            code: 'GITHUB_INVALID_PAYLOAD',
          },
          HttpStatus.BAD_GATEWAY,
        );
      }
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_GATEWAY,
          message: hadFetchFailure
            ? hadAbortTimeout
              ? 'GitHub did not respond in time after retries.'
              : 'Could not reach GitHub after retries.'
            : 'GitHub search failed after retries.',
          error: 'Bad Gateway',
          code: 'GITHUB_UPSTREAM_ERROR',
        },
        HttpStatus.BAD_GATEWAY,
      );
    }
    const mapped = this.githubSearchGitReposMapper.mapGithubSearchResponse(raw);

    const dto = new SearchGitReposResponseDto();
    dto.totalCount = mapped.totalCount;
    dto.items = mapped.items.map(
      (item): RepositoryItemDto => ({
        ...item,
        rankScore: this.repositoryScoringService.computeRankScore(item),
      }),
    );
    dto.items.sort((a, b) => b.rankScore - a.rankScore);

    return dto;
  }

  private messageForGithubFailure(status: number): string {
    if (status === 401 || status === 403) {
      return 'GitHub declined the request (authentication, rate limit, or access).';
    }
    if (status === 422) {
      return 'GitHub could not run this search. Check the language and date filters.';
    }
    if (status === 429) {
      return 'GitHub rate limit exceeded. Try again in a few minutes.';
    }
    return `GitHub search failed (HTTP ${status}).`;
  }
}
