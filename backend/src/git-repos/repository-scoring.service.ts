import { Injectable } from '@nestjs/common';
import { RepositoryItemDto } from './dto/search-git-repos-response.dto';

@Injectable()
export class RepositoryScoringService {

  computeRankScore(item: RepositoryItemDto): number {
    const stars = Math.max(0, item.stargazersCount ?? 0);
    const forks = Math.max(0, item.forksCount ?? 0);

    const daysSinceUpdate = this.daysSince(item.updatedAt);
    const recency = Math.exp(-daysSinceUpdate / 30); 
    const starsScore = Math.log1p(stars) * 8;
    const forksScore = Math.log1p(forks) * 5;
    const recencyScore = recency * 15;

    return Number((starsScore + forksScore + recencyScore).toFixed(2));
  }

  private daysSince(isoDate: string): number {
    const ms = Date.now() - this.parseDateMs(isoDate);
    if (!Number.isFinite(ms) || ms <= 0) return 0;
    return ms / (1000 * 60 * 60 * 24);
  }

  private parseDateMs(isoDate: string): number {
    const ms = Date.parse(isoDate);
    return Number.isFinite(ms) ? ms : 0;
  }
}

