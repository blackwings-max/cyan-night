
import type { Stats } from '../types'

import { fmt, fmtShort, pct, t } from './i18n'
import type { Lang } from './i18n'

// Panel „Spotřeba Claude" / „Claude Usage": tokeny této session, dnešek a týden ze všech sessions,
// zaplnění kontextu a limity účtu. Desktop a mobil kreslí SVG kartu s jemnými
// animacemi, terminál stejné údaje textem.

export const PANE = 'spotreba'
export const DAYS_KEY = 'days-v1'

export const EMPTY: Stats = {
  input: 0,
  output: 0,
  cacheRead: 0,
  cacheWrite: 0,
  prompts: 0,
  isWorking: false,
  contextPercent: null,
  limits: [],
  costUsd: null,
  days: {},
}


// ---------- čas a formáty ----------

const pad = (n: number) => String(n).padStart(2, '0')
export const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const fmtReset = (lang: Lang, iso: string | null, now: Date): string => {
  if (iso === null) {
    return ''
  }
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) {
    return ''
  }
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`

  const L = t(lang)

  return dayKey(d) === dayKey(now) ? L.resetToday(time) : L.resetDay(d, L.dayShort, time)
}

const limitName = (lang: Lang, kind: string) => {
  const L = t(lang)

  return kind === 'five_hour' ? L.limit5h : kind === 'seven_day' ? L.limitWeek : kind === 'spend_limit' ? L.limitSpend : kind
}

/** Sedm dní aktuálního týdne (Po–Ne) s tokeny z uložených dnů. */
const week = (lang: Lang, days: Record<string, number>, now: Date) => {
  const monday = new Date(now)
  monday.setHours(12, 0, 0, 0)
  monday.setDate(monday.getDate() - ((now.getDay() + 6) % 7))

  return t(lang).weekLabels.map((label, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const key = dayKey(d)

    return { label, tokens: days[key] ?? 0, isToday: key === dayKey(now) }
  })
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// ---------- SVG karta ----------

const ring = (cx: number, cy: number, r: number, p: number, grad: string) => {
  const c = 2 * Math.PI * r
  const len = Math.max(0, Math.min(1, p)) * c

  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#ffffff" stroke-opacity="0.07" stroke-width="10"/>
<g class="glow"><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="url(#${grad})" stroke-width="14" stroke-linecap="round" stroke-dasharray="${len.toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 ${cx} ${cy})" filter="url(#blur)" opacity="0.55"/></g>
<circle class="draw" cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="url(#${grad})" stroke-width="10" stroke-linecap="round" stroke-dasharray="${len.toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 ${cx} ${cy})"/>`
}

// Řádky limitů mají 11 px (.mutedS), aby se delší texty s datem obnovy (en i cs) vešly do karty.
// Karta se kreslí 1,15× větší, aby se celá vešla do výšky panelu bez posouvání.
const ZOOM = 1.15
/** Velikost karty v CSS pixelech (viewBox 380 × 588). */
export const CARD = { width: Math.round(380 * ZOOM), height: Math.round(588 * ZOOM) }

