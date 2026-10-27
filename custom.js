// ==========================================
// PATCH: Advanced Follow Up System & Today Dashboard
// ==========================================
const isProjectActive = p => p && !['Closed', 'Closure'].includes(p.stage);
function getDueCount() {
    let count = 0;
    const t = today();
    const linked = new Set(Object.values(BZ.pj).map(p=>p.qid).filter(Boolean));
    Object.values(S.q).forEach(q => {
        if (q.st == 'shared' && !q.unl && q.out !== 'lost' && !linked.has(q.id)) {
            const base = q.lfu || q.shAt || q.date;
            if (q.nfu && q.nfu <= t) count++;
            else if (!q.nfu && base && (Date.now() - new Date(base).getTime())/864e5 >= 4) count++;
        }
    });
    Object.values(BZ.pj).forEach(p => {
        if (isProjectActive(p)) {
            const base = p.lfu || p.cr;
            if (p.nfu && p.nfu <= t) count++;
            else if (!p.nfu && base && (Date.now() - new Date(base).getTime())/864e5 >= 4) count++;
        }
    });
    return count;
}

const navObserver = new MutationObserver(() => {
    const btn = document.querySelector('#nav button[data-a="tab"][data-v="h"]');
    if (btn) {
        const c = getDueCount();
        const currentText = btn.innerHTML.replace(/<span.*?<\/span>/, '').trim();
        if (btn.dataset.count !== String(c)) {
            btn.dataset.count = String(c);
            btn.innerHTML = currentText + (c > 0 ? ` <span style="background:#ef4444;color:#fff;border-radius:10px;padding:1px 6px;font-size:11px;margin-left:4px;font-weight:bold">${c}</span>` : '');
        }
    }
});
if(document.getElementById('nav')) navObserver.observe(document.getElementById('nav'), {childList: true, subtree: true});

