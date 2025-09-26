import { BACKEND_URL } from './config.js';

const id = new URLSearchParams(location.search).get('id') || 'fool';
const el = (t,c)=>{const e=document.createElement(t); if(c) e.className=c; return e;};

async function getCard(){
  const res = await fetch('registry/arcanae.json', {cache:'no-cache'});
  const list = await res.json();
  return list.find(x=>x.id===id) || list[0];
}

async function logView(cardId){
  if(!BACKEND_URL) return;
  try{
    await fetch(`${BACKEND_URL}/v1/logs`, {
      method:'POST',
      headers:{ 'content-type':'application/json' },
      body: JSON.stringify({ cardId, event:'view-folio' }),
      mode:'cors',
      keepalive:true
    });
  }catch{
    // Silent fail keeps page offline-safe if backend unreachable
  }
}

(async ()=>{
  const data = await getCard();
  await logView(data.id);
  const folio = document.getElementById('folio');

  const plate = el('section','plate');
  const card = el('div','card'); plate.appendChild(card);

  // Placeholder sigil; swap for art asset later (Thierry-Mugler angel couture vibe)
  card.innerHTML = `<svg viewBox="0 0 100 160" width="100%" height="100%" aria-hidden="true">
    <g fill="none" stroke="#4dd3c9" stroke-opacity=".7" stroke-width="1.2">
      <circle cx="50" cy="50" r="24"/><path d="M50 12 L76 62 L24 62 Z"/><path d="M50 86 L70 120 L30 120 Z"/>
    </g></svg>`;

  const meta = el('div','meta');
  const h2 = el('h2'); h2.textContent = `${data.name} — ${data.role}`; meta.appendChild(h2);
  const badges = el('div'); (data.lineage||[]).forEach(n=>{const b=el('span','badge'); b.textContent=n; badges.appendChild(b);}); meta.appendChild(badges);
  const desc = el('p'); desc.textContent = `Symbols: ${(data.symbols||[]).join(', ').replaceAll('_',' ')}`; meta.appendChild(desc);

  const actions = el('div','actions');
  const back = el('a','btn'); back.href='index.html'; back.textContent='Return to Corridor';
  const restart = el('a','btn'); restart.href=data.route; restart.textContent='Replay Entry';
  actions.append(back,restart); meta.appendChild(actions);

  plate.appendChild(meta); folio.appendChild(plate);
})();
