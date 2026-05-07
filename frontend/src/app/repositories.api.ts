import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

export interface RepositoryItemDto {
  id: number;
  name: string;
  fullName: string;
  htmlUrl: string;
  description: string | null;
  stargazersCount: number;
  forksCount: number;
  language: string | null;
  createdAt: string;
  updatedAt: string;
  rankScore: number;
}

export interface SearchRepositoriesResponseDto {
  totalCount: number;
  items: RepositoryItemDto[];
}

@Injectable({ providedIn: 'root' })
export class RepositoriesApi {
  private readonly http = inject(HttpClient);

  searchRepositories(
    language: string,
    changedAfter: string,
    page = 1,
    perPage = 30,
  ) {
    const params = new HttpParams()
      .set('language', language)
      .set('changedAfter', changedAfter)
      .set('page', String(page))
      .set('perPage', String(perPage));

    // Uses Angular dev proxy (see `proxy.conf.json`)
    return this.http.get<SearchRepositoriesResponseDto>('/repositories', {
      params,
    });
  }
}

