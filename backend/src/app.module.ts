import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { GithubSearchGitReposMapper } from './infrastructure/mappers/github-search-git-repos.mapper';
import { GitReposController } from './git-repos/git-repos.controller';
import { RepositoryScoringService } from './git-repos/repository-scoring.service';
import { GitReposService } from './git-repos/git-repos.service';

@Module({
  imports: [],
  controllers: [GitReposController],
  providers: [
    AppService,
    GithubSearchGitReposMapper,
    RepositoryScoringService,
    GitReposService,
  ],
})
export class AppModule {}
