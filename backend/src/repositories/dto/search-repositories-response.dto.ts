export class RepositoryItemDto {
  id!: number;
  name!: string;
  fullName!: string;
  htmlUrl!: string;
  description!: string | null;
  stargazersCount!: number;
  language!: string | null;
  createdAt!: string;
  updatedAt!: string;
}

export class SearchRepositoriesResponseDto {
  totalCount!: number;
  incompleteResults!: boolean;
  items!: RepositoryItemDto[];
}
