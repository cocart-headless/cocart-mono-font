CoCart Mono {version}
https://cocart-headless.github.io/cocart-mono-font/

Two builds, the same drawings:
  CoCart-Mono/         Standard. Turn on ss02 to mask API keys, zero or ss01 for a dotted zero.
  CoCart-Mono-Masked/  Key masking always on, for apps without font-feature settings.

In each build:
  ttf/variable/  2 files, Roman and Italic, wght 100-900, includes Thai. Install these.
  ttf/static/    18 files, every weight, hinted for Windows. For apps that ignore variable fonts.
  ttf/scripts/   Thai, Armenian and Georgian static files (CoCart-Mono only).
  woff2/         Every weight plus a stylesheet, for the web.

Install
  macOS    Open ttf/variable, select both files, double-click, then Install.
  Windows  Open ttf/variable, select both files, right-click, then Install for all users.
  Linux    Copy ttf/variable into ~/.local/share/fonts, then run fc-cache -f.
  Or run   curl -fsSL https://cocart-headless.github.io/cocart-mono-font/install.sh | sh

Restart your terminal or editor afterwards.

Source, issues and releases: https://github.com/cocart-headless/cocart-mono-font

License: SIL Open Font License 1.1, see OFL.txt. Bundle it, embed it, modify it.
Just don't sell the font on its own.
