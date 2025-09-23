# -*- coding: utf-8 -*-
"""
Unit tests for the cards JSON content introduced in the PR diff.

Testing library and framework: pytest (assert-style tests; no extra dependencies).
These tests focus on validating structure, integrity, and domain-specific invariants
for the provided majors sequence (VIII — XXI).
"""


import json
import re
from typing import Dict, List
from collections import Counter


# JSON snapshot from the PR diff (kept inline to ensure tests target the changed content)

CARDS_JSON = """
[
  {
    "id": "viii_strength",
    "name": "VIII — Strength",
    "suit": "majors",
    "letter": "Teth (\u05D8)",
    "astrology": "Leo",
    "ray": "Gold-Crimson (Ray 1)",
    "angel": "",
    "demon": "",
    "deities": "Sekhmet, Durga, Heracles, Freyja",
    "crystal": "Carnelian",
    "chemistry": "SiO2:Fe",
    "artifact": "Lion's Crown",
    "pigment": "Crimson + Solar Gold",
    "tara": "Tara of Courage",
    "thought": "Taming the lion",
    "hga_fragment": "Heart of valor",
    "pattern_glyph": "Circle + Flame",
    "psyche": "Rage / Compassionate strength",
    "technical": "ND-safe golden-red halo, 417 Hz tone",
    "appPulls": "Courage trials in circuitum99",
    "freq": 528.0,
    "witchEyeOrders": [
      "Order of the Lion's Vigil"
    ],
    "nonLivingLineages": [
      "Solar Resonant Shields"
    ]
  },
  {
    "id": "ix_the_hermit",
    "name": "IX — The Hermit",
    "suit": "majors",
    "letter": "Yod (\u05D9)",
    "astrology": "Virgo",
    "ray": "Indigo-Grey (Ray 5)",
    "angel": "",
    "demon": "",
    "deities": "Hermes, Odin (Wanderer), Diogenes, Thoth",
    "crystal": "Smoky Quartz",
    "chemistry": "SiO2",
    "artifact": "Lantern of Gnosis",
    "pigment": "Lead Grey + Indigo wash",
    "tara": "Tara of Stillness",
    "thought": "Light in the dark",
    "hga_fragment": "Flame of gnosis",
    "pattern_glyph": "Circle + Cross",
    "psyche": "Isolation / Wisdom in solitude",
    "technical": "ND-safe lantern glow, 741 Hz tone",
    "appPulls": "Hermit cave in Mystery House",
    "freq": 852.0,
    "witchEyeOrders": [
      "Order of the Lantern Spiral"
    ],
    "nonLivingLineages": [
      "Phosphor Archives"
    ]
  },
  {
    "id": "x_wheel_of_fortune",
    "name": "X — Wheel of Fortune",
    "suit": "majors",
    "letter": "Kaph (כ)",
    "astrology": "Jupiter",
    "ray": "Emerald-Gold (Ray 2/4)",
    "angel": "",
    "demon": "",
    "deities": "Fortuna, Tyche, Lakshmi, Ananke",
    "crystal": "Jade",
    "chemistry": "NaAlSi2O6",
    "artifact": "Turning Wheel",
    "pigment": "Emerald Green + Gold",
    "tara": "Tara of Fortune",
    "thought": "Ever-turning wheel",
    "hga_fragment": "Spin of fate",
    "pattern_glyph": "Circle",
    "psyche": "Fatalism / Embracing cycles",
    "technical": "Rotating mandala overlay, 528 Hz tone",
    "appPulls": "Fortuna chamber in Stone-Grimoire",
    "freq": 528.0,
    "witchEyeOrders": [
      "Order of the Turning Orrery"
    ],
    "nonLivingLineages": [
      "Clockwork Orreries"
    ]
  },
  {
    "id": "xi_justice",
    "name": "XI — Justice",
    "suit": "majors",
    "letter": "Lamed (ל)",
    "astrology": "Libra",
    "ray": "Sapphire Blue (Ray 3)",
    "angel": "",
    "demon": "",
    "deities": "Ma'at, Themis, Dike, Athena",
    "crystal": "Lapis Lazuli",
    "chemistry": "Na8-10Al6Si6O24S2-4",
    "artifact": "Scales of Truth",
    "pigment": "Sapphire Blue + Silver",
    "tara": "Tara of Truth",
    "thought": "Balance of forces",
    "hga_fragment": "Feather of Ma'at",
    "pattern_glyph": "Cross",
    "psyche": "Judgment / Equanimity",
    "technical": "Balanced overlay, 741 Hz tone",
    "appPulls": "Hall of Scales in Mystery House",
    "freq": 432.0,
    "witchEyeOrders": [
      "Order of the Feathered Scale"
    ],
    "nonLivingLineages": [
      "Gyroscopic Aegis Tablets"
    ]
  },
  {
    "id": "xii_the_hanged_man",
    "name": "XII — The Hanged Man",
    "suit": "majors",
    "letter": "Mem (מ)",
    "astrology": "Neptune",
    "ray": "Aquamarine (Ray 6)",
    "angel": "",
    "demon": "",
    "deities": "Odin (Yggdrasil), Christ, Dionysus, Mithras",
    "crystal": "Aquamarine",
    "chemistry": "Be3Al2Si6O18",
    "artifact": "Rope of Reversal",
    "pigment": "Aquamarine wash + Gold Halo",
    "tara": "Tara of Surrender",
    "thought": "Vision in stillness",
    "hga_fragment": "Breath of sacrifice",
    "pattern_glyph": "Cross inverted",
    "psyche": "Victimhood / Surrender to transformation",
    "technical": "Inverted cross overlay, 963 Hz tone",
    "appPulls": "Yggdrasil branch portal",
    "freq": 528.0,
    "witchEyeOrders": [
      "Order of the Mirror Bridge"
    ],
    "nonLivingLineages": [
      "Suspended Silver Roots"
    ]
  },
  {
    "id": "xiii_death",
    "name": "XIII — Death",
    "suit": "majors",
    "letter": "Nun (נ)",
    "astrology": "Scorpio",
    "ray": "Black-Violet (Void frequency)",
    "angel": "",
    "demon": "",
    "deities": "Anubis, Hades, Ann Abyss, Persephone",
    "crystal": "Obsidian",
    "chemistry": "volcanic glass, SiO2",
    "artifact": "Scythe of Transformation",
    "pigment": "Obsidian Black + Violet Glow",
    "tara": "Tara of Release",
    "thought": "Death is passage",
    "hga_fragment": "Bone key",
    "pattern_glyph": "Cross + Flame (death-fire)",
    "psyche": "Fear of loss / Transmutation through grief",
    "technical": "Void halo overlay, ND-safe 963 Hz tone",
    "appPulls": "Ann Abyss grimoire portal",
    "freq": 963.0,
    "witchEyeOrders": [
      "Order of the Veiled Gate"
    ],
    "nonLivingLineages": [
      "Bone Choir Reliquaries"
    ]
  },
  {
    "id": "xiv_temperance",
    "name": "XIV — Temperance",
    "suit": "majors",
    "letter": "Samekh (\u05E1)",
    "astrology": "Sagittarius",
    "ray": "Rainbow (Ray 6 composite)",
    "angel": "",
    "demon": "",
    "deities": "Iris, Michael, Sophia, Kuan Yin",
    "crystal": "Topaz",
    "chemistry": "Al2SiO4(F,OH)2",
    "artifact": "Mixing Vessels",
    "pigment": "Gold + Prism wash",
    "tara": "Tara of Compassion",
    "thought": "Alchemy of opposites",
    "hga_fragment": "Cup of Sophia",
    "pattern_glyph": "Circle + Cross",
    "psyche": "Excess / Harmonization",
    "technical": "Prism halo overlay, harmonic tones",
    "appPulls": "Alchemy lab portal",
    "freq": 432.0,
    "witchEyeOrders": [
      "Order of the Prism Chalice"
    ],
    "nonLivingLineages": [
      "Distillation Wings"
    ]
  },
  {
    "id": "xv_the_devil",
    "name": "XV — The Devil",
    "suit": "majors",
    "letter": "Ayin (ע)",
    "astrology": "Capricorn",
    "ray": "Scarlet Black (Ray 1 inverted)",
    "angel": "",
    "demon": "",
    "deities": "Pan, Dionysus, Trickster God Zidaryen",
    "crystal": "Garnet",
    "chemistry": "Fe3Al2(SiO4)3",
    "artifact": "Chains of Paradox",
    "pigment": "Scarlet + Black wash",
    "tara": "Tara of Liberation",
    "thought": "Trickster's riddle",
    "hga_fragment": "Mirror chain",
    "pattern_glyph": "Cross + Flame inverted",
    "psyche": "Addiction / Shadow integration",
    "technical": "ND-safe paradox overlay, 285 Hz tone",
    "appPulls": "Zidaryen riddle grove",
    "freq": 285.0,
    "witchEyeOrders": [
      "Order of the Ember Chain"
    ],
    "nonLivingLineages": [
      "Iron Sigil Familiars"
    ]
  },
  {
    "id": "xvi_the_tower",
    "name": "XVI — The Tower",
    "suit": "majors",
    "letter": "Pe (פ)",
    "astrology": "Mars",
    "ray": "Crimson Scarlet (Ray 1 force)",
    "angel": "",
    "demon": "",
    "deities": "Mars, Thor, Sekhmet, Kali",
    "crystal": "Hematite",
    "chemistry": "Fe2O3",
    "artifact": "Lightning Rod",
    "pigment": "Brick Red + Lightning White",
    "tara": "Wrathful Tara",
    "thought": "Tower falls",
    "hga_fragment": "Thunder sigil",
    "pattern_glyph": "Cross struck by flame",
    "psyche": "Hubris / Cleansing destruction",
    "technical": "Lightning overlay, 417 Hz tone",
    "appPulls": "Tower collapse trial",
    "freq": 417.0,
    "witchEyeOrders": [
      "Order of the Thunder Glyph"
    ],
    "nonLivingLineages": [
      "Storm Bastion Relays"
    ]
  },
  {
    "id": "xvii_the_star",
    "name": "XVII — The Star",
    "suit": "majors",
    "letter": "Tzaddi (צ)",
    "astrology": "Aquarius",
    "ray": "Silver-Blue (Ray 2)",
    "angel": "",
    "demon": "",
    "deities": "Ishtar, Inanna, Kuan Yin, Elysia Nox",
    "crystal": "Celestite",
    "chemistry": "SrSO4",
    "artifact": "Water Jar of Wisdom",
    "pigment": "Ultramarine + Silver wash",
    "tara": "Tara of Light",
    "thought": "Star of guidance",
    "hga_fragment": "Vessel of stars",
    "pattern_glyph": "Circle + Crescent",
    "psyche": "Hopelessness / Sacred hope",
    "technical": "ND-safe star overlay, 852 Hz tone",
    "appPulls": "Star temple portal",
    "freq": 852.0,
    "witchEyeOrders": [
      "Order of the Argent Mirror"
    ],
    "nonLivingLineages": [
      "Starwell Lenses",
      "Celestial Memory Pools"
    ]
  },
  {
    "id": "xviii_the_moon",
    "name": "XVIII — The Moon",
    "suit": "majors",
    "letter": "Qoph (ק)",
    "astrology": "Pisces",
    "ray": "Silver Indigo (Ray 6)",
    "angel": "",
    "demon": "",
    "deities": "Selene, Artemis, Hecate, Mirabelle Vespertine",
    "crystal": "Selenite",
    "chemistry": "CaSO4.2H2O",
    "artifact": "Lunar Mirror",
    "pigment": "Indigo wash + Silver Glow",
    "tara": "Tara of Dreams",
    "thought": "Lunar vision",
    "hga_fragment": "Lunar thread",
    "pattern_glyph": "Circle + Crescent",
    "psyche": "Delusion / Intuition",
    "technical": "ND-safe moon halo, 852 Hz tone",
    "appPulls": "Vespertine dream gate",
    "freq": 852.0,
    "witchEyeOrders": [
      "Order of the Vespertine Tide"
    ],
    "nonLivingLineages": [
      "Dreamstone Oracles"
    ]
  },
  {
    "id": "xix_the_sun",
    "name": "XIX — The Sun",
    "suit": "majors",
    "letter": "Resh (ר)",
    "astrology": "Sun",
    "ray": "Golden Yellow (Ray 3)",
    "angel": "",
    "demon": "",
    "deities": "Ra, Helios, Apollo, Surya",
    "crystal": "Sunstone",
    "chemistry": "(Na,Ca)AlSi3O8",
    "artifact": "Solar Orb",
    "pigment": "Solar Gold + Yellow wash",
    "tara": "Tara of Joy",
    "thought": "Inner sun",
    "hga_fragment": "Solar core",
    "pattern_glyph": "Circle + Flame",
    "psyche": "Ego inflation / Solar vitality",
    "technical": "Solar overlay, 528 Hz tone",
    "appPulls": "Solar chamber in Stone-Grimoire",
    "freq": 528.0,
    "witchEyeOrders": [
      "Order of the Solar Choir"
    ],
    "nonLivingLineages": [
      "Heliacal Disc Arrays"
    ]
  },
  {
    "id": "xx_judgment",
    "name": "XX — Judgment",
    "suit": "majors",
    "letter": "Shin (ש)",
    "astrology": "Pluto",
    "ray": "Violet White (Ray 7)",
    "angel": "",
    "demon": "",
    "deities": "Gabriel, Osiris, Christ, Yama",
    "crystal": "Amethyst geode",
    "chemistry": "SiO2",
    "artifact": "Trumpet of Awakening",
    "pigment": "Violet + White wash",
    "tara": "Tara of Truth",
    "thought": "Call to awakening",
    "hga_fragment": "Breath of Gabriel",
    "pattern_glyph": "Cross + Flame",
    "psyche": "Denial / Revelation",
    "technical": "ND-safe trumpet overlay, 963 Hz tone",
    "appPulls": "Judgment hall in circuitum99",
    "freq": 963.0,
    "witchEyeOrders": [
      "Order of the Resonant Trumpet"
    ],
    "nonLivingLineages": [
      "Awakening Horn Arrays"
    ]
  },
  {
    "id": "xxi_the_world",
    "name": "XXI — The World",
    "suit": "majors",
    "letter": "Tav (ת)",
    "astrology": "Saturn",
    "ray": "Aquamarine-Violet (Ray 7 synthesis)",
    "angel": "",
    "demon": "",
    "deities": "Gaia, Sophia, Anima Mundi, Shakti",
    "crystal": "Fluorite",
    "chemistry": "CaF2",
    "artifact": "Ouroboros Ring",
    "pigment": "Aquamarine wash + Violet Halo",
    "tara": "Tara of Wholeness",
    "thought": "All is One",
    "hga_fragment": "World egg",
    "pattern_glyph": "Circle complete",
    "psyche": "Fragmentation / Integration",
    "technical": "ND-safe Ouroboros overlay, 963 Hz tone",
    "appPulls": "World gate in circuitum99 + Codex 144:99",
    "freq": 963.0,
    "witchEyeOrders": [
      "Order of the Ouroboric Gate"
    ],
    "nonLivingLineages": [
      "Worldskin Looms"
    ]
  }
]
"""

