# Changelog

All notable changes to CoCart Mono are listed here. Versions follow [Semantic Versioning](https://semver.org): a major version can change metrics or remove glyphs, a minor version adds glyphs, scripts or features, and a patch version fixes drawings, hinting or metadata.

<!-- On release day, rename "Unreleased" to "[X.Y.Z] - YYYY-MM-DD" with that day's date, and set the same date
     in site/mono-languages.json ("history"). The Release workflow checks both. See CONTRIBUTING.md. -->

## [Unreleased]

## [1.0.0-beta.1] - 2026-11-12

The first public beta.

- Nine weights, Thin 100 to Black 900, each with a true italic that leans 9°. All weights are drawn from one monoline skeleton.
- Variable fonts with a `wght` axis from 100 to 900, roman and italic. Their named instances match the static files.
- 40 languages in six scripts on one 600-unit cell: Latin (including Vietnamese and Welsh), Cyrillic, Greek, Thai, Armenian and Georgian.
- Full box drawing and block elements, all 256 Braille patterns, every Unicode currency sign up to ₿, and agent marks (✻ ⏺ ⎿ ❯ ◐).
- `ss02` masks API keys and tokens on screen while the text stays intact. **CoCart Mono Masked** has masking always on.
- `zero` and `ss01` for a dotted zero. `ccmp` composes decomposed accents.
- TrueType hinting (y-axis zones, stems and gasp) on the static files.
- OTF, TTF and WOFF2, with `@font-face` stylesheets that load Thai, Armenian and Georgian only when a page uses them.
- On npm as `@cocartheadless/mono`, with a `next/font` loader at `@cocartheadless/mono/next`, and on jsDelivr and unpkg through npm.

[Unreleased]: https://github.com/cocart-headless/cocart-mono-font/compare/v1.0.0-beta.1...HEAD
[1.0.0-beta.1]: https://github.com/cocart-headless/cocart-mono-font/releases/tag/v1.0.0-beta.1
