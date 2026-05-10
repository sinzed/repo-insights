import { Test, TestingModule } from '@nestjs/testing';
import { GithubSearchLanguage } from './github-search-language';
import { GitReposController } from './git-repos.controller';
import { GitReposService } from './git-repos.service';

describe('GitReposController', () => {
  let controller: GitReposController;
  let service: jest.Mocked<Pick<GitReposService, 'searchGitRepos'>>;

  beforeEach(async () => {
    service = {
      searchGitRepos: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GitReposController],
      providers: [{ provide: GitReposService, useValue: service }],
    }).compile();

    controller = module.get(GitReposController);
  });

  it('delegates to GitReposService with DTO fields and pagination defaults', async () => {
    service.searchGitRepos.mockResolvedValue({
      totalCount: 0,
      items: [],
    });

    await controller.getGitRepos({
      language: GithubSearchLanguage.TypeScript,
      changedAfter: '2026-05-01',
    });

    expect(service.searchGitRepos).toHaveBeenCalledWith(
      GithubSearchLanguage.TypeScript,
      '2026-05-01',
      1,
      30,
    );
  });

  it('passes explicit page and perPage through', async () => {
    service.searchGitRepos.mockResolvedValue({
      totalCount: 0,
      items: [],
    });

    await controller.getGitRepos({
      language: GithubSearchLanguage.Rust,
      changedAfter: '2026-01-15',
      page: 3,
      perPage: 50,
    });

    expect(service.searchGitRepos).toHaveBeenCalledWith('rust', '2026-01-15', 3, 50);
  });
});
