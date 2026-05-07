import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GithubSearchRepositoriesMapper } from './infrastructure/mappers/github-search-repositories.mapper';
import { RepositoriesController } from './repositories/repositories.controller';
import { RepositoriesService } from './repositories/repositories.service';

@Module({
  imports: [],
  controllers: [AppController, RepositoriesController],
  providers: [AppService, GithubSearchRepositoriesMapper, RepositoriesService],
})
export class AppModule {}
