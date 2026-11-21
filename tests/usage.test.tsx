import { expect, test } from 'claude-code/testing'

const PANE = {
  plugin: 'cyan-night',
  component: 'Pane',
  requestId: 'spotreba',
  props: {
    title: 'Spotřeba Claude',
    isFocused: false,
    bodyColumns: 60,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 30 },
    view: {},
  },
} as const

test('panel sčítá tokeny tahu a ukazuje kontext', async ($, on) => {
  const store: Record<string, unknown> = {}
  on('store.get', (_, e) => ({ value: store[e.key] }))
  on('store.set', (_, e) => {
    store[e.key] = e.value

    return { value: undefined }
  })
  on('clock.now', () => ({ value: new Date(2026, 10, 21, 15, 0).getTime() }))
  on('theme.set', () => ({ value: { isDrawn: true, requestId: 'look' } }))
  on('command.register', () => ({ value: { command: 'spotreba' } }))
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

  const term = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect((await term.find({ type: 'Text', text: /Dnes celkem/ }))?.text).toBe('Dnes celkem: 1,14 mil. tokenů')
  expect((await term.find({ type: 'Text', text: /Kontext/ }))?.text).toBe('Kontext: 34 %')
  await term.unmount()

  const desk = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await desk.find({ type: 'Svg' })).toBeTruthy()
  await desk.unmount()
})
