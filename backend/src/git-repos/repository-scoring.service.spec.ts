import { RepositoryScoringService } from './repository-scoring.service';
import { RepositoryItemDto } from './dto/search-git-repos-response.dto';

const FROZEN_NOW = new Date('2026-01-31T00:00:00.000Z');
const MS_PER_DAY = 86_400_000;

function makeRepo(
  overrides: Partial<RepositoryItemDto> = {},
): RepositoryItemDto {
  return {
    id: 1,
    name: 'repo',
    fullName: 'org/repo',
    htmlUrl: 'https://example.com',
    description: null,
    stargazersCount: 0,
    forksCount: 0,
    language: null,
    createdAt: new Date('2020-01-01T00:00:00.000Z').toISOString(),
    updatedAt: new Date('2020-01-01T00:00:00.000Z').toISOString(),
    rankScore: 0,
    ...overrides,
  };
}

function updatedNDaysAgo(daysAgo: number, now: Date = FROZEN_NOW): string {
  return new Date(now.getTime() - daysAgo * MS_PER_DAY).toISOString();
}

describe('RepositoryScoringService', () => {
  let service: RepositoryScoringService;

  beforeEach(() => {
    service = new RepositoryScoringService();
  });

  describe('computeRankScore', () => {
    it('increases as stars increase (same recency/forks)', () => {
      const now = new Date('2026-01-01T00:00:00.000Z');
      jest.useFakeTimers();
      jest.setSystemTime(now);

      const base = makeRepo({ updatedAt: now.toISOString(), forksCount: 0 });
      const low = service.computeRankScore({ ...base, stargazersCount: 10 });
      const high = service.computeRankScore({ ...base, stargazersCount: 1000 });

      expect(high).toBeGreaterThan(low);

      jest.useRealTimers();
    });

    it('increases as forks increase (same recency/stars)', () => {
      const now = new Date('2026-01-01T00:00:00.000Z');
      jest.useFakeTimers();
      jest.setSystemTime(now);

      const base = makeRepo({
        updatedAt: now.toISOString(),
        stargazersCount: 100,
      });
      const low = service.computeRankScore({ ...base, forksCount: 1 });
      const high = service.computeRankScore({ ...base, forksCount: 100 });

      expect(high).toBeGreaterThan(low);

      jest.useRealTimers();
    });

    it('decreases as updatedAt gets older (same stars/forks)', () => {
      const now = new Date('2026-01-31T00:00:00.000Z');
      jest.useFakeTimers();
      jest.setSystemTime(now);

      const base = makeRepo({ stargazersCount: 500, forksCount: 50 });
      const fresh = service.computeRankScore({
        ...base,
        updatedAt: new Date('2026-01-30T00:00:00.000Z').toISOString(),
      });
      const stale = service.computeRankScore({
        ...base,
        updatedAt: new Date('2025-10-01T00:00:00.000Z').toISOString(),
      });

      expect(fresh).toBeGreaterThan(stale);

      jest.useRealTimers();
    });

    it('handles invalid updatedAt without NaN', () => {
      const score = service.computeRankScore(
        makeRepo({
          updatedAt: 'not-a-date',
          stargazersCount: 1,
          forksCount: 1,
        }),
      );
      expect(Number.isFinite(score)).toBe(true);
    });

    it('recency can outrank larger stars/forks within the freshness budget', () => {
      const now = new Date('2026-01-01T00:00:00.000Z');
      jest.useFakeTimers();
      jest.setSystemTime(now);

      const staleLeader = service.computeRankScore(
        makeRepo({
          stargazersCount: 1000,
          forksCount: 100,
          updatedAt: new Date('2025-01-01T00:00:00.000Z').toISOString(),
        }),
      );
      const freshUnderdog = service.computeRankScore(
        makeRepo({
          stargazersCount: 500,
          forksCount: 50,
          updatedAt: now.toISOString(),
        }),
      );

      expect(staleLeader).toBeCloseTo(78.35, 2);
      expect(freshUnderdog).toBeCloseTo(84.39, 2);
      expect(freshUnderdog).toBeGreaterThan(staleLeader);

      jest.useRealTimers();
    });

    it('recency cannot overcome a ~100x popularity gap', () => {
      const now = new Date('2026-01-01T00:00:00.000Z');
      jest.useFakeTimers();
      jest.setSystemTime(now);

      const stalePopular = service.computeRankScore(
        makeRepo({
          stargazersCount: 10000,
          forksCount: 1000,
          updatedAt: new Date('2025-01-01T00:00:00.000Z').toISOString(),
        }),
      );
      const freshNiche = service.computeRankScore(
        makeRepo({
          stargazersCount: 100,
          forksCount: 10,
          updatedAt: now.toISOString(),
        }),
      );

      expect(stalePopular).toBeGreaterThan(freshNiche);

      jest.useRealTimers();
    });

    describe('recency decay curve (stars=200, forks=25)', () => {
      beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(FROZEN_NOW);
      });
      afterEach(() => {
        jest.useRealTimers();
      });

      it.each([
        [0, 73.72],
        [7, 70.6],
        [14, 68.12],
        [30, 64.24],
        [60, 60.75],
        [90, 59.46],
        [180, 58.75],
        [365, 58.72],
      ])('updated %i day(s) ago -> rankScore ~ %f', (daysAgo, expected) => {
        const result = service.computeRankScore(
          makeRepo({
            stargazersCount: 200,
            forksCount: 25,
            updatedAt: updatedNDaysAgo(daysAgo),
          }),
        );
        expect(result).toBeCloseTo(expected, 2);
      });
    });

    describe('popularity scaling at fixed recency (today, forks = stars / 10)', () => {
      beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(FROZEN_NOW);
      });
      afterEach(() => {
        jest.useRealTimers();
      });

      it.each([
        [0, 0, 15.0],
        [10, 1, 37.65],
        [100, 10, 63.91],
        [1000, 100, 93.35],
        [10000, 1000, 123.23],
        [100000, 10000, 153.16],
      ])('stars=%i forks=%i -> rankScore ~ %f', (stars, forks, expected) => {
        const result = service.computeRankScore(
          makeRepo({
            stargazersCount: stars,
            forksCount: forks,
            updatedAt: updatedNDaysAgo(0),
          }),
        );
        expect(result).toBeCloseTo(expected, 2);
      });
    });

    describe('real-world archetypes', () => {
      beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(FROZEN_NOW);
      });
      afterEach(() => {
        jest.useRealTimers();
      });

      it.each([
        ['hot new project', 50, 5, 1, 54.92],
        ['niche, maintained', 500, 30, 14, 76.31],
        ['active mainstream library', 5000, 500, 7, 111.1],
        ['famous but stale', 80000, 8000, 730, 135.25],
        ['veteran, still active', 80000, 8000, 0, 150.25],
        ['mega-popular, weekly maintenance', 200000, 40000, 7, 162.51],
      ])(
        '%s (stars=%i, forks=%i, days=%i) -> rankScore ~ %f',
        (_label, stars, forks, daysAgo, expected) => {
          const result = service.computeRankScore(
            makeRepo({
              stargazersCount: stars,
              forksCount: forks,
              updatedAt: updatedNDaysAgo(daysAgo),
            }),
          );
          expect(result).toBeCloseTo(expected, 2);
        },
      );

      it('orders archetypes from least to most relevant', () => {
        const archetypes = [
          { stars: 50, forks: 5, daysAgo: 1 },
          { stars: 500, forks: 30, daysAgo: 14 },
          { stars: 5000, forks: 500, daysAgo: 7 },
          { stars: 80000, forks: 8000, daysAgo: 730 },
          { stars: 80000, forks: 8000, daysAgo: 0 },
          { stars: 200000, forks: 40000, daysAgo: 7 },
        ];
        const scores = archetypes.map((a) =>
          service.computeRankScore(
            makeRepo({
              stargazersCount: a.stars,
              forksCount: a.forks,
              updatedAt: updatedNDaysAgo(a.daysAgo),
            }),
          ),
        );
        for (let i = 1; i < scores.length; i++) {
          expect(scores[i]).toBeGreaterThan(scores[i - 1]);
        }
      });
    });

    describe('edge cases', () => {
      beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(FROZEN_NOW);
      });
      afterEach(() => {
        jest.useRealTimers();
      });

      it('returns 15.00 (recency only) for a brand-new empty repo', () => {
        const result = service.computeRankScore(
          makeRepo({
            stargazersCount: 0,
            forksCount: 0,
            updatedAt: updatedNDaysAgo(0),
          }),
        );
        expect(result).toBeCloseTo(15.0, 2);
      });

      it('returns 0.00 for an empty repo updated long ago', () => {
        const result = service.computeRankScore(
          makeRepo({
            stargazersCount: 0,
            forksCount: 0,
            updatedAt: updatedNDaysAgo(3650),
          }),
        );
        expect(result).toBeCloseTo(0.0, 2);
      });

      it('clamps negative stars/forks to 0', () => {
        const result = service.computeRankScore(
          makeRepo({
            stargazersCount: -100,
            forksCount: -50,
            updatedAt: updatedNDaysAgo(0),
          }),
        );
        expect(result).toBeCloseTo(15.0, 2);
      });

      it('treats a future updatedAt as "today" (max recency)', () => {
        const future = new Date(
          FROZEN_NOW.getTime() + 30 * MS_PER_DAY,
        ).toISOString();
        const result = service.computeRankScore(
          makeRepo({ stargazersCount: 0, forksCount: 0, updatedAt: future }),
        );
        expect(result).toBeCloseTo(15.0, 2);
      });

      it('treats an unparseable updatedAt as "ancient" (recency ~ 0)', () => {
        const result = service.computeRankScore(
          makeRepo({
            stargazersCount: 0,
            forksCount: 0,
            updatedAt: 'not-a-date',
          }),
        );
        expect(result).toBeCloseTo(0.0, 2);
      });
    });
  });
});