function openFupModal(id, type) {
    const isP = type === 'p';
    const obj = isP ? BZ.pj[id] : S.q[id];
    if (!obj) return;
    const defDate = obj.nfu ? obj.nfu : addDays(today(), 4);
    const historyHtml = (obj.fups || []).map(f => `<div style="font-size:11px;margin-bottom:6px;padding-bottom:6px;border-bottom:1px dashed var(--line)"><b>${dmy(f.date)}:</b> ${esc(f.note)} <br><span class="mut" style="font-size:10px">Next scheduled: ${dmy(f.next)}</span></div>`).join('');
    const o = document.createElement('div');
    o.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:99999;padding:16px';
    const bx = document.createElement('div');
    bx.style.cssText = 'background:var(--card,#fff);color:var(--ink,#222);border-radius:12px;padding:18px;max-width:420px;width:100%;box-shadow:0 8px 30px rgba(0,0,0,.35);border:1px solid var(--line)';
    bx.innerHTML = `<h3 style="margin-top:0;color:var(--gr)">Follow Up: ${esc(obj.name)}</h3><p class="mut" style="font-size:12px;margin-bottom:12px">${isP ? 'Project' : 'Quotation'} • ${esc(obj.client || '')}</p><label style="font-size:12px;color:var(--mut);display:block;margin-bottom:4px">What was the result of the follow up?</label><textarea id="fup_note" style="width:100%;height:80px;margin-bottom:12px;padding:8px;border:1px solid var(--line);border-radius:6px;background:var(--in);color:var(--ink);font-family:inherit" placeholder="e.g. Called client."></textarea><label style="font-size:12px;color:var(--mut);display:block;margin-bottom:4px">Next follow-up date</label><input type="date" id="fup_date" value="${defDate}" style="width:100%;margin-bottom:16px;padding:8px;border:1px solid var(--line);border-radius:6px;background:var(--in);color:var(--ink);font-family:inherit">${historyHtml ? `<div style="margin-bottom:16px;max-height:120px;overflow-y:auto"><label style="font-size:12px;color:var(--mut);display:block;margin-bottom:4px">Previous Follow Ups</label>${historyHtml}</div>` : ''}<div style="display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap">${!isP ? `<button class="g" id="fup_lost" style="background:#fee2e2;color:#b91c1c;border-color:#fca5a5;margin-right:auto">Mark as Lost Lead</button>` : ''}<button class="g" id="fup_cancel">Cancel</button><button id="fup_save" style="background:var(--gold);color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-weight:bold">Save Follow Up</button></div>`;
    o.appendChild(bx);
    document.body.appendChild(o);
    document.getElementById('fup_cancel').onclick = () => o.remove();
    if (!isP) {
        document.getElementById('fup_lost').onclick = () => {
            askPick('Why was this lead lost?', [['Price too high', 'Price too high'],['Chose another designer', 'Chose another designer'],['Postponed', 'Postponed / not now'],['No response', 'No response'],['Other', 'Other']], v => { obj.out = 'lost'; obj.lr = v; save('q', id); o.remove(); render(); flash('Marked as Lost Lead'); }, () => {}); 
        };
    }
    document.getElementById('fup_save').onclick = () => {
        const note = document.getElementById('fup_note').value.trim();
        const next = document.getElementById('fup_date').value;
        if (!next) { alert('Please select a date.'); return; }
        obj.fups = obj.fups || [];
        obj.fups.unshift({ date: today(), note: note || 'Followed up', next });
        obj.nfu = next;
        obj.lfu = today();
        if (isP) bzSave('pj', id); else save('q', id);
        o.remove(); render(); flash('Follow-up recorded! Reminder set for ' + dmy(next));
    };
}
document.addEventListener('click', e => {
    const bFup = e.target.closest && e.target.closest('[data-fup]');
    if (bFup) { e.preventDefault(); e.stopImmediatePropagation(); openFupModal(bFup.dataset.fup, bFup.dataset.fuptype || 'q'); return; }
    const bLost = e.target.closest && e.target.closest('[data-lost]');
    if (bLost) {
        e.preventDefault(); e.stopImmediatePropagation();
        const id = bLost.dataset.lost, obj = S.q[id];
        if (!obj) return;
        askPick('Why was this lead lost?', [['Price too high', 'Price too high'], ['Chose another designer', 'Chose another designer'],['Postponed', 'Postponed / not now'], ['No response', 'No response'], ['Other', 'Other']], v => { obj.out = 'lost'; obj.lr = v; save('q', id); render(); flash('Marked as Lost Lead'); }, () => {}); 
    }
    const bComp = e.target.closest && e.target.closest('[data-complete]');
    if (bComp) {
        e.preventDefault(); e.stopImmediatePropagation();
        const id = bComp.dataset.complete, p = BZ.pj[id];
        if (!p) return;
        askDo('Mark this project as COMPLETED?', () => { p.stage = 'Closure'; bzSave('pj', id); render(); flash('Project marked as Completed'); });
    }
}, true);

