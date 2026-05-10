/**
 * Allowed `language` query values — mirrors `backend/src/git-repos/github-search-language.ts`.
 * Extend both when adding languages.
 */
export const GITHUB_SEARCH_LANGUAGES = [
  'asp.net',
  'c',
  'c++',
  'c#',
  'clojure',
  'css',
  'dart',
  'dockerfile',
  'elixir',
  'erlang',
  'go',
  'haskell',
  'html',
  'java',
  'javascript',
  'kotlin',
  'lua',
  'markdown',
  'objective-c',
  'perl',
  'php',
  'python',
  'r',
  'ruby',
  'rust',
  'scala',
  'shell',
  'swift',
  'typescript',
  'vue',
] as const;

const ALLOWED = new Set<string>(GITHUB_SEARCH_LANGUAGES);

export function isAllowedGithubSearchLanguage(value: string): boolean {
  return ALLOWED.has(value);
}

/** Sorted copy for stable dropdown order. */
export const GITHUB_SEARCH_LANGUAGES_SORTED: readonly string[] = [
  ...GITHUB_SEARCH_LANGUAGES,
].sort((a, b) => a.localeCompare(b));
