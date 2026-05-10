import { Injectable } from '@nestjs/common';
import type {
  GithubSearchGitReposRaw,
  GithubSearchRepositoryItemRaw,
} from '../github/github-search-repository.raw';
import type {
  GithubSearchMappedResponse,
  RepositoryItemGithubMapped,
} from '../../git-repos/dto/search-git-repos-response.dto';

@Injectable()
export class GithubSearchGitReposMapper {
  mapGithubSearchResponse(
    raw: GithubSearchGitReposRaw,
  ): GithubSearchMappedResponse {
    return {
      totalCount: raw.total_count,
      items: raw.items.map((item) => this.toRepositoryItemGithubMapped(item)),
    };
  }

  private toRepositoryItemGithubMapped(
    item: GithubSearchRepositoryItemRaw,
  ): RepositoryItemGithubMapped {
    return {
      id: item.id,
      name: item.name,
      fullName: item.full_name,
      htmlUrl: item.html_url,
      description: item.description,
      stargazersCount: item.stargazers_count,
      forksCount: item.forks_count,
      language: item.language,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    };
  }
}
