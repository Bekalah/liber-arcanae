import os
import io
import re
import pathlib
import contextlib

import pytest

REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]

@pytest.fixture(scope="session")
def index_html_path() -> pathlib.Path:
    # Locate index.html in common locations; fallback to provided snippet path if mirrored.
    # Prefer root-level index.html or public/index.html.
    candidates = [
        REPO_ROOT / "index.html",
        REPO_ROOT / "public" / "index.html",
        REPO_ROOT / "static" / "index.html",
        REPO_ROOT / "site" / "index.html",
        REPO_ROOT / "docs" / "index.html",
    ]
    for p in candidates:
        if p.exists():
            return p
    # If none found, synthesize from tests fixture mirror if present
    fallback = REPO_ROOT / "tests" / "_fixtures" / "index.html"
    if fallback.exists():
        return fallback
    pytest.skip("index.html not found in repository; cannot run HTML structure tests.")
    return None

@pytest.fixture(scope="session")
def index_html_text(index_html_path) -> str:
    return index_html_path.read_text(encoding="utf-8")

@pytest.fixture(scope="session")
def html_lines(index_html_text):
    return index_html_text.splitlines()

def find_first(lines, pattern):
    rx = re.compile(pattern)
    for i, line in enumerate(lines, start=1):
        if rx.search(line):
            return i, line
    return -1, ""