const origTodayCard = window.vDash;
window.vDash = function() {
    let html = origTodayCard();
    const u = (typeof uName === 'function') ? uName() : (localStorage.getItem('msq_me') || '');
    const displayName = u ? (u.includes('@') ? u.split('@')[0] : u) : 'User';
    html = html.replace("Today —", `Welcome Back, ${displayName}! Today is`);
    html = html.replace(/<div style="border:1px solid #e6dcc3;border-radius:10px;padding:8px 10px;margin:8px 0;background:(?:#fffaf0|#f4fbf4)"><b>📞 Clients to follow up.*?<\/div><\/div>/s, '');
    let newHtml = '';
    const t = today();
    const linked = new Set(Object.values(BZ.pj).map(p=>p.qid).filter(Boolean));
    const dueQ = Object.values(S.q).filter(q => {
        if (q.st !== 'shared' || q.unl || q.out === 'lost' || linked.has(q.id)) return false;
        const base = q.lfu || q.shAt || q.date;
        return (q.nfu && q.nfu <= t) || (!q.nfu && base && (Date.now() - new Date(base).getTime())/864e5 >= 4);
    });
    const dueP = Object.values(BZ.pj).filter(p => {
        if (!isProjectActive(p)) return false;
        const base = p.lfu || p.cr;
        return (p.nfu && p.nfu <= t) || (!p.nfu && base && (Date.now() - new Date(base).getTime())/864e5 >= 4);
    });
    if (dueQ.length || dueP.length) {
        let r = '';
        dueP.forEach(p => { r += `<tr><td><span class="mut">Project</span><br><b>${esc(p.name)}</b><td>${esc(p.client)}<td style="color:#b00020;font-weight:bold">${p.nfu ? dmy(p.nfu) : 'Overdue'}<td style="white-space:nowrap"><button class="g" data-fup="${p.id}" data-fuptype="p" style="background:#e0f2fe;color:#0369a1;border-color:#bae6fd;padding:4px 10px">📞 Follow Up</button> <button class="g" data-complete="${p.id}" style="background:#dcfce7;color:#166534;border-color:#bbf7d0;padding:4px 10px;margin-left:4px">✅ Complete</button></td></tr>`; });
        dueQ.forEach(q => { r += `<tr><td><span class="mut">Quotation</span><br><b>${esc(q.name)}</b><td>${esc(qno(q))}<td style="color:#b00020;font-weight:bold">${q.nfu ? dmy(q.nfu) : 'Overdue'}<td style="white-space:nowrap"><button class="g" data-fup="${q.id}" data-fuptype="q" style="background:#e0f2fe;color:#0369a1;border-color:#bae6fd;padding:4px 10px">📞 Follow Up</button> <button class="g" data-lost="${q.id}" style="background:#fee2e2;color:#b91c1c;border-color:#fca5a5;padding:4px 10px;margin-left:4px">❌ Lost</button></td></tr>`; });
        newHtml += `<div style="border:1px solid #f0b4b4;border-radius:10px;padding:8px 10px;margin:8px 0;background:#fff5f5"><b style="color:#b00020">⏰ Overdue Follow Ups</b><div class="sc"><table class="g" style="min-width:600px"><tr><th>Details</th><th>Client/Quote</th><th>Due</th><th></th></tr>${r}</table></div></div>`;
    }
    const runP = Object.values(BZ.pj).filter(isProjectActive);
    if (runP.length) {
        let r = runP.map(p => `<tr><td><b>${esc(p.name)}</b><td>${esc(p.client)}<td>${esc(p.stage)}<td>${p.nfu ? dmy(p.nfu) : '—'}<td style="white-space:nowrap"><button class="g" data-fup="${p.id}" data-fuptype="p" style="background:#e0f2fe;color:#0369a1;border-color:#bae6fd;padding:4px 10px">📞 Follow Up</button> <button class="g" data-complete="${p.id}" style="background:#dcfce7;color:#166534;border-color:#bbf7d0;padding:4px 10px;margin-left:4px">✅ Complete</button></td></tr>`).join('');
        newHtml += `<div style="border:1px solid #e6dcc3;border-radius:10px;padding:8px 10px;margin:8px 0;background:#fffaf0"><b>🏗️ Running Projects</b><div class="sc"><table class="g" style="min-width:700px"><tr><th>Project</th><th>Client</th><th>Stage</th><th>Next Follow Up</th><th></th></tr>${r}</table></div></div>`;
    }
    const sharedQ = Object.values(S.q).filter(q=>q.st==='shared' && !q.unl && q.out!=='lost' && !linked.has(q.id));
    if (sharedQ.length) {
        let r = sharedQ.map(q => `<tr><td><b>${esc(q.name)}</b><br><span class="mut">${esc(qno(q))}</span><td>${esc(q.project||'')}<td>${q.nfu ? dmy(q.nfu) : '—'}<td style="white-space:nowrap"><button class="g" data-fup="${q.id}" data-fuptype="q" style="background:#e0f2fe;color:#0369a1;border-color:#bae6fd;padding:4px 10px">📞 Follow Up</button> <button class="g" data-lost="${q.id}" style="background:#fee2e2;color:#b91c1c;border-color:#fca5a5;padding:4px 10px;margin-left:4px">❌ Lost</button></td></tr>`).join('');
        newHtml += `<div style="border:1px solid #e6dcc3;border-radius:10px;padding:8px 10px;margin:8px 0;background:#fffaf0"><b>📄 Shared Quotations</b><div class="sc"><table class="g" style="min-width:700px"><tr><th>Client</th><th>Project</th><th>Next Follow Up</th><th></th></tr>${r}</table></div></div>`;
    }
    const chipEnd = html.indexOf('</div>', html.indexOf('<h2>'));
    if (chipEnd !== -1) { html = html.substring(0, chipEnd + 6) + newHtml + html.substring(chipEnd + 6); }
    return html;
};

