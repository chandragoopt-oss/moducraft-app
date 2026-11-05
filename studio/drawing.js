// --- READ URL PARAMS ---
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
window.SHAPE_CUT = 0.4;   
window.SHAPE_CUT_Y = 0.4;

// --- 1. GET WALLS ---
function getWallSegments() {
  const W = wallDims.A, H = wallDims.B;
  const walls = [];
  if (CURRENT_SHAPE === 'l-shape') {
    walls.push({ id: 'A', name: 'A', x1: 0, y1: 0, x2: W*(1-SHAPE_CUT), y2: 0 });
    walls.push({ id: 'B', name: 'B', x1: W*(1-SHAPE_CUT), y1: 0, x2: W, y2: 0 });
    walls.push({ id: 'C', name: 'C', x1: W, y1: 0, x2: W, y2: H*(1-SHAPE_CUT_Y) });
    walls.push({ id: 'D', name: 'D', x1: W, y1: H*(1-SHAPE_CUT_Y), x2: W*SHAPE_CUT, y2: H*(1-SHAPE_CUT_Y) });
    walls.push({ id: 'E', name: 'E', x1: W*SHAPE_CUT, y1: H*(1-SHAPE_CUT_Y), x2: W*SHAPE_CUT, y2: H });
    walls.push({ id: 'F', name: 'F', x1: W*SHAPE_CUT, y1: H, x2: 0, y2: H });
    walls.push({ id: 'G', name: 'G', x1: 0, y1: H, x2: 0, y2: 0 });
  } else {
    walls.push({ id: 'A', name: 'A', x1: 0, y1: 0, x2: W, y2: 0 });
    walls.push({ id: 'B', name: 'B', x1: W, y1: 0, x2: W, y2: H });
    walls.push({ id: 'C', name: 'C', x1: W, y1: H, x2: 0, y2: H });
    walls.push({ id: 'D', name: 'D', x1: 0, y1: H, x2: 0, y2: 0 });
  }
  return walls;
}

// --- 2. FIND CLOSEST WALL ---
function findClosestWall(x, y) {
  const walls = getWallSegments();
  let closest = walls[0];
  let minDist = 999999;
  walls.forEach(w => {
    // Distance from point to line segment
    const A = x - w.x1;
    const B = y - w.y1;
    const C = w.x2 - w.x1;
    const D = w.y2 - w.y1;
    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    let param = -1;
    if (len_sq != 0) param = dot / len_sq;
    let xx, yy;
    if (param < 0) { xx = w.x1; yy = w.y1; }
    else if (param > 1) { xx = w.x2; yy = w.y2; }
    else { xx = w.x1 + param * C; yy = w.y1 + param * D; }
    const dx = x - xx;
    const dy = y - yy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < minDist) {
      minDist = dist;
      closest = w;
    }
  });
  return closest;
}

// --- 3. LOAD DATA ---
function loadRoomsDropdown() {
  const select = document.getElementById('active-room-select');
  let allRooms = [];
  try {
    const saved = JSON.parse(localStorage.getItem('msq_v2') || 'null');
    if (saved && saved.q && saved.q[window.__dsParams.quoteId] && saved.q[window.__dsParams.quoteId].rooms) {
       allRooms = saved.q[window.__dsParams.quoteId].rooms;
    }
  } catch(e) {}

  if (allRooms.length > 0) {
      select.innerHTML = allRooms.map((r, i) => `<option value="${i}" ${i === activeRoomIndex ? 'selected' : ''}>${r.name || 'Room '+(i+1)}</option>`).join('');
      const room = allRooms[activeRoomIndex];
      if (room.dim) {
          wallDims.A = room.dim.L / 10 || 800;
          wallDims.B = room.dim.W / 10 || 600;
          wallDims.H = (room.dim.H || 2700) / 10;
      }
      const existingDS = (room.rows || []).filter(r => r._fromDS && r.fpId);
      window.modules = existingDS.map(r => ({
        id: r.fpId, type: r.n, mk: r.mk || '', wall: r.wl || 'A',
        x: (r.x || 0) / 10, y: (r.y || 0) / 10, z: (r.z || 0) / 10,
        width: (r.l || 0) / 10, height: (r.w || 0) / 10, depth: (r.d || 600) / 10
      }));
      if (room.siteElements) window.siteElements = room.siteElements.map(el => ({...el}));
  } else {
      select.innerHTML = `<option value="0">Living Room</option>`;
  }
  initializeViews(); 
}

