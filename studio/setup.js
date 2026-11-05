// --- 1. RIGHT PANEL TABS ---
window.updateRightPanel = function(tabName, btnElement) {
  if (btnElement) {
    document.querySelectorAll('.action-tabs button').forEach(b => b.classList.remove('active'));
    btnElement.classList.add('active');
  }
  const tc = document.getElementById('toolbar-content');
  
  if (tabName === 'View & Tools') {
      tc.innerHTML = `
        <div class="tool-group"><button onclick="openAddModuleModal()" style="width:100%; background:var(--accent-blue); color:white; padding:10px; font-weight:bold; border:none; border-radius:4px; cursor:pointer;">+ Add Module</button></div>
        <div class="tool-group"><span class="tool-group-title">Transform</span>
          <div class="btn-row"><button onclick="zoomCanvas(1.1)">Zoom +</button><button onclick="zoomCanvas(0.9)">Zoom -</button></div>
        </div>
        <div class="tool-group"><span class="tool-group-title">Undo / Redo</span>
          <div class="btn-row"><button onclick="alert('Undo soon!')">↶ Undo</button><button onclick="alert('Redo soon!')">↷ Redo</button></div>
        </div>`;
  } 
  else if (tabName === 'Room Setting') {
      const walls = getWallSegments();
      let wallList = '';
      walls.forEach(w => {
          const wLen = Math.sqrt(Math.pow(w.x2 - w.x1, 2) + Math.pow(w.y2 - w.y1, 2));
          wallList += `<div style="display:flex; justify-content:space-between; padding:4px 0; border-bottom:1px dashed #ccc; font-size:12px;"><span>Wall ${w.name}</span><b>${Math.round(wLen*10)} mm</b></div>`;
      });

      tc.innerHTML = `
        <div class="tool-group"><span class="tool-group-title">Overall Room Size</span>
          <div class="prop-form">
            <div><label>Overall Length (mm)</label><input type="number" value="${wallDims.A*10}" onchange="wallDims.A = +this.value/10; updateAllViews(); centerPlan();"></div>
            <div><label>Overall Width (mm)</label><input type="number" value="${wallDims.B*10}" onchange="wallDims.B = +this.value/10; updateAllViews(); centerPlan();"></div>
            <div style="margin-top:10px;"><label>Ceiling Height (mm)</label><input type="number" value="${wallDims.H*10}" onchange="wallDims.H = +this.value/10; updateAllViews();"></div>
          </div>
        </div>
        <div class="tool-group"><span class="tool-group-title">Handle Type</span>
          <div class="prop-form">
            <select><option>Normal handle</option><option>J-profile</option><option>G-profile</option><option>Gola profile</option><option>Push-to-open</option></select>
          </div>
        </div>
        <div class="tool-group"><span class="tool-group-title">Calculated Wall Lengths</span>${wallList}</div>`;
  } 
   else if (tabName === 'Site Structure') {
      tc.innerHTML = `
        <div class="tool-group">
          <span class="tool-group-title">Add Elements</span>
          <div class="btn-row" style="flex-direction:column; gap:8px;">
            <button onclick="addSiteElement('door')">+ Normal Door</button>
            <button onclick="addSiteElement('window')">+ Window</button>
            <button onclick="addSiteElement('niche')">+ Niche / Cut</button>
            <button onclick="addSiteElement('pillar')">+ Column</button>
            <button onclick="addSiteElement('beam')">+ Beam</button>
            <button onclick="addSiteElement('slab')">+ Slab</button>
          </div>
        </div>`;
  } 
  else if (tabName === 'Auto Loft') {
      tc.innerHTML = `
        <div class="tool-group"><span class="tool-group-title">Generate Loft</span>
          <div class="prop-form"><div><label>Loft Height (mm)</label><input type="number" value="450"></div><div><label>Loft Depth (mm)</label><input type="number" value="320"></div></div>
          <div class="btn-row" style="margin-top:10px;"><button style="background:var(--accent-blue); color:white; border:none; padding:10px;">Generate Loft</button></div>
        </div>`;
  }
  else if (tabName === 'Project Settings') {
      tc.innerHTML = `
        <div class="tool-group"><span class="tool-group-title">Project Materials</span>
          <div class="prop-form">
            <div><label>Ply Maker</label><select><option>Sainik</option><option>Century</option></select></div>
            <div><label>Hardware</label><select><option>Local</option><option>Hettich</option><option>Ebco</option></select></div>
            <div><label>Shutter Finish</label><select><option>0.8mm Laminate</option><option>Acrylic</option></select></div>
            <div><label>Pricing Basis</label><select><option>Module rates (auto)</option><option>Material costing</option></select></div>
          </div>
        </div>`;
  }
  renderRightPanelProperties();
};

