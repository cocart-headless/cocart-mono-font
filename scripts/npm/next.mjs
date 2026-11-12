// CoCart Mono for Next.js (next/font/local). Self-hosted, preloaded, no layout shift.
//
//   import { cocartMono } from "@cocartheadless/mono/next";
//   <html className={cocartMono.variable}>   then   font-family: var(--font-cocart-mono);
//
// next/font needs literal arguments, so keep this call static.
import localFont from "next/font/local";

export const cocartMono = localFont({
  src: [
    { path: "./dist/CoCart-Mono-Variable.woff2", weight: "100 900", style: "normal" },
    { path: "./dist/CoCart-Mono-Variable-Italic.woff2", weight: "100 900", style: "italic" },
  ],
  variable: "--font-cocart-mono",
  display: "swap",
  adjustFontFallback: false,
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "Liberation Mono", "monospace"],
});
