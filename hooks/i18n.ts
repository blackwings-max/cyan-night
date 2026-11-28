// Všechny texty, které uživatel vidí, na jednom místě: čeština a angličtina.
// Jazyk: argument příkazu (/usage en) > CYAN_NIGHT_LANG > locale systému > LC_ALL / LANG.
// Čeština nebo slovenština → cs, cokoli jiného → en.

export type Lang = 'cs' | 'en'

export const LANGS: readonly Lang[] = ['cs', 'en']

const pad = (n: number) => String(n).padStart(2, '0')
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const cs = {
  title: 'Spotřeba Claude',
  commandDescription: 'Otevře panel Spotřeba Claude (volitelně cs/en)',
  opened: 'Panel Spotřeba Claude je otevřený.',
  openedLang: 'Panel Spotřeba Claude je otevřený, jazyk: čeština.',
  badArg: (arg: string) => `Neznámý argument „${arg}". Použij cs nebo en.`,
  backdropAlt: 'Tmavá scéna s pomalu plujícími zářemi a světelnými linkami',

  dayNames: ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'],
  dayShort: ['ne', 'po', 'út', 'st', 'čt', 'pá', 'so'],
  weekLabels: ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'],
  dateLine: (d: Date, names: string[]) =>
    `${names[d.getDay()]} ${d.getDate()}. ${d.getMonth() + 1}. · ${pad(d.getHours())}:${pad(d.getMinutes())}`,
  resetToday: (time: string) => `dnes ${time}`,
  resetDay: (d: Date, short: string[], time: string) => `${short[d.getDay()]} ${d.getDate()}.${d.getMonth() + 1}. ${time}`,
  resets: 'obnova',

  limit5h: '5h okno',
  limitWeek: 'Týden',
  limitSpend: 'Útrata',

  todayTotal: 'Dnes celkem',
  tokens: 'tokenů',
  working: 'PRACUJE ⚡',
  idle: 'V KLIDU',
  context: 'KONTEXT',
  limit: 'LIMIT',
  thisSession: 'Tato session',
  live: 'ŽIVĚ',
  output: 'výstup',
  input: 'vstup',
  cache: 'cache',
  prompts: (n: number) => `${n}× dotaz`,
  workingNow: 'pracuje teď',
  costEstimate: (usd: string) => `odhad ceny session ~ $${usd}`,
  waiting: 'čeká na další dotaz',
  accountLimits: 'Limity účtu',
  noLimitsHint: ['Limity se ukážou po první', 'odpovědi na předplatném.'],
  weeklyLimit: (p: string) => `Týdenní limit ${p}`,
  noLimits: 'Bez údajů o limitech',

  // terminál
  termToday: 'Dnes celkem',
  termWorking: '⚡ pracuje se',
  termSession: 'Session',
  termContext: 'Kontext',
  termWeek: 'Týden',
}

export type Strings = typeof cs

const en: Strings = {
  title: 'Claude Usage',
  commandDescription: 'Opens the Claude Usage panel (optional cs/en)',
  opened: 'The Claude Usage panel is open.',
  openedLang: 'The Claude Usage panel is open, language: English.',
  badArg: (arg: string) => `Unknown argument "${arg}". Use cs or en.`,
  backdropAlt: 'Dark scene with slowly drifting glows and light lines',

  dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  dayShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  weekLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  dateLine: (d: Date, names: string[]) =>
    `${names[d.getDay()]}, ${MONTHS_EN[d.getMonth()]} ${d.getDate()} · ${pad(d.getHours())}:${pad(d.getMinutes())}`,
  resetToday: (time: string) => `today ${time}`,
  // „Nov 28 19:39": kratší než se dnem v týdnu (vejde se do karty) a jednoznačné pro US i EU čtenáře.
  resetDay: (d: Date, _short: string[], time: string) => `${MONTHS_EN[d.getMonth()]} ${d.getDate()} ${time}`,
  resets: 'resets',

  limit5h: '5h window',
  limitWeek: 'Week',
  limitSpend: 'Spend',

  todayTotal: 'Today total',
  tokens: 'tokens',
  working: 'WORKING ⚡',
  idle: 'IDLE',
  context: 'CONTEXT',
  limit: 'LIMIT',
  thisSession: 'This session',
  live: 'LIVE',
  output: 'output',
  input: 'input',
  cache: 'cache',
  prompts: (n: number) => `${n.toLocaleString('en-US')} ${n === 1 ? 'prompt' : 'prompts'}`,
  workingNow: 'working now',
  costEstimate: (usd: string) => `session cost estimate ~ $${usd}`,
  waiting: 'waiting for next prompt',
  accountLimits: 'Account limits',
  noLimitsHint: ['Limits appear after the first', 'reply on a subscription.'],
  weeklyLimit: (p: string) => `Weekly limit ${p}`,
  noLimits: 'No limit data',

  termToday: 'Today total',
  termWorking: '⚡ working',
  termSession: 'Session',
  termContext: 'Context',
  termWeek: 'Week',
}