// --- 2. PROPERTIES ---
function renderRightPanelProperties() {
  const titleEl = document.getElementById('prop-title');
  const bodyEl = document.getElementById('prop-body');
  let obj = selectedType === 'module' ? window.modules.find(m => m.id === selectedId) : window.siteElements.find(m => m.id === selectedId);
  
  if (!obj) {
      titleEl.innerText = 'Details';
      bodyEl.innerHTML = `<p style="color:var(--text-muted); font-size:13px;">Select an item on the plan to edit its dimensions.</p>`;
      return;
  }
  titleEl.innerText = selectedType === 'module' ? 'Module: ' + obj.type : 'Element: ' + obj.type.toUpperCase();
  
  if (selectedType === 'module') {
      bodyEl.innerHTML = `
        <div class="prop-form">
          <div><label>Width (mm)</label><input type="number" value="${Math.round(obj.width * 10)}" onchange="const m=window.modules.find(x=>x.id==='${obj.id}'); m.width=+this.value/10; updateAllViews();"></div>
          <div><label>Height (mm)</label><input type="number" value="${Math.round(obj.height * 10)}" onchange="const m=window.modules.find(x=>x.id==='${obj.id}'); m.height=+this.value/10; updateAllViews();"></div>
          <div><label>Depth (mm)</label><input type="number" value="${obj.depth ? Math.round(obj.depth * 10) : 600}" onchange="const m=window.modules.find(x=>x.id==='${obj.id}'); m.depth=+this.value/10; updateAllViews();"></div>
          <div><label>Height from Floor (mm)</label><input type="number" value="${Math.round((obj.z||0) * 10)}" onchange="const m=window.modules.find(x=>x.id==='${obj.id}'); m.z=+this.value/10; updateAllViews();"></div>
          <button onclick="deleteSelected()" style="background:#ef4444; color:white; border:none; padding:8px; border-radius:4px; margin-top:10px; cursor:pointer;">Delete Module</button>
        </div>`;
  } else {
      bodyEl.innerHTML = `
        <div class="prop-form">
          <div><label>Mount on Wall</label>
            <select onchange="const m=window.siteElements.find(x=>x.id==='${obj.id}'); m.wall=this.value; updateAllViews();">
              ${getWallSegments().map(w => `<option value="${w.id}" ${obj.wall===w.id?'selected':''}>Wall ${w.name}</option>`).join('')}
            </select>
          </div>
          <div><label>Width (mm)</label><input type="number" value="${Math.round(obj.width * 10)}" onchange="const m=window.siteElements.find(x=>x.id==='${obj.id}'); m.width=+this.value/10; updateAllViews();"></div>
          <div><label>Height (mm)</label><input type="number" value="${Math.round(obj.height * 10)}" onchange="const m=window.siteElements.find(x=>x.id==='${obj.id}'); m.height=+this.value/10; updateAllViews();"></div>
          <div><label>Sill Height (mm)</label><input type="number" value="${Math.round((obj.z||0) * 10)}" onchange="const m=window.siteElements.find(x=>x.id==='${obj.id}'); m.z=+this.value/10; updateAllViews();"></div>
          <button onclick="deleteSelected()" style="background:#ef4444; color:white; border:none; padding:8px; border-radius:4px; margin-top:10px; cursor:pointer;">Delete Element</button>
        </div>`;
  }
}

// --- 3. MODULE ADD ---
window.openAddModuleModal = function() {
  const list = document.getElementById('quick-add-list');
  const bMods = getBackendModules();
  let html = '', currentCat = '';
  bMods.forEach(m => {
    if (m.cat !== currentCat) { html += `<div class="quick-add-cat">${m.cat}</div>`; currentCat = m.cat; }
    html += `<div class="quick-add-item" data-search="${m.n.toLowerCase()}" onclick="addModule('${m.n.replace(/'/g,"\\'")}', '${m.id}', '${m.cat.includes('Loft') ? 200 : 0}')"><span>${m.n}</span><span style="font-size:11px; opacity:0.6">${m.w}cm</span></div>`;
  });
  list.innerHTML = html;
  document.getElementById('quick-add-modal').style.display = 'flex';
  document.getElementById('quick-add-input').value = '';
  document.getElementById('quick-add-input').focus();
};
window.filterQuickAdd = function() {
  const q = document.getElementById('quick-add-input').value.toLowerCase();
  document.querySelectorAll('.quick-add-item').forEach(el => { el.style.display = el.dataset.search.includes(q) ? 'flex' : 'none'; });
};
window.addModule = function(type, mk, zHeight) { 
  document.getElementById('quick-add-modal').style.display = 'none'; 
  const newMod = { id: 'mod-' + Date.now(), type: type, mk: mk, x: 50, y: 50, z: parseInt(zHeight), width: 60, height: 80, depth: 60, wall: 'A' };
  window.modules.push(newMod);
  selectedId = newMod.id; selectedType = 'module';
  updateAllViews();
};

// --- 4. SITE ELEMENTS ---
function getBackendModules() {
  let list = [];
  if (window.__dsParams.mods && window.__dsParams.mods.length > 0) {
      list = window.__dsParams.mods.map(m => {
        let cat = 'Base / Floor';
        if (m.ty === 'wall') cat = 'Wall Units';
        else if (m.ty === 'loft') cat = 'Loft Units';
        else if (m.ty === 'tall') cat = 'Tall Units';
        else if (m.ty === 'ward') cat = 'Wardrobes';
        return { id: m.id, n: m.n, cat: cat, w: m.w, h: m.h, d: m.d };
      });
  } else {
    list = [ { id: 'wh3', n: 'Wardrobe (3 Door)', cat: 'Wardrobes', w: 120, h: 220, d: 60 } ];
  }
  return list.sort((a,b) => a.cat.localeCompare(b.cat) || a.n.localeCompare(b.n));
}

