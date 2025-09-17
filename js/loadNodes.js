fetch('data/nodes.json')
  .then(res => res.json())
  .then(nodes => {
    const list = document.getElementById('node-list');
    nodes.forEach(node => {
      const card = document.createElement('div');
      card.className = 'node-card';
      card.innerHTML = `
        ${node.art ? `<img src="${node.art}" alt="${node.name}" />` : ''}
        <h2>${node.name}</h2>
        <p>${node.type} - Numerology: ${node.numerology}</p>
        <div>${node.lore}</div>
        ${node.lab ? `<button onclick="window.open('${node.lab}', '_blank')">Open Lab</button>` : ''}
      `;
      list.appendChild(card);
    });
  });
