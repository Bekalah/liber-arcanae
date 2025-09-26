// Museum-grade, ND-safe. No strobe, no autoplay. Respect reduced-motion.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { BACKEND_URL } from '../config.js';

const state = {
  reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
  speed: 0.035,
  doors: [
    { id:'fool', label:'The Fool', z:-18 },
    { id:'magician', label:'The Magician', z:-38 },
    { id:'high-priestess', label:'The High Priestess', z:-58 },
    { id:'hierophant', label:'The Hierophant', z:-78 },
    { id:'tower', label:'The Tower', z:-98 },
    { id:'world', label:'The World', z:-118 }
  ],
  hovered: null, near: null
};

async function logEvent(cardId, event = 'enter-door'){
  if(!BACKEND_URL) return;
  try{
    await fetch(`${BACKEND_URL}/v1/logs`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ cardId, event }),
      mode: 'cors',
      keepalive: true
    });
  }catch{
    // Fail silent to preserve corridor flow even if logging offline
  }
}

const root = document.getElementById('cathedral-root');
const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x0b0e10, 12, 140);
const camera = new THREE.PerspectiveCamera(55, root.clientWidth/root.clientHeight, 0.1, 300);
camera.position.set(0,1.6,4);

const renderer = new THREE.WebGLRenderer({ antialias:true, powerPreference:'high-performance' });
renderer.setSize(root.clientWidth, root.clientHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.shadowMap.enabled = true;
root.appendChild(renderer.domElement);

// Lights
const hemi = new THREE.HemisphereLight(0x6fb3a9, 0x090a0c, 0.6); scene.add(hemi);
const dir = new THREE.DirectionalLight(0xd5b676, 0.9);
dir.position.set(4,8,6); dir.castShadow=true; dir.shadow.mapSize.set(1024,1024); scene.add(dir);

// Materials
const stone = new THREE.MeshStandardMaterial({ color:'#111419', roughness:0.9, metalness:0.05 });
const gold  = new THREE.MeshStandardMaterial({ color:'#d5b676', roughness:0.35, metalness:0.75,
                                               emissive:'#271f0f', emissiveIntensity:.08 });
const glass = new THREE.MeshStandardMaterial({ color:'#4dd3c9', metalness:0.9, roughness:0.05,
                                               transparent:true, opacity:0.25, emissive:'#173b3d', emissiveIntensity:.4 });

// Nave geometry
const group = new THREE.Group(); scene.add(group);
// floor
const floor = new THREE.Mesh(new THREE.PlaneGeometry(8,140), stone);
floor.rotation.x = -Math.PI/2; floor.receiveShadow = true; group.add(floor);
// side walls
const mkWall = x => { const w=new THREE.Mesh(new THREE.PlaneGeometry(0.3,140), stone);
  w.position.set(x,1.6,-70); w.rotation.y = x<0 ? Math.PI/2 : -Math.PI/2; w.receiveShadow=true; return w; };
group.add(mkWall(-3), mkWall(3));
// arches & ribs
const archGeo = new THREE.TorusGeometry(2.8,0.06,8,64,Math.PI);
for(let i=0;i<16;i++){
  const z = -i*8 - 10;
  const arch = new THREE.Mesh(archGeo,gold); arch.rotation.z=Math.PI; arch.position.set(0,2.8,z); arch.castShadow=true; group.add(arch);
  const rib  = new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,6,8),gold);
  rib.position.set(0,2.8,z); rib.rotation.z=Math.PI/2; group.add(rib);
}
// “stained-glass” panes
for(let i=0;i<6;i++){
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(2.2,2.2),glass);
  pane.position.set(0,3.1, -i*20 - 10); group.add(pane);
}

// Doors
const doorGeo = new THREE.PlaneGeometry(1.3,2.4);
const doorIdle= new THREE.MeshStandardMaterial({color:'#1a1f22', metalness:.4, roughness:.6});
state.doors.forEach(d=>{
  const frame = new THREE.Mesh(new THREE.RingGeometry(0.75,0.82,64),gold);
  frame.position.set(0,1.6,d.z); frame.rotation.y=Math.PI; group.add(frame);
  const door = new THREE.Mesh(doorGeo, doorIdle.clone());
  door.name = `door:${d.id}`; door.position.set(0,1.5,d.z+0.02); door.castShadow=true; door.userData.meta=d; group.add(door);
});

// Hover / near
const ray = new THREE.Raycaster(); const mouse = new THREE.Vector2(-1,-1);
root.addEventListener('pointermove', e=>{
  const r = renderer.domElement.getBoundingClientRect();
  mouse.x = ((e.clientX-r.left)/r.width)*2-1; mouse.y = -((e.clientY-r.top)/r.height)*2+1;
});
let forward=false;
root.addEventListener('pointerdown', ()=>{ if(!state.reduced) forward=true; });
root.addEventListener('pointerup', ()=>{ forward=false; });
window.addEventListener('keydown', e=>{ if(e.code==='Space') forward = !state.reduced; });

function update(){
  if(forward) camera.position.z -= state.speed;
  ray.setFromCamera(mouse,camera);
  const doors = group.children.filter(m=>m.name?.startsWith('door:'));
  const hit = ray.intersectObjects(doors,false)[0];
  if(hit){
    if(state.hovered!==hit.object){
      if(state.hovered) state.hovered.material.emissive?.setHex(0x000000);
      state.hovered = hit.object; hit.object.material.emissive = new THREE.Color('#173b3d');
    }
    const dz = Math.abs(camera.position.z - hit.object.position.z);
    state.near = dz < 1.8 ? hit.object : null;
  } else { if(state.hovered){ state.hovered.material.emissive?.setHex(0x000000); } state.hovered=null; state.near=null; }
}
root.addEventListener('click', ()=>{
  if(state.near){
    const id = state.near.userData.meta.id;
    logEvent(id, 'enter-door');
    window.location.href = `arcana.html?id=${encodeURIComponent(id)}`;
  }
});
window.addEventListener('resize', ()=>{ renderer.setSize(root.clientWidth,root.clientHeight);
  camera.aspect = root.clientWidth/root.clientHeight; camera.updateProjectionMatrix(); });

const motionBtn = document.getElementById('motionToggle');
if(motionBtn){
  motionBtn.addEventListener('click', ()=>{
    state.reduced=!state.reduced; motionBtn.textContent=`Reduce Motion: ${state.reduced?'ON':'OFF'}`;
    motionBtn.setAttribute('aria-pressed', String(state.reduced)); forward=false;
  });
  motionBtn.textContent=`Reduce Motion: ${state.reduced?'ON':'OFF'}`; motionBtn.setAttribute('aria-pressed', String(state.reduced));
}

(function frame(){ update(); renderer.render(scene,camera); requestAnimationFrame(frame); })();
