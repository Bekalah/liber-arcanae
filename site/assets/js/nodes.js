// nodes.js -- bridges the Atelier layout with the ND-safe helix renderer.
import { renderHelix } from './helix-renderer.mjs';

const NUM = Object.freeze({
  THREE:3,
  SEVEN:7,
  NINE:9,
  ELEVEN:11,
  TWENTYTWO:22,
  THIRTYTHREE:33,
  NINETYNINE:99,
  ONEFORTYFOUR:144
});

const FALLBACK_PALETTE = Object.freeze({
  bg:'#0b0b12',
  ink:'#e8e8f0',
  layers:['#b1c7ff','#89f7fe','#a0ffa1','#ffd27f','#f5a3ff','#d0d0e6']
});

const statusEl = document.getElementById('status');
const canvas = document.getElementById('cosmicCanvas');
const ctx = canvas?.getContext('2d');

// Pure helper: fetch JSON without throwing; ND-safe fallback keeps render calm offline.
async function loadJSON(path) {
  try {
    const response = await fetch(path, { cache:'no-store' });
    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    return null;
  }
}

function updateStatus(message) {
  if (statusEl) statusEl.textContent = message;
}

function renderCosmicHelix(palette) {
  if (!ctx || !canvas) return;
  renderHelix(ctx, { width:canvas.width, height:canvas.height, palette, NUM });
}

function renderNodeList(nodes) {
  const target = document.getElementById('nodeList');
  if (!target) return;
  if (!Array.isArray(nodes)) {
    target.innerHTML = '<li class="node-empty">Node registry unreachable -- offline oracle engaged.</li>';
    return;
  }
  const items = nodes.slice(0, NUM.TWENTYTWO).map(node => {
    const title = node?.title || 'Unnamed node';
    const path = node?.path || 'Unknown path';
    return `<li class="node-entry"><span class="node-title">${title}</span><span class="node-path">${path}</span></li>`;
  }).join('');
  target.innerHTML = items;
}

(async function init() {
  const [palette, nodes] = await Promise.all([
    loadJSON('../data/palette.json'),
    loadJSON('../data/nodes.json')
  ]);
  if (palette) {
    updateStatus('Palette + nodes retrieved.');
  } else {
    updateStatus('Palette missing -- soothing fallback applied.');
  }
  renderCosmicHelix(palette || FALLBACK_PALETTE);
  renderNodeList(nodes);
})();
