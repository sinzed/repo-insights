export class RepositoryItemDto {
  id!: number;
  name!: string;
  fullName!: string;
  htmlUrl!: string;
  description!: string | null;
  stargazersCount!: number;
  forksCount!: number;
  language!: string | null;
  createdAt!: string;
  updatedAt!: string;
  rankScore: number;
}

export class SearchRepositoriesResponseDto {
  totalCount!: number;
  items!: RepositoryItemDto[];
}
