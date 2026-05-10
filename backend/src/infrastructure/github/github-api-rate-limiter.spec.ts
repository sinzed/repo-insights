import { GithubApiRateLimiter } from './github-api-rate-limiter';

describe('GithubApiRateLimiter', () => {
  it('runs scheduled work in order', async () => {
    const limiter = new GithubApiRateLimiter();
    const out: number[] = [];
    await limiter.schedule(() => {
      out.push(1);
      return Promise.resolve();
    });
    await limiter.schedule(() => {
      out.push(2);
      return Promise.resolve();
    });
    expect(out).toEqual([1, 2]);
  });
});
