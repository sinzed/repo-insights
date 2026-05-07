import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-repository-pager',
  imports: [CommonModule, FormsModule],
  templateUrl: './repository-pager.component.html',
  styleUrl: './repository-pager.component.scss',
})
export class RepositoryPagerComponent {
  readonly page = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly perPage = input.required<number>();
  readonly pageSizeOptions = input.required<readonly number[]>();

  readonly isLoading = input(false);

  readonly previous = output<void>();
  readonly next = output<void>();
  readonly perPageChange = output<number>();
}
