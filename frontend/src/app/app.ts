import { Component } from '@angular/core';

import { RepositorySearchComponent } from './repository-search/repository-search.component';

@Component({
  selector: 'app-root',
  imports: [RepositorySearchComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