// --- 4. RENDER PLAN ---
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
  
  // Render Beams/Slabs behind everything
  window.siteElements.forEach(el => {
      if (el.type === 'beam' || el.type === 'slab') {
          let xPos = el.x + 100, yPos = el.y + 100;
          itemsHtml += `<div class="plan-pillar ${el.id === selectedId ? 'selected' : ''}" data-id="${el.id}" style="left:${xPos}px; top:${yPos}px; width:${el.width}px; height:${el.height||20}px; transform:translate(-50%,-50%); background:rgba(200,200,200,0.5); border:1px dashed #666; z-index:2;"></div>`;
      }
  });

  // Render Doors/Windows (Z-index 15 so they sit ON TOP of walls)
  window.siteElements.forEach(el => {
      if (el.type === 'pillar' || el.type === 'beam' || el.type === 'slab') return;
      let w = walls.find(w => w.id === el.wall);
      if(!w) return;
      
      const wallLen = Math.sqrt(Math.pow(w.x2 - w.x1, 2) + Math.pow(w.y2 - w.y1, 2));
      const pct = (el.x + el.width/2) / wallLen;
      const cx = w.x1 + (w.x2 - w.x1) * pct + 100;
      const cy = w.y1 + (w.y2 - w.y1) * pct + 100;
      const isHorizontal = Math.abs(w.y1 - w.y2) < 1;
      
      let typeClass = el.type === 'door' ? 'plan-door' : (el.type === 'window' ? 'plan-window' : 'plan-niche');
      let bg = el.type === 'door' ? '#f5deb3' : (el.type === 'window' ? '#bfdbfe' : '#ffcdd2');
      let border = el.type === 'door' ? '#8b5a2b' : (el.type === 'window' ? '#3b82f6' : '#b00020');

      itemsHtml += `<div class="${typeClass} ${el.id === selectedId ? 'selected' : ''}" data-id="${el.id}" 
        style="left:${cx}px; top:${cy}px; width:${isHorizontal ? el.width : 12}px; height:${isHorizontal ? 12 : el.width}px; transform:translate(-50%,-50%); 
        background:${bg}; border:2px solid ${border}; z-index:15; display:flex; align-items:center; justify-content:center; font-size:9px; font-weight:bold; color:${border};">${el.type}</div>`;
  });

  // Render Pillars
  window.siteElements.forEach(el => {
      if (el.type === 'pillar') {
          let cx = el.x + 100, cy = el.y + 100;
          itemsHtml += `<div class="plan-pillar ${el.id === selectedId ? 'selected' : ''}" data-id="${el.id}" style="left:${cx}px; top:${cy}px; width:${el.width}px; height:${el.width}px; transform:translate(-50%,-50%); z-index:10;"></div>`;
      }
  });

  // Render Modules
  window.modules.forEach(m => {
      itemsHtml += `<div class="module ${m.id === selectedId ? 'selected' : ''}" data-id="${m.id}" style="left:${m.x+100}px; top:${m.y+100}px; width:${m.width}px; height:${m.depth || m.width}px; z-index:12;">${m.type}</div>`;
  });

  return svg + itemsHtml;
}

// --- 5. DRAG LOGIC ---
document.addEventListener('mousedown', (e) => {
  const el = e.target.closest('.module, .plan-door, .plan-window, .plan-pillar, .plan-niche');
  
  if (el) {
      selectedId = el.getAttribute('data-id');
      selectedType = el.classList.contains('module') ? 'module' : 'site';
      let obj = selectedType === 'module' ? window.modules.find(m => m.id === selectedId) : window.siteElements.find(m => m.id === selectedId);
      if (!obj) return;
      
      isDragging = true;
      startX = e.clientX; 
      startY = e.clientY;
      startLeft = obj.x;
      startTop = obj.y;
      
      // Determine drag type
      if (obj.type === 'pillar' || obj.type === 'beam' || obj.type === 'slab') {
          dragType = 'pillar'; 
      } else if (obj.type === 'door' || obj.type === 'window' || obj.type === 'niche') {
          dragType = 'site';
      } else {
          dragType = 'module';
      }
      
      updateAllViews();
  } else {
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
  
  // --- MODULE DRAGGING (Confinement) ---
  if (dragType === 'module') {
      let newX = startLeft + dx;
      let newY = startTop + dy;
      
      // Keep module inside room bounds
      newX = Math.max(0, Math.min(wallDims.A - obj.width, newX));
      newY = Math.max(0, Math.min(wallDims.B - (obj.depth || obj.width), newY));
      
      obj.x = newX;
      obj.y = newY;
  } 
  // --- PILLAR / BEAM DRAGGING (Free) ---
  else if (dragType === 'pillar') {
      obj.x = startLeft + dx;
      obj.y = startTop + dy;
  } 
  // --- DOORS/WINDOWS (Smart Snap to Nearest Wall) ---
  else if (dragType === 'site') {
      const mouseX = startLeft + dx; 
      const mouseY = startTop + dy;
      
      // Find the wall closest to the mouse cursor
      const closestWall = findClosestWall(mouseX, mouseY);
      
      obj.wall = closestWall.id;
      
      // Calculate the X position along that wall
      const wallLen = Math.sqrt(Math.pow(closestWall.x2 - closestWall.x1, 2) + Math.pow(closestWall.y2 - closestWall.y1, 2));
      let newX = 0;
      
      if (closestWall.y1 === closestWall.y2) { // Horizontal wall
          newX = mouseX - closestWall.x1; 
      } else { // Vertical wall
          newX = mouseY - closestWall.y1;
      }
      
      // Clamp within wall bounds
      obj.x = Math.max(0, Math.min(wallLen - obj.width, newX));
  }
  
  updateAllViews();
});

document.addEventListener('mouseup', () => {
  isDragging = false; isPanning = false; viewport.style.cursor = 'grab';
});

// --- 6. INITIALIZE ---
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
window.switchRoom = function(idx) { activeRoomIndex = parseInt(idx); };
function applyTransform() { if (plan) plan.style.transform = `translate(${panX}px, ${panY}px) scale(${currentZoom})`; }