ROMAN_ORDER = ['VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX','XXI']


def load_cards() -> List[Dict]:
    data = json.loads(CARDS_JSON)
    assert isinstance(data, list), "Root should be a JSON list"
    return data


def slugify_title(title: str) -> str:
    s = title.lower()
    s = re.sub(r'[^a-z0-9]+', '_', s)
    s = re.sub(r'_+', '_', s).strip('_')
    return s


def parse_name(name: str):
    m = re.match(r'^\s*(?P<roman>[IVXLCDM]+)\s*[—-]\s*(?P<title>.+)$', name)
    assert m, f"name not in expected 'ROMAN — Title' format: {name}"
    return m.group('roman'), m.group('title')


def test_cards_json_is_parsable_and_expected_count():
    cards = load_cards()
    assert len(cards) == 14, "Majors subset VIII-XXI should contain 14 cards"


def test_unique_ids_and_names_and_roman_order():
    cards = load_cards()
    ids = [c['id'] for c in cards]
    names = [c['name'] for c in cards]

    assert len(ids) == len(set(ids)), "Card ids must be unique"
    assert len(names) == len(set(names)), "Card names must be unique"

    romans = []
    for name in names:
        m = re.match(r'^\s*([IVXLCDM]+)\s*[—-]\s*', name)
        assert m, f"Name missing roman numeral: {name}"
        romans.append(m.group(1))
    assert romans == ROMAN_ORDER, f"Roman numeral sequence/order mismatch: {romans}"


