import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
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
