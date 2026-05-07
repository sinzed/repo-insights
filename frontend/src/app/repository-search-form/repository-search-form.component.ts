import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-repository-search-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './repository-search-form.component.html',
  styleUrl: './repository-search-form.component.scss',
})
export class RepositorySearchFormComponent {
  readonly language = input.required<string>();
  readonly changedAfter = input.required<string>();
  readonly isLoading = input(false);

  readonly languageChange = output<string>();
  readonly changedAfterChange = output<string>();
  readonly search = output<void>();
}