export const buildSvg = (s: Stats, now: Date, lang: Lang = 'cs'): string => {
  const L = t(lang)
  const today = s.days[dayKey(now)] ?? 0
  const session = s.input + s.output + s.cacheRead + s.cacheWrite
  const days = week(lang, s.days, now)
  const max = Math.max(1, ...days.map(d => d.tokens))
  const ctx = s.contextPercent
  const weekly = s.limits.find(l => l.kind === 'seven_day') ?? s.limits[0]

  const W = 380
  const c1 = 168
  const c1h = 232
  const c2 = c1 + c1h + 14
  const c2h = 160
  const H = c2 + c2h + 14

  const bars = days
    .map((d, i) => {
      const x = 150 + i * 30
      const h = d.tokens > 0 ? Math.max(6, (d.tokens / max) * 40) : 3
      const y = c1 + 172 - h
      const fill = d.isToday ? 'url(#barToday)' : d.tokens > 0 ? 'url(#bar)' : '#ffffff'
      const op = d.tokens > 0 ? 1 : 0.08

      return `<rect ${d.isToday && d.tokens > 0 ? 'class="today"' : ''} x="${x}" y="${y.toFixed(1)}" width="25" height="${h.toFixed(1)}" rx="5" fill="${fill}" opacity="${op}"/>
<text x="${x + 12.5}" y="${c1 + 190}" text-anchor="middle" class="${d.isToday ? 'lblT' : 'lbl'}">${d.label}</text>`
    })
    .join('\n')

  const limitLines =
    s.limits.length === 0
      ? L.noLimitsHint.map((line, i) => `<text x="150" y="${c2 + 70 + i * 18}" class="muted">${esc(line)}</text>`).join('\n')
      : s.limits
          .slice(0, 3)
          .map(
            (l, i) =>
              `<text x="150" y="${c2 + 70 + i * 20}" class="mutedS"><tspan class="strong">${esc(limitName(lang, l.kind))} ${esc(pct(lang, l.percent))}</tspan>${l.resetsAt ? ` · ${L.resets} ${esc(fmtReset(lang, l.resetsAt, now))}` : ''}</text>`,
          )
          .join('\n')

  const dateLine = L.dateLine(now, L.dayNames)

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${Math.round(W * ZOOM)}" height="${Math.round(H * ZOOM)}">
<defs>
<linearGradient id="cyan" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#5ee7ff"/><stop offset="100%" stop-color="#0077d6"/></linearGradient>
<linearGradient id="violet" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#b59cff"/><stop offset="100%" stop-color="#22c3ee"/></linearGradient>
<linearGradient id="bar" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#3aa9c9"/><stop offset="100%" stop-color="#1d4f66"/></linearGradient>
<linearGradient id="barToday" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#7cf0ff"/><stop offset="100%" stop-color="#0098d8"/></linearGradient>
<linearGradient id="card1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#14303d" stop-opacity="0.85"/><stop offset="100%" stop-color="#0f1a22" stop-opacity="0.85"/></linearGradient>
<linearGradient id="card2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#1e1d3a" stop-opacity="0.8"/><stop offset="100%" stop-color="#0f1820" stop-opacity="0.85"/></linearGradient>
<radialGradient id="orb" cx="35%" cy="30%" r="70%"><stop offset="0%" stop-color="#7cf0ff"/><stop offset="55%" stop-color="#2a5bd7"/><stop offset="100%" stop-color="#8b5cf6"/></radialGradient>
<filter id="blur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6"/></filter>
</defs>
<style>
text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; fill: #e8f4f8; }
.title { font-size: 20px; font-weight: 700; }
.sub { font-size: 13px; fill: #8ba0ac; }
.muted { font-size: 12px; fill: #8ba0ac; }
.mutedS { font-size: 11px; fill: #8ba0ac; }
.strong { fill: #d6e9f0; font-weight: 600; }
.big { font-size: 46px; font-weight: 800; letter-spacing: -1px; }
.unit { font-size: 18px; fill: #8ba0ac; font-weight: 600; }
.h2 { font-size: 18px; font-weight: 700; }
.num { font-size: 22px; font-weight: 800; }
.ringN { font-size: 19px; font-weight: 800; }
.ringL { font-size: 9.5px; fill: #8ba0ac; font-weight: 700; letter-spacing: 1px; }
.lbl { font-size: 10.5px; fill: #6f8592; }
.lblT { font-size: 10.5px; fill: #e8f4f8; font-weight: 700; }
.accent { font-size: 13px; fill: #4fd8f5; font-weight: 600; }
.accentV { font-size: 13px; fill: #b59cff; font-weight: 600; }
.chipOff { font-size: 10.5px; font-weight: 800; fill: #8ba0ac; letter-spacing: 0.8px; }
.chip { font-size: 10.5px; font-weight: 800; fill: #4fd8f5; letter-spacing: 0.5px; }
.glow { animation: breathe 6s ease-in-out infinite alternate; }
.draw { animation: draw 1.4s ease-out; }
.today { animation: pulse 3.5s ease-in-out infinite alternate; }
.dot { animation: blink 1.6s ease-in-out infinite; }
.orbc { animation: spin 24s linear infinite; transform-origin: 34px 36px; }
@keyframes breathe { from { opacity: 0.35; } to { opacity: 0.9; } }
@keyframes draw { from { stroke-dasharray: 0 400; } }
@keyframes pulse { from { opacity: 0.8; } to { opacity: 1; } }
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }
@keyframes spin { to { transform: rotate(360deg); } }
</style>

<g class="orbc"><circle cx="34" cy="36" r="21" fill="url(#orb)" opacity="0.95"/></g>
<circle cx="34" cy="36" r="21" fill="none" stroke="#ffffff" stroke-opacity="0.18"/>
<path d="M34 25 L36.5 33.5 L45 36 L36.5 38.5 L34 47 L31.5 38.5 L23 36 L31.5 33.5 Z" fill="#ffffff" opacity="0.92"/>
<text x="66" y="33" class="title">${esc(L.title)}</text>
<text x="66" y="53" class="sub">${esc(dateLine)}</text>

<text x="20" y="100" class="sub">${esc(L.todayTotal)}</text>
<text x="18" y="146"><tspan class="big">${esc(fmt(lang, today))}</tspan><tspan class="unit" dx="8">${esc(L.tokens)}</tspan></text>
<rect x="${W - 132}" y="20" width="112" height="28" rx="14" fill="${s.isWorking ? '#4fd8f5' : '#ffffff'}" fill-opacity="${s.isWorking ? 0.12 : 0.05}" stroke="${s.isWorking ? '#4fd8f5' : '#ffffff'}" stroke-opacity="0.18"/>
${s.isWorking ? `<circle class="dot" cx="${W - 116}" cy="34" r="4" fill="#4fd8f5"/>` : ''}
<text x="${W - 72}" y="38.5" text-anchor="middle" class="${s.isWorking ? 'chip' : 'chipOff'}">${esc(s.isWorking ? L.working : L.idle)}</text>

<rect x="14" y="${c1}" width="${W - 28}" height="${c1h}" rx="22" fill="url(#card1)" stroke="#5ee7ff" stroke-opacity="0.14"/>
${ring(78, c1 + 78, 44, (ctx ?? 0) / 100, 'cyan')}
<text x="78" y="${c1 + 82}" text-anchor="middle" class="ringN">${ctx === null ? '–' : esc(pct(lang, ctx))}</text>
<text x="78" y="${c1 + 98}" text-anchor="middle" class="ringL">${esc(L.context)}</text>
<text x="150" y="${c1 + 34}" class="h2">${esc(L.thisSession)}</text>
${s.isWorking ? `<rect x="282" y="${c1 + 20}" width="56" height="20" rx="10" fill="#4fd8f5" fill-opacity="0.12"/><circle class="dot" cx="294" cy="${c1 + 30}" r="3.5" fill="#4fd8f5"/><text x="302" y="${c1 + 34}" class="chip">${esc(L.live)}</text>` : ''}
<text x="150" y="${c1 + 64}" class="num">${esc(fmt(lang, session))}</text>
<text x="150" y="${c1 + 88}" class="muted">${L.output} ${esc(fmtShort(lang, s.output))} · ${L.input} ${esc(fmtShort(lang, s.input))}</text>
<text x="150" y="${c1 + 106}" class="muted">${L.cache} ${esc(fmtShort(lang, s.cacheRead + s.cacheWrite))} · ${esc(L.prompts(s.prompts))}</text>
${bars}
<text x="32" y="${c1 + 218}" class="accent">${esc(s.isWorking ? L.workingNow : s.costUsd !== null ? L.costEstimate(s.costUsd.toFixed(2)) : L.waiting)}</text>

<rect x="14" y="${c2}" width="${W - 28}" height="${c2h}" rx="22" fill="url(#card2)" stroke="#b59cff" stroke-opacity="0.14"/>
${ring(78, c2 + 78, 44, (weekly?.percent ?? 0) / 100, 'violet')}
<text x="78" y="${c2 + 82}" text-anchor="middle" class="ringN">${weekly ? esc(pct(lang, Math.round(weekly.percent))) : '–'}</text>
<text x="78" y="${c2 + 98}" text-anchor="middle" class="ringL">${esc(L.limit)}</text>
<text x="150" y="${c2 + 36}" class="h2">${esc(L.accountLimits)}</text>
${limitLines}
<text x="32" y="${c2 + c2h - 14}" class="accentV">${esc(weekly ? L.weeklyLimit(pct(lang, weekly.percent)) : L.noLimits)}</text>
</svg>`
}

// ---------- text pro terminál ----------

export const textLines = (s: Stats, now: Date, lang: Lang = 'cs'): string[] => {
  const L = t(lang)
  const session = s.input + s.output + s.cacheRead + s.cacheWrite
  const days = week(lang, s.days, now)
  const max = Math.max(1, ...days.map(d => d.tokens))
  const blocks = ' ▁▂▃▄▅▆▇█'

  return [
    `${L.termToday}: ${fmt(lang, s.days[dayKey(now)] ?? 0)} ${L.tokens}${s.isWorking ? `  ${L.termWorking}` : ''}`,
    `${L.termSession}: ${fmt(lang, session)} · ${L.output} ${fmtShort(lang, s.output)} · ${L.input} ${fmtShort(lang, s.input)} · ${L.cache} ${fmtShort(lang, s.cacheRead + s.cacheWrite)} · ${L.prompts(s.prompts)}`,
    `${L.termContext}: ${s.contextPercent === null ? '–' : pct(lang, s.contextPercent)}`,
    `${L.termWeek}: ${days.map(d => `${d.label}${blocks[Math.round((d.tokens / max) * 8)] ?? ' '}`).join(' ')}`,
    ...s.limits.map(l => `${limitName(lang, l.kind)}: ${pct(lang, l.percent)}${l.resetsAt ? ` · ${L.resets} ${fmtReset(lang, l.resetsAt, now)}` : ''}`),
  ]
}

