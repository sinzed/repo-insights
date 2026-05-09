/** Shape of GitHub `GET /search/repositories` JSON (fields we read). */
export interface GithubSearchRepositoryItemRaw {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  created_at: string;
  updated_at: string;
}

export interface GithubSearchGitReposRaw {
  total_count: number;
  incomplete_results: boolean;
  items: GithubSearchRepositoryItemRaw[];
}
