import { githubRestRequestHeaders } from './github-api-headers';

describe('githubRestRequestHeaders', () => {
  it('returns anonymous REST headers', () => {
    const h = githubRestRequestHeaders();
    expect(h.Accept).toBe('application/vnd.github+json');
    expect(h['User-Agent']).toBe('repo-insights-backend');
    expect(h.Authorization).toBeUndefined();
  });

  it('allows overriding User-Agent', () => {
    const h = githubRestRequestHeaders('custom-agent');
    expect(h['User-Agent']).toBe('custom-agent');
  });
});
