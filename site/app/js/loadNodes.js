const IMAGE_PATTERN = /\.(?:png|jpg|jpeg|webp|avif)$/i;

/**
 * Create a semantic card for a node.
 * ND-safe choices: small pure function, no animation, gentle focus states handled in CSS.
 */
function createNodeCard(node) {
  const card = document.createElement('article');
  card.className = 'node-card';
  card.setAttribute('role', 'listitem');

  if (node.art && IMAGE_PATTERN.test(node.art)) {
    const figure = document.createElement('figure');
    const image = document.createElement('img');
    image.src = node.art;
    image.alt = `${node.name} emblem`;
    image.loading = 'lazy';
    image.decoding = 'async';
    figure.appendChild(image);
    if (node.art_credit) {
      const caption = document.createElement('figcaption');
      caption.textContent = node.art_credit;
      figure.appendChild(caption);
    }
    card.appendChild(figure);
  }

  const title = document.createElement('h3');
  title.textContent = node.name;
  card.appendChild(title);

  const meta = document.createElement('p');
  meta.className = 'node-meta';
  meta.textContent = `${node.type} · Numerology ${node.numerology}`;
  card.appendChild(meta);

  if (node.lore) {
    const lore = document.createElement('p');
    lore.className = 'node-lore';
    lore.textContent = node.lore;
    card.appendChild(lore);
  }

  if (Array.isArray(node.links) && node.links.length > 0) {
    const links = document.createElement('p');
    links.className = 'node-links';
    links.textContent = `Linked to: ${node.links.join(', ')}`;
    card.appendChild(links);
  }

  if (node.lab) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'lab-button';
    button.textContent = `Open ${node.name} Lab`;
    button.setAttribute('aria-label', `Open ${node.name} lab in a new tab`);
    button.addEventListener('click', () => {
      window.open(node.lab, '_blank', 'noopener');
    });
    card.appendChild(button);
  }

  return card;
}

/**
 * Render fallback notice when network is unavailable.
 */
function renderOfflineNotice(listEl) {
  const notice = document.createElement('p');
  notice.className = 'offline-notice';
  notice.textContent = 'Offline cache active. Connect to refresh Codex 144:99 nodes.';
  listEl.appendChild(notice);
}

/**
 * Initialize node gallery and respect covenant requirements.
 */
export async function initNodeGallery({ listEl, statusEl, dataUrl = 'data/nodes.json' } = {}) {
  if (!listEl) {
    throw new Error('initNodeGallery requires a listEl reference');
  }

  if (statusEl) {
    statusEl.textContent = 'Loading nodes…';
  }

  try {
    const response = await fetch(dataUrl, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const payload = await response.json();
    if (!Array.isArray(payload) || payload.length === 0) {
      if (statusEl) {
        statusEl.textContent = 'No nodes available yet.';
      }
      return;
    }

    const fragment = document.createDocumentFragment();
    payload.forEach((node) => {
      fragment.appendChild(createNodeCard(node));
    });

    listEl.innerHTML = '';
    listEl.appendChild(fragment);

    if (statusEl) {
      statusEl.textContent = `Loaded ${payload.length} node${payload.length === 1 ? '' : 's'}.`;
    }
  } catch (error) {
    console.warn('Node registry load failed:', error);
    if (statusEl) {
      statusEl.textContent = 'Unable to reach the live registry; showing cached copy.';
    }
    renderOfflineNotice(listEl);
  }
}
