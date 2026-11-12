#!/bin/sh
# CoCart Mono installer. Read it before you run it.
#
#   curl -fsSL https://cocart-headless.github.io/cocart-mono-font/install.sh | sh
#
# Downloads the latest release zip from GitHub, checks it against the SHA-256 published
# with the release, then copies both builds (CoCart Mono and CoCart Mono Masked, variable,
# roman and italic) into your user fonts folder. No sudo.
#
# Pin a version:  curl -fsSL .../install.sh | COCART_MONO_VERSION=1.0.0 sh
set -eu

REPO="cocart-headless/cocart-mono-font"
SITE="https://cocart-headless.github.io/cocart-mono-font"

case "$(uname -s)" in
  Darwin) DEST="$HOME/Library/Fonts" ;;
  Linux)  DEST="${XDG_DATA_HOME:-$HOME/.local/share}/fonts/CoCart-Mono" ;;
  *) echo "On Windows, download the zip from $SITE"; exit 1 ;;
esac

for cmd in curl unzip; do
  command -v "$cmd" >/dev/null 2>&1 || { echo "✘ $cmd is required. Install it and try again."; exit 1; }
done

VERSION="${COCART_MONO_VERSION:-}"
if [ -z "$VERSION" ]; then
  # /releases/latest redirects to /releases/tag/vX.Y.Z
  LATEST="$(curl -fsSLI -o /dev/null -w '%{url_effective}' "https://github.com/$REPO/releases/latest")"
  VERSION="${LATEST##*/v}"
fi
VERSION="${VERSION#v}"
case "$VERSION" in
  ''|*[!0-9.]*) echo "✘ Couldn't find the latest release. Set COCART_MONO_VERSION=x.y.z and try again."; exit 1 ;;
esac

ZIP="CoCart-Mono-$VERSION.zip"
BASE="https://github.com/$REPO/releases/download/v$VERSION"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT

echo "CoCart Mono $VERSION · a free font from CoCart · ${SITE#https://}"
curl -fsSL "$BASE/$ZIP" -o "$TMP/$ZIP"
curl -fsSL "$BASE/$ZIP.sha256" -o "$TMP/$ZIP.sha256"

SHA256="$(cut -d' ' -f1 < "$TMP/$ZIP.sha256")"
if command -v sha256sum >/dev/null 2>&1; then GOT="$(sha256sum "$TMP/$ZIP" | cut -d' ' -f1)"
else GOT="$(shasum -a 256 "$TMP/$ZIP" | cut -d' ' -f1)"; fi
if [ -z "$SHA256" ] || [ "$GOT" != "$SHA256" ]; then echo "✘ Checksum mismatch. Nothing installed."; exit 1; fi

SIZE="$(wc -c < "$TMP/$ZIP" | awk '{ printf "%.1f MB", $1 / 1000000 }')"
echo "✓ Downloaded   $SIZE · sha-256 $(echo "$GOT" | cut -c1-10) verified"

unzip -q "$TMP/$ZIP" -d "$TMP"
mkdir -p "$DEST"
for B in CoCart-Mono CoCart-Mono-Masked; do cp "$TMP/CoCart-Mono-$VERSION/$B/ttf/variable/"*.ttf "$DEST/"; done
if command -v fc-cache >/dev/null 2>&1; then fc-cache -f "$DEST" >/dev/null; fi

echo "✓ Installed    CoCart Mono and CoCart Mono Masked"
echo "               variable 100–900, roman and italic"
echo "               $DEST"
echo "Restart your terminal."
