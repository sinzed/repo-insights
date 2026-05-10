import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { GithubSearchLanguage } from '../github-search-language';
import { SearchGitReposQueryDto } from './search-git-repos-query.dto';

async function validateQuery(
  plain: Record<string, unknown>,
): Promise<ReturnType<typeof validate>> {
  const dto = plainToInstance(SearchGitReposQueryDto, plain);
  return validate(dto);
}

describe('SearchGitReposQueryDto', () => {
  it('accepts required fields and applies language trim/lowercase', async () => {
    const errors = await validateQuery({
      language: '  TypeScript ',
      changedAfter: '2026-05-01',
    });
    expect(errors).toHaveLength(0);
  });

  it('accepts optional page and perPage as numeric strings', async () => {
    const dto = plainToInstance(SearchGitReposQueryDto, {
      language: GithubSearchLanguage.TypeScript,
      changedAfter: '2026-05-01',
      page: '2',
      perPage: '50',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.page).toBe(2);
    expect(dto.perPage).toBe(50);
  });

  it('rejects missing language', async () => {
    const errors = await validateQuery({ changedAfter: '2026-05-01' });
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'language')).toBe(true);
  });

  it('rejects empty language after trim', async () => {
    const errors = await validateQuery({
      language: '   ',
      changedAfter: '2026-05-01',
    });
    expect(errors.some((e) => e.property === 'language')).toBe(true);
  });

  it('rejects unsupported language values', async () => {
    const errors = await validateQuery({
      language: 'zig',
      changedAfter: '2026-05-01',
    });
    expect(errors.some((e) => e.property === 'language')).toBe(true);
  });

  it('rejects missing changedAfter', async () => {
    const errors = await validateQuery({
      language: GithubSearchLanguage.TypeScript,
    });
    expect(errors.some((e) => e.property === 'changedAfter')).toBe(true);
  });

  it('rejects invalid calendar dates', async () => {
    const errors = await validateQuery({
      language: GithubSearchLanguage.TypeScript,
      changedAfter: '2026-02-30',
    });
    expect(errors.some((e) => e.property === 'changedAfter')).toBe(true);
  });

  it('rejects non-YYYY-MM-DD changedAfter strings', async () => {
    const errors = await validateQuery({
      language: GithubSearchLanguage.TypeScript,
      changedAfter: '05/01/2026',
    });
    expect(errors.some((e) => e.property === 'changedAfter')).toBe(true);
  });

  it('rejects page below 1', async () => {
    const errors = await validateQuery({
      language: GithubSearchLanguage.TypeScript,
      changedAfter: '2026-05-01',
      page: 0,
    });
    expect(errors.some((e) => e.property === 'page')).toBe(true);
  });

  it('rejects perPage above 100', async () => {
    const errors = await validateQuery({
      language: GithubSearchLanguage.TypeScript,
      changedAfter: '2026-05-01',
      perPage: 101,
    });
    expect(errors.some((e) => e.property === 'perPage')).toBe(true);
  });

  it('rejects page that parses to NaN', async () => {
    const errors = await validateQuery({
      language: GithubSearchLanguage.TypeScript,
      changedAfter: '2026-05-01',
      page: 'not-a-number',
    });
    expect(errors.some((e) => e.property === 'page')).toBe(true);
  });
});
