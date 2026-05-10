import { isCalendarDateString } from './calendar-date-string';
import { isAllowedGithubSearchLanguage } from './github-search-language';

export type SearchQueryFieldErrors = {
  language: string | null;
  changedAfter: string | null;
};

/** Mirrors `SearchGitReposQueryDto` validation messages from the Nest API. */
export function validateSearchQuery(
  languageRaw: string,
  changedAfterRaw: string,
): SearchQueryFieldErrors {
  const language = languageRaw.trim().toLowerCase();
  const changedAfter = changedAfterRaw.trim();

  const languageError =
    language.length === 0
      ? 'Query parameter "language" is required'
      : !isAllowedGithubSearchLanguage(language)
        ? 'language must be one of the supported GitHub language values'
        : null;

  const changedAfterError =
    changedAfter.length === 0
      ? 'Query parameter "changedAfter" is required'
      : !isCalendarDateString(changedAfter)
        ? 'changedAfter must be a valid calendar date (YYYY-MM-DD)'
        : null;

  return { language: languageError, changedAfter: changedAfterError };
}

export function hasSearchQueryFieldErrors(errors: SearchQueryFieldErrors): boolean {
  return errors.language != null || errors.changedAfter != null;
}
