#!/usr/bin/env python3
"""Build the CoCart Mono release zip from fonts/.

The zip is reproducible: entries are sorted, timestamps and permissions are fixed and
text files use LF, so the same fonts always produce the same SHA-256.

Layout:
  CoCart-Mono-<version>/
    OFL.txt
    README.txt
    CoCart-Mono/         ttf/variable  ttf/static  ttf/scripts  woff2 (+ 2 stylesheets)
    CoCart-Mono-Masked/  ttf/variable  ttf/static  woff2 (+ 1 stylesheet)

Usage:  python scripts/build_release.py --version 1.0.0 [--out dist]
Writes  dist/CoCart-Mono-<version>.zip and dist/CoCart-Mono-<version>.zip.sha256
"""
from __future__ import annotations

import argparse
import hashlib
import re
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FONTS = ROOT / "fonts"
SCRIPTS = ("Thai", "Armenian", "Georgian")
STAMP = (1980, 1, 1, 0, 0, 0)  # fixed, so the zip is byte-for-byte reproducible


def zip_css(text: str) -> str:
    """Point a repo stylesheet at the flat woff2/ folder of the zip, WOFF2 only."""
    text = re.sub(r',url\("\.\./(?:ttf|variable)/[^"]+\.ttf[^"]*"\) format\("truetype"\)', "", text)
    return re.sub(r'url\("\.\./(?:woff2|variable)/([^"?]+)(?:\?[^"]*)?"\)', r'url("./\1")', text)


def lf(data: bytes) -> bytes:
    return data.replace(b"\r\n", b"\n")


def plan(version: str) -> list[tuple[str, bytes]]:
    top = f"CoCart-Mono-{version}"
    files: list[tuple[str, bytes]] = []

    def add(arc: str, src: Path) -> None:
        if not src.is_file():
            sys.exit(f"missing: {src.relative_to(ROOT)}")
        files.append((f"{top}/{arc}", src.read_bytes()))

    def is_script(name: str) -> bool:
        return any(name.startswith(f"CoCart-Mono-{s}-") for s in SCRIPTS)

    def is_masked(name: str) -> bool:
        return name.startswith("CoCart-Mono-Masked-")

    # Standard build
    for f in sorted((FONTS / "variable").glob("CoCart-Mono-Variable*.ttf")):
        add(f"CoCart-Mono/ttf/variable/{f.name}", f)
    for f in sorted((FONTS / "ttf").glob("*.ttf")):
        if is_masked(f.name):
            continue
        add(f"CoCart-Mono/ttf/{'scripts' if is_script(f.name) else 'static'}/{f.name}", f)
    for f in sorted((FONTS / "woff2").glob("*.woff2")):
        if not is_masked(f.name):
            add(f"CoCart-Mono/woff2/{f.name}", f)
    for f in sorted((FONTS / "variable").glob("CoCart-Mono-Variable*.woff2")):
        add(f"CoCart-Mono/woff2/{f.name}", f)
    for css in ("cocart-mono.css", "cocart-mono-variable.css"):
        files.append((f"{top}/CoCart-Mono/woff2/{css}",
                      lf(zip_css((FONTS / "css" / css).read_text(encoding="utf-8")).encode())))

    # Masked build
    for f in sorted((FONTS / "variable").glob("CoCart-Mono-Masked-Variable*.ttf")):
        add(f"CoCart-Mono-Masked/ttf/variable/{f.name}", f)
    for f in sorted((FONTS / "ttf").glob("CoCart-Mono-Masked-*.ttf")):
        add(f"CoCart-Mono-Masked/ttf/static/{f.name}", f)
    for f in sorted((FONTS / "woff2").glob("CoCart-Mono-Masked-*.woff2")):
        add(f"CoCart-Mono-Masked/woff2/{f.name}", f)
    for f in sorted((FONTS / "variable").glob("CoCart-Mono-Masked-Variable*.woff2")):
        add(f"CoCart-Mono-Masked/woff2/{f.name}", f)
    css = "cocart-mono-masked.css"
    files.append((f"{top}/CoCart-Mono-Masked/woff2/{css}",
                  lf(zip_css((FONTS / "css" / css).read_text(encoding="utf-8")).encode())))

    # Licence and readme
    files.append((f"{top}/OFL.txt", lf((ROOT / "OFL.txt").read_bytes())))
    readme = (ROOT / "scripts" / "release-README.txt").read_text(encoding="utf-8")
    files.append((f"{top}/README.txt", lf(readme.replace("{version}", version).encode())))
    return sorted(files)


def write_zip(dest: Path, files: list[tuple[str, bytes]]) -> None:
    dirs = sorted({arc.rsplit("/", i)[0] + "/" for arc, _ in files for i in range(1, arc.count("/") + 1)})
    with zipfile.ZipFile(dest, "w") as zf:
        for d in dirs:
            info = zipfile.ZipInfo(d, STAMP)
            info.create_system = 3
            info.external_attr = (0o40755 << 16) | 0x10
            zf.writestr(info, b"")
        for arc, data in files:
            info = zipfile.ZipInfo(arc, STAMP)
            info.create_system = 3
            info.external_attr = 0o100644 << 16
            info.compress_type = zipfile.ZIP_DEFLATED
            zf.writestr(info, data, compresslevel=9)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--version", required=True, help="release version, e.g. 1.0.0 (a leading v is ignored)")
    ap.add_argument("--out", default="dist", help="output folder (default: dist)")
    args = ap.parse_args()
    version = args.version.lstrip("v")
    if not re.fullmatch(r"\d+\.\d+\.\d+(?:-[0-9A-Za-z.]+)?", version):
        sys.exit(f"version must look like 1.2.3 or 1.2.3-beta.1, got {args.version!r}")

    out = (ROOT / args.out) if not Path(args.out).is_absolute() else Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    name = f"CoCart-Mono-{version}.zip"
    dest = out / name

    files = plan(version)
    write_zip(dest, files)
    digest = hashlib.sha256(dest.read_bytes()).hexdigest()
    (out / f"{name}.sha256").write_bytes(f"{digest}  {name}\n".encode())

    size = dest.stat().st_size / 1_000_000
    print(f"{dest.relative_to(ROOT).as_posix() if dest.is_relative_to(ROOT) else dest}")
    print(f"  {len(files)} files · {size:.1f} MB · sha256 {digest}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
