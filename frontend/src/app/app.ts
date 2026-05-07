import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  RepositoriesApi,
  type RepositoryItemDto,
} from './repositories.api';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly repositoriesApi = inject(RepositoriesApi);

  protected readonly language = signal('typescript');
  protected readonly changedAfter = signal('2024-01-01');

  protected readonly isLoading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly items = signal<RepositoryItemDto[]>([]);

  protected async search() {
    const language = this.language().trim();
    const changedAfter = this.changedAfter().trim();

    this.error.set(null);
    this.isLoading.set(true);
    this.items.set([]);

    try {
      const response = await firstValueFrom(
        this.repositoriesApi.searchRepositories(language, changedAfter),
      );
      this.items.set(response.items ?? []);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : String(e));
    } finally {
      this.isLoading.set(false);
    }
  }
}
