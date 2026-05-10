import { Module } from '@nestjs/common';
import { GitReposModule } from './git-repos/git-repos.module';

@Module({
  imports: [GitReposModule],
})
export class AppModule {}
