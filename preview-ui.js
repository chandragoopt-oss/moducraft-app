// ==========================================
// SANDBOX PREVIEW UI — KANBAN, THEME, DESIGN STUDIO BRIDGE
// ==========================================
(function() {
  if (window.__previewUILoaded_v2) return;
  window.__previewUILoaded_v2 = true;

  // ---------- THEME ----------
  window.toggleTheme = function() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('mc_theme', next);
    updateThemeButton();
  };
  function updateThemeButton() {
    const btn = document.getElementById('theme-toggle');
    if (btn) {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      btn.innerHTML = current === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
    }
  }

  // ---------- NAV ----------
  function buildNav() {
    const nav = document.getElementById('nav');
    const userActions = document.getElementById('user-actions');
    if (!nav || !userActions) return;

    nav.innerHTML = `
      <button class="${S.tab === 'h' ? 'active' : ''}" data-a="tab" data-v="h">Dashboard</button>
      <button class="${S.tab === 'q' ? 'active' : ''}" data-a="tab" data-v="q">Quotations</button>
      <button class="${S.tab === 'enq' ? 'active' : ''}" data-a="tab" data-v="enq">Enquiries</button>
      <button class="${S.tab === 'j' ? 'active' : ''}" data-a="tab" data-v="j">Projects</button>
      <button class="${S.tab === 'v' ? 'active' : ''}" data-a="tab" data-v="v">Vendors</button>
      <button class="${S.tab === 'r' ? 'active' : ''}" data-a="tab" data-v="r">Reports</button>
    `;

    userActions.innerHTML = `
      <button id="theme-toggle" onclick="toggleTheme()">Toggle Theme</button>
      <div class="dropdown">
        <button class="dropdown-btn">Tools & Settings ▾</button>
        <div class="dropdown-content">
          <button data-a="tab" data-v="e">Edit</button>
          <button data-a="tab" data-v="p">Preview / Print</button>
          <button data-a="tab" data-v="a">Accessories</button>
          <button data-a="tab" data-v="m">Ply & Hardware</button>
          <button data-ds-open="1" style="color:#3b82f6; font-weight:bold;">🎨 Design Studio (New)</button>
          <button data-a="tab" data-v="d">Design (Old)</button>
          <button data-a="tab" data-v="s">Settings & Rates</button>
          <button data-a="tab" data-v="x">Access & Sharing</button>
        </div>
      </div>
      <div class="dropdown">
        <button class="dropdown-btn">Admin View ▾</button>
        <div class="dropdown-content">
          <button onclick="document.getElementById('adminUsersBtn')?.click()">Manage Users</button>
          <button onclick="document.getElementById('changePassBtn')?.click()">Change Password</button>
          <button onclick="document.getElementById('logoutBtn')?.click()">Log Out</button>
        </div>
      </div>
    `;
    updateThemeButton();
  }

  // ---------- KPI STRIP ----------
  function buildKPIs() {
    const strip = document.getElementById('kpi-strip');
    if (!strip) return;
    let pipeline = 0;
    Object.values(S.q || {}).forEach(q => {
      if (q.st === 'shared' && q.out !== 'lost') {
        try { pipeline += gt(q); } catch(e){}
      }
    });
    const activeProjects = Object.values(BZ?.pj || {}).filter(p => p.stage !== 'Closed').length;
    let receivables = 0;
    Object.values(BZ?.pj || {}).forEach(p => {
      if (p.stage !== 'Closed') {
        const rec = pjRcv ? pjRcv(p) : 0;
        receivables += Math.max(0, (p.val || 0) - rec);
      }
    });
    const pendingPOs = Object.values(BZ?.po || {}).filter(p => ['Draft', 'Sent', 'Part received'].includes(p.st)).length;
    strip.innerHTML = `
      <div class="kpi-card" style="border-bottom: 3px solid var(--accent-blue)">
        <span class="kpi-title">Sales Pipeline</span>
        <span class="kpi-value">${typeof fmt === 'function' ? fmt(pipeline) : pipeline}</span>
      </div>
      <div class="kpi-card" style="border-bottom: 3px solid var(--accent-green)">
        <span class="kpi-title">Active Projects</span>
        <span class="kpi-value">${activeProjects}</span>
      </div>
      <div class="kpi-card" style="border-bottom: 3px solid var(--accent-red)">
        <span class="kpi-title">Receivables</span>
        <span class="kpi-value">${typeof fmt === 'function' ? fmt(receivables) : receivables}</span>
      </div>
      <div class="kpi-card" style="border-bottom: 3px solid var(--accent-yellow)">
        <span class="kpi-title">POs Pending</span>
        <span class="kpi-value">${pendingPOs}</span>
      </div>
      <div class="kpi-card" style="border-bottom: 3px solid var(--text-muted)">
        <span class="kpi-title">Cash Flow</span>
        <span class="kpi-value">${typeof fmt === 'function' ? fmt(receivables) : receivables}</span>
      </div>
    `;
  }

  // ---------- KANBAN ----------
  function buildKanban() {
    const app = document.getElementById('app');
    if (!app) return;
    const todayStr = new Date().toISOString().split('T')[0];
    let urgentCards = [], taskCards = [], quoteCards = [], projectCards = [];

    urgentCards.push(`
      <div class="k-card alert-card">
        <div class="k-card-header"><div class="k-card-title">⚠️ Setup Incomplete</div></div>
        <div class="k-card-sub">1 critical item needs attention (Labour & fabrication).</div>
        <button class="k-btn danger full" onclick="S.tab='s';render()">Open Setup Checklist</button>
      </div>`);

    Object.values(S.q || {}).forEach(q => {
      if (q.st === 'shared' && q.out !== 'lost') {
        const qNum = typeof qno === 'function' ? qno(q) : '';
        const date = typeof dmy === 'function' && q.due ? dmy(q.due) : (q.due || '');
        quoteCards.push(`
          <div class="k-card quote">
            <div class="k-card-header">
              <div class="k-card-title">${typeof esc === 'function' ? esc(q.name || 'No Name') : (q.name || 'No Name')}</div>
              <div class="k-card-date">${date}</div>
            </div>
            <div class="k-card-sub">Apartment - ${qNum}</div>
            <div class="k-btn-group">
              <button class="k-btn" data-a="pq" data-i="${q.id}">📞 Follow Up</button>
              <button class="k-btn danger" onclick="if(typeof mcUpdateEnqStatus==='function') mcUpdateEnqStatus('${q.id}','Lost',true)">✖ Lost</button>
            </div>
          </div>`);
      }
    });

    Object.values(BZ?.pj || {}).forEach(p => {
      if (p.stage !== 'Closed') {
        projectCards.push(`
          <div class="k-card project">
            <div class="k-card-header"><div class="k-card-title">${typeof esc === 'function' ? esc(p.name || p.client) : (p.name || p.client)}</div></div>
            <div class="k-card-sub">Client: ${typeof esc === 'function' ? esc(p.client || 'N/A') : (p.client || 'N/A')}</div>
            <div class="k-pill">Stage: ${typeof esc === 'function' ? esc(p.stage) : p.stage}</div>
          </div>`);
        if (p.tasks) {
          p.tasks.forEach((t, idx) => {
            if (t.st !== 'Done' && t.due) {
              const isUrgent = t.due < todayStr;
              const date = typeof dmy === 'function' ? dmy(t.due) : t.due;
              const card = `
                <div class="k-card ${isUrgent ? 'urgent' : 'task'}">
                  <div class="k-card-header">
                    <div class="k-card-title">${typeof esc === 'function' ? esc(t.t) : t.t}</div>
                    <div class="k-card-date">${date}</div>
                  </div>
                  <div class="k-card-sub">${typeof esc === 'function' ? esc(p.name || p.client) : (p.name || p.client)} (Unassigned)</div>
                  <div class="k-btn-group">
                    <button class="k-btn" onclick="alert('Follow up')">📞 Follow Up</button>
                    <button class="k-btn success" onclick="askDo('Mark complete?',()=>{p.tasks[${idx}].st='Done';p.tasks[${idx}].pct=100;bzSave('pj','${p.id}');render();})">✔ Complete</button>
                  </div>
                </div>`;
              if (isUrgent) urgentCards.push(card); else taskCards.push(card);
            }
          });
        }
      }
    });

    app.innerHTML = `
      <div class="mobile-tabs">
        <button class="active" data-target="col-urgent">🚨 Urgent</button>
        <button data-target="col-tasks">📌 Tasks</button>
        <button data-target="col-quotes">📄 Quotes</button>
        <button data-target="col-projects">🏃 Projects</button>
      </div>
      <div class="kanban-board">
        <div class="kanban-col active-tab" id="col-urgent">
          <div class="kanban-col-header"><span>🚨 Overdue & Urgent</span> <span class="badge">${urgentCards.length}</span></div>
          <div class="kanban-col-body">${urgentCards.join('')}</div>
        </div>
        <div class="kanban-col" id="col-tasks">
          <div class="kanban-col-header"><span>📌 Tasks Due</span> <span class="badge">${taskCards.length}</span></div>
          <div class="kanban-col-body">${taskCards.join('') || '<div style="padding:20px;text-align:center;color:var(--text-muted)">No pending tasks</div>'}</div>
        </div>
        <div class="kanban-col" id="col-quotes">
          <div class="kanban-col-header"><span>📄 Pending Quotes</span> <span class="badge">${quoteCards.length}</span></div>
          <div class="kanban-col-body">${quoteCards.join('') || '<div style="padding:20px;text-align:center;color:var(--text-muted)">No pending quotes</div>'}</div>
        </div>
        <div class="kanban-col" id="col-projects">
          <div class="kanban-col-header"><span>🏃 Running Projects</span> <span class="badge">${projectCards.length}</span></div>
          <div class="kanban-col-body">${projectCards.join('') || '<div style="padding:20px;text-align:center;color:var(--text-muted)">No active projects</div>'}</div>
        </div>
      </div>`;

    document.querySelectorAll('.mobile-tabs button').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.mobile-tabs button').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.kanban-col').forEach(c => c.classList.remove('active-tab'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.target).classList.add('active-tab');
      };
    });
  }

  // ---------- DESIGN STUDIO BRIDGE ----------
    window.openDesignStudio = function() {
    const overlay = document.getElementById('design-studio-overlay');
    const iframe = document.getElementById('ds-iframe');
    if (!overlay || !iframe) { alert('Design Studio overlay not found.'); return; }

    const quoteId = S.cur || Object.keys(S.q || {})[0] || '';
    const roomIdx = 0; 
    const theme = document.documentElement.getAttribute('data-theme') || 'dark';
    
    let roomData = {};
    if (quoteId && S.q[quoteId] && S.q[quoteId].rooms && S.q[quoteId].rooms[roomIdx]) {
        roomData = S.q[quoteId].rooms[roomIdx];
    }
    
    let modulesData = [];
    try {
        if (typeof MODS !== 'undefined') {
            Object.values(MODS).forEach(m => {
                if (!m.au) modulesData.push({ id: m.id, n: m.n, cat: m.cat, ty: m.ty, w: m.w0 || 60, h: m.h || 80, d: m.d || 60 });
            });
        }
    } catch(e) { console.warn("Could not read MODS", e); }

    // --- FIX: Save the large data to localStorage instead of the URL ---
    try {
        localStorage.setItem('msq_studio_data', JSON.stringify({
            quoteId: quoteId,
            roomIdx: roomIdx,
            theme: theme,
            mods: modulesData,
            room: roomData
        }));
    } catch(e) { console.error("Failed to save studio data", e); }

    // Pass only the basic info in the URL
    const params = new URLSearchParams({ q: quoteId, r: roomIdx, theme: theme });
    iframe.src = 'studio/index.html?' + params.toString();
    
    overlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
  };
    window.closeDesignStudio = function() {
    const overlay = document.getElementById('design-studio-overlay');
    const iframe = document.getElementById('ds-iframe');
    if (overlay) overlay.style.display = 'none';
    if (iframe) iframe.src = '';
    document.body.style.overflow = '';
  };
   // Listen for messages from the design studio (save / close / dimensions changed)
  window.addEventListener('message', function(e) {
    if (!e.data || typeof e.data !== 'object') return;
    if (e.data.type === 'ds-close') { closeDesignStudio(); }
    
    if (e.data.type === 'ds-saved') {
      let qid = e.data.quoteId;
      if (!qid || !S.q[qid]) {
        // Create a new quotation on the fly if none exists
        qid = 'q' + Date.now().toString(36);
        S.q[qid] = { id: qid, ts: Date.now(), name: 'New Design Project', by: '', project: '', address: '', contact: '', date: new Date().toISOString().slice(0,10), rooms: [], ir: {}, grp: qid, rev: 0, seq: 1, st: 'draft', pay: [], notes: '' };
        S.cur = qid;
      }
      const q = S.q[qid];
      let rIdx = e.data.roomIdx || 0;
      
      if (!q.rooms[rIdx]) {
        q.rooms.push({ id: 'r' + Date.now().toString(36), t: 'DESIGN ROOM', name: 'DESIGN ROOM', w: 0, rate: '', rows: [], dim: { L: 3000, W: 3000, H: 2700 } });
        rIdx = q.rooms.length - 1;
      }
      const room = q.rooms[rIdx];
      
      // Update room name and dimensions
      if (e.data.roomName) room.name = e.data.roomName;
      if (e.data.dim) {
        room.dim = { L: e.data.dim.L, W: e.data.dim.W, H: e.data.dim.H };
      }
      
      // 1. Save Site Elements (Doors/Windows)
      if (e.data.siteElements) {
        room.siteElements = e.data.siteElements;
      }

      // 2. Save Modules (with new categories: Base/Wall/Loft)
      if (Array.isArray(e.data.modules)) {
        // Remove old Design Studio rows
        room.rows = room.rows.filter(r => !r._fromDS); 
        
        const newRows = e.data.modules.map(m => {
          let mkId = m.mk || ''; 
          
          return {
            n: m.type || 'Custom Design Module',
            mk: mkId,
            l: Math.round(m.width * 10),
            w: Math.round(m.height * 10),
            d: Math.round(m.depth * 10),
            u: 'mm',
            q: 1,
            b: 'sqft',
            x: Math.round(m.left * 10),
            y: Math.round(m.top * 10),
            z: Math.round(m.z * 10),
            wl: m.wall || 'A',
            category: m.category || 'base', // Saves Base/Wall/Loft
            _fromDS: true
          };
        });
        room.rows.push(...newRows);
      }
      
      if (typeof save === 'function') save('q', qid);
      if (typeof flash === 'function') flash('Design saved to: ' + (room.name || 'Room'));
      if (typeof render === 'function') render(); // Force re-render
    }
  });

  // Hook the buttons
  document.addEventListener('click', function(e) {
    if (e.target.closest('[data-ds-open]')) { e.preventDefault(); openDesignStudio(); return; }
    if (e.target.id === 'ds-close-btn') { closeDesignStudio(); return; }
    if (e.target.id === 'ds-save-btn') {
      const iframe = document.getElementById('ds-iframe');
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'ds-request-save' }, '*');
      }
    }
  }, true);

  // ---------- RENDER OVERRIDE ----------
  const originalRender = window.render;
  window.render = function() {
    if (S.tab === 'h') {
      buildNav();
      buildKPIs();
      buildKanban();
      const strip = document.getElementById('kpi-strip');
      if (strip) strip.style.display = 'flex';
      return;
    }
    originalRender.apply(this, arguments);
    const strip = document.getElementById('kpi-strip');
    if (strip) strip.style.display = 'none';
    const appDiv = document.getElementById('app');
    if (appDiv) appDiv.style.overflowY = 'auto';
    buildNav();
  };

  // Initial load
  window.addEventListener('load', () => {
    setTimeout(() => {
      if (typeof S !== 'undefined') { S.tab = 'h'; window.render(); }
    }, 800);
  });
})();
