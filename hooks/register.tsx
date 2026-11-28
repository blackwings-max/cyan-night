import { atom, read, update } from 'claude-code'
import type { Register, ThemeSetArgs } from 'claude-code'

import { makeColors } from './make-colors.js'
import { detectLang, parseLang, t } from './i18n'
import type { Lang } from './i18n'
import { buildSvg, CARD, DAYS_KEY, dayKey, EMPTY, PANE, textLines } from './usage'

// Stav panelu pro session; tag změnit, když se změní tvar Stats.
const stats = atom({ plugin: 'cyan-night', key: 'stats' } as const, EMPTY, { shape: 'stats-1' })

// Jazyk panelu: `auto` z CYAN_NIGHT_LANG / locale, `manual` z argumentu příkazu (jen pro session).
const language = atom({ plugin: 'cyan-night', key: 'language' } as const, { auto: 'en', manual: null }, { shape: 'lang-1' })

const currentLang = (l: { auto: Lang; manual: Lang | null }): Lang => l.manual ?? l.auto

const envOrUndefined = (p: Promise<string | undefined>) => p.catch(() => undefined)

// Grafitová noc s cyan akcenty — tmavé téma Cyan Night.
const { theme, problems } = makeColors({
  label: 'Cyan Night',
  only: 'dark',
  roles: { accent: '#00c8f0', danger: '#ff5a5f', success: '#3fd68a', warning: '#ffb547', pro: '#8b7bff' },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#0a0f14',
        'surface-1': '#0f161d',
        'surface-2': '#131c25',
        'surface-3': '#18222c',
        'text-primary': '#e8f4f8',
        'text-secondary': '#b4c6d0',
        'text-muted': '#8ba0ac',
      },
    },
  },
})

// Pomalé barevné záře a jemná mřížka. Bez odkazů url(#…):
// každá záře je stoh průhledných elips, takže měkký střed vznikne sám.
const orb = (cls: string, cx: number, cy: number, rx: number, ry: number, color: string, peak: number) => {
  const steps = 12
  const layers = Array.from({ length: steps }, (_, i) => {
    const k = 1 - i / steps
    return `<ellipse cx="${cx}" cy="${cy}" rx="${(rx * k).toFixed(0)}" ry="${(ry * k).toFixed(0)}" fill="${color}" fill-opacity="${(peak / steps).toFixed(3)}"/>`
  })
  return `<g class="${cls}">${layers.join('')}</g>`
}

const grid = () => {
  const d: string[] = []
  for (let x = 80; x < 1600; x += 80) d.push(`M${x} 0V1000`)
  for (let y = 80; y < 1000; y += 80) d.push(`M0 ${y}H1600`)
  return `<path d="${d.join('')}" fill="none" stroke="#00c8f0" stroke-opacity="0.06" stroke-width="1"/>`
}


