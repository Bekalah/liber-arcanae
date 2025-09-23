import json
import os
import re
from pathlib import Path
from typing import Tuple

try:
    import pytest  # Prefer pytest if available
except Exception:  # pragma: no cover
    pytest = None  # Fallback gracefully

HEX_RE = re.compile(r"^#[0-9a-f]{6}$")

EXPECTED = {
    "bg": "#0b0b12",
    "ink": "#e8e8f0",
    "layers": [
        "#b1c7ff",
        "#89f7fe",
        "#a0ffa1",
        "#ffd27f",
        "#f5a3ff",
        "#d0d0e6",
    ],
}


def _candidate_palette_paths() -> list[Path]:
    """Return likely locations for the palette JSON file relative to repo root."""
    repo_root = Path(__file__).resolve().parents[1]
    candidates = [
        repo_root / "data" / "palette.json",
        repo_root / "assets" / "palette.json",
        repo_root / "src" / "data" / "palette.json",
        repo_root / "src" / "assets" / "palette.json",
        repo_root / "public" / "palette.json",
        repo_root / "palette.json",
    ]
    # Also scan a small set of .json files as fallbacks if signature matches.
    jsons = list(repo_root.rglob("*.json"))
    # Keep search bounded
    for p in jsons[:200]:
        candidates.append(p)
    # De-duplicate while preserving order
    seen, uniq = set(), []
    for c in candidates:
        if c not in seen:
            seen.add(c)
            uniq.append(c)
    return uniq


def _load_palette() -> Tuple[dict, Path]:
    """Load the first JSON that matches the expected schema and values if present."""
    signature_keys = {"bg", "ink", "layers"}
    for path in _candidate_palette_paths():
        if not path.is_file():
            continue
        try:
            with path.open("r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception:
            continue
        if not isinstance(data, dict):
            continue
        if set(data.keys()) >= signature_keys:
            # Prefer exact match to EXPECTED if found
            if (
                isinstance(data.get("bg"), str)
                and isinstance(data.get("ink"), str)
                and isinstance(data.get("layers"), list)
            ):
                # If it matches our specific diff values, pick immediately
                if data.get("bg") == EXPECTED["bg"] and data.get("ink") == EXPECTED["ink"]:
                    lay = data.get("layers")
                    if all(isinstance(x, str) for x in lay) and len(lay) >= 6:
                        return data, path
                # Otherwise still return as a candidate schema match
                return data, path
    raise FileNotFoundError(
        "Could not locate the palette JSON file. "
        "Searched common locations and repository JSON files."
    )


def _hex_to_rgb01(hex_color: str) -> Tuple[float, float, float]:
    assert HEX_RE.fullmatch(hex_color), f"Invalid hex format: {hex_color}"
    r = int(hex_color[1:3], 16) / 255.0
    g = int(hex_color[3:5], 16) / 255.0
    b = int(hex_color[5:7], 16) / 255.0
    return r, g, b


def _rel_luminance(rgb: Tuple[float, float, float]) -> float:
    def _lin(c: float) -> float:
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (_lin(c) for c in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def _contrast_ratio(hex1: str, hex2: str) -> float:
    l1 = _rel_luminance(_hex_to_rgb01(hex1))
    l2 = _rel_luminance(_hex_to_rgb01(hex2))
    lighter = max(l1, l2)
    darker = min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)


def test_palette_file_exists_and_loadable():
    try:
        data, path = _load_palette()
    except FileNotFoundError as e:
        if pytest:
            pytest.skip(str(e))
            return
        else:
            raise
    assert path.is_file(), "Palette file path is not a file"
    # JSON was loaded by _load_palette; ensure it's re-loadable directly
    reloaded = json.loads(Path(path).read_text(encoding="utf-8"))
    assert isinstance(reloaded, dict), "Palette JSON must be an object"


def test_schema_and_required_keys():
    data, _ = _load_palette()
    assert isinstance(data, dict), "Palette must be a JSON object"
    assert set(data.keys()) == {"bg", "ink", "layers"}, "Palette must have only bg, ink, and layers keys"
    assert isinstance(data["bg"], str), "bg must be a string"
    assert isinstance(data["ink"], str), "ink must be a string"
    assert isinstance(data["layers"], list), "layers must be a list"


def test_hex_format_and_lowercase():
    data, _ = _load_palette()
    all_colors = [data["bg"], data["ink"], *data["layers"]]
    for c in all_colors:
        assert isinstance(c, str), "Color entries must be strings"
        assert HEX_RE.fullmatch(c), f"Color not in lowercase #RRGGBB format: {c}"
        assert c == c.lower(), f"Color hex must be lowercase: {c}"


def test_no_duplicates_and_separation():
    data, _ = _load_palette()
    all_colors = [data["bg"], data["ink"], *data["layers"]]
    assert len(set(all_colors)) == len(all_colors), (
        "No duplicate colors allowed across bg, ink, and layers"
    )
    assert data["bg"] != data["ink"], "bg and ink must differ"
    assert data["ink"] not in data["layers"], "ink should not be part of layers"
    assert data["bg"] not in data["layers"], "bg should not be part of layers"


def test_expected_values_from_diff():
    data, _ = _load_palette()
    # These assert the concrete values modified in this PR diff.
    assert data["bg"] == EXPECTED["bg"], f'bg expected {EXPECTED["bg"]}, got {data["bg"]}'
    assert data["ink"] == EXPECTED["ink"], f'ink expected {EXPECTED["ink"]}, got {data["ink"]}'
    assert isinstance(data["layers"], list), "layers must be a list"
    assert len(data["layers"]) == len(EXPECTED["layers"]), f"layers expected {len(EXPECTED['layers'])} entries"
    assert data["layers"] == EXPECTED["layers"], "layers order and values must match expected"


def test_contrast_requirements():
    data, _ = _load_palette()
    bg = data["bg"]
    ink = data["ink"]
    cr_bg_ink = _contrast_ratio(bg, ink)
    # AAA for normal text is 7.0; AA is 4.5. Given the palette, we enforce AAA for text.
    assert cr_bg_ink >= 7.0, f"bg vs ink contrast {cr_bg_ink:.2f} must be >= 7.0 (AAA)"

    # Each layer used atop bg should have at least 3.0 contrast (proxy for large UI elements).
    for i, layer in enumerate(data["layers"]):
        cr = _contrast_ratio(bg, layer)
        assert cr >= 3.0, f"Layer index {i} color {layer} contrast {cr:.2f} vs bg {bg} must be >= 3.0"


def test_layers_length_bounds_and_content_types():
    data, _ = _load_palette()
    layers = data["layers"]
    assert 4 <= len(layers) <= 12, "layers should contain a reasonable number of entries (4-12)"
    assert all(isinstance(x, str) for x in layers), "All layer entries must be strings"
    assert all(HEX_RE.fullmatch(x) for x in layers), "All layer entries must be lowercase #RRGGBB"


def test_json_minimal_whitespace_and_no_trailing_commas():
    # Structural validation useful for strict parsers or downstream tooling.
    data, path = _load_palette()
    raw = path.read_text(encoding="utf-8")
    # Ensure no trailing commas in arrays/objects (a common JSON mistake)
    assert not re.search(r",\s*([}\]])", raw), "JSON must not contain trailing commas"
    # Ensure consistent quoting for keys and values (double quotes)
    assert "'" not in raw, "JSON should use double quotes, not single quotes"