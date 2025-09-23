import os
import re
import logging
from pathlib import Path
from typing import Tuple, List

# Framework note:
# These tests are written for pytest. They use plain asserts and function-scoped tests consistent with pytest conventions.

ROOT = Path(__file__).resolve().parents[1]

H1_TITLE = "Cosmic Helix Renderer"
HEADINGS = [
    "# " + H1_TITLE,
    "## Layers",
    "## Usage",
    "## ND-Safe Considerations",
    "## Extending",
]

LAYER_BULLETS = [
    r"\*\*L1\s+Vesica\s+Field\*\*\s*[—-]\s*overlapping circles establish the womb of forms\.",
    r"\*\*L2\s+Tree-of-Life\*\*\s*[—-]\s*ten sephirot nodes and twenty-two paths build the teaching scaffold\.",
    r"\*\*L3\s+Fibonacci\s+Curve\*\*\s*[—-]\s*a static spiral encoded with .*? progression for gentle movement cues without animation\.",
    r"\*\*L4\s+Double\s+Helix\s+Lattice\*\*\s*[—-]\s*twin strands with fixed rungs referencing the circuitum double-helix\.",
]

ND_SAFE_BULLETS_REQUIRED_SUBSTRINGS = [
    "No animation or motion APIs",
    "Soft contrast palette with calm blues, violets, and golds",
    "Layer rendering order follows grounding-first principles: field → scaffold → curve → helix",
    "Geometry constants reference 3, 7, 9, 11, 22, 33, 99, and 144",
]

EXTENDING_BULLETS_CHECKS = [
    ("js/helix-renderer.mjs", "renderHelix(ctx, options)"),
    ("pure functions", "drawing context"),
    ("offline", "avoid external network calls"),
]

NUMEROLOGY_SET = {3, 7, 9, 11, 22, 33, 99, 144}


def _find_cosmic_helix_markdown() -> Tuple[Path, str]:
    """
    Walk the repo to find a Markdown file containing the H1 'Cosmic Helix Renderer'.
    Prefer docs/ and README-like files. Raise AssertionError if not found.
    """
    # Priority order of directories to scan
    priority_dirs = ["docs", "documentation", "doc", "."]
    seen = set()

    for rel in priority_dirs:
        base = (ROOT / rel).resolve()
        if not base.exists():
            continue
        for p in base.rglob("*.md"):
            if "node_modules" in p.parts:
                continue
            if p in seen:
                continue
            seen.add(p)
            try:
                text = p.read_text(encoding="utf-8", errors="strict")
            except (OSError, UnicodeDecodeError) as exc:
                logging.debug("Skipping %s due to read error: %s", p, exc)
                continue
            if H1_TITLE in text:
                return p, text

    # Fallback: scan all md files if not found in priority dirs
    for p in ROOT.rglob("*.md"):
        if "node_modules" in p.parts:
            continue
        try:
            text = p.read_text(encoding="utf-8", errors="strict")
        except (OSError, UnicodeDecodeError) as exc:
            logging.debug("Skipping %s due to read error: %s", p, exc)
            continue
        if H1_TITLE in text:
            return p, text

    raise AssertionError()


def _section(text: str, heading: str) -> List[str]:
    """
    Return lines belonging to the section starting at 'heading' (inclusive)
    until the next '## ' heading (exclusive), or EOF.
    """
    lines = text.splitlines()
    start = None
    for i, line in enumerate(lines):
        if line.strip() == heading:
            start = i
            break
    assert start is not None, f"Heading not found: {heading}"
    # Find next '## ' heading after start (but allow H1 to precede)
    end = len(lines)
    for j in range(start + 1, len(lines)):
        if lines[j].startswith("## "):
            end = j
            break
    return lines[start:end]


def _bullets(lines: List[str]) -> List[str]:
    return [ln.strip() for ln in lines if ln.strip().startswith("- ")]


def test_markdown_file_discovery_and_headings():
    md_path, text = _find_cosmic_helix_markdown()
    assert md_path.suffix == ".md", "Target doc must be a Markdown file (.md)."

    # Check presence of required headings
    for h in HEADINGS:
        assert h in text, f"Missing heading: {h}"

    # H1 must be the first non-empty line
    first_nonempty = next((ln for ln in text.splitlines() if ln.strip()), "")
    assert first_nonempty.strip() == HEADINGS[0], "H1 must be the first non-empty line."


