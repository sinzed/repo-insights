import { Injectable } from '@nestjs/common';
import type {
  GithubSearchRepositoriesRaw,
  GithubSearchRepositoryItemRaw,
} from '../github/github-search-repository.raw';
import {
  RepositoryItemDto,
  SearchRepositoriesResponseDto,
} from '../../repositories/dto/search-repositories-response.dto';

@Injectable()
export class GithubSearchRepositoriesMapper {
  toSearchRepositoriesResponseDto(
    raw: GithubSearchRepositoriesRaw,
  ): SearchRepositoriesResponseDto {
    const dto = new SearchRepositoriesResponseDto();
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
