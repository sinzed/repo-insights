import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from '@angular/common/http';
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

export interface SearchGitReposResponseDto {
  totalCount: number;
  items: RepositoryItemDto[];
}

/**
 * Maps failed HTTP responses from the API (e.g. Nest HttpException JSON) to UI text.
 * Angular surfaces failures as HttpErrorResponse, not Error.
 */
export function getHttpApiErrorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    const body = err.error as unknown;
    if (body && typeof body === 'object') {
      const message = (body as { message?: unknown }).message;
      if (Array.isArray(message)) {
        return message.map(String).join(' ');
      }
      if (typeof message === 'string' && message.trim()) {
        return message;
      }
    }
    if (typeof body === 'string' && body.trim()) {
      return body;
    }
    if (err.status === 0) {
      return 'Unable to reach the server. Check that the API is running.';
    }
    return `Request failed (${err.status}).`;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return String(err);
}

@Injectable({ providedIn: 'root' })
export class GitReposApi {
  private readonly http = inject(HttpClient);

  searchGitRepos(
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
    return this.http.get<SearchGitReposResponseDto>('/git-repos', {
      params,
    });
  }
}
