import { describe, expect, it } from 'vitest';

import {
  hasSearchQueryFieldErrors,
  validateSearchQuery,
} from './search-query-validation';

describe('validateSearchQuery', () => {
  it('passes for canonical backend-friendly values', () => {
    const e = validateSearchQuery('typescript', '2026-05-01');
    expect(hasSearchQueryFieldErrors(e)).toBe(false);
  });

  it('normalizes language like the API Transform', () => {
    const e = validateSearchQuery('  TypeScript ', '2026-05-01');
    expect(hasSearchQueryFieldErrors(e)).toBe(false);
  });

  it('reports missing and invalid fields', () => {
    expect(validateSearchQuery('', '').language).toContain('required');
    expect(validateSearchQuery('', '').changedAfter).toContain('required');
    expect(validateSearchQuery('lol', '2026-05-01').language).toContain(
      'supported GitHub language',
    );
    expect(validateSearchQuery('typescript', 'nope').changedAfter).toContain(
      'valid calendar date',
    );
  });
});
