import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RepositoriesController } from './repositories/repositories.controller';
import { RepositoriesService } from './repositories/repositories.service';

@Module({
  imports: [],
  controllers: [AppController, RepositoriesController],
  providers: [AppService, RepositoriesService],
})
export class AppModule {}
