// --- READ URL PARAMS FROM MAIN APP ---
(function() {
  const params = new URLSearchParams(location.search);
  const t = params.get('theme');
  if (t) {
    document.body.setAttribute('data-theme', t);
    document.documentElement.setAttribute('data-theme', t);
  }
  window.__dsParams = {
    quoteId: params.get('q') || '',
    roomIdx: parseInt(params.get('r') || '0', 10),
    mods: JSON.parse(params.get('mods') || '[]'),
    room: JSON.parse(params.get('room') || '{}')
  };
})();

const viewport = document.getElementById('viewport');
const plan = document.getElementById('plan');

window.modules = [];
window.siteElements = [];
window.wallDims = { A: 800, B: 600, H: 240 };
window.CURRENT_SHAPE = 'rectangle';
let activeRoomIndex = window.__dsParams.roomIdx || 0;
let selectedId = null, selectedType = null; 
let activeWall = 'A';
let isDragging = false, dragType = '', startX, startY, startLeft, startTop;
let isPanning = false, panStartX, panStartY;
let currentZoom = 1, panX = 0, panY = 0;

// --- WALL DEFINITIONS ---
function getWallSegments() {
  const W = wallDims.A, H = wallDims.B;
  const walls = [];
  if (CURRENT_SHAPE === 'l-shape') {
    walls.push({ id: 'A', name: 'A', x1: 0, y1: 0, x2: W*0.6, y2: 0 });
    walls.push({ id: 'B', name: 'B', x1: W*0.6, y1: 0, x2: W, y2: 0 });
    walls.push({ id: 'C', name: 'C', x1: W, y1: 0, x2: W, y2: H*0.6 });
    walls.push({ id: 'D', name: 'D', x1: W, y1: H*0.6, x2: W*0.6, y2: H*0.6 });
    walls.push({ id: 'E', name: 'E', x1: W*0.6, y1: H*0.6, x2: W*0.6, y2: H });
    walls.push({ id: 'F', name: 'F', x1: W*0.6, y1: H, x2: 0, y2: H });
    walls.push({ id: 'G', name: 'G', x1: 0, y1: H, x2: 0, y2: 0 });
  } else if (CURRENT_SHAPE === 'u-shape') {
    walls.push({ id: 'A', name: 'A', x1: 0, y1: 0, x2: W*0.3, y2: 0 });
    walls.push({ id: 'B', name: 'B', x1: W*0.3, y1: 0, x2: W*0.7, y2: 0 });
    walls.push({ id: 'C', name: 'C', x1: W*0.7, y1: 0, x2: W, y2: 0 });
    walls.push({ id: 'D', name: 'D', x1: W, y1: 0, x2: W, y2: H });
    walls.push({ id: 'E', name: 'E', x1: W, y1: H, x2: W*0.7, y2: H });
    walls.push({ id: 'F', name: 'F', x1: W*0.7, y1: H, x2: W*0.7, y2: H*0.5 });
    walls.push({ id: 'G', name: 'G', x1: W*0.7, y1: H*0.5, x2: W*0.3, y2: H*0.5 });
    walls.push({ id: 'H', name: 'H', x1: W*0.3, y1: H*0.5, x2: W*0.3, y2: H });
    walls.push({ id: 'I', name: 'I', x1: W*0.3, y1: H, x2: 0, y2: H });
    walls.push({ id: 'J', name: 'J', x1: 0, y1: H, x2: 0, y2: 0 });
  } else {
    walls.push({ id: 'A', name: 'A', x1: 0, y1: 0, x2: W, y2: 0 });
    walls.push({ id: 'B', name: 'B', x1: W, y1: 0, x2: W, y2: H });
    walls.push({ id: 'C', name: 'C', x1: W, y1: H, x2: 0, y2: H });
    walls.push({ id: 'D', name: 'D', x1: 0, y1: H, x2: 0, y2: 0 });
  }
  return walls;
}