// ==========================================
// PATCH: Advanced Pricing Bases & Material Summary & Discounts
// ==========================================
const origVEdit = window.vEdit;
window.vEdit = function() {
    let html = origVEdit();
    const q = S.q[S.cur];
    if (!q) return html;
    
    // Minimal base UI for edit if none exists
    if (!html.includes('Pricing basis')) {
        html = `<div class="card"><h2>Quotation Editor</h2><p>Client: <input id="q_name" value="${esc(q.name||'')}"></p>${html}</div>`;
    }

    const oldPmoStr = `<div><label>Pricing basis</label>${SEL('q','pmo',q.pmo||'Module rates',['Module rates','Material costing'])}</div>`;
    const newPmoStr = `<div><label>Pricing basis</label><select data-d="q" data-p="pmo"><option value="Module rates" ${q.pmo==='Module rates'||!q.pmo?'selected':''}>Module rates (auto-calculated)</option><option value="Room base" ${q.pmo==='Room base'?'selected':''}>Room base (per sq.ft)</option><option value="Package" ${q.pmo==='Package'?'selected':''}>Package (flat price per room)</option><option value="Material costing" ${q.pmo==='Material costing'?'selected':''}>Material costing (Internal only)</option></select></div>`;
    html = html.replace(oldPmoStr, newPmoStr);
    
    return html;
};

