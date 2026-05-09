import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import type { RepositoryItemDto } from '../git-repos.api';
import { RepositoryItemComponent } from '../repository-item/repository-item.component';

@Component({
  selector: 'app-repository-list',
  imports: [CommonModule, RepositoryItemComponent],
  templateUrl: './repository-list.component.html',
  styleUrl: './repository-list.component.scss',
})
export class RepositoryListComponent {
  readonly items = input<RepositoryItemDto[]>([]);
}
