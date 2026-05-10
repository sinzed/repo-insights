import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { GithubApiRateLimiter } from './infrastructure/github/github-api-rate-limiter';
import { GithubSearchGitReposMapper } from './infrastructure/mappers/github-search-git-repos.mapper';
import { GitReposController } from './git-repos/git-repos.controller';
import { RepositoryScoringService } from './git-repos/repository-scoring.service';
import { GitReposService } from './git-repos/git-repos.service';

@Module({
  imports: [],
  controllers: [GitReposController],
  providers: [
    AppService,
    GithubApiRateLimiter,
    GithubSearchGitReposMapper,
    RepositoryScoringService,
    GitReposService,
  ],
})
export class AppModule {}