// ==========================================
// STEP 3: PACKAGE TEMPLATES
// ==========================================
(function(){
  'use strict';
  if (window.__mcPackagesLoaded_v2) return;
  window.__mcPackagesLoaded_v2 = true;
  const PACKAGES = {
    'pkg_kitchen': { name: '🍳 Only Kitchen (Standard)', rooms: [{ name: 'KITCHEN', t: 'KITCHEN', items: [ { mk: 'kb2', q: 4 }, { mk: 'kw2', q: 2 }, { mk: 'ktp', q: 1 }, { mk: 'kl2', q: 2 }, { mk: 'kbsk', q: 1 } ]}] },
    'pkg_1bhk': { name: '🏠 1BHK Package (Kitchen + 1 Bed + Living)', rooms: [{ name: 'KITCHEN', t: 'KITCHEN', items: [ { mk: 'kb2', q: 4 } ]},{ name: 'MASTER BEDROOM', t: 'MASTER BEDROOM', items: [ { mk: 'wh3', q: 1 } ]},{ name: 'LIVING ROOM', t: 'LIVING ROOM', items: [ { mk: 'tvb', q: 1 } ]}] }
  };
  function applyPackage(pkgId) {
    const pkg = PACKAGES[pkgId]; if (!pkg) return;
    let q = S.q[S.cur];
    if (!q) { 
        const id = 'q' + Date.now().toString(36); 
        S.q[id] = { id, name: '', rooms: [], date: today(), pay: [] }; 
        S.cur = id; 
        q = S.q[id]; 
    }
    pkg.rooms.forEach(pkgRoom => {
      const newRoom = { id: 'r' + Date.now().toString(36), t: pkgRoom.t, name: pkgRoom.name, w: 0, rate: '', rows: [] };
      pkgRoom.items.forEach(item => { newRoom.rows.push({ id: 'r'+Date.now(), n: 'Module ' + item.mk, w: 1000, h: 1000, q: item.q }); });
      q.rooms.push(newRoom);
    });
    save('q', S.cur); render(); flash('Package added successfully!');
  }
  function showPackageModal() {
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:flex-start;justify-content:center;z-index:100001;padding:20px;overflow-y:auto';
    const btnHtml = Object.entries(PACKAGES).map(([id, p]) => `<button data-pkg-id="${id}" style="background:var(--in);color:var(--ink);border:1px solid var(--line);text-align:left;padding:12px;font-size:15px;margin-bottom:8px;display:block;width:100%;border-radius:8px;font-weight:600;cursor:pointer;transition:background 0.2s">${p.name}</button>`).join('');
    modal.innerHTML = `<div style="background:var(--card,#fff);color:var(--ink,#222);border-radius:12px;padding:20px;max-width:480px;width:100%;box-shadow:0 10px 40px rgba(0,0,0,.5);margin:auto"><h3 style="margin-top:0">Insert Package Template</h3><p class="mut" style="font-size:13px;margin-bottom:16px">Choose a pre-built set of rooms and modules.</p><div style="max-height:60vh;overflow-y:auto;padding-right:4px">${btnHtml}</div><button id="pkg_cancel" style="margin-top:14px;width:100%;background:transparent;border:1px solid var(--line);color:var(--ink);padding:10px;border-radius:8px;font-weight:600;cursor:pointer">Cancel</button></div>`;
    document.body.appendChild(modal);
    modal.querySelectorAll('[data-pkg-id]').forEach(btn => { btn.onclick = () => { applyPackage(btn.dataset.pkgId); modal.remove(); }; });
    document.getElementById('pkg_cancel').onclick = () => modal.remove();
  }
  if (window.vList) { const _vList = window.vList; window.vList = function() { return _vList().replace('<button data-a="nq">+ New quotation</button>', '<button data-a="nq">+ New quotation</button><button class="g" id="btn-insert-pkg" style="border-color:#1F4E79;color:#1F4E79;font-weight:600">📦 Insert Package</button>'); }; }
  document.addEventListener('click', function(e) { if (e.target.id === 'btn-insert-pkg') { e.preventDefault(); showPackageModal(); } });
})();

// ==========================================
// STEP 4: ENQUIRY TRACKER (PRE-QUOTATION)
// ==========================================
(function(){
  'use strict';
  if (window.__mcEnqLoaded) return;
  window.__mcEnqLoaded = true;
  
  let savedEnq = {};
  try { savedEnq = JSON.parse(localStorage.getItem('msq_enq_data') || '{}'); } catch(e) {}
  window.ENQ = savedEnq;
  window.saveEnq = function() { try { localStorage.setItem('msq_enq_data', JSON.stringify(window.ENQ)); } catch(e) {} };
  
  window.vEnq = function() {
    const list = Object.values(window.ENQ).sort((a, b) => (b.date || '').localeCompare(a.date || '')), t = today();
    const rows = list.map(e => {
      const isOverdue = e.nextFollowUp && e.nextFollowUp <= t, badge = e.status === 'Won' ? '<span style="color:#15803d">Won</span>' : e.status === 'Lost' ? '<span style="color:#b00020">Lost</span>' : `<span style="color:#1F4E79">${e.status || 'Enquiry'}</span>`;
      return `<tr><td><b>${esc(e.name)}</b><br><span class="mut">${esc(e.phone)}</span></td><td>${esc(e.project)}</td><td>${esc(e.budget || '—')}</td><td style="${isOverdue ? 'color:#b00020;font-weight:bold' : ''}">${e.nextFollowUp ? dmy(e.nextFollowUp) : '—'}</td><td>${badge}</td><td style="white-space:nowrap"><button class="g" data-enq-act="edit" data-id="${e.id}">Edit</button>${e.status !== 'Won' ? `<button data-enq-act="convert" data-id="${e.id}" style="background:#1F4E79;color:#fff;border:0;border-radius:6px;padding:4px 10px;cursor:pointer;margin-left:4px">→ Quote</button>` : ''}</td></tr>`;
    }).join('');
    return `<div class="card"><div class="bar noprint"><h2>Enquiries / Leads</h2><button data-enq-act="new" style="background:#1F4E79;color:#fff;border:0;border-radius:6px;padding:6px 12px;font-weight:600;cursor:pointer;margin-left:auto">+ New Enquiry</button></div><p class="mut">Track potential clients before creating a quotation.</p><div class="sc"><table class="g" style="min-width:760px"><tr><th>Client</th><th>Project / Requirement</th><th>Budget</th><th>Next Follow Up</th><th>Status</th><th></th></tr>${rows || '<tr><td colspan="6" class="mut">No enquiries logged yet.</td></tr>'}</table></div></div>`;
  };
  
  document.addEventListener('click', function(ev) {
    const btn = ev.target.closest('[data-enq-act]'); if (!btn) return; ev.preventDefault();
    const act = btn.dataset.enqAct, id = btn.dataset.id;
    if (act === 'new') openEnqModal();
    else if (act === 'edit') openEnqModal(id);
  });
})();