const SCENE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
<style>
.o1 { animation: drift1 38s ease-in-out infinite alternate; }
.o2 { animation: drift2 46s ease-in-out infinite alternate; }
.o3 { animation: drift3 54s ease-in-out infinite alternate; }
.o4 { animation: drift4 62s ease-in-out infinite alternate; }
.o5 { animation: drift5 70s ease-in-out infinite alternate; }
@keyframes drift1 { from { transform: translate(0px, 0px); } to { transform: translate(180px, 90px); } }
@keyframes drift2 { from { transform: translate(0px, 0px); } to { transform: translate(-220px, -70px); } }
@keyframes drift3 { from { transform: translate(0px, 0px); } to { transform: translate(120px, -140px); } }
@keyframes drift4 { from { transform: translate(0px, 0px); } to { transform: translate(-160px, 120px); } }
@keyframes drift5 { from { transform: translate(0px, 0px); } to { transform: translate(200px, -60px); } }
</style>
<rect width="1600" height="1000" fill="#0a0f14"/>
${grid()}
<!-- strong cyan glow, top left -->
<circle cx="300" cy="250" r="260" fill="#00c8f0" fill-opacity="0.8"/>
${orb('o1', 260, 180, 520, 380, '#00c8f0', 0.45)}
${orb('o2', 1380, 820, 600, 420, '#0077b6', 0.42)}
${orb('o3', 1250, 160, 380, 280, '#00c8f0', 0.3)}
${orb('o4', 1450, 420, 420, 320, '#ff8a4c', 0.28)}
${orb('o5', 420, 860, 480, 340, '#8b5cf6', 0.32)}
<path d="M0 1000 L1600 860" stroke="#00c8f0" stroke-opacity="0.1" stroke-width="2" fill="none"/>
<path d="M0 1000 L1600 900" stroke="#00c8f0" stroke-opacity="0.06" stroke-width="1" fill="none"/>
</svg>`

const LOOK: ThemeSetArgs = {
  colors: theme,
  overrideColorScheme: 'dark',
  backdrop: { scene: 'cyan-night', glass: { blur: 24, opacity: 0.3 } },
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const unpainted = problems.find(line => line.startsWith("Desktop won't paint"))

    if (unpainted !== undefined) {
      $.ui.toast(unpainted)
    }
    const set = await $.theme.set(LOOK)

    if (!set.isDrawn) {
      $.ui.status(set.reason)
    }

    // Jazyk: CYAN_NIGHT_LANG má přednost před locale systému (Intl, jazyk macOS, LC_ALL, LANG).
    const override = await envOrUndefined($.env.get('CYAN_NIGHT_LANG'))
    // Jazyk macOS (např. „cs_CZ"): Intl v pluginu vrací jen „en-US" a desktop nemá LANG.
    let system: string | undefined
    if (parseLang(override) === null) {
      try {
        const info = await $.session.info()
        if (info.platform === 'macos' && info.isHosted !== true) {
          const r = await $.process.run(['defaults', 'read', '-g', 'AppleLocale'], { timeoutMs: 2000 })
          system = r.exitCode === 0 ? r.stdout.trim() : undefined
        }
      } catch {
        system = undefined
      }
    }
    const auto = detectLang({
      override,
      system,
      lcAll: await envOrUndefined($.env.get('LC_ALL')),
      lang: await envOrUndefined($.env.get('LANG')),
    })
    await update($, language, l => ({ ...l, auto }))
    const L = t(currentLang(await read($, language)))

    // Panel se spotřebou: dny ze všech sessions, první měření, příkaz a otevření.
    const saved = (await $.store.get(DAYS_KEY)) as Record<string, number> | undefined
    const u = await $.session.usage()
    await update($, stats, s => ({
      ...s,
      days: saved ?? {},
      contextPercent: u.context.percent ?? null,
      limits: u.rateLimits.map(l => ({ kind: l.kind, percent: l.percentUsed, resetsAt: l.resetsAt ?? null })),
      costUsd: u.cost ? u.cost.usd : null,
    }))
    await $.command.register({ name: 'spotreba', description: L.commandDescription, argumentHint: '[cs|en]' })
    void $.ui.open({ id: PANE, title: L.title })

    return next(e)
  })

  // /spotreba [cs|en]: otevře panel; argument přepne jazyk pro tuto session.
  on('command.run', { command: 'spotreba' }, async ($, e) => {
    const arg = e.args.trim()
    const manual = parseLang(arg)
    if (manual !== null) {
      await update($, language, l => ({ ...l, manual }))
    }
    const L = t(currentLang(await read($, language)))
    await $.ui.open({ id: PANE, title: L.title })

    if (arg !== '' && manual === null) {
      return { text: `${L.badArg(arg)} ${L.opened}` }
    }

    return { text: manual !== null ? L.openedLang : L.opened }
  })

  // /usage je vestavěný příkaz Claude Code, jiný příkaz se jménem `usage` registrovat nejde.
  // Alias proto obaluje vestavěný /usage: otevře panel (a /usage cs|en přepne jazyk),
  // pak nechá proběhnout původní výpis, aby o něj nikdo nepřišel.
  on('command.run', { command: 'usage' }, async ($, e, next) => {
    const manual = parseLang(e.args)
    if (manual !== null) {
      await update($, language, l => ({ ...l, manual }))
    }
    const L = t(currentLang(await read($, language)))
    await $.ui.open({ id: PANE, title: L.title }).catch(() => undefined)

    return next(manual !== null ? { ...e, args: '' } : e)
  }).catch(($, e, next) => next(e))

  on('prompt.submit', async ($, e, next) => {
    // Statistika nesmí nikdy zdržet ani zablokovat odeslání zprávy.
    await update($, stats, s => ({ ...s, isWorking: true, prompts: s.prompts + 1 })).catch(() => undefined)

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const t = e.usage
    const isMain = e.agentId === undefined
    let days: Record<string, number> | undefined

    if (t) {
      const add = t.input_tokens + t.output_tokens + t.cache_read_input_tokens + t.cache_creation_input_tokens
      const key = dayKey(new Date(await $.clock.now()))
      // Dny sdílí všechny sessions: přečíst čerstvě, přičíst, uložit posledních 60 dnů.
      const saved = ((await $.store.get(DAYS_KEY)) as Record<string, number> | undefined) ?? {}
      const all = { ...saved, [key]: (saved[key] ?? 0) + add }
      days = Object.fromEntries(Object.entries(all).sort(([a], [b]) => (a < b ? 1 : -1)).slice(0, 60))
      await $.store.set(DAYS_KEY, days)
    }
    const u = await $.session.usage()
    await update($, stats, s => ({
      ...s,
      input: s.input + (t?.input_tokens ?? 0),
      output: s.output + (t?.output_tokens ?? 0),
      cacheRead: s.cacheRead + (t?.cache_read_input_tokens ?? 0),
      cacheWrite: s.cacheWrite + (t?.cache_creation_input_tokens ?? 0),
      days: days ?? s.days,
      isWorking: isMain ? false : s.isWorking,
      contextPercent: u.context.percent ?? s.contextPercent,
      limits: u.rateLimits.map(l => ({ kind: l.kind, percent: l.percentUsed, resetsAt: l.resetsAt ?? null })),
      costUsd: u.cost ? u.cost.usd : s.costUsd,
    }))

    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const s = await read($, stats)
    const lang = currentLang(await read($, language))
    const now = new Date(await $.clock.now())

    if (e.surface === 'terminal') {
      const { Box, Text } = $.ui.resolve(e)

      return (
        <Box flexDirection="column">
          {textLines(s, now, lang).map(line => (
            <Text>{line}</Text>
          ))}
        </Box>
      )
    }
    const { Svg } = $.ui.resolve(e)

    return (
      <Svg
        source={buildSvg(s, now, lang)}
        alt={textLines(s, now, lang).join('. ')}
        width={CARD.width}
        height={CARD.height}
        isInteractive
      />
    )
  })

  on('ui.render', { component: 'Backdrop' }, async ($, e, next) => {
    if ((e.surface !== 'desktop' && e.surface !== 'mobile') || e.props.scene !== 'cyan-night') {
      return next(e)
    }
    const { Svg } = $.ui.resolve(e)
    const L = t(currentLang(await read($, language)))

    return <Svg source={SCENE} alt={L.backdropAlt} />
  })
}
