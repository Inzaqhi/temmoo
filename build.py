#!/usr/bin/env python3
"""Gabungkan src/ menjadi satu file index.html.

Kode Temmoo diedit di folder src/ (HTML, CSS, dan JS terpisah). Skrip ini
memasukkan kembali setiap file CSS/JS ke dalam satu index.html, karena preview
aplikasi Claude dan hosting statis paling mudah dipakai dengan satu file.

Pemakaian:  python3 build.py
"""
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent
SRC = ROOT / "src"
OUT = ROOT / "index.html"
BANNER = "<!-- FILE HASIL BUILD: jangan diedit langsung. Edit file di src/ lalu jalankan: python3 build.py -->"


def inline_css(match):
    attrs, href = match.group(1), match.group(2)
    css = (SRC / href).read_text(encoding="utf-8")
    return f"<style{attrs}>{css}</style>"


def inline_js(match):
    attrs, src = match.group(1), match.group(2)
    js = (SRC / src).read_text(encoding="utf-8")
    return f"<script{attrs}>{js}</script>"


def build():
    html = (SRC / "index.html").read_text(encoding="utf-8")
    html = re.sub(r'<link((?:\s(?!rel=|href=)[^\s>]+)*) rel="stylesheet" href="(styles/[^"]+)">', inline_css, html)
    html = re.sub(r'<script((?:\s(?!src=)[^\s>]+)*) src="(scripts/[^"]+)"></script>', inline_js, html)
    leftover = re.findall(r'(?:href|src)="(?:styles|scripts)/[^"]+"', html)
    if leftover:
        raise SystemExit(f"Gagal menggabungkan: {leftover}")
    doctype = "<!doctype html>"
    if not html.startswith(doctype):
        raise SystemExit("src/index.html harus diawali <!doctype html>")
    OUT.write_text(doctype + BANNER + html[len(doctype):], encoding="utf-8")
    print(f"index.html dibuat ({OUT.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    build()
