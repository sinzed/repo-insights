import { HttpException, Injectable } from '@nestjs/common';
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
      const body = await response.text();
      throw new HttpException(
        `GitHub API error ${response.status}: ${body}`,
        response.status,
      );
    }

    const raw = (await response.json()) as GithubSearchRepositoriesRaw;
    const dto =
      this.githubSearchRepositoriesMapper.toSearchRepositoriesResponseDto(raw);

    for (const item of dto.items) {
      item.rankScore = this.repositoryScoringService.computeRankScore(item);
    }
    dto.items.sort((a, b) => b.rankScore - a.rankScore);

    return dto;
  }
}
