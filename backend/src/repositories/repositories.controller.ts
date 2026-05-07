import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { SearchRepositoriesResponseDto } from './dto/search-repositories-response.dto';
import { RepositoriesService } from './repositories.service';

function parsePositiveInt(
  value: string | undefined,
  defaultValue: number,
): number {
  if (value === undefined) return defaultValue;
  const trimmed = value.trim();
  if (!trimmed) return defaultValue;
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return defaultValue;
  return parsed;
}

@Controller('repositories')
export class RepositoriesController {
  constructor(private readonly repositoriesService: RepositoriesService) {}

  @Get()
  async getRepositories(
    @Query('language') language: string | undefined,
    @Query('changedAfter') changedAfter: string | undefined,
    @Query('page') pageRaw: string | undefined,
    @Query('perPage') perPageRaw: string | undefined,
  ): Promise<SearchRepositoriesResponseDto> {
    if (!language?.trim()) {
      throw new BadRequestException('Query parameter "language" is required');
    }
    if (!changedAfter?.trim()) {
      throw new BadRequestException(
        'Query parameter "changedAfter" is required',
      );
    }

    const page = parsePositiveInt(pageRaw, 1);
    const perPage = Math.min(parsePositiveInt(perPageRaw, 30), 100);

    return this.repositoriesService.searchRepositories(
      language.trim(),
      changedAfter.trim(),
      page,
      perPage,
    );
  }
}