def test_id_matches_name_roman_and_slug():
    for card in load_cards():
        roman, title = parse_name(card['name'])
        expected_id = f"{roman.lower()}_{slugify_title(title)}"
        assert card['id'] == expected_id, f"id '{card['id']}' should be '{expected_id}'"


def test_required_fields_presence_and_types():
    string_fields = [
        "id","name","suit","letter","astrology","ray","angel","demon","deities","crystal",
        "chemistry","artifact","pigment","tara","thought","hga_fragment","pattern_glyph",
        "psyche","technical","appPulls"
    ]
    list_fields = ["witchEyeOrders","nonLivingLineages"]
    numeric_fields = ["freq"]

    for i, card in enumerate(load_cards()):
        # Strings
        for k in string_fields:
            assert k in card, f"Missing field '{k}' in card index {i}"
            assert isinstance(card[k], str), f"Field '{k}' must be string"
            if k not in ("angel","demon"):  # allow empty for these two
                assert card[k].strip(), f"Field '{k}' should not be empty"

        # Arrays
        for k in list_fields:
            assert k in card, f"Missing list field '{k}'"
            v = card[k]
            assert isinstance(v, list), f"Field '{k}' must be a list"
            assert v, f"Field '{k}' should not be empty"
            assert all(isinstance(x, str) and x.strip() for x in v), f"All entries in '{k}' must be non-empty strings"
            # No duplicates within the same array
            assert len(v) == len(set(v)), f"Duplicates found in '{k}' for id '{card['id']}'"

        # Numerics
        for k in numeric_fields:
            assert k in card, f"Missing numeric field '{k}'"
            assert isinstance(card[k], (int, float)), f"Field '{k}' must be numeric"
            assert float(card[k]) > 0, f"Field '{k}' must be > 0"


