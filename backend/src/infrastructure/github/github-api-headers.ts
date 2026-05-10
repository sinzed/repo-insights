/**
 * Headers for unauthenticated GitHub REST calls (public Search API quota).
 */
export function githubRestRequestHeaders(
  userAgent = 'repo-insights-backend',
): Record<string, string> {
  return {
    Accept: 'application/vnd.github+json',
    'User-Agent': userAgent,
  };
}
