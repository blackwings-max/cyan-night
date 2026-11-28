# Cyan Night

*English: [README.en.md](README.en.md)*

Mod pro Claude Code: tmavé grafitové téma s cyan akcenty, jemně animovaná scéna za konverzací a panel **Spotřeba Claude**.

- **Téma:** tmavé pozadí s modrým nádechem, cyan akcent, čitelné barvy pro chyby, úspěch a varování.
- **Scéna:** pomalu plující barevné záře a jemná mřížka pod sklem (desktopová a mobilní aplikace).
- **Panel Spotřeba Claude:** tokeny dnes a v této session (výstup, vstup, cache, počet dotazů), zaplnění kontextu, sloupce Po–Ne a limity účtu s časem obnovy. Otevře se při startu session, znovu příkazem `/spotreba`. V terminálu ukazuje stejné údaje textem.

- **Jazyk:** panel mluví česky nebo anglicky podle jazyka systému (čeština a slovenština → česky, jinak anglicky). Přepneš ho proměnnou `CYAN_NIGHT_LANG=cs|en` nebo pro aktuální session příkazem `/spotreba en` či `/spotreba cs`.
- **Alias `/usage`:** otevře stejný panel a pak zobrazí i vestavěný výpis `/usage` z Claude Code. Jazyk přepínej přes `/spotreba en`, protože desktopová aplikace u `/usage` argument nepustí.

Odhad ceny v panelu je jen orientační, nejde o vyúčtování.

## Instalace

Na promptu sezení v terminálu:

```
/plugin install cyan-night --marketplace blackwings-max/cyan-night
```

Na dotaz `Add marketplace?` odpověz `y` a pak vyber rozsah (scope) Enterem.

Ze shellu:

```bash
claude plugin install cyan-night --marketplace blackwings-max/cyan-night
```

V desktopové aplikaci, kde `/plugin` neběží: klikni na **+** vedle pole pro zprávu, pak **Plugins**, **Add marketplace** s `blackwings-max/cyan-night` a nakonec **Add plugin**.
