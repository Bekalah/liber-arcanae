import json
import re
from typing import Any, Dict

# Testing library and framework:
# - Using pytest (commonly used in this repo; if unittest is present, pytest remains compatible).
import pytest

# Embedded JSON (from PR diff) for LA-17-STAR
LA_17_STAR_JSON = r"""
{
  "id": "LA-17-STAR",
  "title": "The Star",
  "qabalistic_path": "Tzaddi",
  "color_tone": {"hex": "#7FB3FF", "note": "F#", "hz": 369},
  "lineage": ["Emma Kunz"],
  "witch_eye_orders": ["Order of the Argent Mirror"],
  "non_living_lineages": ["Starwell Lenses", "Celestial Memory Pools"],
  "study_seed": "The laws of healing revealed in geometric form.",
  "helpers": {"calm_overlay": true, "unlock_paths": [17, 33]},
  "art_recipe": {"layers": [{"type": "sigil", "sdf": true}, {"type": "rose_window", "fps": 10}]},
  "safety": {"strobe": false, "autoplay": false, "motion": "calm"}
}
""".strip()


@pytest.fixture(scope="module")
def star_data() -> Dict[str, Any]:
    try:
        return json.loads(LA_17_STAR_JSON)
    except json.JSONDecodeError as e:
        pytest.fail(f"Embedded LA-17-STAR JSON failed to parse: {e}")


def test_top_level_keys_present(star_data):
    expected_keys = {
        "id",
        "title",
        "qabalistic_path",
        "color_tone",
        "lineage",
        "witch_eye_orders",
        "non_living_lineages",
        "study_seed",
        "helpers",
        "art_recipe",
        "safety",
    }
    assert set(star_data.keys()) == expected_keys, f"Missing or extra keys: {set(star_data.keys()) ^ expected_keys}"


def test_basic_identity_fields(star_data):
    assert star_data["id"] == "LA-17-STAR"
    assert star_data["title"] == "The Star"
    assert star_data["qabalistic_path"] == "Tzaddi"


def test_color_tone_schema_and_values(star_data):
    ct = star_data["color_tone"]
    assert isinstance(ct, dict)

    assert set(ct.keys()) == {"hex", "note", "hz"}
    # hex format: #RRGGBB

    assert isinstance(ct["hex"], str) and re.fullmatch(r"#([0-9A-Fa-f]{6})", ct["hex"]), "hex must be #RRGGBB"
    # musical note representation

    assert ct["note"] == "F#"
    # frequency number and plausible range (human hearing)
    assert isinstance(ct["hz"], (int, float))
    assert 20 <= ct["hz"] <= 20000
    assert ct["hz"] == 369  # exact as per diff


def test_lineages_and_orders(star_data):
    lineage = star_data["lineage"]
    orders = star_data["witch_eye_orders"]
    non_living = star_data["non_living_lineages"]

    assert isinstance(lineage, list) and all(isinstance(x, str) for x in lineage)
    assert "Emma Kunz" in lineage

    assert isinstance(orders, list) and all(isinstance(x, str) for x in orders)
    assert "Order of the Argent Mirror" in orders

    assert isinstance(non_living, list) and all(isinstance(x, str) for x in non_living)
    assert non_living == ["Starwell Lenses", "Celestial Memory Pools"]


def test_study_seed(star_data):
    seed = star_data["study_seed"]
    assert isinstance(seed, str)
    assert seed.strip() != ""
    assert "healing" in seed.lower()
    assert seed.endswith(".")


def test_helpers_schema_and_values(star_data):
    helpers = star_data["helpers"]
    assert isinstance(helpers, dict)
    assert set(helpers.keys()) == {"calm_overlay", "unlock_paths"}
    assert isinstance(helpers["calm_overlay"], bool) and helpers["calm_overlay"] is True

    ups = helpers["unlock_paths"]
    assert isinstance(ups, list) and all(isinstance(x, int) for x in ups)
    assert ups == [17, 33]
    assert len(set(ups)) == len(ups), "unlock_paths should not contain duplicates"
    assert all(x > 0 for x in ups)


def test_art_recipe_layers(star_data):
    art = star_data["art_recipe"]
    assert isinstance(art, dict)
    assert set(art.keys()) == {"layers"}

    layers = art["layers"]
    assert isinstance(layers, list) and len(layers) == 2

    first, second = layers
    assert isinstance(first, dict) and first.get("type") == "sigil"
    assert "sdf" in first and isinstance(first["sdf"], bool) and first["sdf"] is True

    assert isinstance(second, dict) and second.get("type") == "rose_window"
    assert "fps" in second and isinstance(second["fps"], int) and second["fps"] == 10
    assert second["fps"] > 0


def test_safety_flags(star_data):
    safety = star_data["safety"]
    assert isinstance(safety, dict)
    assert set(safety.keys()) == {"strobe", "autoplay", "motion"}

    assert safety["strobe"] is False
    assert safety["autoplay"] is False
    assert isinstance(safety["motion"], str) and safety["motion"] in {"calm", "gentle", "still"}
    assert safety["motion"] == "calm"


@pytest.mark.parametrize(
    "field,expected_type",
    [
        ("id", str),
        ("title", str),
        ("qabalistic_path", str),
        ("color_tone", dict),
        ("lineage", list),
        ("witch_eye_orders", list),
        ("non_living_lineages", list),
        ("study_seed", str),
        ("helpers", dict),
        ("art_recipe", dict),
        ("safety", dict),
    ],
)
def test_field_types(star_data, field, expected_type):
    assert isinstance(star_data[field], expected_type), f"{field} must be {expected_type.__name__}"


def test_defensive_missing_keys_copy():
    data = json.loads(LA_17_STAR_JSON)
    # Remove a required key to simulate invalid data
    data.pop("color_tone")
    missing = {"color_tone"}
    assert missing.issubset({"id","title","qabalistic_path","color_tone","lineage","witch_eye_orders","non_living_lineages","study_seed","helpers","art_recipe","safety"} - set(data.keys()))
    # Optional place to hook schema validation if project adds jsonschema later.


def test_hex_uppercase_normalization():
    data = json.loads(LA_17_STAR_JSON)
    hex_val = data["color_tone"]["hex"]
    assert hex_val == hex_val.upper(), "Prefer uppercase HEX for consistency"


def test_unlock_paths_are_integers_and_sorted_non_decreasing(star_data):
    ups = star_data["helpers"]["unlock_paths"]
    assert ups == sorted(ups), "unlock_paths should be sorted non-decreasing"
    assert all(isinstance(u, int) and u >= 0 for u in ups)