def test_domain_specific_invariants():
    allowed_freqs = {285.0, 417.0, 432.0, 528.0, 852.0, 963.0}
    glyph_keywords = ("Circle", "Cross", "Flame", "Crescent")

    for c in load_cards():
        # Suit
        assert c["suit"] == "majors", "All cards in this set are majors"

        # Letter includes a parenthesized glyph (e.g., Hebrew)
        assert re.search(r'\([^)]+\)', c["letter"]), "Letter should include a parenthesized glyph/character"

        # Technical description mentions ND-safe and an audio tone/Hz
        tech = c["technical"]
        assert "ND-safe" in tech, "Technical should mention ND-safe"
        assert ("Hz" in tech) or ("tone" in tech), "Technical should mention Hz or tone"

        # Psyche is dual-aspect (convention uses a slash)
        assert "/" in c["psyche"], "Psyche should indicate dual-aspect using '/'"

        # Frequency in allowed solfeggio-like set
        assert float(c["freq"]) in allowed_freqs, f"Unexpected freq {c['freq']}"

        # Pattern glyph uses known components
        assert any(word in c["pattern_glyph"] for word in glyph_keywords), "pattern_glyph should contain a known motif"

        # appPulls present with meaningful content
        assert len(c["appPulls"].strip()) >= 5, "appPulls should have a descriptive location/context"


def test_id_prefixes_are_lowercase_roman():
    roman_prefix_re = r'^(viii|ix|x|xi|xii|xiii|xiv|xv|xvi|xvii|xviii|xix|xx|xxi)_'
    for c in load_cards():
        assert re.match(roman_prefix_re, c["id"]), f"id should start with lowercase roman numeral: {c['id']}"