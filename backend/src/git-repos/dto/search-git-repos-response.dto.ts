import { ApiProperty } from '@nestjs/swagger';

export class RepositoryItemDto {
  @ApiProperty({ example: 12345 })
  id!: number;

  @ApiProperty({ example: 'repo-insights' })
  name!: string;

  @ApiProperty({ example: 'org/repo-insights' })
  fullName!: string;

  @ApiProperty({ example: 'https://github.com/org/repo-insights' })
  htmlUrl!: string;

  @ApiProperty({ nullable: true, example: 'Description text' })
  description!: string | null;

  @ApiProperty({ example: 42 })
  stargazersCount!: number;

  @ApiProperty({ example: 7 })
  forksCount!: number;

  @ApiProperty({ nullable: true, example: 'TypeScript' })
  language!: string | null;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-05-01T12:00:00Z' })
  updatedAt!: string;

  @ApiProperty({
    description:
      'Computed after GitHub items are mapped into this shape (not present on GitHub payloads). Higher is better; typical magnitudes are ~0–15 for inactive repos up through tens and low hundreds for popular ones.',
    example: 111.1,
    minimum: 0,
  })
  rankScore!: number;
}

/** Repository fields taken from GitHub before `rankScore` is assigned in `GitReposService`. */
export type RepositoryItemGithubMapped = Omit<RepositoryItemDto, 'rankScore'>;

export interface GithubSearchMappedResponse {
  totalCount: number;
  items: RepositoryItemGithubMapped[];
}

export class SearchGitReposResponseDto {
  @ApiProperty({ example: 460_603 })
  totalCount!: number;

  @ApiProperty({ type: [RepositoryItemDto] })
  items!: RepositoryItemDto[];
}
