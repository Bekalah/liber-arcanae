"""
Tests for assets interchange JSON "cards" payload added/modified in the PR.

Testing library/framework: pytest
- We use only stdlib (json, re, pathlib) and pytest assertions.
- Tests validate schema shape, content invariants, and selected canonical entries from the diff.
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any, Dict, List, Tuple, Optional

# Strategy to locate the target JSON file:
# 1) Prefer any *.json file under repository that contains a top-level "cards" array with dict items having the expected keys.
# 2) Fallback to an embedded fixture (from the PR diff) to ensure this suite remains valuable even if the asset path moves.
#
# If you rename or relocate the asset, keep the "cards" schema; these tests will discover it automatically.

REPO_ROOT = Path(__file__).resolve().parents[1]

EXPECTED_APP_PULL_KEYS = {"visual", "music", "learning", "game", "artifact"}

# Fixture from the PR diff (used only if file discovery fails)
_DIFF_FIXTURE = {
  "cards": [
    {
      "id": "viii_strength",
      "name": "Strength",
      "witchEyeOrders": ["Order of the Lion's Vigil"],
      "nonLivingLineages": ["Solar Resonant Shields"],
      "appPulls": {
        "visual": "Lion's Vigil mural studies from circuitum99 courage trials",
        "music": "417 Hz heart-forge drone track",
        "learning": "Somatic resilience protocol — Courage trials notebook",
        "game": "Courage trials encounter module (circuitum99)",
        "artifact": "Solar gauntlet blueprint slab"
      }
    },
    {
      "id": "ix_the_hermit",
      "name": "The Hermit",
      "witchEyeOrders": ["Order of the Lantern Spiral"],
      "nonLivingLineages": ["Phosphor Archives"],
      "appPulls": {
        "visual": "Lantern Spiral cave sketches from Mystery House",
        "music": "741 Hz solitary bell loop",
        "learning": "Hermit cave contemplative prompts",
        "game": "Mystery House seclusion walkabout",
        "artifact": "Gnosis lantern construction notes"
      }
    },
    {
      "id": "x_wheel_of_fortune",
      "name": "Wheel of Fortune",
      "witchEyeOrders": ["Order of the Turning Orrery"],
      "nonLivingLineages": ["Clockwork Orreries"],
      "appPulls": {
        "visual": "Orrery spin etchings from Stone-Grimoire",
        "music": "528 Hz fortune wheel chime",
        "learning": "Cycle-mapping exercises — Fortuna chamber logs",
        "game": "Stone-Grimoire fortuna chamber puzzle",
        "artifact": "Turning wheel keystone"
      }
    },
    {
      "id": "xi_justice",
      "name": "Justice",
      "witchEyeOrders": ["Order of the Feathered Scale"],
      "nonLivingLineages": ["Gyroscopic Aegis Tablets"],
      "appPulls": {
        "visual": "Feathered scale diagram set from Mystery House",
        "music": "741 Hz balance tone",
        "learning": "Equanimity journaling spreads",
        "game": "Hall of Scales arbitration trial",
        "artifact": "Truth-scale calibration weights"
      }
    },
    {
      "id": "xii_the_hanged_man",
      "name": "The Hanged Man",
      "witchEyeOrders": ["Order of the Mirror Bridge"],
      "nonLivingLineages": ["Suspended Silver Roots"],
      "appPulls": {
        "visual": "Mirror bridge inversion charts",
        "music": "963 Hz suspension chant",
        "learning": "Reflection trial journal prompts",
        "game": "Yggdrasil branch portal sequence",
        "artifact": "Silver root talisman"
      }
    },
    {
      "id": "xiii_death",
      "name": "Death",
      "witchEyeOrders": ["Order of the Veiled Gate"],
      "nonLivingLineages": ["Bone Choir Reliquaries"],
      "appPulls": {
        "visual": "Veiled gate threshold renders from Ann Abyss",
        "music": "963 Hz void hymn",
        "learning": "Grief transmutation ritual notes",
        "game": "Ann Abyss grimoire passage",
        "artifact": "Bone key schema"
      }
    },
    {
      "id": "xiv_temperance",
      "name": "Temperance",
      "witchEyeOrders": ["Order of the Prism Chalice"],
      "nonLivingLineages": ["Distillation Wings"],
      "appPulls": {
        "visual": "Prism chalice blend diagrams",
        "music": "528 Hz harmonic fusion pad",
        "learning": "Alchemy lab harmonization recipes",
        "game": "Alchemy lab balancing game",
        "artifact": "Mixing vessel schematic"
      }
    },
    {
      "id": "xv_the_devil",
      "name": "The Devil",
      "witchEyeOrders": ["Order of the Ember Chain"],
      "nonLivingLineages": ["Iron Sigil Familiars"],
      "appPulls": {
        "visual": "Ember chain paradox glyphs",
        "music": "285 Hz shadow pulse",
        "learning": "Shadow integration riddles",
        "game": "Zidaryen riddle grove trial",
        "artifact": "Paradox chain links"
      }
    },
    {
      "id": "xvi_the_tower",
      "name": "The Tower",
      "witchEyeOrders": ["Order of the Thunder Glyph"],
      "nonLivingLineages": ["Storm Bastion Relays"],
      "appPulls": {
        "visual": "Thunder glyph strike studies",
        "music": "417 Hz cleansing surge",
        "learning": "Crisis reset checklist",
        "game": "Tower collapse scenario",
        "artifact": "Lightning rod fragment"
      }
    },
    {
      "id": "xvii_the_star",
      "name": "The Star",
      "witchEyeOrders": ["Order of the Argent Mirror"],
      "nonLivingLineages": ["Starwell Lenses", "Celestial Memory Pools"],
      "appPulls": {
        "visual": "Argent mirror refraction plates",
        "music": "852 Hz starlight chorus",
        "learning": "Hope-channel journaling prompts",
        "game": "Star temple portal path",
        "artifact": "Water jar resonance map"
      }
    },
    {
      "id": "xviii_the_moon",
      "name": "The Moon",
      "witchEyeOrders": ["Order of the Vespertine Tide"],
      "nonLivingLineages": ["Dreamstone Oracles"],
      "appPulls": {
        "visual": "Vespertine tide mirror pool sketches",
        "music": "852 Hz lunar drift",
        "learning": "Dream hygiene protocol",
        "game": "Vespertine dream gate path",
        "artifact": "Lunar mirror schema"
      }
    },
    {
      "id": "xix_the_sun",
      "name": "The Sun",
      "witchEyeOrders": ["Order of the Solar Choir"],
      "nonLivingLineages": ["Heliacal Disc Arrays"],
      "appPulls": {
        "visual": "Solar choir fresco studies",
        "music": "528 Hz radiant hum",
        "learning": "Solar vitality rituals",
        "game": "Solar chamber encounter",
        "artifact": "Heliacal disc imprint"
      }
    },
    {
      "id": "xx_judgment",
      "name": "Judgment",
      "witchEyeOrders": ["Order of the Resonant Trumpet"],
      "nonLivingLineages": ["Awakening Horn Arrays"],
      "appPulls": {
        "visual": "Resonant trumpet beacon charts",
        "music": "963 Hz awakening swell",
        "learning": "Revelation journaling spread",
        "game": "Judgment hall rite",
        "artifact": "Breath sigil scroll"
      }
    },
    {
      "id": "xxi_the_world",
      "name": "The World",
      "witchEyeOrders": ["Order of the Ouroboric Gate"],
      "nonLivingLineages": ["Worldskin Looms"],
      "appPulls": {
        "visual": "Ouroboric gate tessellations",
        "music": "963 Hz unity tone",
        "learning": "Integration path reflection",
        "game": "World gate resonance tour",
        "artifact": "Worldskin loom sample"
      }
    }
  ]
}

def _discover_cards_payload() -> Tuple[Dict[str, Any], str]:
    """
    Try to find a JSON file in the repo with a top-level 'cards' array. If none, use the PR diff fixture.
    Returns: (payload, origin)
    """
    json_paths: List[Path] = []
    # Typical asset locations to try first
    for base in ("assets", "data", "static", "public", "resources", "fixtures"):
        p = REPO_ROOT / base
        if p.exists():
            json_paths.extend(sorted(p.rglob("*.json")))
    # Fallback: anywhere in repo (shallow to limit IO)
    if not json_paths:
        json_paths = sorted(REPO_ROOT.rglob("*.json"))

    for jp in json_paths[:200]:  # guard upper bound
        try:
            text = jp.read_text(encoding="utf-8")
            obj = json.loads(text)
            if isinstance(obj, dict) and "cards" in obj and isinstance(obj["cards"], list):
                # basic shape validation
                if obj["cards"] and isinstance(obj["cards"][0], dict):
                    return obj, f"file:{jp.as_posix()}"
        except (OSError, json.JSONDecodeError, UnicodeDecodeError):
            continue

    return _DIFF_FIXTURE, "embedded:diff"

def _slug_to_name(slug: str) -> Optional[str]:
    """Convert id slug like 'xviii_the_moon' to display name 'The Moon'."""
    if "_" not in slug:
        return None
    parts = slug.split("_", 1)
    name = parts[1].replace("_", " ").title()
    return name

def _roman_prefix(slug: str) -> Optional[str]:
    """Extract roman numeral prefix (lowercase expected)."""
    m = re.match(r'^([ivxlcdm]+)_', slug)
    return m.group(1) if m else None

def test_discovery_and_top_level_schema():
    payload, origin = _discover_cards_payload()
    assert isinstance(payload, dict), f"Payload should be object, got {type(payload)} from {origin}"
    assert "cards" in payload, f"Missing 'cards' in payload from {origin}"
    assert isinstance(payload["cards"], list), "'cards' must be a list"
    # Expect 14 Major Arcana entries from VIII to XXI per PR diff
    assert len(payload["cards"]) == 14, f"Expected 14 cards, found {len(payload['cards'])} from {origin}"

def test_each_card_required_fields_and_types():
    payload, _origin = _discover_cards_payload()
    for idx, card in enumerate(payload["cards"]):
        assert isinstance(card, dict), f"Card {idx} not object"
        for key in ("id", "name", "witchEyeOrders", "nonLivingLineages", "appPulls"):
            assert key in card, f"Card {idx} missing '{key}'"
        assert isinstance(card["id"], str) and card["id"], f"Card {idx} 'id' invalid"
        assert isinstance(card["name"], str) and card["name"], f"Card {idx} 'name' invalid"
        assert isinstance(card["witchEyeOrders"], list) and card["witchEyeOrders"], f"Card {idx} 'witchEyeOrders' must be non-empty list"
        assert all(isinstance(x, str) and x for x in card["witchEyeOrders"]), f"Card {idx} 'witchEyeOrders' entries must be non-empty strings"
        assert isinstance(card["nonLivingLineages"], list) and card["nonLivingLineages"], f"Card {idx} 'nonLivingLineages' must be non-empty list"
        assert all(isinstance(x, str) and x for x in card["nonLivingLineages"]), f"Card {idx} 'nonLivingLineages' entries must be non-empty strings"
        app = card["appPulls"]
        assert isinstance(app, dict), f"Card {idx} 'appPulls' must be object"
        assert set(app.keys()) == EXPECTED_APP_PULL_KEYS, f"Card {idx} 'appPulls' keys mismatch: {set(app.keys())}"

def test_ids_are_unique_and_match_names():
    payload, _origin = _discover_cards_payload()
    ids = [c["id"] for c in payload["cards"]]
    names = [c["name"] for c in payload["cards"]]
    assert len(ids) == len(set(ids)), "IDs must be unique"
    assert len(names) == len(set(names)), "Names must be unique"
    # Ensure slug and name alignment
    for c in payload["cards"]:
        expected_name = _slug_to_name(c["id"])
        assert expected_name == c["name"], f"Name/slug mismatch for {c['id']}: expected '{expected_name}', got '{c['name']}'"
        rp = _roman_prefix(c["id"])
        assert rp is not None, f"Missing roman numeral prefix in id '{c['id']}'"

def test_music_fields_have_valid_frequency_suffix():
    payload, _origin = _discover_cards_payload()
    freq_re = re.compile(r'(?i)\b(285|417|528|741|852|963)\s*Hz\b')
    for idx, c in enumerate(payload["cards"]):
        music = c["appPulls"]["music"]
        assert isinstance(music, str) and music, f"Card {idx} music invalid"
        assert freq_re.search(music), f"Card {c['id']} music lacks valid 'Hz' frequency tag: {music}"

def test_expected_anchor_entries_from_diff():
    payload, _origin = _discover_cards_payload()
    # Build lookup by id for anchor checks
    by_id = {c["id"]: c for c in payload["cards"]}

    # The Star
    star = by_id.get("xvii_the_star")
    assert star is not None, "Missing card 'xvii_the_star'"
    assert star["name"] == "The Star"
    assert star["nonLivingLineages"] == ["Starwell Lenses", "Celestial Memory Pools"]
    assert "Argent mirror refraction plates" in star["appPulls"]["visual"]
    assert "852 Hz" in star["appPulls"]["music"]

    # The Moon
    moon = by_id.get("xviii_the_moon")
    assert moon is not None, "Missing card 'xviii_the_moon'"
    assert moon["name"] == "The Moon"
    assert moon["nonLivingLineages"] == ["Dreamstone Oracles"]
    assert "Vespertine" in moon["appPulls"]["visual"]
    assert "852 Hz" in moon["appPulls"]["music"]

    # The World
    world = by_id.get("xxi_the_world")
    assert world is not None, "Missing card 'xxi_the_world'"
    assert world["name"] == "The World"
    assert "Worldskin Looms" in world["nonLivingLineages"]
    assert "unity tone" in world["appPulls"]["music"]
    assert "Worldskin loom sample" == world["appPulls"]["artifact"]

def test_no_empty_strings_or_whitespace_only_values():
    payload, _origin = _discover_cards_payload()
    def _is_bad(s: str) -> bool:
        return not isinstance(s, str) or not s.strip()
    for idx, c in enumerate(payload["cards"]):
        assert not _is_bad(c["id"]), f"Card {idx} has empty id"
        assert not _is_bad(c["name"]), f"Card {idx} has empty name"
        for k in ("visual", "music", "learning", "game", "artifact"):
            assert not _is_bad(c["appPulls"][k]), f"Card {c['id']} has empty appPulls.{k}"

def test_sorted_by_major_arcana_progression():
    payload, _origin = _discover_cards_payload()
    # Roman order for VIII..XXI
    order = [
        "viii_strength",
        "ix_the_hermit",
        "x_wheel_of_fortune",
        "xi_justice",
        "xii_the_hanged_man",
        "xiii_death",
        "xiv_temperance",
        "xv_the_devil",
        "xvi_the_tower",
        "xvii_the_star",
        "xviii_the_moon",
        "xix_the_sun",
        "xx_judgment",
        "xxi_the_world",
    ]
    got = [c["id"] for c in payload["cards"]]
    assert got == order, f"Cards not in expected order.\nExpected: {order}\nGot:      {got}"

def test_arrays_are_not_excessively_long():
    payload, _origin = _discover_cards_payload()
    # Sanity bounds to prevent accidental bloats/duplications
    for _idx, c in enumerate(payload["cards"]):
        assert 1 <= len(c["witchEyeOrders"]) <= 3, f"Card {c['id']} witchEyeOrders size unexpected"
        assert 1 <= len(c["nonLivingLineages"]) <= 3, f"Card {c['id']} nonLivingLineages size unexpected"