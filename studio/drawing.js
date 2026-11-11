// --- READ DATA FROM LOCAL STORAGE ---
(function() {
  const params = new URLSearchParams(location.search);
  const t = params.get('theme');
  if (t) {
    document.body.setAttribute('data-theme', t);
    document.documentElement.setAttribute('data-theme', t);
  }

  // Read the large data we saved from the parent
  let savedData = {};
  try {
    savedData = JSON.parse(localStorage.getItem('msq_studio_data') || '{}');
  } catch(e) { console.error("Failed to parse studio data", e); }

  window.__dsParams = {
    quoteId: params.get('q') || savedData.quoteId || '',
    roomIdx: parseInt(params.get('r') || savedData.roomIdx || '0', 10),
    mods: savedData.mods || [],
    room: savedData.room || {}
  };
})();

const viewport = document.getElementById('viewport');
const plan = document.getElementById('plan');

window.modules = [];
window.siteElements = [];
window.wallDims = { A: 3000, B: 3000, H: 2700 };
window.CURRENT_SHAPE = 'rectangle';
let activeRoomIndex = window.__dsParams.roomIdx || 0;
let selectedId = null, selectedType = null; 
let activeWall = 'A';
let currentZoom = 1, panX = 0, panY = 0;
window.SHAPE_CUT = 0.4;   
window.SHAPE_CUT_Y = 0.4;

// --- 1. WALL GEOMETRY ---
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
  } else if (CURRENT_SHAPE === 'u-shape') {
    const left = W * 0.30, right = W * 0.70, innerY = H * 0.35;
    walls.push({ id: 'A', name: 'A', x1: 0, y1: 0, x2: W, y2: 0 });
    walls.push({ id: 'B', name: 'B', x1: W, y1: 0, x2: W, y2: H });
    walls.push({ id: 'C', name: 'C', x1: W, y1: H, x2: right, y2: H });
    walls.push({ id: 'D', name: 'D', x1: right, y1: H, x2: right, y2: innerY });
    walls.push({ id: 'E', name: 'E', x1: right, y1: innerY, x2: left, y2: innerY });
    walls.push({ id: 'F', name: 'F', x1: left, y1: innerY, x2: left, y2: H });
    walls.push({ id: 'G', name: 'G', x1: left, y1: H, x2: 0, y2: H });
    walls.push({ id: 'H', name: 'H', x1: 0, y1: H, x2: 0, y2: 0 });
  } else {
    walls.push({ id: 'A', name: 'A', x1: 0, y1: 0, x2: W, y2: 0 });
    walls.push({ id: 'B', name: 'B', x1: W, y1: 0, x2: W, y2: H });
    walls.push({ id: 'C', name: 'C', x1: W, y1: H, x2: 0, y2: H });
    walls.push({ id: 'D', name: 'D', x1: 0, y1: H, x2: 0, y2: 0 });
  }
  return walls;
}

