import { Injectable } from '@nestjs/common';

/**
 * Runs GitHub outbound calls strictly one after another (no proactive delay).
 * Callers apply retry/backoff when GitHub returns errors.
 */
@Injectable()
export class GithubApiRateLimiter {
  private queueTail: Promise<void> = Promise.resolve();

  schedule<T>(operation: () => Promise<T>): Promise<T> {
    const scheduled = this.queueTail.then(() => operation());
    this.queueTail = scheduled.then(
      () => undefined,
      () => undefined,
    );
    return scheduled;
  }
}
