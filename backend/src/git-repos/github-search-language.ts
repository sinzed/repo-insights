/**
 * GitHub `language:` search qualifier tokens this API allows (linguist-style names).
 *
 * Keeps the constructed search query strictly bounded; extend when product needs
 * more languages (or generate from github/linguist `languages.yml`).
 */
export enum GithubSearchLanguage {
  AspDotNet = 'asp.net',
  C = 'c',
  CPlusPlus = 'c++',
  CSharp = 'c#',
  Clojure = 'clojure',
  Css = 'css',
  Dart = 'dart',
  Dockerfile = 'dockerfile',
  Elixir = 'elixir',
  Erlang = 'erlang',
  Go = 'go',
  Haskell = 'haskell',
  Html = 'html',
  Java = 'java',
  JavaScript = 'javascript',
  Kotlin = 'kotlin',
  Lua = 'lua',
  Markdown = 'markdown',
  ObjectiveC = 'objective-c',
  Perl = 'perl',
  Php = 'php',
  Python = 'python',
  R = 'r',
  Ruby = 'ruby',
  Rust = 'rust',
  Scala = 'scala',
  Shell = 'shell',
  Swift = 'swift',
  TypeScript = 'typescript',
  Vue = 'vue',
}

const ALLOWED = new Set<string>(Object.values(GithubSearchLanguage));

export function isAllowedGithubSearchLanguage(value: string): boolean {
  return ALLOWED.has(value);
}
