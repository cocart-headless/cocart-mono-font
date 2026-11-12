#!/usr/bin/env python3
"""Assemble the GitHub Pages site and check that every local link resolves.

  site/*      -> _site/
  fonts/      -> _site/fonts/
  install.sh  -> _site/install.sh
  OFL.txt     -> _site/OFL.txt

Usage:  python scripts/build_site.py [--out _site] [--serve [PORT]]
Exits non-zero if a page, a stylesheet or the language data points at a file that is not in the build.

Preview with --serve, not by opening site/index.html directly: the pages load fonts from
fonts/…, which only exists in the build. Opened from site/, the browser falls back to a system
monospace font, so nothing renders in CoCart Mono and ss02 key masking does nothing.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKIP = ("http://", "https://", "//", "#", "data:", "mailto:", "javascript:", "{{")


def assemble(out: Path) -> None:
    if out.exists():
        shutil.rmtree(out)
    shutil.copytree(ROOT / "site", out)
    shutil.copytree(ROOT / "fonts", out / "fonts")
    shutil.copy2(ROOT / "install.sh", out / "install.sh")
    shutil.copy2(ROOT / "OFL.txt", out / "OFL.txt")
    (out / ".nojekyll").write_text("")


def local_refs(html: str) -> set[str]:
    refs = set(re.findall(r'\b(?:href|src)="([^"]+)"', html))
    # App icons are built in script: 'url("icons/apps/' + id + '.svg")'
    for app in re.findall(r"\[\s*'([a-z0-9]+)'\s*,\s*'[^']*'\s*,\s*'[^']*'\s*,\s*\[", html):
        refs.add(f"icons/apps/{app}.svg")
    return {r for r in refs if not r.startswith(SKIP)}


def check(out: Path) -> list[str]:
    problems: list[str] = []
    for page in sorted(out.glob("*.html")):
        for ref in sorted(local_refs(page.read_text(encoding="utf-8"))):
            if ref.startswith("/"):
                continue  # root-relative paths only appear in copy-paste snippets for other sites
            target = (page.parent / ref.split("?")[0].split("#")[0]).resolve()
            if not target.is_file():
                problems.append(f"{page.name}: {ref} is not in the site build")
    # The languages and review pages build their PDF links from mono-languages.json:
    # 'review-sheets/CoCart-Mono-Review-' + name.replace(/\s+/g, '-') + '.pdf'
    data = out / "mono-languages.json"
    if not data.is_file():
        problems.append("mono-languages.json is not in the site build")
    else:
        for lang in json.loads(data.read_text(encoding="utf-8")).get("languages", []):
            pdf = "review-sheets/CoCart-Mono-Review-" + re.sub(r"\s+", "-", lang["name"]) + ".pdf"
            if not (out / pdf).is_file():
                problems.append(f"mono-languages.json: {lang['name']} has no {pdf}")
    for css in sorted((out / "fonts" / "css").glob("*.css")):
        for url in re.findall(r'url\("([^"]+)"\)', css.read_text(encoding="utf-8")):
            if not (css.parent / url.split("?")[0]).resolve().is_file():
                problems.append(f"fonts/css/{css.name}: {url} is not in the site build")
    return problems


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", default="_site", help="output folder (default: _site)")
    ap.add_argument("--serve", nargs="?", type=int, const=8000, metavar="PORT",
                    help="after building, preview the site at http://localhost:PORT (default 8000)")
    args = ap.parse_args()
    out = Path(args.out) if Path(args.out).is_absolute() else ROOT / args.out

    assemble(out)
    problems = check(out)
    gha = os.environ.get("GITHUB_ACTIONS") == "true"
    for p in problems:
        print(f"::error::{p}" if gha else f"ERROR   {p}")
    files = sum(1 for p in out.rglob("*") if p.is_file())
    size = sum(p.stat().st_size for p in out.rglob("*") if p.is_file()) / 1_000_000
    print(f"Site built in {out.name}/ · {files} files · {size:.1f} MB · {len(problems)} broken link(s)")
    if args.serve is not None and not problems:
        serve(out, args.serve)
    return 1 if problems else 0


def serve(out: Path, port: int) -> None:
    import functools
    import http.server

    class Handler(http.server.SimpleHTTPRequestHandler):
        # Serve fonts with font MIME types, as GitHub Pages does.
        extensions_map = {
            **http.server.SimpleHTTPRequestHandler.extensions_map,
            ".woff2": "font/woff2", ".ttf": "font/ttf", ".otf": "font/otf",
        }

    handler = functools.partial(Handler, directory=str(out))
    with http.server.ThreadingHTTPServer(("127.0.0.1", port), handler) as httpd:
        print(f"Previewing at http://localhost:{port}/ · Ctrl+C to stop")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    sys.exit(main())
