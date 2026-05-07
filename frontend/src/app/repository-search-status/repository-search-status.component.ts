import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-repository-search-status',
  imports: [CommonModule],
  templateUrl: './repository-search-status.component.html',
  styleUrl: './repository-search-status.component.scss',
})
export class RepositorySearchStatusComponent {
  readonly isLoading = input(false);
  readonly hasSearched = input(false);
  readonly itemsLength = input(0);
  readonly hasError = input(false);

  readonly page = input(1);
  readonly totalPages = input(1);
  readonly totalCount = input(0);
}
