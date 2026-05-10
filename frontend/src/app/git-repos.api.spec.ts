import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';

import {
  getHttpApiErrorMessage,
  GitReposApi,
  type SearchGitReposResponseDto,
} from './git-repos.api';

describe('getHttpApiErrorMessage', () => {
  it('joins validation message arrays from JSON bodies', () => {
    const err = new HttpErrorResponse({
      error: { message: ['language', 'is invalid'] },
      status: 400,
      statusText: 'Bad Request',
    });
    expect(getHttpApiErrorMessage(err)).toBe('language is invalid');
  });

  it('uses string message property when present', () => {
    const err = new HttpErrorResponse({
      error: { message: 'Something went wrong' },
      status: 502,
      statusText: 'Bad Gateway',
    });
    expect(getHttpApiErrorMessage(err)).toBe('Something went wrong');
  });

  it('uses string body when error is a plain string', () => {
    const err = new HttpErrorResponse({
      error: 'plain text body',
      status: 500,
      statusText: 'Error',
    });
    expect(getHttpApiErrorMessage(err)).toBe('plain text body');
  });

  it('maps status 0 to a connectivity hint', () => {
    const err = new HttpErrorResponse({
      error: null,
      status: 0,
      statusText: 'Unknown Error',
    });
    expect(getHttpApiErrorMessage(err)).toContain('Unable to reach the server');
  });

  it('falls back to status code when body has no message', () => {
    const err = new HttpErrorResponse({
      error: {},
      status: 418,
      statusText: "I'm a teapot",
    });
    expect(getHttpApiErrorMessage(err)).toBe('Request failed (418).');
  });

  it('passes through Error instances', () => {
    expect(getHttpApiErrorMessage(new Error('oops'))).toBe('oops');
  });

  it('stringifies unknown values', () => {
    expect(getHttpApiErrorMessage(42)).toBe('42');
  });
});

describe('GitReposApi', () => {
  let api: GitReposApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        GitReposApi,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    api = TestBed.inject(GitReposApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('GET /git-repos with expected query params', () => {
    const payload: SearchGitReposResponseDto = {
      totalCount: 3,
      items: [],
    };

    api.searchGitRepos('typescript', '2026-05-01', 2, 50).subscribe((res) => {
      expect(res).toEqual(payload);
    });

    const req = httpMock.expectOne(
      (r) =>
        r.url === '/git-repos' &&
        r.params.get('language') === 'typescript' &&
        r.params.get('changedAfter') === '2026-05-01' &&
        r.params.get('page') === '2' &&
        r.params.get('perPage') === '50',
    );
    expect(req.request.method).toBe('GET');
    req.flush(payload);
  });
});
