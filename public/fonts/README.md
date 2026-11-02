# Fonts

The site uses two Fontshare families by Indian Type Foundry:

- **Gambetta** for headings (`Gambetta-Variable.woff2`)
- **Satoshi** for body text (`Satoshi-Variable.woff2`, `Satoshi-VariableItalic.woff2`)

The font files are **not included**: Fontshare's licence does not allow redistributing them.
Until they are added, the site falls back to Georgia and the system font.

## Add them

```powershell
powershell -ExecutionPolicy Bypass -File scripts\get-fonts.ps1
```

Or download both families from fontshare.com and copy the three files above into this folder.

## Licence check before launch

Fontshare fonts are free for commercial use, but the files may not be redistributed, and one
reading of the licence forbids placing them on a public server. Read the licence file inside
each download. If self-hosting is not allowed, delete the `@font-face` block at the top of
`app/assets/css/main.css`, remove the two font `preload` links from `nuxt.config.ts`
(`app.head.link`), and add Fontshare's stylesheet there instead:

```ts
{ rel: 'stylesheet', href: 'https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&f[]=gambetta@400,500&display=swap' }
```

Never commit the `.woff2` files to a public repository (`.gitignore` already excludes them).
