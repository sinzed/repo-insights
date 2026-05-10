import { provideHttpClient, type HttpRequest } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';

import type { RepositoryItemDto } from '../git-repos.api';
import { RepositorySearchComponent } from './repository-search.component';

/** Access protected hooks/signals from tests without widening production visibility. */
function harness(c: RepositorySearchComponent): {
  search(): Promise<void>;
  goToNextPage(): Promise<void>;
  goToPreviousPage(): Promise<void>;
  onPerPageChange(value: number): Promise<void>;
  totalPages(): number;
  page(): number;
  totalCount(): number;
  items(): RepositoryItemDto[];
  error(): string | null;
  hasSearched(): boolean;
  perPage(): number;
} {
  return c as unknown as {
    search(): Promise<void>;
    goToNextPage(): Promise<void>;
    goToPreviousPage(): Promise<void>;
    onPerPageChange(value: number): Promise<void>;
    totalPages(): number;
    page(): number;
    totalCount(): number;
    items(): RepositoryItemDto[];
    error(): string | null;
    hasSearched(): boolean;
    perPage(): number;
  };
}

function expectGitReposGet(controller: HttpTestingController) {
  return controller.expectOne((req: HttpRequest<unknown>) => {
    const path = req.url.split('?')[0];
    return req.method === 'GET' && path === '/git-repos';
  });
}

describe('RepositorySearchComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [RepositorySearchComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  it('computes totalPages from totalCount and perPage', async () => {
    const fixture = TestBed.createComponent(RepositorySearchComponent);
    const cmp = harness(fixture.componentInstance);

    expect(cmp.totalPages()).toBe(1);

    const searchDone = cmp.search();
    expectGitReposGet(httpMock).flush({ totalCount: 100, items: [] });
    await searchDone;
    await fixture.whenStable();

    expect(cmp.totalCount()).toBe(100);
    expect(cmp.perPage()).toBe(30);
    expect(cmp.totalPages()).toBe(4);
  });

  it('resets totalCount to 0 on HTTP error (does not keep stale totals)', async () => {
    const fixture = TestBed.createComponent(RepositorySearchComponent);
    const cmp = harness(fixture.componentInstance);

    let done = cmp.search();
    expectGitReposGet(httpMock).flush({ totalCount: 99, items: [] });
    await done;
    await fixture.whenStable();

    expect(cmp.totalCount()).toBe(99);
    expect(cmp.hasSearched()).toBe(true);

    done = cmp.goToNextPage();
    expectGitReposGet(httpMock).flush(
      { message: 'failed' },
      { status: 500, statusText: 'Error' },
    );
    await done;
    await fixture.whenStable();

    expect(cmp.error()).toBe('failed');
    expect(cmp.totalCount()).toBe(0);
    expect(cmp.items()).toEqual([]);
  });

  it('goToNextPage requests the next page when within range', async () => {
    const fixture = TestBed.createComponent(RepositorySearchComponent);
    const cmp = harness(fixture.componentInstance);

    let done = cmp.search();
    expectGitReposGet(httpMock).flush({
      totalCount: 60,
      items: [],
    });
    await done;
    await fixture.whenStable();

    done = cmp.goToNextPage();
    const req = expectGitReposGet(httpMock);
    expect(req.request.params.get('page')).toBe('2');
    req.flush({ totalCount: 60, items: [] });
    await done;
    await fixture.whenStable();

    expect(cmp.page()).toBe(2);
  });

  it('goToPreviousPage decrements page and refetches', async () => {
    const fixture = TestBed.createComponent(RepositorySearchComponent);
    const cmp = harness(fixture.componentInstance);

    let done = cmp.search();
    expectGitReposGet(httpMock).flush({
      totalCount: 60,
      items: [],
    });
    await done;
    await fixture.whenStable();

    done = cmp.goToNextPage();
    expectGitReposGet(httpMock).flush({
      totalCount: 60,
      items: [],
    });
    await done;
    await fixture.whenStable();

    done = cmp.goToPreviousPage();
    const req = expectGitReposGet(httpMock);
    expect(req.request.params.get('page')).toBe('1');
    req.flush({ totalCount: 60, items: [] });
    await done;
    await fixture.whenStable();

    expect(cmp.page()).toBe(1);
  });

  it('onPerPageChange resets to page 1 and refetches when a search already ran', async () => {
    const fixture = TestBed.createComponent(RepositorySearchComponent);
    const cmp = harness(fixture.componentInstance);

    let done = cmp.search();
    expectGitReposGet(httpMock).flush({
      totalCount: 100,
      items: [],
    });
    await done;
    await fixture.whenStable();

    done = cmp.goToNextPage();
    expectGitReposGet(httpMock).flush({
      totalCount: 100,
      items: [],
    });
    await done;
    await fixture.whenStable();
    expect(cmp.page()).toBe(2);

    done = cmp.onPerPageChange(50);
    const req = expectGitReposGet(httpMock);
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('perPage')).toBe('50');
    req.flush({ totalCount: 100, items: [] });
    await done;
    await fixture.whenStable();

    expect(cmp.page()).toBe(1);
    expect(cmp.perPage()).toBe(50);
  });
});
