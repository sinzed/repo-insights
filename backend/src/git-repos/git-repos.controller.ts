import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { SearchGitReposResponseDto } from './dto/search-git-repos-response.dto';
import { GitReposService } from './git-repos.service';

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

@ApiTags('git-repos')
@Controller('git-repos')
export class GitReposController {
  constructor(private readonly gitReposService: GitReposService) {}

  @Get()
  @ApiOperation({ summary: 'Search Git repos (GitHub-backed)' })
  @ApiQuery({
    name: 'language',
    required: true,
    example: 'typescript',
    description: 'GitHub language filter (e.g. typescript, javascript)',
  })
  @ApiQuery({
    name: 'changedAfter',
    required: true,
    example: '2026-05-01',
    description: 'Only repos with push activity after this date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    description: '1-based page number',
  })
  @ApiQuery({
    name: 'perPage',
    required: false,
    example: 30,
    description: 'Page size (max 100)',
  })
  @ApiOkResponse({ type: SearchGitReposResponseDto })
  @ApiBadRequestResponse({
    description: 'Missing or invalid query parameters',
  })
  async getGitRepos(
    @Query('language') language: string | undefined,
    @Query('changedAfter') changedAfter: string | undefined,
    @Query('page') pageRaw: string | undefined,
    @Query('perPage') perPageRaw: string | undefined,
  ): Promise<SearchGitReposResponseDto> {
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

    return this.gitReposService.searchGitRepos(
      language.trim(),
      changedAfter.trim(),
      page,
      perPage,
    );
  }
}
