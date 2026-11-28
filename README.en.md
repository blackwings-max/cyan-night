# Cyan Night

*Česky: [README.md](README.md)*

A mod for Claude Code: a dark graphite theme with cyan accents, a slowly animated scene behind the conversation, and a **usage panel** that shows what you are actually burning.

- **Theme:** dark background with a blue tint, cyan accent, readable colours for errors, success and warnings.
- **Scene:** slowly drifting colour glows and a subtle grid under glass (desktop and mobile apps).
- **Usage panel ("Claude Usage"):** tokens today and in the current session (output, input, cache, number of requests), context fill, a Mon–Sun bar chart and your account limits with reset time. It opens when a session starts and again with `/spotreba`. In the terminal it shows the same numbers as text.

- **Language:** the panel speaks English or Czech, picked automatically from your system language (Czech or Slovak → Czech, anything else → English). Override it with `CYAN_NIGHT_LANG=cs|en`, or for the current session with `/spotreba en` / `/usage en`.
- **`/usage` alias:** `/usage` opens the same panel (and takes `cs` / `en`), then shows Claude Code's built-in `/usage` output as well.

The cost estimate in the panel is indicative only, not a bill.

Everything is read from local Claude Code files. Nothing is sent anywhere.

## Install

At the session prompt in the terminal:

```
/plugin install cyan-night --marketplace blackwings-max/cyan-night
```

Answer `y` to `Add marketplace?`, then pick the scope with Enter.

From a shell:

```bash
claude plugin install cyan-night --marketplace blackwings-max/cyan-night
```

In the desktop app, where `/plugin` does not run: click **+** next to the message box, then **Plugins**, **Add marketplace** with `blackwings-max/cyan-night`, and finally **Add plugin**.

## Commands

| Command | What it does |
| --- | --- |
| `/spotreba [cs\|en]` | Opens the usage panel again; `cs` / `en` switches its language for this session |
| `/usage [cs\|en]` | Alias: opens the same panel, then runs Claude Code's built-in `/usage` |

## Compatibility

Cyan Night is a Claude Code plugin. The theme and the panel work only in Claude Code (terminal, desktop and mobile apps).

## License

MIT © 2026 Jan Stadtherr (Black Wings)
