import { HttpException, Injectable } from '@nestjs/common';

export interface GitHubSearchRepositoriesResponse {
  total_count: number;
  incomplete_results: boolean;
  items: unknown[];
}

@Injectable()
export class RepositoriesService {
  private readonly searchUrl = 'https://api.github.com/search/repositories';

  async searchRepositories(
    language: string,
    createdAfter: string,
  ): Promise<GitHubSearchRepositoriesResponse> {
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

    return response.json() as Promise<GitHubSearchRepositoriesResponse>;
  }
}
