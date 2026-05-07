import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GithubSearchRepositoriesMapper } from './infrastructure/mappers/github-search-repositories.mapper';
import { RepositoriesController } from './repositories/repositories.controller';
import { RepositoryScoringService } from './repositories/repository-scoring.service';
import { RepositoriesService } from './repositories/repositories.service';

@Module({
  imports: [],
  controllers: [AppController, RepositoriesController],
  providers: [
    AppService,
    GithubSearchRepositoriesMapper,
    RepositoryScoringService,
    RepositoriesService,
  ],
})
export class AppModule {}
