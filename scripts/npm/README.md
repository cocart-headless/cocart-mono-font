# CoCart Mono

A free monospaced typeface for storefronts, carts and command lines. Nine weights with true italics, a variable font, 40 languages in six scripts, and every glyph on one 600-unit cell.

**[Specimen](https://cocart-headless.github.io/cocart-mono-font/)** · **[Desktop download](https://github.com/cocart-headless/cocart-mono-font/releases/latest)** · **[Issues](https://github.com/cocart-headless/cocart-mono-font/issues/new/choose)**

This package holds the web fonts (WOFF2) and their stylesheets. Version {version}.

## Install

```sh
npm i @cocartheadless/mono
```

## Use

Import one stylesheet in your entry file, then set the family.

```js
import "@cocartheadless/mono";               // CoCart Mono: nine weights + italics
// import "@cocartheadless/mono/variable.css"; // CoCart Mono VF: two variable files
// import "@cocartheadless/mono/masked.css";   // CoCart Mono Masked (+ VF)
```

```css
.price, .sku, .order-number, code, pre {
  font-family: "CoCart Mono", ui-monospace, monospace;
}
```

| Import | Family | What it loads |
| --- | --- | --- |
| `@cocartheadless/mono` | `CoCart Mono` | Static weights 100–900 and italics. Thai, Armenian and Georgian load only when a page uses them. |
| `@cocartheadless/mono/variable.css` | `CoCart Mono VF` | Roman and italic variable files, weights 100–900. |
| `@cocartheadless/mono/masked.css` | `CoCart Mono Masked`, `CoCart Mono Masked VF` | Key masking always on. For docs, dashboards and screen recordings, never the storefront. |

The stylesheets are also at `@cocartheadless/mono/dist/*.css`, next to the `.woff2` files.

### Next.js

```tsx
// app/layout.tsx
import { cocartMono } from "@cocartheadless/mono/next";

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={cocartMono.variable}>
      <body>{children}</body>
    </html>
  );
}
```

```css
/* globals.css */
.price { font-family: var(--font-cocart-mono); }
```

This uses `next/font/local` with the variable files, so the font is self-hosted and preloaded.

### CDN

No install needed. Pin the major version so a future release can't change your metrics.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@cocartheadless/mono@{major}/dist/cocart-mono.css">
```

## OpenType features

```css
.dotted { font-feature-settings: "zero" 1; }  /* dotted zero */
.secret { font-feature-settings: "ss02" 1; }  /* masks API keys on screen */
```

Masking is a visual aid, not a security control: the text keeps every character.

## License

[SIL Open Font License 1.1](OFL.txt). Use it, bundle it and embed it in anything, commercial or not. You can't sell the fonts on their own.