// ==========================================
// DAILY STARTUP CHECKLIST LOGIC
// ==========================================
(function() {
  if (window.__mcDailyChecklistLoaded) return;
  window.__mcDailyChecklistLoaded = true;

  function initChecklist() {
    const todayStr = new Date().toDateString();
    const lastCheck = localStorage.getItem(`checklist_${todayStr}`);

    if (lastCheck === 'completed') return;

    const modal = document.getElementById('daily-checklist-modal');
    if (!modal) return;

    const checkRole = setInterval(() => {
      if (typeof S !== 'undefined' && S.role) {
        clearInterval(checkRole);
        setupChecklist(modal, todayStr);
      }
    }, 500);
  }

  function setupChecklist(modal, todayStr) {
    const isAdmin = (S.role === 'Owner' || S.role === 'Editor' || !S.role);
    
    let tasks = [];
    if (isAdmin) {
      tasks = [
        { id: 'chk_email', label: 'Check Email / BCC for new leads (Optional)', optional: true },
        { id: 'chk_leads', label: 'Review New Leads in Enquiries Tab', optional: false },
        { id: 'chk_sync', label: 'Check System Sync Status', optional: false },
        { id: 'chk_pipeline', label: 'Review Won/Lost Pipeline', optional: false }
      ];
    } else {
      tasks = [
        { id: 'chk_tasks', label: 'Review assigned tasks', optional: false },
        { id: 'chk_site', label: 'Check site updates & daily reports', optional: false }
      ];
    }

    const itemsContainer = document.getElementById('chk-items');
    itemsContainer.innerHTML = tasks.map(t => `
      <label class="chk-item">
        <input type="checkbox" id="${t.id}" class="chk-cb" ${t.optional ? 'data-optional="true"' : ''} onchange="window.validateChecklist()">
        ${t.label}
      </label>
    `).join('');

    document.getElementById('chk-date').textContent = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

    modal.style.display = 'flex';

    window.validateChecklist = function() {
      const cbs = document.querySelectorAll('.chk-cb');
      const allReqChecked = Array.from(cbs).every(cb => cb.checked || cb.dataset.optional === 'true');
      document.getElementById('chk-start-btn').disabled = !allReqChecked;
    };

    document.getElementById('chk-start-btn').onclick = function() {
      localStorage.setItem(`checklist_${todayStr}`, 'completed');
      modal.style.display = 'none';
      if (typeof render === 'function') render();
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChecklist);
  } else {
    initChecklist();
  }
})();
