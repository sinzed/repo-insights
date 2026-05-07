import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import type { GithubSearchRepositoriesRaw } from '../infrastructure/github/github-search-repository.raw';
import { GithubSearchRepositoriesMapper } from '../infrastructure/mappers/github-search-repositories.mapper';
import { SearchRepositoriesResponseDto } from './dto/search-repositories-response.dto';
import { RepositoryScoringService } from './repository-scoring.service';

@Injectable()
export class RepositoriesService {
  private readonly searchUrl = 'https://api.github.com/search/repositories';
  private readonly defaultPerPage = 30;

  constructor(
    private readonly githubSearchRepositoriesMapper: GithubSearchRepositoriesMapper,
    private readonly repositoryScoringService: RepositoryScoringService,
  ) {}

  async searchRepositories(
    language: string,
    changedAfter: string,
    page = 1,
    perPage = this.defaultPerPage,
  ): Promise<SearchRepositoriesResponseDto> {
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

    let raw: GithubSearchRepositoriesRaw;
    try {
      raw = (await response.json()) as GithubSearchRepositoriesRaw;
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
      this.githubSearchRepositoriesMapper.toSearchRepositoriesResponseDto(raw);

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