// --- 2. DISTANCE HELPERS ---
function findClosestWall(x, y) {
  const walls = getWallSegments();
  let closest = walls[0];
  let minDist = 999999;
  walls.forEach(w => {
    const A = x - w.x1, B = y - w.y1;
    const C = w.x2 - w.x1, D = w.y2 - w.y1;
    const dot = A * C + B * D, len_sq = C * C + D * D;
    let param = -1;
    if (len_sq != 0) param = dot / len_sq;
    let xx, yy;
    if (param < 0) { xx = w.x1; yy = w.y1; }
    else if (param > 1) { xx = w.x2; yy = w.y2; }
    else { xx = w.x1 + param * C; yy = w.y1 + param * D; }
    const dx = x - xx, dy = y - yy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < minDist) { minDist = dist; closest = w; }
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
  
  window.siteElements.forEach(el => {
      if (el.type === 'pillar' || el.type === 'beam' || el.type === 'slab') {
          let xPos = el.x + 100, yPos = el.y + 100;
          let styleStr = "left:"+xPos+"px; top:"+yPos+"px; width:"+el.width+"px; height:"+(el.height||el.width)+"px; transform:translate(-50%,-50%); z-index:2;";
          if (el.type === 'pillar') styleStr += "background:#9ca3af; border:1px solid #4b5563;";
          if (el.type === 'beam') styleStr += "background:rgba(200,200,200,0.5); border:1px dashed #666;";
          itemsHtml += `<div class="plan-pillar ${el.id === selectedId ? 'selected' : ''}" data-id="${el.id}" style="${styleStr}"></div>`;
      } else {
          let w = walls.find(w => w.id === el.wall);
          if(!w) return;
          const wallLen = Math.sqrt(Math.pow(w.x2 - w.x1, 2) + Math.pow(w.y2 - w.y1, 2));
          const pct = (el.x + el.width/2) / wallLen;
          const cx = w.x1 + (w.x2 - w.x1) * pct + 100;
          const cy = w.y1 + (w.y2 - w.y1) * pct + 100;
          const isHorizontal = Math.abs(w.y1 - w.y2) < 1;
          let bg = el.type === 'door' ? '#f5deb3' : (el.type === 'window' ? '#bfdbfe' : '#ffcdd2');
          let br = el.type === 'door' ? '#8b5a2b' : (el.type === 'window' ? '#3b82f6' : '#b00020');
          itemsHtml += `<div class="plan-${el.type} ${el.id === selectedId ? 'selected' : ''}" data-id="${el.id}" style="left:${cx}px; top:${cy}px; width:${isHorizontal ? el.width : 12}px; height:${isHorizontal ? 12 : el.width}px; transform:translate(-50%,-50%); z-index:15; background:${bg}; border:2px solid ${br}; display:flex; align-items:center; justify-content:center; font-size:9px;">${el.type}</div>`;
      }
  });

  window.modules.forEach(m => {
      itemsHtml += `<div class="module ${m.id === selectedId ? 'selected' : ''}" data-id="${m.id}" style="left:${m.x+100}px; top:${m.y+100}px; width:${m.width}px; height:${m.depth || m.width}px; z-index:12;">${m.type}</div>`;
  });

  return svg + itemsHtml;
}

// --- 5. LIGHTWEIGHT ISOMETRIC 3D PREVIEW ---
function renderPerspectiveHTML() {
  const W = wallDims.A, D = wallDims.B, H = wallDims.H;
  const project = (x, y, z = 0) => ({
    x: (x - y) * 0.72 + (W + D) * 0.72,
    y: (x + y) * 0.36 - z * 0.72 + H * 0.72 + 40
  });
  const pts = [];
  const point = (x, y, z = 0) => {
    const p = project(x, y, z); pts.push(p); return p;
  };
  const poly = (arr, fill, stroke = "#475569", opacity = 1) =>
    `<polygon points="${arr.map(p => `${p.x},${p.y}`).join(" ")}" fill="${fill}" fill-opacity="${opacity}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>`;
  const walls = getWallSegments();
  let shapes = "";
  const floor = walls.map(w => point(w.x1, w.y1, 0));
  shapes += poly(floor, "#e8edf3", "#64748b", 0.96);

  // Room perimeter walls are drawn as transparent planes so the furniture remains visible.
  walls.forEach((w, i) => {
    const face = [
      point(w.x1, w.y1, 0), point(w.x2, w.y2, 0),
      point(w.x2, w.y2, H), point(w.x1, w.y1, H)
    ];
    shapes += poly(face, i % 2 ? "#94a3b8" : "#cbd5e1", "#64748b", 0.22);
  });

  window.modules.forEach((m) => {
    const x = Number(m.x) || 0, y = Number(m.y) || 0, z = Number(m.z) || 0;
    const w = Math.max(1, Number(m.width) || 60);
    const d = Math.max(1, Number(m.depth) || 60);
    const h = Math.max(1, Number(m.height) || 80);
    const a = point(x, y, z), b = point(x + w, y, z);
    const c = point(x + w, y + d, z), e = point(x, y + d, z);
    const at = point(x, y, z + h), bt = point(x + w, y, z + h);
    const ct = point(x + w, y + d, z + h), et = point(x, y + d, z + h);
    shapes += poly([b, c, ct, bt], "#0f766e", "#115e59", 0.92);
    shapes += poly([e, c, ct, et], "#14b8a6", "#0f766e", 0.92);
    shapes += poly([at, bt, ct, et], "#99f6e4", "#0f766e", 0.98);
    const label = String(m.type || "Module").replace(/[&<>"]/g, "");
    const mid = project(x + w / 2, y + d / 2, z + h + 8);
    shapes += `<text x="${mid.x}" y="${mid.y}" font-size="13" text-anchor="middle" fill="#0f172a" font-weight="600">${label}</text>`;
  });

  window.siteElements.filter(el => el.type === "pillar").forEach(el => {
    const x = Number(el.x) || 0, y = Number(el.y) || 0;
    const w = Math.max(8, Number(el.width) || 30), d = Math.max(8, Number(el.height) || 30);
    const h = H;
    const a = point(x, y, 0), b = point(x + w, y, 0), c = point(x + w, y + d, 0), e = point(x, y + d, 0);
    const at = point(x, y, h), bt = point(x + w, y, h), ct = point(x + w, y + d, h), et = point(x, y + d, h);
    shapes += poly([b, c, ct, bt], "#64748b", "#334155", 0.85);
    shapes += poly([e, c, ct, et], "#94a3b8", "#334155", 0.85);
    shapes += poly([at, bt, ct, et], "#cbd5e1", "#334155", 0.9);
  });

  const minX = Math.min(...pts.map(p => p.x)), maxX = Math.max(...pts.map(p => p.x));
  const minY = Math.min(...pts.map(p => p.y)), maxY = Math.max(...pts.map(p => p.y));
  const pad = 45;
  const viewBox = `${minX - pad} ${minY - pad} ${Math.max(100, maxX - minX + pad * 2)} ${Math.max(100, maxY - minY + pad * 2)}`;
  return `<svg class="studio-3d-preview" viewBox="${viewBox}" role="img" aria-label="Isometric room and furniture preview" preserveAspectRatio="xMidYMid meet">${shapes}</svg>`;
}

// --- 5. RENDER ELEVATIONS ---
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
      else if (el.type === 'pillar') content += `<div style="position:absolute; left:${leftPct}%; bottom:0; width:${widthPct}%; height:100%; background:rgba(0,0,0,0.2); border:1px dashed #333; z-index:4;">Pillar</div>`;
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
  const altWrapper = document.querySelector('#alt-content .zoom-wrapper');
  if (activeView === 'persp' && altWrapper) {
      altWrapper.innerHTML = renderPerspectiveHTML();
  } else if (activeView !== 'plan') {
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

// --- 6. NEW MAGNETIC DRAG ENGINE ---
let draggedObj = null;
let isPanning = false, panStartX = 0, panStartY = 0;

document.addEventListener('pointerdown', (e) => {
  const el = e.target.closest('.module, .plan-door, .plan-window, .plan-pillar, .plan-niche, .elev-module, .elev-door, .elev-window');
  
  if (el) {
      e.preventDefault(); // Stop browser text selection
      selectedId = el.getAttribute('data-id');
      selectedType = el.classList.contains('module') || el.classList.contains('elev-module') ? 'module' : 'site';
      let obj = selectedType === 'module' ? window.modules.find(m => m.id === selectedId) : window.siteElements.find(m => m.id === selectedId);
      if (!obj) return;
      
      draggedObj = {
          isSite: selectedType === 'site',
          type: obj.type || 'module', 
          data: obj,
          startX: e.clientX,  // Screen position where click started
          startY: e.clientY,
          startLeft: obj.x,   // Room position where click started
          startTop: obj.y,
          isElevation: !!el.closest('.elev-canvas'),
          wall: el.closest('.elev-canvas') ? el.closest('.elev-canvas').getAttribute('data-wall') : (obj.wall || 'A')
      };
      
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

document.addEventListener('pointermove', (e) => {
  if (isPanning) {
      panX = e.clientX - panStartX; panY = e.clientY - panStartY;
      applyTransform();
      return;
  }
  if (!draggedObj) return;
  
  // Calculate how far the mouse moved in room units
  const dx = (e.clientX - draggedObj.startX) / currentZoom;
  const dy = (e.clientY - draggedObj.startY) / currentZoom;
  const obj = draggedObj.data;

  if (draggedObj.isElevation) {
      // --- ELEVATION DRAGGING ---
      obj.x = Math.max(0, draggedObj.startLeft + dx);
      obj.z = Math.max(0, draggedObj.startTop - dy); 
  } 
  else if (draggedObj.type === 'pillar' || draggedObj.type === 'beam' || draggedObj.type === 'slab') {
      // --- COLUMNS, BEAMS, SLABS (Confined to room) ---
      let newX = draggedObj.startLeft + dx;
      let newY = draggedObj.startTop + dy;
      
      // Clamp within room
      obj.x = Math.max(0, Math.min(wallDims.A - obj.width, newX));
      obj.y = Math.max(0, Math.min(wallDims.B - (obj.height || obj.width), newY));
  } 
  else if (draggedObj.type === 'niche' || draggedObj.type === 'door' || draggedObj.type === 'window') {
      // --- DOORS, WINDOWS, NICHES (Snap to wall) ---
      const rect = viewport.getBoundingClientRect();
      // The plan canvas is drawn with a 100-unit inset around the room.
      // Convert the pointer from screen coordinates back into room coordinates.
      const mouseRoomX = (e.clientX - rect.left - panX) / currentZoom - 100;
      const mouseRoomY = (e.clientY - rect.top - panY) / currentZoom - 100;

      // Find the nearest wall and project the pointer onto that wall segment.
      const closestWall = findClosestWall(mouseRoomX, mouseRoomY);
      obj.wall = closestWall.id;

      const wallDX = closestWall.x2 - closestWall.x1;
      const wallDY = closestWall.y2 - closestWall.y1;
      const wallLen = Math.hypot(wallDX, wallDY);
      const safeLength = Math.max(1, wallLen);
      const projection = (
          (mouseRoomX - closestWall.x1) * wallDX +
          (mouseRoomY - closestWall.y1) * wallDY
      ) / (safeLength * safeLength);
      let newX = Math.max(0, Math.min(wallLen, projection * wallLen)) - obj.width / 2;

      // Snap openings to wall ends and keep their full width on the wall.
      if (Math.abs(newX) < 30) newX = 0;
      if (Math.abs(newX + obj.width - wallLen) < 30) newX = wallLen - obj.width;

      obj.x = Math.max(0, Math.min(Math.max(0, wallLen - obj.width), newX));
  } 
  else if (draggedObj.isSite === false) {
      // --- MODULES (Confinement & Snapping) ---
      let newX = draggedObj.startLeft + dx;
      let newY = draggedObj.startTop + dy;
      
      // Hard clamp inside room
      newX = Math.max(0, Math.min(wallDims.A - obj.width, newX));
      newY = Math.max(0, Math.min(wallDims.B - (obj.depth || obj.width), newY));
      
      // Snap to other modules
      window.modules.forEach(other => {
          if (other.id === obj.id) return;
          if (Math.abs(other.y - newY) < 50) { 
              if (Math.abs((other.x + other.width) - newX) < 30) newX = other.x + other.width;
              if (Math.abs(other.x - (newX + obj.width)) < 30) newX = other.x - obj.width;
          }
      });
      
      obj.x = newX;
      obj.y = newY;
  }
  
  updateAllViews();
});

document.addEventListener('pointerup', () => {
  draggedObj = null;
  isPanning = false; 
  viewport.style.cursor = 'grab';
});

// --- 7. INITIALIZE ---
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

window.zoomCanvas = function(factor) {
  currentZoom = Math.max(0.2, Math.min(3, currentZoom * factor));
  applyTransform();
};
window.switchRoom = function(idx) {
  const nextIndex = Number.parseInt(idx, 10);
  if (!Number.isInteger(nextIndex) || nextIndex < 0) return;
  activeRoomIndex = nextIndex;
  selectedId = null;
  selectedType = null;
  draggedObj = null;
  loadRoomsDropdown();
};
function applyTransform() { if (plan) plan.style.transform = `translate(${panX}px, ${panY}px) scale(${currentZoom})`; }

viewport.addEventListener('wheel', (e) => {
    if (!document.getElementById('view-plan').classList.contains('active') && !document.getElementById('view-alt').classList.contains('active')) return; 
    e.preventDefault();
    const rect = viewport.getBoundingClientRect();
    const mx = e.clientX - rect.left; 
    const my = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.max(0.2, Math.min(3, currentZoom * factor));
    const scale = newZoom / currentZoom;
    panX = mx - scale * (mx - panX); 
    panY = my - scale * (my - panY);
    currentZoom = newZoom; 
    applyTransform();
}, { passive: false });

setTimeout(loadRoomsDropdown, 100);