// --- LOAD DATA ---
function loadRoomsDropdown() {
  const select = document.getElementById('active-room-select');
  if (window.__dsParams.room && window.__dsParams.room.name) {
      select.innerHTML = `<option value="0" selected>${window.__dsParams.room.name}</option>`;
      if (window.__dsParams.room.dim) {
          wallDims.A = window.__dsParams.room.dim.L / 10 || 800;
          wallDims.B = window.__dsParams.room.dim.W / 10 || 600;
          wallDims.H = (window.__dsParams.room.dim.H || 2700) / 10;
      }
      const room = window.__dsParams.room;
      const existingDS = (room.rows || []).filter(r => r._fromDS && r.fpId);
      window.modules = existingDS.map(r => ({
        id: r.fpId, type: r.n, mk: r.mk || '', wall: r.wl || 'A',
        x: (r.x || 0) / 10, y: (r.y || 0) / 10, z: (r.z || 0) / 10,
        width: (r.l || 0) / 10, height: (r.w || 0) / 10, depth: (r.d || 600) / 10
      }));
      if (room.siteElements) window.siteElements = room.siteElements.map(el => ({...el}));
  }
  initializeViews(); 
}

// --- RENDER PLAN ---
function renderPlanHTML() {
  const W = wallDims.A, H = wallDims.B;
  const walls = getWallSegments();
  let svg = `<svg width="${W+200}" height="${H+200}" style="position:absolute; top:-100px; left:-100px; pointer-events:none; z-index:0;">`;
  
  let pathD = "";
  walls.forEach(w => { if (pathD === "") pathD = `M ${w.x1+100},${w.y1+100}`; pathD += ` L ${w.x2+100},${w.y2+100}`; });
  pathD += " Z";
  svg += `<path d="${pathD}" fill="#fdfdfd" stroke="#9ca3af" stroke-width="12" stroke-linejoin="round" />`;

  walls.forEach(w => {
    const midX = (w.x1 + w.x2) / 2 + 100, midY = (w.y1 + w.y2) / 2 + 100;
    const isVertical = Math.abs(w.x1 - w.x2) < 1;
    let tx = midX, ty = midY, rot = 0;
    if (isVertical) { rot = -90; tx = (w.x1 === 0) ? midX - 20 : midX + 20; } else { ty = (w.y1 === 0) ? midY - 10 : midY + 20; }
    svg += `<text x="${tx}" y="${ty}" font-size="16" font-weight="bold" fill="#555" text-anchor="middle" transform="rotate(${rot}, ${tx}, ${ty})">WALL ${w.name}</text>`;
  });
  svg += `</svg>`;

  let itemsHtml = '';
  window.siteElements.forEach(el => {
      let w = walls.find(w => w.id === el.wall);
      if(!w) return;
      
      // Lock doors and windows to the wall line
      if (el.type === 'door' || el.type === 'window') {
          const wallLen = Math.sqrt(Math.pow(w.x2 - w.x1, 2) + Math.pow(w.y2 - w.y1, 2));
          const pct = (el.x + el.width/2) / wallLen;
          const cx = w.x1 + (w.x2 - w.x1) * pct + 100;
          const cy = w.y1 + (w.y2 - w.y1) * pct + 100;
          const isHorizontal = Math.abs(w.y1 - w.y2) < 1;
          itemsHtml += `<div class="plan-${el.type} ${el.id === selectedId ? 'selected' : ''}" data-id="${el.id}" style="left:${cx}px; top:${cy}px; width:${isHorizontal ? el.width : 12}px; height:${isHorizontal ? 12 : el.width}px; transform:translate(-50%,-50%);"></div>`;
      } else if (el.type === 'pillar') {
          // Lock pillars to the wall start
          let cx = w.x1 + 100, cy = w.y1 + 100;
          itemsHtml += `<div class="plan-pillar ${el.id === selectedId ? 'selected' : ''}" data-id="${el.id}" style="left:${cx}px; top:${cy}px; width:${el.width}px; height:${el.width}px; transform:translate(-50%,-50%);"></div>`;
      }
  });

  window.modules.forEach(m => {
      itemsHtml += `<div class="module ${m.id === selectedId ? 'selected' : ''}" data-id="${m.id}" style="left:${m.x+100}px; top:${m.y+100}px; width:${m.width}px; height:${m.depth || m.width}px;">${m.type}</div>`;
  });

  return svg + itemsHtml;
}

