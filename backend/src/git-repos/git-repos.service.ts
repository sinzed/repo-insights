import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import type { GithubSearchGitReposRaw } from '../infrastructure/github/github-search-repository.raw';
import { GithubSearchGitReposMapper } from '../infrastructure/mappers/github-search-git-repos.mapper';
import { SearchGitReposResponseDto } from './dto/search-git-repos-response.dto';
import { isAllowedGithubSearchLanguage } from './github-search-language';
import { RepositoryScoringService } from './repository-scoring.service';

@Injectable()
export class GitReposService {
  private readonly searchUrl = 'https://api.github.com/search/repositories';
  private readonly defaultPerPage = 30;

  constructor(
    private readonly githubSearchGitReposMapper: GithubSearchGitReposMapper,
    private readonly repositoryScoringService: RepositoryScoringService,
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
          message: 'language must be one of the supported GitHub language values',
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

    const response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'repo-insights-backend',
      },
    });

    if (!response.ok) {
      const message = this.messageForGithubFailure(response.status);
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_GATEWAY,
          message,
          error: 'Bad Gateway',
          code: 'GITHUB_UPSTREAM_ERROR',
        },
        HttpStatus.BAD_GATEWAY,
      );
    }

    let raw: GithubSearchGitReposRaw;
    try {
      raw = (await response.json()) as GithubSearchGitReposRaw;
    } catch {
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
    const dto =
      this.githubSearchGitReposMapper.toSearchGitReposResponseDto(raw);

    for (const item of dto.items) {
      item.rankScore = this.repositoryScoringService.computeRankScore(item);
    }
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
