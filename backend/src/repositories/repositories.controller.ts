import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { RepositoriesService } from './repositories.service';

@Controller('repositories')
export class RepositoriesController {
  constructor(private readonly repositoriesService: RepositoriesService) {}

  @Get()
  async getRepositories(
    @Query('language') language: string | undefined,
    @Query('createdAfter') createdAfter: string | undefined,
  ) {
    if (!language?.trim()) {
      throw new BadRequestException('Query parameter "language" is required');
    }
    if (!createdAfter?.trim()) {
      throw new BadRequestException(
        'Query parameter "createdAfter" is required',
      );
    }

    return this.repositoriesService.searchRepositories(
      language.trim(),
      createdAfter.trim(),
    );
  }
}
