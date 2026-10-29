// ==========================================
// SANDBOX PREVIEW UI - KANBAN & THEME LOGIC
// ==========================================
(function() {
  if (window.__previewUILoaded) return;
  window.__previewUILoaded = true;

  // Theme Toggle Logic
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
          <button data-a="tab" data-v="d">Design Studio</button>
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

  function buildKanban() {
    const app = document.getElementById('app');
    if (!app) return;

    const todayStr = new Date().toISOString().split('T')[0];
    let urgentCards = [], taskCards = [], quoteCards = [], projectCards = [];

    Object.values(S.q || {}).forEach(q => {
      if (q.st === 'shared' && q.out !== 'lost') {
        const qNum = typeof qno === 'function' ? qno(q) : '';
        quoteCards.push(`
          <div class="k-card quote">
            <div class="k-card-title">${typeof esc === 'function' ? esc(q.name || 'No Name') : (q.name || 'No Name')}</div>
            <div class="k-card-meta">Lead: ${typeof esc === 'function' ? esc(qNum) : qNum}</div>
            <div class="k-card-actions">
              <button class="k-icon-btn" data-a="pq" data-i="${q.id}" title="Preview">👁️</button>
              <button class="k-icon-btn" data-a="oq" data-i="${q.id}" title="Edit">✏️</button>
            </div>
          </div>
        `);
      }
    });

    Object.values(BZ?.pj || {}).forEach(p => {
      if (p.stage !== 'Closed') {
        let qNum = '';
        if (p.qid && S.q[p.qid]) {
          qNum = typeof qno === 'function' ? qno(S.q[p.qid]) : '';
        }
        
        projectCards.push(`
          <div class="k-card project">
            <div class="k-card-title">${typeof esc === 'function' ? esc(p.client || p.name) : (p.client || p.name)}</div>
            <div class="k-card-meta">${qNum ? 'Quote: ' + (typeof esc === 'function' ? esc(qNum) : qNum) : 'No Quote Linked'} • ${typeof esc === 'function' ? esc(p.stage) : p.stage}</div>
            <div class="k-card-actions">
              <button class="k-icon-btn" onclick="S.tab='j';S.pj='${p.id}';S.pt='ov';render();" title="Open Project">🏃</button>
            </div>
          </div>
        `);

        if (p.tasks) {
          p.tasks.forEach((t, idx) => {
            if (t.st !== 'Done' && t.due) {
              const isUrgent = t.due < todayStr;
              const card = `
                <div class="k-card ${isUrgent ? 'urgent' : 'task'}">
                  <div class="k-card-title">${typeof esc === 'function' ? esc(t.t) : t.t}</div>
                  <div class="k-card-meta">${typeof esc === 'function' ? esc(p.client || p.name) : (p.client || p.name)} ${qNum ? ' • ' + (typeof esc === 'function' ? esc(qNum) : qNum) : ''} • Due: ${typeof dmy === 'function' ? dmy(t.due) : t.due}</div>
                  <div class="k-card-actions">
                    <button class="k-icon-btn" onclick="askDo('Mark complete?',()=>{p.tasks[${idx}].st='Done';p.tasks[${idx}].pct=100;bzSave('pj','${p.id}');render();})" title="Complete Task">✔️</button>
                  </div>
                </div>
              `;
              if (isUrgent) urgentCards.push(card);
              else taskCards.push(card);
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
          <div class="kanban-col-header"><span>🚨 Overdue & Urgent</span> <span>${urgentCards.length}</span></div>
          <div class="kanban-col-body">${urgentCards.join('') || '<div style="padding:20px;text-align:center;color:var(--text-muted)">No urgent items</div>'}</div>
        </div>
        <div class="kanban-col" id="col-tasks">
          <div class="kanban-col-header"><span>📌 Tasks Due</span> <span>${taskCards.length}</span></div>
          <div class="kanban-col-body">${taskCards.join('') || '<div style="padding:20px;text-align:center;color:var(--text-muted)">No pending tasks</div>'}</div>
        </div>
        <div class="kanban-col" id="col-quotes">
          <div class="kanban-col-header"><span>📄 Pending Quotes</span> <span>${quoteCards.length}</span></div>
          <div class="kanban-col-body">${quoteCards.join('') || '<div style="padding:20px;text-align:center;color:var(--text-muted)">No pending quotes</div>'}</div>
        </div>
        <div class="kanban-col" id="col-projects">
          <div class="kanban-col-header"><span>🏃 Running Projects</span> <span>${projectCards.length}</span></div>
          <div class="kanban-col-body">${projectCards.join('') || '<div style="padding:20px;text-align:center;color:var(--text-muted)">No active projects</div>'}</div>
        </div>
      </div>
    `;

    document.querySelectorAll('.mobile-tabs button').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.mobile-tabs button').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.kanban-col').forEach(c => c.classList.remove('active-tab'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.target).classList.add('active-tab');
      };
    });
  }

    const originalRender = window.render;
  window.render = function() {
        
    if (S.tab === 'h') {
      buildNav();
      buildKPIs();
      buildKanban();
      document.getElementById('kpi-strip').style.display = 'flex';
      return;
    }
    
    // 1. Let the original app draw the screen first
    originalRender.apply(this, arguments);
    
    document.getElementById('kpi-strip').style.display = 'none';
    const appDiv = document.getElementById('app');
    if (appDiv) appDiv.style.overflowY = 'auto';
    
    buildNav(); 

    // 2. Inject the Toggle Switch if we are in either Design tab ('d' or 'f')
     if (S.tab === 'd' || S.tab === 'f') {
            if (appDiv) {
        const toggleHtml = `
          <div id="design-mode-toggle">
            <button class="${S.tab === 'f' ? 'active' : ''}" onclick="S.tab='f'; window.render();">
              📐 Plan View (Top)
            </button>
            <button class="${S.tab === 'd' ? 'active' : ''}" onclick="S.tab='d'; window.render();">
              🧱 Wall Elevations & 3D
            </button>
          </div>
        `;
        // Insert the toggle at the very top of the canvas
        appDiv.insertAdjacentHTML('afterbegin', toggleHtml);
      }
             // Inject Maximize Buttons into the viewports
      setTimeout(() => {
        const views = document.querySelectorAll('.card:has(.elc), #dsv, #fpsv');
        
        views.forEach(view => {
          // Find the parent container box
          const box = view.closest('.card') || view.parentElement;
          if (!box || box.querySelector('.vp-max-btn')) return; // Skip if already has button

          box.classList.add('viewport-box');
          
          const btn = document.createElement('button');
          btn.className = 'vp-max-btn';
          btn.innerHTML = '⛶'; // Maximize icon
          btn.title = "Maximize / Restore Viewport";
          
          btn.onclick = () => {
            box.classList.toggle('vp-maximized');
            // Dispatch resize event so the 3D canvas redraws to fit the new size
            window.dispatchEvent(new Event('resize'));
          };
          
          box.appendChild(btn);
        });
      }, 200); // Small delay to let the DOM build first
    }
  };

  window.addEventListener('load', () => {
    setTimeout(() => { 
      if (typeof S !== 'undefined') {
        S.tab = 'h';
        window.render(); 
      }
    }, 1000);
  });
})();
