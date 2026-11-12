#!/usr/bin/env python3
"""Validate the CoCart Mono font binaries and stylesheets.

Checks, per file:
  * the file is in the expected inventory (and nothing in the inventory is missing)
  * it opens, and its format matches its extension (OTF = CFF, TTF/WOFF2 = TrueType)
  * family, weight class and italic bits match the file name
  * every glyph advance is 0 or the 600-unit cell, and post.isFixedPitch is set
  * the font revision is the same across every file (and matches --version, if given),
    and name ID 5 reads "Version X.YYY" to match it
  * WOFF2 and OTF files map the same characters as their TTF twin
  * variable fonts carry a wght axis from 100 to 900
Then every url() in fonts/css/*.css must resolve to a file.

Usage:  python scripts/check_fonts.py [--version 1.0.0] [--strict]
        --strict turns warnings into errors.
"""
from __future__ import annotations

import argparse
import os
import re
import sys
from collections import defaultdict
from pathlib import Path

from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
FONTS = ROOT / "fonts"

UPM = 1000
CELL = 600
WEIGHTS = {
    "Thin": 100, "ExtraLight": 200, "Light": 300, "Regular": 400, "Medium": 500,
    "SemiBold": 600, "Bold": 700, "ExtraBold": 800, "Black": 900,
}
# file-name prefix -> typographic family name (name ID 16, falling back to ID 1)
FAMILIES = {
    "CoCart-Mono": "CoCart Mono",
    "CoCart-Mono-Masked": "CoCart Mono Masked",
    "CoCart-Mono-Thai": "CoCart Mono Thai",
    "CoCart-Mono-Armenian": "CoCart Mono Armenian",
    "CoCart-Mono-Georgian": "CoCart Mono Georgian",
}
VARIABLE_FAMILIES = {"CoCart-Mono": "CoCart Mono", "CoCart-Mono-Masked": "CoCart Mono Masked"}
STATIC_DIRS = {"otf": ".otf", "ttf": ".ttf", "woff2": ".woff2"}

GHA = os.environ.get("GITHUB_ACTIONS") == "true"


class Report:
    def __init__(self, strict: bool):
        self.strict = strict
        self.errors: list[str] = []
        self.warnings: list[str] = []

    def error(self, path: Path | None, msg: str) -> None:
        self._emit("error", path, msg)
        self.errors.append(f"{self._rel(path)}: {msg}" if path else msg)

    def warn(self, path: Path | None, msg: str) -> None:
        if self.strict:
            return self.error(path, msg)
        self._emit("warning", path, msg)
        self.warnings.append(f"{self._rel(path)}: {msg}" if path else msg)

    @staticmethod
    def _rel(path: Path | None) -> str:
        return path.relative_to(ROOT).as_posix() if path else ""

    def _emit(self, level: str, path: Path | None, msg: str) -> None:
        if GHA:
            loc = f" file={self._rel(path)}" if path else ""
            print(f"::{level}{loc}::{msg}")
        else:
            print(f"{level.upper():7} {self._rel(path)}  {msg}")


def expected_inventory() -> dict[Path, dict]:
    """Every file that should exist under fonts/, with what it should contain."""
    inv: dict[Path, dict] = {}
    for prefix, family in FAMILIES.items():
        for wname, wclass in WEIGHTS.items():
            for italic in (False, True):
                stem = f"{prefix}-{wname}{'-Italic' if italic else ''}"
                for folder, ext in STATIC_DIRS.items():
                    inv[FONTS / folder / f"{stem}{ext}"] = dict(
                        family=family, weight=wclass, italic=italic, variable=False, ext=ext, stem=stem)
    for prefix, family in VARIABLE_FAMILIES.items():
        for italic in (False, True):
            stem = f"{prefix}-Variable{'-Italic' if italic else ''}"
            for ext in (".ttf", ".woff2"):
                inv[FONTS / "variable" / f"{stem}{ext}"] = dict(
                    family=family, weight=None, italic=italic, variable=True, ext=ext, stem=stem)
    return inv


def check_inventory(rep: Report, inv: dict[Path, dict]) -> None:
    found = {p for p in FONTS.rglob("*") if p.is_file() and p.suffix in (".otf", ".ttf", ".woff2")}
    for p in sorted(set(inv) - found):
        rep.error(p, "missing font file")
    for p in sorted(found - set(inv)):
        rep.error(p, "unexpected font file (wrong folder or name?)")
    for p in sorted(p for p in FONTS.rglob("*") if p.is_file() and p.suffix not in (".otf", ".ttf", ".woff2")):
        if p.parent != FONTS / "css" or p.suffix != ".css":
            rep.error(p, "only font files belong in fonts/ (stylesheets go in fonts/css/)")


def family_name(font: TTFont) -> str:
    name = font["name"]
    return name.getDebugName(16) or name.getDebugName(1) or ""


