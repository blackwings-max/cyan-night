import { expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { On } from 'claude-code'

import { detectLang, fmt, langFromLocale, parseLang } from '../hooks/i18n'

const pane = (title: string) =>
  ({
    plugin: 'cyan-night',
    component: 'Pane',
    requestId: 'spotreba',
    props: {
      title,
      isFocused: false,
      bodyColumns: 60,
      placement: 'dock',
      scroll: { offset: 0, bodyRows: 30 },
      view: {},
    },
  }) as const

const CZECH = /[ěščřžýáíéůúťďňĚŠČŘŽÝÁÍÉŮÚ]|Tato session|Limity|Dnes celkem|tokenů|V KLIDU|ŽIVĚ|KONTEXT|obnova|výstup|vstup|dotaz/

/** Společný svět: úložiště, hodiny, téma, příkazy, panel a jedna odpověď s tokeny. */
const world = (on: On, env: Record<string, string>) => {
  const registered: { name: string; description: string }[] = []
  mock.store(on)
  mock.env(on, env)
  on('clock.now', () => ({ value: new Date(2026, 10, 21, 15, 0).getTime() }))
  on('theme.set', () => ({ value: { isDrawn: true, requestId: 'look' } }))
  on('command.register', (_, e) => {
    registered.push({ name: e.name, description: e.description })

    return { value: { command: e.name } }
  })
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('session.usage', () => ({
    value: {
      startedAt: 0,
      context: { window: 200000, tokens: 68000, percent: 34 },
      rateLimits: [{ kind: 'seven_day', percentUsed: 3, resetsAt: '2026-11-25T18:39:00Z' }],
      cost: { usd: 1.25 },
    },
  }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('prompt.submit', (_, e) => e)
  on('turn.complete', () => ({ text: '' }))

  return registered
}

/** Spuštění příkazu, jako by ho člověk napsal: `/name args`. */
const run = ($: Engine, command: string, args: string) =>
  $.command.run({ command, args, origin: { kind: 'sdk' }, presentation: { isFullscreen: false, columns: 80 } })

const oneTurn = async ($: Engine) => {
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await $.prompt.submit({ text: 'ahoj', wait: false, origin: { kind: 'sdk' } })
  await $.turn.complete({
    turnId: 't1',
    reason: 'answer',
    answer: 'hotovo',
    durationMs: 1200,
    isAborted: false,
    usage: {
      input_tokens: 24,
      output_tokens: 6500,
      cache_read_input_tokens: 1_100_000,
      cache_creation_input_tokens: 30_000,
      model: 'claude-opus-5-5',
    },
  })
}

test('česky: panel sčítá tokeny tahu a ukazuje kontext', async ($, on) => {
  const registered = world(on, { CYAN_NIGHT_LANG: 'cs' })
  await oneTurn($)

  expect(registered[0]?.name).toBe('spotreba')
  expect(registered[0]?.description).toContain('Otevře panel Spotřeba Claude')

  const term = await $.ui.mount({ ...pane('Spotřeba Claude'), surface: 'terminal' })
  expect((await term.find({ type: 'Text', text: /Dnes celkem/ }))?.text).toBe('Dnes celkem: 1,14 mil. tokenů')
  expect((await term.find({ type: 'Text', text: /Kontext/ }))?.text).toBe('Kontext: 34 %')
  expect((await term.find({ type: 'Text', text: /^Session/ }))?.text).toBe(
    'Session: 1,14 mil. · výstup 6,5k · vstup 24 · cache 1,1M · 1× dotaz',
  )
  expect((await term.find({ type: 'Text', text: /^Týden/ }))?.text).toContain('Po')
  await term.unmount()

  const desk = await $.ui.mount({ ...pane('Spotřeba Claude'), surface: 'desktop' })
  const svg = String((await desk.find({ type: 'Svg' }))?.props.source)
  expect(svg).toContain('Spotřeba Claude')
  expect(svg).toContain('Tato session')
  expect(svg).toContain('Limity účtu')
  expect(svg).toContain('Týdenní limit 3 %')
  expect(svg).toContain('odhad ceny session ~ $1.25')
  await desk.unmount()
})

test('anglicky: stejné údaje, anglické texty a formát čísel', async ($, on) => {
  const registered = world(on, { CYAN_NIGHT_LANG: 'en', LANG: 'cs_CZ.UTF-8' })
  await oneTurn($)

  expect(registered[0]?.name).toBe('spotreba')
  expect(registered[0]?.description).toBe('Opens the Claude Usage panel (optional cs/en)')

  const term = await $.ui.mount({ ...pane('Claude Usage'), surface: 'terminal' })
  const lines = (await term.findAll({ type: 'Text' })).map(n => n.text)
  expect(lines[0]).toBe('Today total: 1.14M tokens')
  expect(lines).toContain('Session: 1.14M · output 6.5k · input 24 · cache 1.1M · 1 prompt')
  expect(lines).toContain('Context: 34%')
  expect(lines.find(l => l.startsWith('Week:'))).toContain('Mon')
  expect(lines.find(l => l.startsWith('Week'))).not.toContain('Po')
  for (const line of lines) {
    expect(line).not.toMatch(CZECH)
  }
  await term.unmount()

  const desk = await $.ui.mount({ ...pane('Claude Usage'), surface: 'desktop' })
  const svg = String((await desk.find({ type: 'Svg' }))?.props.source)
  for (const text of ['Claude Usage', 'This session', 'Account limits', 'Weekly limit 3%', 'Today total', 'tokens', 'IDLE', 'session cost estimate ~ $1.25', 'Mon', 'Sun']) {
    expect(svg).toContain(text)
  }
  expect(svg).not.toMatch(CZECH)
  await desk.unmount()
})

test('argument příkazu přepne jazyk pro session', async ($, on) => {
  world(on, { CYAN_NIGHT_LANG: 'cs' })
  on('command.run', (_, e) => ({ text: `builtin ${e.command} [${e.args}]` }))
  await oneTurn($)

  const toEn = await run($, 'spotreba', 'en')
  expect(toEn.text).toBe('The Claude Usage panel is open, language: English.')
  let term = await $.ui.mount({ ...pane('Claude Usage'), surface: 'terminal' })
  expect((await term.find({ type: 'Text', text: /^Today/ }))?.text).toBe('Today total: 1.14M tokens')
  await term.unmount()

  // /usage cs: přepne zpět a vestavěný /usage dostane prázdné argumenty.
  const toCs = await run($, 'usage', 'cs')
  expect(toCs.text).toBe('builtin usage []')
  term = await $.ui.mount({ ...pane('Spotřeba Claude'), surface: 'terminal' })
  expect((await term.find({ type: 'Text', text: /^Dnes/ }))?.text).toBe('Dnes celkem: 1,14 mil. tokenů')
  await term.unmount()

  const bad = await run($, 'spotreba', 'de')
  expect(bad.text).toContain('Neznámý argument')
})

test('bez CYAN_NIGHT_LANG rozhodne locale systému', async ($, on) => {
  const registered = world(on, { LANG: 'cs_CZ.UTF-8' })
  await oneTurn($)
  expect(registered[0]?.description).toContain('Otevře panel')
})

test('volba jazyka z locale a čísla', async () => {
  expect(langFromLocale('cs-CZ')).toBe('cs')
  expect(langFromLocale('sk_SK.UTF-8')).toBe('cs')
  expect(langFromLocale('en-US')).toBe('en')
  expect(langFromLocale('de_DE.UTF-8')).toBe('en')
  expect(langFromLocale('C')).toBe(null)
  expect(parseLang(' EN ')).toBe('en')
  expect(parseLang('fr')).toBe(null)
  // ruční přepínač má přednost před locale
  expect(detectLang({ override: 'en', intl: 'cs-CZ' })).toBe('en')
  expect(detectLang({ override: 'cs', intl: 'en-US' })).toBe('cs')
  // čeština/slovenština v kterémkoli zdroji → cs (Intl v pluginu často jen „en-US")
  expect(detectLang({ intl: 'sk-SK', lang: 'en_US.UTF-8' })).toBe('cs')
  expect(detectLang({ intl: 'en-US', system: 'cs_CZ' })).toBe('cs')
  expect(detectLang({ intl: 'C', lcAll: 'cs_CZ.UTF-8', lang: 'en_US.UTF-8' })).toBe('cs')
  expect(detectLang({ intl: 'en-US', system: 'de_DE', lang: 'en_GB.UTF-8' })).toBe('en')
  expect(detectLang({ intl: 'en-US' })).toBe('en')
  expect(fmt('en', 1234)).toBe('1.2k')
  expect(fmt('cs', 1234)).toBe('1,2k')
  expect(fmt('en', 2_500_000)).toBe('2.50M')
  expect(fmt('cs', 2_500_000)).toBe('2,50 mil.')
})
