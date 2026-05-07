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

  @ApiProperty({ description: 'Server-computed ranking score', example: 0.85 })
  rankScore!: number;
}

export class SearchRepositoriesResponseDto {
  @ApiProperty({ example: 460_603 })
  totalCount!: number;

  @ApiProperty({ type: [RepositoryItemDto] })
  items!: RepositoryItemDto[];
}