// --- RENDER ELEVATIONS ---
function renderElevations() {
  const container = document.getElementById('elevations-container');
  const walls = getWallSegments();
  let html = '';
  
  walls.forEach(w => {
    const len = Math.sqrt(Math.pow(w.x2 - w.x1, 2) + Math.pow(w.y2 - w.y1, 2));
    let content = `<div class="env-floor"></div><div class="env-ceiling"></div>`;
    
    window.siteElements.forEach(el => {
      if (el.wall !== w.id) return;
      const leftPct = (el.x / len) * 100, widthPct = (el.width / len) * 100, heightPct = (el.height / wallDims.H) * 100, bottomPct = (el.z / wallDims.H) * 100;
      if (el.type === 'door') content += `<div class="elev-door ${el.id === selectedId ? 'selected' : ''}" data-id="${el.id}" style="left:${leftPct}%; width:${widthPct}%; height:${heightPct}%; bottom:${bottomPct}%;">Door</div>`;
      else if (el.type === 'window') content += `<div class="elev-window ${el.id === selectedId ? 'selected' : ''}" data-id="${el.id}" style="left:${leftPct}%; width:${widthPct}%; height:${heightPct}%; bottom:${bottomPct}%;">Window</div>`;
    });
    
    window.modules.forEach(mod => {
      if (mod.wall !== w.id) return;
      const leftPct = (mod.x / len) * 100, widthPct = (mod.width / len) * 100, heightPct = (mod.height / wallDims.H) * 100, bottomPct = ((mod.z || 0) / wallDims.H) * 100;
      content += `<div class="elev-module ${mod.id === selectedId ? 'selected' : ''}" data-id="${mod.id}" style="left: ${leftPct}%; width: ${widthPct}%; height: ${heightPct}%; bottom: ${bottomPct}%;">${mod.type}</div>`;
    });

    html += `
      <div class="elevation-box" onclick="changeView('wall${w.id}')">
        <div class="panel-header">Wall ${w.name} Elevation</div>
        <div class="elev-canvas" data-wall="${w.id}"><div class="zoom-wrapper">${content}</div></div>
      </div>
    `;
  });
  container.innerHTML = html;
}

function updateAllViews() {
  plan.style.width = (wallDims.A + 200) + 'px';
  plan.style.height = (wallDims.B + 200) + 'px';
  plan.innerHTML = renderPlanHTML();
  renderElevations();
  
  const activeView = document.getElementById('box-center').getAttribute('data-view');
  if (activeView !== 'plan' && activeView !== 'persp') {
      const altWrapper = document.querySelector('#alt-content .zoom-wrapper');
      const walls = getWallSegments();
      const w = walls.find(x => x.id === activeView.replace('wall', ''));
      
      if (altWrapper && w) {
        const len = Math.sqrt(Math.pow(w.x2 - w.x1, 2) + Math.pow(w.y2 - w.y1, 2));
        let content = `<div class="env-floor"></div><div class="env-ceiling"></div>`;
        window.siteElements.forEach(el => {
          if (el.wall !== w.id) return;
          const leftPct = (el.x / len) * 100, widthPct = (el.width / len) * 100, heightPct = (el.height / wallDims.H) * 100, bottomPct = (el.z / wallDims.H) * 100;
          if (el.type === 'door') content += `<div class="elev-door ${el.id === selectedId ? 'selected' : ''}" data-id="${el.id}" style="left:${leftPct}%; width:${widthPct}%; height:${heightPct}%; bottom:${bottomPct}%;">Door</div>`;
          else if (el.type === 'window') content += `<div class="elev-window ${el.id === selectedId ? 'selected' : ''}" data-id="${el.id}" style="left:${leftPct}%; width:${widthPct}%; height:${heightPct}%; bottom:${bottomPct}%;">Window</div>`;
        });
        window.modules.forEach(mod => {
          if (mod.wall !== w.id) return;
          const leftPct = (mod.x / len) * 100, widthPct = (mod.width / len) * 100, heightPct = (mod.height / wallDims.H) * 100, bottomPct = ((mod.z || 0) / wallDims.H) * 100;
          content += `<div class="elev-module ${mod.id === selectedId ? 'selected' : ''}" data-id="${mod.id}" style="left: ${leftPct}%; width: ${widthPct}%; height: ${heightPct}%; bottom: ${bottomPct}%;">${mod.type}</div>`;
        });
        altWrapper.innerHTML = content;
      }
  }
  renderRightPanelProperties();
}

