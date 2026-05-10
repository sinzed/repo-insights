import { Component, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import type { RepositoryItemDto } from '../git-repos.api';
import { getHttpApiErrorMessage, GitReposApi } from '../git-repos.api';
import { RepositoryListComponent } from '../repository-list/repository-list.component';
import { RepositoryPagerComponent } from '../repository-pager/repository-pager.component';
import { RepositorySearchFormComponent } from '../repository-search-form/repository-search-form.component';
import { RepositorySearchStatusComponent } from '../repository-search-status/repository-search-status.component';

@Component({
  selector: 'app-repository-search',
  imports: [
    RepositorySearchFormComponent,
    RepositorySearchStatusComponent,
    RepositoryPagerComponent,
    RepositoryListComponent,
  ],
  templateUrl: './repository-search.component.html',
  styleUrl: './repository-search.component.scss',
})
export class RepositorySearchComponent {
  private readonly gitReposApi = inject(GitReposApi);

  /** Must match backend max per page (100). */
  protected readonly pageSizeOptions = [10, 20, 30, 50, 100] as const;

  protected readonly language = signal('typescript');
  protected readonly changedAfter = signal('2026-05-01');

  protected readonly page = signal(1);
  protected readonly perPage = signal(30);

  protected readonly isLoading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly items = signal<RepositoryItemDto[]>([]);
  protected readonly totalCount = signal(0);
  protected readonly hasSearched = signal(false);

  protected readonly totalPages = computed(() => {
    const total = this.totalCount();
    const size = this.perPage();
    if (total <= 0) return 1;
    return Math.max(1, Math.ceil(total / size));
  });

  protected readonly hasError = computed(() => this.error() != null);

  protected async search() {
    this.page.set(1);
    await this.fetchPage();
  }

  protected async goToPreviousPage() {
    const next = this.page() - 1;
    if (next < 1) return;
    this.page.set(next);
    await this.fetchPage();
  }

  protected async goToNextPage() {
    const next = this.page() + 1;
    if (next > this.totalPages()) return;
    this.page.set(next);
    await this.fetchPage();
  }

  protected async onPerPageChange(value: number) {
    if (value === this.perPage()) return;
    this.perPage.set(value);
    this.page.set(1);
    if (!this.hasSearched()) return;
    await this.fetchPage();
  }

  private async fetchPage() {
    const language = this.language().trim();
    const changedAfter = this.changedAfter().trim();

    this.error.set(null);
    this.isLoading.set(true);

    try {
      const response = await firstValueFrom(
        this.gitReposApi.searchGitRepos(
          language,
          changedAfter,
          this.page(),
          this.perPage(),
        ),
      );
      this.items.set(response.items ?? []);
      this.totalCount.set(response.totalCount ?? 0);
      this.hasSearched.set(true);
    } catch (e) {
      this.items.set([]);
      this.totalCount.set(0);
      this.page.update((p) => Math.min(p, this.totalPages()));
      this.error.set(getHttpApiErrorMessage(e));
    } finally {
      this.isLoading.set(false);
    }
  }
}