window.addSiteElement = function(type) {
  const walls = getWallSegments();
  const w = walls.find(x => x.id === activeWall) || walls[0];
  const wallLen = Math.sqrt(Math.pow(w.x2 - w.x1, 2) + Math.pow(w.y2 - w.y1, 2));
  
  let newEl = { id: 'el-' + Date.now(), type: type, x: wallLen / 2, y: 0, z: 0, width: 90, height: 210, wall: w.id };
  
  if (type === 'window') { newEl.width = 120; newEl.height = 120; newEl.z = 90; }
  if (type === 'pillar') { newEl.width = 30; newEl.height = 30; newEl.x = 50; newEl.y = 50; newEl.wall = ''; }
  if (type === 'beam') { newEl.width = wallLen; newEl.height = 20; newEl.x = wallLen/2; newEl.y = 0; newEl.z = 2400; newEl.wall = w.id; }
  if (type === 'slab') { newEl.width = 200; newEl.height = 100; newEl.x = 200; newEl.y = 200; newEl.wall = ''; }
  if (type === 'niche') { newEl.width = 60; newEl.height = 60; newEl.x = wallLen/2; newEl.z = 1200; newEl.wall = w.id; }
  
  window.siteElements.push(newEl);
  selectedId = newEl.id; selectedType = 'site';
  updateAllViews();
};

window.deleteSelected = function() {
  if (selectedType === 'module') window.modules = window.modules.filter(m => m.id !== selectedId);
  if (selectedType === 'site') window.siteElements = window.siteElements.filter(m => m.id !== selectedId);
  selectedId = null; selectedType = null;
  updateAllViews();
};

// --- 5. SHAPE ---
window.changeRoomShape = function(shape) {
  CURRENT_SHAPE = shape;
  if (shape === 'l-shape') { wallDims.A = 1000; wallDims.B = 800; }
  else if (shape === 'u-shape') { wallDims.A = 1200; wallDims.B = 900; }
  else { wallDims.A = 800; wallDims.B = 600; }
  initializeViews();
};

window.changeView = function(viewType) {
  document.getElementById('box-center').setAttribute('data-view', viewType);
  if (viewType === 'plan') {
      document.getElementById('view-plan').classList.add('active'); 
      document.getElementById('view-alt').classList.remove('active');
      document.getElementById('center-title').innerText = 'Plan View'; 
      applyTransform();
  } else {
      document.getElementById('view-plan').classList.remove('active'); 
      document.getElementById('view-alt').classList.add('active');
      document.getElementById('center-title').innerText = viewType === 'persp' ? '3D Perspective' : 'Elevation: Wall ' + viewType.replace('wall', '');
      updateAllViews();
  }
};

// --- 6. SAVE BRIDGE ---
loadRoomsDropdown();

window.addEventListener('message', function(ev) {
  if (!ev.data || ev.data.type !== 'ds-request-save') return;
  try {
    const payload = {
      type: 'ds-saved', quoteId: window.__dsParams.quoteId, roomIdx: activeRoomIndex, dimChanged: true,
      dim: { L: wallDims.A * 10, W: wallDims.B * 10, H: wallDims.H * 10 },
      modules: window.modules.map(m => {
        let cat = m.z > 100 ? 'wall' : 'base';
        if (m.type.toLowerCase().includes('loft')) cat = 'loft';
        return { fpId: m.id, type: m.type, category: cat, wall: m.wall, left: m.x, top: m.y, z: m.z || 0, width: m.width, height: m.height, depth: m.depth || 60, mk: m.mk || '' };
      }),
      siteElements: window.siteElements,
      roomName: document.getElementById('active-room-select').options[document.getElementById('active-room-select').selectedIndex].text
    };
    window.parent.postMessage(payload, '*');

    try {
      const saved = JSON.parse(localStorage.getItem('msq_v2') || 'null');
      if (saved && saved.q && saved.q[window.__dsParams.quoteId]) {
        const room = saved.q[window.__dsParams.quoteId].rooms[activeRoomIndex];
        if (room) {
          room.rows = room.rows.filter(r => !r._fromDS);
          payload.modules.forEach(m => {
            room.rows.push({
              n: m.type, mk: m.mk, l: Math.round(m.width * 10), w: Math.round(m.height * 10), d: Math.round(m.depth * 10),
              u: 'mm', q: 1, b: 'sqft', x: Math.round(m.left * 10), y: Math.round(m.top * 10), z: Math.round(m.z * 10),
              wl: m.wall, category: m.category, _fromDS: true, fpId: m.fpId
            });
          });
          if (payload.siteElements) room.siteElements = payload.siteElements;
          if (payload.roomName) room.name = payload.roomName;
          localStorage.setItem('msq_v2', JSON.stringify(saved));
        }
      }
    } catch(err) {}
  } catch(e) {}
});
