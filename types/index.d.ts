export type Stats = {
  input: number
  output: number
  cacheRead: number
  cacheWrite: number
  prompts: number
  isWorking: boolean
  contextPercent: number | null
  limits: { kind: string; percent: number; resetsAt: string | null }[]
  costUsd: number | null
  days: Record<string, number>
}

/** Jazyk panelu: `auto` z CYAN_NIGHT_LANG / locale, `manual` z argumentu příkazu (jen pro session). */
export type LanguageState = {
  auto: 'cs' | 'en'
  manual: 'cs' | 'en' | null
}

declare module 'claude-code' {
  interface PluginState {
    'cyan-night': { stats: Shaped<Stats>; language: Shaped<LanguageState> }
  }
}
