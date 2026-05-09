import { Injectable } from '@nestjs/common';
import type {
  GithubSearchGitReposRaw,
  GithubSearchRepositoryItemRaw,
} from '../github/github-search-repository.raw';
import {
  RepositoryItemDto,
  SearchGitReposResponseDto,
} from '../../git-repos/dto/search-git-repos-response.dto';

@Injectable()
export class GithubSearchGitReposMapper {
  toSearchGitReposResponseDto(
    raw: GithubSearchGitReposRaw,
  ): SearchGitReposResponseDto {
    const dto = new SearchGitReposResponseDto();
    dto.totalCount = raw.total_count;
    dto.items = raw.items.map((item) => this.toRepositoryItemDto(item));
    return dto;
  }

  private toRepositoryItemDto(
    item: GithubSearchRepositoryItemRaw,
  ): RepositoryItemDto {
    const dto = new RepositoryItemDto();
    dto.id = item.id;
    dto.name = item.name;
    dto.fullName = item.full_name;
    dto.htmlUrl = item.html_url;
    dto.description = item.description;
    dto.stargazersCount = item.stargazers_count;
    dto.forksCount = item.forks_count;
    dto.language = item.language;
    dto.createdAt = item.created_at;
    dto.updatedAt = item.updated_at;
    return dto;
  }
}
