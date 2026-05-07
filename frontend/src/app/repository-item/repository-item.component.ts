import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import type { RepositoryItemDto } from '../repositories.api';

@Component({
  selector: 'app-repository-item',
  imports: [CommonModule],
  templateUrl: './repository-item.component.html',
  styleUrl: './repository-item.component.scss',
})
export class RepositoryItemComponent {
  readonly repo = input.required<RepositoryItemDto>();
}