def check_font(rep: Report, path: Path, meta: dict, revisions: dict, cmaps: dict) -> None:
    try:
        font = TTFont(path)
    except Exception as exc:  # noqa: BLE001
        rep.error(path, f"cannot be opened: {exc}")
        return

    # Outline format
    is_cff = font.sfntVersion == "OTTO"
    if meta["ext"] == ".otf" and not is_cff:
        rep.error(path, "OTF file does not contain CFF outlines")
    if meta["ext"] in (".ttf", ".woff2") and is_cff:
        rep.error(path, "expected TrueType outlines, found CFF")
    if meta["ext"] == ".woff2" and font.flavor != "woff2":
        rep.error(path, "file is not WOFF2-compressed")

    if font["head"].unitsPerEm != UPM:
        rep.error(path, f"unitsPerEm is {font['head'].unitsPerEm}, expected {UPM}")

    # Names and style bits
    fam = family_name(font)
    if fam != meta["family"]:
        rep.error(path, f"family name is {fam!r}, expected {meta['family']!r}")

    os2 = font["OS/2"]
    italic_bit = bool(os2.fsSelection & 1)
    if italic_bit != meta["italic"]:
        rep.error(path, f"OS/2 italic bit is {italic_bit}, file name says {meta['italic']}")
    if meta["weight"] is not None and os2.usWeightClass != meta["weight"]:
        rep.error(path, f"usWeightClass is {os2.usWeightClass}, expected {meta['weight']}")

    # Monospace
    advances = {w for w, _ in font["hmtx"].metrics.values()}
    if not advances <= {0, CELL}:
        rep.error(path, f"glyph advances {sorted(advances - {0, CELL})} break the {CELL}-unit cell")
    if not font["post"].isFixedPitch:
        rep.error(path, "post.isFixedPitch is not set")
    if os2.panose.bProportion != 9:
        rep.warn(path, f"PANOSE proportion is {os2.panose.bProportion}, 9 (monospaced) is recommended")

    # Licence fields
    lic = (font["name"].getDebugName(13) or "").strip()
    if not lic:
        rep.warn(path, "name ID 13 (licence description) is empty")
    elif "Open Font License" not in lic and "OFL" not in lic:
        rep.error(path, "name ID 13 does not mention the SIL Open Font License")

    # Variable axes
    if meta["variable"]:
        if "fvar" not in font:
            rep.error(path, "variable font has no fvar table")
        else:
            axes = {a.axisTag: (a.minValue, a.maxValue) for a in font["fvar"].axes}
            if axes.get("wght") != (100, 900):
                rep.error(path, f"wght axis is {axes.get('wght')}, expected (100, 900)")
    elif "fvar" in font:
        rep.error(path, "static font contains an fvar table")

    # Version string: OpenType form "Version X.YYY", matching head.fontRevision
    want = f"Version {font['head'].fontRevision:.3f}"
    for rec in font["name"].names:
        if rec.nameID == 5 and not rec.toUnicode().startswith(want):
            rep.error(path, f"name ID 5 is {rec.toUnicode()!r} (platform {rec.platformID}), expected {want!r}")

    revisions[round(font["head"].fontRevision, 3)].append(path)
    cmaps[(meta["stem"], meta["ext"])] = set(font.getBestCmap() or {})
    font.close()


def check_parity(rep: Report, cmaps: dict) -> None:
    for (stem, ext), chars in cmaps.items():
        if ext == ".ttf":
            continue
        twin = cmaps.get((stem, ".ttf"))
        if twin is None:
            continue
        if chars != twin:
            folder = "variable" if "Variable" in stem else ext.lstrip(".")
            missing, extra = len(twin - chars), len(chars - twin)
            rep.error(FONTS / folder / f"{stem}{ext}",
                      f"character map differs from the TTF ({missing} missing, {extra} extra)")


def check_revisions(rep: Report, revisions: dict, version: str | None) -> None:
    if len(revisions) > 1:
        summary = ", ".join(f"{r:.3f} ({len(v)} files)" for r, v in sorted(revisions.items()))
        rep.error(None, f"font revisions differ across files: {summary}")
    if version and revisions:
        major = version.split(".")[0]
        for rev, paths in revisions.items():
            if f"{rev:.3f}".split(".")[0] != major:
                rep.error(paths[0], f"head.fontRevision {rev:.3f} does not match release {version}")


def check_css(rep: Report) -> None:
    sheets = sorted((FONTS / "css").glob("*.css"))
    if not sheets:
        rep.error(FONTS / "css", "no stylesheets found")
    for css in sheets:
        text = css.read_text(encoding="utf-8")
        urls = re.findall(r'url\("([^"]+)"\)', text)
        if not urls:
            rep.error(css, "stylesheet has no url() references")
        for url in urls:
            target = (css.parent / url.split("?")[0]).resolve()
            if not target.is_file():
                rep.error(css, f"url({url}) does not resolve to a file")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--version", help="release version the fonts must match, e.g. 1.0.0")
    ap.add_argument("--strict", action="store_true", help="treat warnings as errors")
    args = ap.parse_args()
    version = args.version.lstrip("v") if args.version else None

    rep = Report(args.strict)
    inv = expected_inventory()
    check_inventory(rep, inv)

    revisions: dict[float, list[Path]] = defaultdict(list)
    cmaps: dict[tuple[str, str], set[int]] = {}
    for path, meta in sorted(inv.items()):
        if path.is_file():
            check_font(rep, path, meta, revisions, cmaps)
    check_parity(rep, cmaps)
    check_revisions(rep, revisions, version)
    check_css(rep)

    checked = sum(1 for p in inv if p.is_file())
    rev = ", ".join(f"{r:.3f}" for r in sorted(revisions)) or "n/a"
    print(f"\nChecked {checked} font files · revision {rev} · "
          f"{len(rep.errors)} error(s) · {len(rep.warnings)} warning(s)")

    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary, "a", encoding="utf-8") as fh:
            fh.write("### Font checks\n\n")
            fh.write(f"| Files | Revision | Errors | Warnings |\n|---|---|---|---|\n"
                     f"| {checked} | {rev} | {len(rep.errors)} | {len(rep.warnings)} |\n\n")
            if rep.warnings:
                grouped: dict[str, int] = defaultdict(int)
                for w in rep.warnings:
                    grouped[w.split(": ", 1)[1]] += 1
                fh.write("<details><summary>Warnings</summary>\n\n")
                for msg, n in sorted(grouped.items()):
                    fh.write(f"- {msg} — {n} file(s)\n")
                fh.write("\n</details>\n")
    return 1 if rep.errors else 0


if __name__ == "__main__":
    sys.exit(main())
