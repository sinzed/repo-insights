import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { SearchGitReposQueryDto } from './dto/search-git-repos-query.dto';
import { SearchGitReposResponseDto } from './dto/search-git-repos-response.dto';
import { GitReposService } from './git-repos.service';

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
    @Query() query: SearchGitReposQueryDto,
  ): Promise<SearchGitReposResponseDto> {
    return this.gitReposService.searchGitRepos(
      query.language,
      query.changedAfter,
      query.page ?? 1,
      query.perPage ?? 30,
    );
  }
}