// --- INTERACTION ---
document.addEventListener('mousedown', (e) => {
  const el = e.target.closest('.module, .plan-door, .plan-window, .plan-pillar, .elev-module, .elev-door, .elev-window');
  if (el) {
      selectedId = el.getAttribute('data-id');
      selectedType = el.classList.contains('module') || el.classList.contains('elev-module') ? 'module' : 'site';
      let obj = selectedType === 'module' ? window.modules.find(m => m.id === selectedId) : window.siteElements.find(m => m.id === selectedId);
      if (!obj) return;
      
      isDragging = true;
      startX = e.clientX; startY = e.clientY;
      startLeft = obj.x; startTop = obj.y;
      
      const parentCanvas = el.closest('.elev-canvas');
      dragType = parentCanvas ? 'elevation' : 'plan';
      if (dragType === 'elevation') {
          activeWall = parentCanvas.getAttribute('data-wall');
          obj.wall = activeWall;
      }
      updateAllViews();
  } 
  else if (e.target.closest('#viewport') && !e.target.closest('.float-3d-btn')) {
      isPanning = true;
      panStartX = e.clientX - panX;
      panStartY = e.clientY - panY;
      viewport.style.cursor = 'grabbing';
      selectedId = null; selectedType = null;
      updateAllViews();
  }
});

document.addEventListener('mousemove', (e) => {
  if (isPanning) {
      panX = e.clientX - panStartX; panY = e.clientY - panStartY;
      applyTransform();
      return;
  }
  if (!isDragging || !selectedId) return;
  let obj = selectedType === 'module' ? window.modules.find(m => m.id === selectedId) : window.siteElements.find(m => m.id === selectedId);
  if (!obj) return;
  const dx = (e.clientX - startX) / currentZoom;
  const dy = (e.clientY - startY) / currentZoom;

  if (dragType === 'plan') {
      if (selectedType === 'module') {
          obj.x = startLeft + dx; obj.y = startTop + dy;
          if (obj.y < 20) obj.wall = 'A';
          else if (obj.y + (obj.depth || obj.width) > wallDims.B - 20) obj.wall = 'C';
          else if (obj.x < 20) obj.wall = 'D';
          else if (obj.x + obj.width > wallDims.A - 20) obj.wall = 'B';
      } else {
          if (obj.type === 'pillar') {
              obj.x = startLeft + dx; obj.y = startTop + dy;
          } else {
              obj.x = Math.max(0, startLeft + dx);
          }
      }
  } else if (dragType === 'elevation') {
      obj.x = Math.max(0, startLeft + dx); 
      obj.z = Math.max(0, (obj.z || 0) - dy); 
  }
  updateAllViews();
});

document.addEventListener('mouseup', () => {
  isDragging = false; isPanning = false; viewport.style.cursor = 'grab';
});

// --- INITIALIZE ---
function initializeViews() {
  plan.style.width = (wallDims.A + 200) + 'px';
  plan.style.height = (wallDims.B + 200) + 'px';
  updateAllViews();
  centerPlan();
}

function centerPlan() {
  const border = 50; 
  const scaleW = (viewport.clientWidth - border) / (wallDims.A + border);
  const scaleH = (viewport.clientHeight - border) / (wallDims.B + border);
  currentZoom = Math.min(scaleW, scaleH) * 0.9;
  panX = (viewport.clientWidth - (wallDims.A + border) * currentZoom) / 2;
  panY = (viewport.clientHeight - (wallDims.B + border) * currentZoom) / 2;
  applyTransform();
}

window.zoomCanvas = function(factor) { currentZoom *= factor; applyTransform(); };

// --- FINAL BRIDGE FUNCTIONS ---
window.switchRoom = function(idx) { activeRoomIndex = parseInt(idx); };
function applyTransform() { if (plan) plan.style.transform = `translate(${panX}px, ${panY}px) scale(${currentZoom})`; }

// Initialize on load
setTimeout(loadRoomsDropdown, 100);
