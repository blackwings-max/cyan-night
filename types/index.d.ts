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

declare module 'claude-code' {
  interface PluginState {
    'cyan-night': { stats: Shaped<Stats> }
  }
}
