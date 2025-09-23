# Testing library/framework: pytest (no external HTML libs used; stdlib regex/string checks).
import re
import pytest

def test_document_structure_doctype_and_lang(index_html_text):
    assert index_html_text.lstrip().lower().startswith("<\!doctype html>"), "Must start with <\!doctype html>"
    assert re.search(r'<html[^>]*\blang="en"\b', index_html_text, re.I), "html lang='en' is required"

def test_meta_and_title_present(index_html_text):
    assert '<meta charset="utf-8">' in index_html_text
    assert re.search(r'<title>\s*Cosmic Helix Renderer \(ND-safe, Offline\)\s*</title>', index_html_text)

def test_viewport_and_color_scheme_meta(index_html_text):
    assert 'name="viewport"' in index_html_text
    assert 'width=device-width,initial-scale=1,viewport-fit=cover' in index_html_text
    assert re.search(r'<meta[^>]+name="color-scheme"[^>]+content="light dark"', index_html_text)

def test_status_and_canvas_elements(index_html_text):
    assert re.search(r'<div[^>]+class="status"[^>]+id="status"[^>]*>Loading palette…</div>', index_html_text)
    # Canvas size and ARIA label
    assert re.search(r'<canvas[^>]*\bid="stage"[^>]*\bwidth="1440"[^>]*\bheight="900"[^>]*\baria-label="Layered sacred geometry canvas"[^>]*></canvas>', index_html_text)

def test_style_block_nd_safe_tokens(index_html_text):
    # Ensure CSS custom properties and ND-safe comment are present
    assert '/* ND-safe: calm contrast, no motion, generous spacing */' in index_html_text
    assert re.search(r':root\s*\{\s*--bg:#0b0b12;\s*--ink:#e8e8f0;\s*--muted:#a6a6c1;\s*\}', index_html_text)

def test_module_script_and_import(index_html_text):
    # Verify ES module usage and correct relative import path
    assert re.search(r'<script[^>]+type="module"[^>]*>', index_html_text)
    assert re.search(r'import\s*\{\s*renderHelix\s*\}\s*from\s*"./js/helix-renderer\.mjs"\s*;', index_html_text)

def test_loadjson_function_behavior_present(index_html_text):
    # Static checks that loadJSON uses fetch with no-store and returns null on error
    assert re.search(r'async function loadJSON\(path\)\s*\{', index_html_text)
    assert re.search(r'fetch\(path,\s*\{\s*cache:\s*"no-store"\s*\}\s*\)', index_html_text)
    assert re.search(r'if\s*\(\!res\.ok\)\s*throw new Error', index_html_text)
    assert re.search(r'catch\s*\(err\)\s*\{\s*return null;\s*\}', index_html_text)

def test_defaults_palette_schema(index_html_text):
    # Validate presence of defaults.palette keys and expected hex values
    assert re.search(r'const defaults\s*=\s*\{\s*palette:\s*\{', index_html_text)
    assert re.search(r'bg:"#0b0b12"', index_html_text)
    assert re.search(r'ink:"#e8e8f0"', index_html_text)
    # Layers array with 6 entries
    m = re.search(r'layers:\s*\[(.*?)\]', index_html_text, re.S)
    assert m, "defaults.palette.layers must exist"
    layers = [s.strip() for s in m.group(1).split(",")]
    assert len(layers) == 6, f"Expected 6 layer colors, found {len(layers)}"

def test_palette_fallback_and_status_message(index_html_text):
    # Ensure fallback expression and user-facing status text variations exist
    assert re.search(r'const palette\s*=\s*await\s+loadJSON\("./data/palette\.json"\);', index_html_text)
    assert re.search(r'const active\s*=\s*palette\s*\|\|\s*defaults\.palette;', index_html_text)
    assert re.search(r'elStatus\.textContent\s*=\s*palette \? "Palette loaded\." : "Palette missing; using safe fallback\.";', index_html_text)

def test_numerology_constants_defined(index_html_text):
    # NUM includes required keys with exact values
    expected = dict(THREE=3, SEVEN=7, NINE=9, ELEVEN=11, TWENTYTWO=22, THIRTYTHREE=33, NINETYNINE=99, ONEFORTYFOUR=144)
    # Build a regex that ensures all key:value pairs appear
    for k, v in expected.items():
        assert re.search(rf'\b{k}\s*:\s*{v}\b', index_html_text), f"NUM must include {k}:{v}"

def test_renderhelix_invocation_signature(index_html_text):
    # Verify call shape: renderHelix(ctx, { width:canvas.width, height:canvas.height, palette:active, NUM });
    assert re.search(
        r'renderHelix\(\s*ctx\s*,\s*\{\s*width\s*:\s*canvas\.width\s*,\s*height\s*:\s*canvas\.height\s*,\s*palette\s*:\s*active\s*,\s*NUM\s*\}\s*\)\s*;',
        index_html_text
    )