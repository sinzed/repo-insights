import { HttpException, Injectable } from '@nestjs/common';
import type { GithubSearchRepositoriesRaw } from '../infrastructure/github/github-search-repository.raw';
import { GithubSearchRepositoriesMapper } from '../infrastructure/mappers/github-search-repositories.mapper';
import { SearchRepositoriesResponseDto } from './dto/search-repositories-response.dto';

@Injectable()
export class RepositoriesService {
  private readonly searchUrl = 'https://api.github.com/search/repositories';

  constructor(
    private readonly githubSearchRepositoriesMapper: GithubSearchRepositoriesMapper,
  ) {}

  async searchRepositories(
    language: string,
    createdAfter: string,
  ): Promise<SearchRepositoriesResponseDto> {
    const q = `language:${language} created:>${createdAfter}`;
    const url = new URL(this.searchUrl);
    url.searchParams.set('q', q);
    url.searchParams.set('sort', 'stars');
    url.searchParams.set('order', 'desc');

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
    return this.githubSearchRepositoriesMapper.toSearchRepositoriesResponseDto(
      raw,
    );
  }
}
