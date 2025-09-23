# Tests for the registry compiler (tools/registry_compile.py)
# Testing framework: pytest
from __future__ import annotations

import json
import sys
import uuid
import textwrap
from pathlib import Path
import importlib.util
import pytest


def _find_registry_script() -> Path:
    """
    Locate the registry compiler script. Prefer tools/registry_compile.py as indicated
    in the script header comment; fall back to searching the repo.
    """
    candidates = [Path("tools/registry_compile.py")]
    for p in candidates:
        if p.exists():
            return p
    matches = list(Path(".").rglob("registry_compile.py"))
    if not matches:
        pytest.fail("registry_compile.py not found in repository; expected at tools/registry_compile.py")
    return matches[0]


def _load_with(md_text: str, tmp_path: Path, out_name: str = "cards.json"):
    """
    Write md_text to a temporary markdown file, point sys.argv to it and a temp JSON,
    then load the registry script as a fresh module (executing its top-level code).
    Returns (module, in_md_path, out_json_path).
    """
    script_path = _find_registry_script()
    in_md = tmp_path / "codex_test.md"
    in_md.write_text(textwrap.dedent(md_text).lstrip(), encoding="utf-8")
    out_json = tmp_path / out_name

    argv_backup = sys.argv[:]
    try:
        sys.argv = [str(script_path), str(in_md), str(out_json)]
        mod_name = f"registry_compile_{uuid.uuid4().hex}"
        spec = importlib.util.spec_from_file_location(mod_name, script_path)
        assert spec and spec.loader, "Failed to create import spec for registry compiler"
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)  # type: ignore[attr-defined]
        return mod, in_md, out_json
    finally:
        sys.argv = argv_backup


def test_field_parses_value_and_missing(tmp_path: Path):
    mod, _, _ = _load_with("## Dummy\n- App Pulls: yes\n", tmp_path)
    block = textwrap.dedent("""
        ## Example
        - Key:   Value with spaces   
        - Other: Something
    """)
    assert mod.field(block, "Key") == "Value with spaces"
    assert mod.field(block, "Missing") == ""


def test_parse_list_various_inputs(tmp_path: Path):
    mod, _, _ = _load_with("## Dummy\n- App Pulls: yes\n", tmp_path)
    assert mod.parse_list("") == []
    assert mod.parse_list(None) == []
    assert mod.parse_list("a, b; c,, , d") == ["a", "b", "c", "d"]
    assert mod.parse_list(" single ") == ["single"]


def test_suit_identification_rules(tmp_path: Path):
    mod, _, _ = _load_with("## Dummy\n- App Pulls: yes\n", tmp_path)
    assert mod.suit("Knight of Wands") == "wands"
    assert mod.suit("Queen of Cups") == "cups"
    assert mod.suit("Queen of Coins") == "pentacles"
    assert mod.suit("Blade Dancer") == "swords"
    assert mod.suit("Hero of Swords") == "swords"
    assert mod.suit("The Fool") == "majors"


def test_map_freq_mappings_and_precedence(tmp_path: Path):
    mod, _, _ = _load_with("## Dummy\n- App Pulls: yes\n", tmp_path)
    assert mod.map_freq("violet") == 963
    assert mod.map_freq("indigo") == 852
    assert mod.map_freq("silver") == 852
    assert mod.map_freq("gold") == 528
    assert mod.map_freq("emerald") == 528
    assert mod.map_freq("green") == 528
    assert mod.map_freq("aquamarine") == 528
    assert mod.map_freq("turquoise") == 528
    assert mod.map_freq("crimson") == 417
    assert mod.map_freq("scarlet") == 285
    assert mod.map_freq("red") == 285
    # Precedence: 'silver' should win over 'emerald' (852 over 528)
    assert mod.map_freq("emerald and silver") == 852
    # Default when nothing matches
    assert mod.map_freq("unknown hue") == 432


def test_compile_writes_expected_json_and_parses_fields(tmp_path: Path, capsys: pytest.CaptureFixture[str]):
    md = """
    ## The Fool
    - App Pulls: yes
    - Ray: Silver
    - Angel/Demon: Michael ↔ Belial
    - Crystal: Quartz (SiO2)
    - Technical: Info; Solfeggio = 528
    - Letter: Aleph
    - Astrology: Uranus
    - Deities: Thoth
    - Artifact: Wand
    - Pigment: White
    - Secret Tara: 1
    - Thought-form: None
    - HGA Fragment: xyz
    - Pattern Glyph: abc
    - Psyche: none
    - Witch Eye Order: A, B; C
    - Non-Living Lineage: X; Y

    ## Skipped Card
    - Ray: Crimson
    - Technical: Solfeggio = 417
    """
    _, _, out_json = _load_with(md, tmp_path, "out.json")
    captured = capsys.readouterr()
    # Summary message should reflect one written card and the target path
    assert "Wrote 1 cards" in captured.out
    assert str(out_json) in captured.out

    data = json.loads(out_json.read_text(encoding="utf-8"))
    assert isinstance(data, list) and len(data) == 1
    c = data[0]

    # Core identity fields
    assert c["id"] == "the_fool"
    assert c["name"] == "The Fool"
    assert c["suit"] == "majors"
    assert c["letter"] == "Aleph"
    assert c["astrology"] == "Uranus"

    # Parsed composites
    assert c["angel"] == "Michael"
    assert c["demon"] == "Belial"
    assert c["crystal"] == "Quartz"
    assert c["chemistry"] == "SiO2"

    # Raw fields passed through
    assert c["artifact"] == "Wand"
    assert c["pigment"] == "White"
    assert c["tara"] == "1"
    assert c["thought"] == "None"
    assert c["hga_fragment"] == "xyz"
    assert c["pattern_glyph"] == "abc"
    assert c["psyche"] == "none"
    assert c["ray"] == "Silver"

    # Lists from comma/semicolon separated fields
    assert c["witchEyeOrders"] == ["A", "B", "C"]
    assert c["nonLivingLineages"] == ["X", "Y"]

    # App Pulls is preserved as provided
    assert c["appPulls"] == "yes"

    # Frequency parsed from Technical overrides ray mapping
    assert c["freq"] == 528.0


def test_compile_freq_falls_back_to_mapfreq_when_missing_solfeggio(tmp_path: Path):
    md = """
    ## Queen of Coins
    - App Pulls: yes
    - Ray: red
    - Technical: Something without a Solfeggio value
    """
    _, _, out_json = _load_with(md, tmp_path, "freq_fallback.json")
    data = json.loads(out_json.read_text(encoding="utf-8"))
    assert len(data) == 1
    c = data[0]
    assert c["suit"] == "pentacles"  # "coin" -> pentacles
    assert c["freq"] == 285.0        # from ray "red" -> 285 -> float()


def test_angel_demon_without_arrow_sets_empty_strings(tmp_path: Path):
    md = """
    ## Blade Dancer
    - App Pulls: yes
    - Angel/Demon: Azazel only
    """
    _, _, out_json = _load_with(md, tmp_path, "ad_missing.json")
    data = json.loads(out_json.read_text(encoding="utf-8"))
    assert len(data) == 1
    c = data[0]
    assert c["suit"] == "swords"     # "blade" implies swords
    assert c["angel"] == ""
    assert c["demon"] == ""