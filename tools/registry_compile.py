# Registry Compiler -- Codex Abyssiae -> cards.json
# Usage: python tools/registry_compile.py [in_md] [out_json]
import re, json, sys, os

INP = sys.argv[1] if len(sys.argv)>1 else "docs/codex_abyssiae_master.md"
OUT = sys.argv[2] if len(sys.argv)>2 else "assets/data/cards.json"

with open(INP, "r", encoding="utf-8") as f:
    md = f.read()

blocks = [b for b in re.split(r"\n(?=##\s)", md) if b.startswith("## ")]

def field(b, k):
    m = re.search(r"-\s*%s:\s*([^\n]+)" % re.escape(k), b)
    return m.group(1).strip() if m else ""

def suit(n):
    s = n.lower()
    if "wands" in s: return "wands"
    if "cups" in s: return "cups"
    if "pentacles" in s or "coin" in s: return "pentacles"
    if "swords" in s or "blade" in s: return "swords"
    return "majors"

def map_freq(ray):
    """
    Map a textual ray descriptor to a Solfeggio frequency (Hz).
    
    Given a ray name or descriptor string, returns a numeric frequency mapped by keyword:
    - "violet" -> 963
    - "indigo" or "silver" -> 852
    - any of "gold", "emerald", "green", "aquamarine", "turquoise" -> 528
    - "crimson" -> 417
    - "scarlet" or "red" -> 285
    If no keywords match or input is falsy, returns the default 432.
    
    Parameters:
        ray (str | None): Ray descriptor or name (case-insensitive).
    
    Returns:
        int: Corresponding frequency in Hz.
    """
    r = (ray or "").lower()
    if "violet" in r: return 963
    if "indigo" in r or "silver" in r: return 852
    if any(x in r for x in ["gold","emerald","green","aquamarine","turquoise"]): return 528
    if "crimson" in r: return 417
    if "scarlet" in r or "red" in r: return 285
    return 432

def parse_list(value):
    """
    Normalize a delimited string into a list of non-empty, trimmed items.
    
    Replaces semicolons with commas, splits on commas, trims whitespace from each item,
    and filters out empty entries. Returns an empty list when input is falsy.
    
    Parameters:
        value (str | None): A comma/semicolon-delimited string.
    
    Returns:
        list[str]: The list of trimmed, non-empty tokens.
    """
    if not value:
        return []
    cleaned = value.replace(';', ',')
    parts = [p.strip() for p in cleaned.split(',')]
    return [p for p in parts if p]

cards = []
for b in blocks:
    name_match = re.search(r"^##\s+(.+?)\s*$", b, re.M)
    if not name_match:
        continue
    name = name_match.group(1).strip()
    app_pulls = field(b, "App Pulls")
    if not app_pulls:
        continue
    _id = re.sub(r"[^\w]+", "_", name).lower()
    ray = field(b, "Ray")
    ad = field(b, "Angel/Demon")
    angel, demon = "", ""
    if "↔" in ad:
        parts = [p.strip() for p in ad.split("↔")]
        angel = parts[0] if parts else ""
        demon = parts[1] if len(parts) > 1 else ""
    crystal_line = field(b, "Crystal")
    crystal = crystal_line.split("(")[0].strip() if crystal_line else ""
    chem = ""
    if crystal_line and "(" in crystal_line and ")" in crystal_line:
        start = crystal_line.find("(") + 1
        end = crystal_line.rfind(")")
        if end > start:
            chem = crystal_line[start:end].strip()
    tech = field(b, "Technical")
    freq_match = re.search(r"Solfeggio\s*=\s*([\d\.]+)", tech)
    freq = float(freq_match.group(1)) if freq_match else float(map_freq(ray))
    cards.append({
        "id": _id,
        "name": name,
        "suit": suit(name),
        "letter": field(b, "Letter"),
        "astrology": field(b, "Astrology"),
        "ray": ray,
        "angel": angel,
        "demon": demon,
        "deities": field(b, "Deities"),
        "crystal": crystal,
        "chemistry": chem,
        "artifact": field(b, "Artifact"),
        "pigment": field(b, "Pigment"),
        "tara": field(b, "Secret Tara"),
        "thought": field(b, "Thought-form"),
        "hga_fragment": field(b, "HGA Fragment"),
        "pattern_glyph": field(b, "Pattern Glyph"),
        "psyche": field(b, "Psyche"),
        "technical": tech,
        "appPulls": app_pulls,
        "freq": freq,
        "witchEyeOrders": parse_list(field(b, "Witch Eye Order")),
        "nonLivingLineages": parse_list(field(b, "Non-Living Lineage"))
    })

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(cards, f, ensure_ascii=False, indent=2)
print(f"Wrote {len(cards)} cards -> {OUT}")