def test_layers_section_contents_and_order():
    _, text = _find_cosmic_helix_markdown()
    sec = _section(text, "## Layers")
    blts = _bullets(sec)
    assert len(blts) == 4, f"Expected 4 layer bullets, found {len(blts)}"

    # Validate each bullet with tolerant dash (— or -)
    for idx, (line, pattern) in enumerate(zip(blts, LAYER_BULLETS), start=1):
        assert re.search(pattern, line, flags=re.IGNORECASE), (
            f"Layer L{idx} bullet not matching expected pattern.\n"
            f"Line: {line}\nPattern: {pattern}"
        )

    # Enforce declarative order L1..L4
    order = [re.search(r"\*\*(L\d)\b", ln).group(1) for ln in blts]
    assert order == ["L1", "L2", "L3", "L4"], f"Layer order must be L1..L4, got {order}"


def test_usage_section_numbering_and_backticks():
    _, text = _find_cosmic_helix_markdown()
    sec = _section(text, "## Usage")
    # Pull ordered list lines (starting with digits.)
    steps = [ln.strip() for ln in sec if re.match(r"^\d+\.\s+", ln.strip())]
    assert steps, "Usage section must contain numbered steps."
    assert steps[:3], "Usage must include at least 3 steps."

    # Step 1: cloning/opening
    assert re.search(r"1\.\s*(Download|Clone|Download or clone)", steps[0], re.I)

    # Step 2: double-click index.html with backticks
    assert re.search(r"2\.\s*Double-click\s+`index\.html`", steps[1])

    # Step 3: palette path and fallback mention
    assert re.search(r"3\.\s*Optional:.*`data/palette\.json`", steps[2])
    assert ("fall back" in steps[2].lower() or "fallback" in steps[2].lower()) and (
        "in-memory" in steps[2].lower()
    ), "Usage step 3 should mention fallback to safe in-memory set."


def test_nd_safe_considerations_and_numerology():
    _, text = _find_cosmic_helix_markdown()
    sec = _section(text, "## ND-Safe Considerations")
    blts = _bullets(sec)
    assert len(blts) >= 4, "Expected at least 4 ND-safe bullets."
    joined = "\n".join(blts)

    for required in ND_SAFE_BULLETS_REQUIRED_SUBSTRINGS:
        assert required in joined, f"ND-safe bullet missing phrase: {required}"

    # Verify arrow sequence for rendering order (prefer unicode arrow)
    assert "field → scaffold → curve → helix" in joined

    # Extract numerals and compare set (allow commas and 'and')
    nums = set(int(n) for n in re.findall(r"\b(3|7|9|11|22|33|99|144)\b", joined))
    assert nums == NUMEROLOGY_SET, f"Numerology constants mismatch: {nums} vs {NUMEROLOGY_SET}"


def test_extending_guidance_and_api_reference():
    _, text = _find_cosmic_helix_markdown()
    sec = _section(text, "## Extending")
    blts = _bullets(sec)
    joined = "\n".join(blts)

    # Check each tuple of required phrases appears in the section
    for a, b in EXTENDING_BULLETS_CHECKS:
        assert a in joined and b in joined, f"Extending section must reference '{a}' and '{b}'."

    # Explicit API surface
    assert "renderHelix(ctx, options)" in joined


def test_offline_policy_and_no_external_links():
    _, text = _find_cosmic_helix_markdown()
    # No http/https links anywhere in the doc to keep it offline-only
    assert not re.search(r"https?://", text), "Document must avoid external links to remain offline."
    # Must explicitly mention offline assets guidance
    assert "Keep all assets offline; avoid external network calls." in text


def test_formatting_sanity():
    _, text = _find_cosmic_helix_markdown()
    # Ensure em dash or hyphen is used consistently in layer bullets
    layers = _section(text, "## Layers")
    blts = _bullets(layers)
    for ln in blts:
        assert re.search(r"\s[—-]\s", ln), f"Expected a dash separator in: {ln}"
    # Ensure code identifiers are fenced with backticks
    assert "`index.html`" in text
    assert "`data/palette.json`" in text