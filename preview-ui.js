// ==========================================
// SANDBOX PREVIEW UI - KANBAN BOARD LOGIC
// ==========================================
(function() {
  if (window.__previewUILoaded) return;
  window.__previewUILoaded = true;

  // 1. Build Navigation & Dropdowns
  function buildNav() {
    const nav = document.getElementById('nav');
    const userActions = document.getElementById('user-actions');
    if (!nav || !userActions) return;
    
    // Primary Links
    nav.innerHTML = `
      <button class="${S.tab === 'h' ? 'active' : ''}" onclick="S.tab='h';render();">Dashboard</button>
      <button class="${S.tab === 'q' ? 'active' : ''}" onclick="S.tab='q';render();">Quotations</button>
      <button class="${S.tab === 'enq' ? 'active' : ''}" onclick="S.tab='enq';render();">Enquiries</button>
      <button class="${S.tab === 'j' ? 'active' : ''}" onclick="S.tab='j';render();">Projects</button>
      <button class="${S.tab === 'v' ? 'active' : ''}" onclick="S.tab='v';render();">Vendors</button>
      <button class="${S.tab === 'r' ? 'active' : ''}" onclick="S.tab='r';render();">Reports</button>
    `;

    // Dropdowns
    userActions.innerHTML = `
      <div class="dropdown">
        <button class="dropdown-btn">Tools & Settings ▾</button>
        <div class="dropdown-content">
          <button onclick="S.tab='e';render();">Edit</button>
          <button onclick="S.tab='p';render();">Preview / Print</button>
          <button onclick="S.tab='a';render();">Accessories</button>
          <button onclick="S.tab='m';render();">Ply & Hardware</button>
          <button onclick="S.tab='d';render();">Design (Walls A-D)</button>
          <button onclick="S.tab='f';render();">Floor Plan</button>
          <button onclick="S.tab='s';render();">Settings & Rates</button>
          <button onclick="S.tab='x';render();">Access & Sharing</button>
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
  }

  // 2. Build KPI Strip (Calculates live numbers)
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
      <div class="kpi-card" style="border-bottom: 3px solid #3b82f6">
        <span class="kpi-title">Sales Pipeline</span>
        <span class="kpi-value">${typeof fmt === 'function' ? fmt(pipeline) : pipeline}</span>
      </div>
      <div class="kpi-card" style="border-bottom: 3px solid #10b981">
        <span class="kpi-title">Active Projects</span>
        <span class="kpi-value">${activeProjects}</span>
      </div>
      <div class="kpi-card" style="border-bottom: 3px solid #ef4444">
        <span class="kpi-title">Receivables</span>
        <span class="kpi-value">${typeof fmt === 'function' ? fmt(receivables) : receivables}</span>
      </div>
      <div class="kpi-card" style="border-bottom: 3px solid #f59e0b">
        <span class="kpi-title">POs Pending</span>
        <span class="kpi-value">${pendingPOs}</span>
      </div>
      <div class="kpi-card" style="border-bottom: 3px solid #94a3b8">
        <span class="kpi-title">Cash Flow</span>
        <span class="kpi-value">${typeof fmt === 'function' ? fmt(receivables) : receivables}</span>
      </div>
    `;
  }

  // 3. Build Kanban Board (Sorts your data into 4 columns)
  function buildKanban() {
    const app = document.getElementById('app');
    if (!app) return;

    const todayStr = new Date().toISOString().split('T')[0];
    let urgentCards = [], taskCards = [], quoteCards = [], projectCards = [];

    // --- PENDING QUOTES ---
    Object.values(S.q || {}).forEach(q => {
      if (q.st === 'shared' && q.out !== 'lost') {
        quoteCards.push(`
          <div class="k-card quote">
            <div class="k-card-title">${typeof esc === 'function' ? esc(q.name || 'No Name') : (q.name || 'No Name')}</div>
            <div class="k-card-meta">${typeof esc === 'function' ? esc(q.project || 'No Project') : (q.project || 'No Project')}</div>
            <div class="k-card-actions">
              <button class="k-icon-btn" onclick="S.cur='${q.id}';S.tab='p';render();" title="Preview">👁️</button>
              <button class="k-icon-btn" onclick="S.cur='${q.id}';S.tab='e';render();" title="Edit">✏️</button>
            </div>
          </div>
        `);
      }
    });

    // --- PROJECTS & TASKS ---
    Object.values(BZ?.pj || {}).forEach(p => {
      if (p.stage !== 'Closed') {
        
        // Project Card
        projectCards.push(`
          <div class="k-card project">
            <div class="k-card-title">${typeof esc === 'function' ? esc(p.name) : p.name}</div>
            <div class="k-card-meta">${typeof esc === 'function' ? esc(p.client) : p.client} • ${typeof esc === 'function' ? esc(p.stage) : p.stage}</div>
            <div class="k-card-actions">
              <button class="k-icon-btn" onclick="S.tab='j';S.pj='${p.id}';S.pt='ov';render();" title="Open Project">🏃</button>
            </div>
          </div>
        `);

        // Task Cards
        if (p.tasks) {
          p.tasks.forEach((t, idx) => {
            if (t.st !== 'Done' && t.due) {
              const isUrgent = t.due < todayStr;
              const card = `
                <div class="k-card ${isUrgent ? 'urgent' : 'task'}">
                  <div class="k-card-title">${typeof esc === 'function' ? esc(t.t) : t.t}</div>
                  <div class="k-card-meta">${typeof esc === 'function' ? esc(p.name) : p.name} • Due: ${typeof dmy === 'function' ? dmy(t.due) : t.due}</div>
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

    // Render the 4 Columns
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
          <div class="kanban-col-body">${urgentCards.join('') || '<div style="padding:20px;text-align:center;color:#94a3b8">No urgent items</div>'}</div>
        </div>
        <div class="kanban-col" id="col-tasks">
          <div class="kanban-col-header"><span>📌 Tasks Due</span> <span>${taskCards.length}</span></div>
          <div class="kanban-col-body">${taskCards.join('') || '<div style="padding:20px;text-align:center;color:#94a3b8">No pending tasks</div>'}</div>
        </div>
        <div class="kanban-col" id="col-quotes">
          <div class="kanban-col-header"><span>📄 Pending Quotes</span> <span>${quoteCards.length}</span></div>
          <div class="kanban-col-body">${quoteCards.join('') || '<div style="padding:20px;text-align:center;color:#94a3b8">No pending quotes</div>'}</div>
        </div>
        <div class="kanban-col" id="col-projects">
          <div class="kanban-col-header"><span>🏃 Running Projects</span> <span>${projectCards.length}</span></div>
          <div class="kanban-col-body">${projectCards.join('') || '<div style="padding:20px;text-align:center;color:#94a3b8">No active projects</div>'}</div>
        </div>
      </div>
    `;

    // Mobile Tab Clicking
    document.querySelectorAll('.mobile-tabs button').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.mobile-tabs button').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.kanban-col').forEach(c => c.classList.remove('active-tab'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.target).classList.add('active-tab');
      };
    });
  }

  // 4. Intercept Render
  // We grab your original render function and save it safely
  const originalRender = window.render;
  
  window.render = function() {
    // If we are on the Dashboard ('h'), show the Kanban!
    if (S.tab === 'h') {
      buildNav();
      buildKPIs();
      buildKanban();
      
      // Make sure KPI strip is visible
      document.getElementById('kpi-strip').style.display = 'flex';
      return;
    }
    
    // If we click anything else (Quotations, Projects, Settings), load the ORIGINAL app
    originalRender.apply(this, arguments);
    
    // Hide KPI strip and make sure the page can scroll normally for tables
    document.getElementById('kpi-strip').style.display = 'none';
    document.getElementById('app').style.overflowY = 'auto';
    buildNav(); // Keep the new nav bar visible on all pages
  };

  // Run once when the page loads
  window.addEventListener('load', () => {
    setTimeout(() => { 
      if (typeof S !== 'undefined' && S.tab === 'h') {
        window.render(); 
      }
    }, 1000); // Wait 1 second for your database to load
  });

  console.log('[ModuCraft] Preview Logic Loaded.');
})();
