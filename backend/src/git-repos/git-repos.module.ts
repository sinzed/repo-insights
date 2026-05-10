import { Module } from '@nestjs/common';
import { GithubApiRateLimiter } from '../infrastructure/github/github-api-rate-limiter';
import { GithubSearchGitReposMapper } from '../infrastructure/mappers/github-search-git-repos.mapper';
import { GitReposController } from './git-repos.controller';
import { GitReposService } from './git-repos.service';
import { RepositoryScoringService } from './repository-scoring.service';

@Module({
  controllers: [GitReposController],
  providers: [
    GitReposService,
    RepositoryScoringService,
    GithubSearchGitReposMapper,
    GithubApiRateLimiter,
  ],
})
export class GitReposModule {}
