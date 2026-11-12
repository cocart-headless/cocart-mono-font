#!/usr/bin/env python3
"""Build the @cocartheadless/mono npm package from fonts/.

The package carries the web fonts only: every static WOFF2, the variable WOFF2s, the
three stylesheets rewritten to sit next to them (WOFF2 only, no TTF fallback), a
next/font/local loader, the licence and a short README. Templates live in scripts/npm/.

Layout:
  package.json  README.md  OFL.txt  next.mjs  next.d.ts
  dist/  cocart-mono.css  cocart-mono-variable.css  cocart-mono-masked.css  *.woff2

Usage:  python scripts/build_npm.py --version 1.0.0 [--out dist/npm]
Then:   npm publish dist/npm            (CI does this from the Release workflow)
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from pathlib import Path

from build_release import FONTS, ROOT, lf, zip_css

TEMPLATES = ROOT / "scripts" / "npm"
STYLESHEETS = ("cocart-mono.css", "cocart-mono-variable.css", "cocart-mono-masked.css")


def build(version: str, out: Path) -> list[Path]:
    if out.exists():
        shutil.rmtree(out)
    dist = out / "dist"
    dist.mkdir(parents=True)

    for f in sorted((FONTS / "woff2").glob("*.woff2")) + sorted((FONTS / "variable").glob("*.woff2")):
        shutil.copyfile(f, dist / f.name)
    for css in STYLESHEETS:
        text = zip_css((FONTS / "css" / css).read_text(encoding="utf-8"))
        (dist / css).write_bytes(lf(text.encode()))

    pkg = json.loads((TEMPLATES / "package.json").read_text(encoding="utf-8"))
    pkg["version"] = version
    (out / "package.json").write_text(json.dumps(pkg, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")

    readme = (TEMPLATES / "README.md").read_text(encoding="utf-8")
    readme = readme.replace("{version}", version).replace("{major}", version.split(".")[0])
    (out / "README.md").write_bytes(lf(readme.encode()))
    for name in ("next.mjs", "next.d.ts"):
        (out / name).write_bytes(lf((TEMPLATES / name).read_bytes()))
    (out / "OFL.txt").write_bytes(lf((ROOT / "OFL.txt").read_bytes()))
    return sorted(p for p in out.rglob("*") if p.is_file())


def check(out: Path) -> list[str]:
    """Every url() in the stylesheets and every path in next.mjs must resolve inside the package."""
    errors = []
    dist = out / "dist"
    for css in STYLESHEETS:
        text = (dist / css).read_text(encoding="utf-8")
        urls = re.findall(r'url\("([^"]+)"\)', text)
        if not urls:
            errors.append(f"dist/{css}: no url() references")
        for url in urls:
            if not url.endswith(".woff2"):
                errors.append(f"dist/{css}: {url} is not WOFF2")
            elif not (dist / url).resolve().is_file():
                errors.append(f"dist/{css}: {url} does not resolve")
    for path in re.findall(r'path:\s*"([^"]+)"', (out / "next.mjs").read_text(encoding="utf-8")):
        if not (out / path).resolve().is_file():
            errors.append(f"next.mjs: {path} does not resolve")
    pkg = json.loads((out / "package.json").read_text(encoding="utf-8"))
    for target in [pkg["main"], pkg["style"], *(v if isinstance(v, str) else v["default"] for k, v in pkg["exports"].items() if "*" not in k)]:
        if not (out / target).resolve().is_file():
            errors.append(f"package.json: {target} does not resolve")
    return errors


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--version", required=True, help="package version, e.g. 1.0.0 (a leading v is ignored)")
    ap.add_argument("--out", default="dist/npm", help="output folder, emptied first (default: dist/npm)")
    args = ap.parse_args()
    version = args.version.lstrip("v")
    if not re.fullmatch(r"\d+\.\d+\.\d+(?:-[0-9A-Za-z.]+)?", version):
        sys.exit(f"version must look like 1.2.3 or 1.2.3-beta.1, got {args.version!r}")

    out = (ROOT / args.out) if not Path(args.out).is_absolute() else Path(args.out)
    if out.resolve() in (ROOT.resolve(), FONTS.resolve()) or ROOT.resolve().is_relative_to(out.resolve()):
        sys.exit(f"refusing to empty {out}")
    files = build(version, out)
    errors = check(out)
    for e in errors:
        print(f"error: {e}")
    if errors:
        return 1

    size = sum(p.stat().st_size for p in files) / 1_000_000
    print(f"{out.relative_to(ROOT).as_posix() if out.is_relative_to(ROOT) else out}")
    print(f"  @cocartheadless/mono@{version} · {len(files)} files · {size:.1f} MB unpacked")
    return 0


if __name__ == "__main__":
    sys.exit(main())