export const STRINGS: Record<Lang, Strings> = { cs, en }

export const t = (lang: Lang): Strings => STRINGS[lang]

/** „cs-CZ", „sk_SK.UTF-8" → cs; cokoli jiného (i prázdné) → en. */
export const langFromLocale = (locale: string | undefined): Lang | null => {
  if (locale === undefined || locale.trim() === '') {
    return null
  }
  const base = locale.trim().toLowerCase().split(/[-_.@]/)[0]
  if (base === 'c' || base === 'posix') {
    return null
  }

  return base === 'cs' || base === 'sk' ? 'cs' : 'en'
}

/** Ruční přepínač: „cs" / „en" (bez ohledu na velikost písmen), jinak null. */
export const parseLang = (value: string | undefined): Lang | null => {
  const v = value?.trim().toLowerCase()

  return v === 'cs' || v === 'en' ? v : null
}

const intlLocale = (): string | undefined => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale
  } catch {
    return undefined
  }
}

export type LangSources = {
  override?: string
  intl?: string
  /** Jazyk macOS (`defaults read -g AppleLocale`), když ho jde zjistit. */
  system?: string
  lcAll?: string
  lang?: string
}

/**
 * Rozhodne jazyk: CYAN_NIGHT_LANG má přednost; jinak cs, když kterýkoli zdroj
 * locale (Intl, jazyk macOS, LC_ALL, LANG) říká češtinu nebo slovenštinu; jinak en.
 *
 * Proč „kterýkoli": běhové prostředí pluginu vrací z Intl často jen výchozí
 * „en-US" a desktopová aplikace nemívá LANG, takže samotné Intl by českého
 * uživatele přepnulo do angličtiny.
 */
export const detectLang = (src: LangSources): Lang => {
  const manual = parseLang(src.override)
  if (manual !== null) {
    return manual
  }
  const found = [src.intl ?? intlLocale(), src.system, src.lcAll, src.lang].map(langFromLocale)

  return found.includes('cs') ? 'cs' : 'en'
}

// ---------- čísla ----------

const comma = (s: string) => s.replace('.', ',')

/** Desetinné číslo podle jazyka: cs „1,5", en „1.5". */
export const dec = (lang: Lang, s: string) => (lang === 'cs' ? comma(s) : s)

/** Procenta: cs „34 %", en „34%". */
export const pct = (lang: Lang, n: number) => (lang === 'cs' ? `${comma(String(n))} %` : `${n}%`)

export const fmt = (lang: Lang, n: number): string => {
  if (n < 1000) {
    return String(Math.round(n))
  }
  if (n < 1_000_000) {
    return `${dec(lang, (n / 1000).toFixed(n < 10_000 ? 1 : 0))}k`
  }
  const m = (n / 1_000_000).toFixed(n < 10_000_000 ? 2 : 1)

  return lang === 'cs' ? `${comma(m)} mil.` : `${m}M`
}

export const fmtShort = (lang: Lang, n: number): string =>
  n >= 1_000_000 ? `${dec(lang, (n / 1_000_000).toFixed(1))}M` : fmt(lang, n)
