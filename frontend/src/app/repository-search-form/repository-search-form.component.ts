import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { GITHUB_SEARCH_LANGUAGES_SORTED } from '../github-search-language';

@Component({
  selector: 'app-repository-search-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './repository-search-form.component.html',
  styleUrl: './repository-search-form.component.scss',
})
export class RepositorySearchFormComponent {
  readonly languageOptions = GITHUB_SEARCH_LANGUAGES_SORTED;

  readonly language = input.required<string>();
  readonly changedAfter = input.required<string>();
  readonly isLoading = input(false);
  readonly languageError = input<string | null>(null);
  readonly changedAfterError = input<string | null>(null);

  readonly languageChange = output<string>();
  readonly changedAfterChange = output<string>();
  readonly search = output<void>();

  onSubmit(): void {
    if (this.isLoading()) {
      return;
    }
    this.search.emit();
  }
}
