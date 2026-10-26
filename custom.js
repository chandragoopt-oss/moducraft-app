// ModuCraft Custom Patch File
// Paste any new features from Claude below this line.
// --- PATCH: Change Today Page Title ---
const originalTodayCard = todayCard;
todayCard = function() {
    let html = originalTodayCard();
    // Find the old title and replace it with the new one
    return html.replace("Today —", "Welcome Back! Today is");
};
// ==========================================
// PATCH: Advanced Follow Up System & Today Dashboard
// ==========================================

// 1. Calculate pending follow ups (defaults to 4 days if no date set)
function getDueCount() {
    let count = 0;
    const t = today();
    const linked = new Set(Object.values(BZ.pj).map(p=>p.qid).filter(Boolean));
    
    Object.values(S.q).forEach(q => {
        // Ignore dead leads (q.out === 'lost')
        if (q.st == 'shared' && !q.unl && q.out !== 'lost' && !linked.has(q.id)) {
            const base = q.lfu || q.shAt || q.date;
            if (q.nfu && q.nfu <= t) count++;
            else if (!q.nfu && base && (Date.now() - new Date(base).getTime())/864e5 >= 4) count++;
        }
    });
    
    Object.values(BZ.pj).forEach(p => {
        if (p.stage != 'Closed') {
            const base = p.lfu || p.cr;
            if (p.nfu && p.nfu <= t) count++;
            else if (!p.nfu && base && (Date.now() - new Date(base).getTime())/864e5 >= 4) count++;
        }
    });
    return count;
}

// 2. Update the Tab text with the count
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
navObserver.observe(document.getElementById('nav'), {childList: true, subtree: true});

// 3. The Follow Up Modal
function openFupModal(id, type) {
    const isP = type === 'p';
    const obj = isP ? BZ.pj[id] : S.q[id];
    if (!obj) return;
    
    const defDate = obj.nfu ? obj.nfu : addDays(today(), 4);
    const historyHtml = (obj.fups || []).map(f => `
        <div style="font-size:11px;margin-bottom:6px;padding-bottom:6px;border-bottom:1px dashed var(--line)">
            <b>${dmy(f.date)}:</b> ${esc(f.note)} <br><span class="mut" style="font-size:10px">Next scheduled: ${dmy(f.next)}</span>
        </div>
    `).join('');

    const o = document.createElement('div');
    o.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:99999;padding:16px';
    
    const bx = document.createElement('div');
    bx.style.cssText = 'background:var(--card,#fff);color:var(--ink,#222);border-radius:12px;padding:18px;max-width:420px;width:100%;box-shadow:0 8px 30px rgba(0,0,0,.35);border:1px solid var(--line)';
    
    bx.innerHTML = `
        <h3 style="margin-top:0;color:var(--gr)">Follow Up: ${esc(obj.name)}</h3>
        <p class="mut" style="font-size:12px;margin-bottom:12px">${isP ? 'Project' : 'Quotation'} • ${esc(obj.client || '')}</p>
        
        <label style="font-size:12px;color:var(--mut);display:block;margin-bottom:4px">What was the result of the follow up?</label>
        <textarea id="fup_note" style="width:100%;height:80px;margin-bottom:12px;padding:8px;border:1px solid var(--line);border-radius:6px;background:var(--in);color:var(--ink);font-family:inherit" placeholder="e.g. Called client. They need 2 more days to review."></textarea>
        
        <label style="font-size:12px;color:var(--mut);display:block;margin-bottom:4px">Next follow-up date (defaults to 4 days)</label>
        <input type="date" id="fup_date" value="${defDate}" style="width:100%;margin-bottom:16px;padding:8px;border:1px solid var(--line);border-radius:6px;background:var(--in);color:var(--ink);font-family:inherit">
        
        ${historyHtml ? `<div style="margin-bottom:16px;max-height:120px;overflow-y:auto"><label style="font-size:12px;color:var(--mut);display:block;margin-bottom:4px">Previous Follow Ups</label>${historyHtml}</div>` : ''}

        <div style="display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap">
            ${!isP ? `<button class="g" id="fup_dead" style="background:#fee2e2;color:#b91c1c;border-color:#fca5a5;margin-right:auto">Mark as Dead Lead</button>` : ''}
            <button class="g" id="fup_cancel">Cancel</button>
            <button id="fup_save" style="background:var(--gold);color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-weight:bold">Save Follow Up</button>
        </div>
    `;
    
    o.appendChild(bx);
    document.body.appendChild(o);

    document.getElementById('fup_cancel').onclick = () => o.remove();
    
    // Handle Dead Lead inside modal
    if (!isP) {
        document.getElementById('fup_dead').onclick = () => {
            askPick('Why was this lead lost?', [
                ['Price too high', 'Price too high'],
                ['Chose another designer', 'Chose another designer'],
                ['Postponed', 'Postponed / not now'],
                ['No response', 'No response'],
                ['Other', 'Other']
            ], v => {
                obj.out = 'lost';
                obj.lr = v;
                save('q', id);
                o.remove();
                render();
                flash('Marked as Dead Lead');
            }, () => {}); 
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
        o.remove();
        render(); 
        flash('Follow-up recorded! Reminder set for ' + dmy(next));
    };
}

// 4. Global Event Listeners for Follow Up & Dead Lead buttons
document.addEventListener('click', e => {
    const bFup = e.target.closest && e.target.closest('[data-fup]');
    if (bFup) {
        e.preventDefault();
        e.stopImmediatePropagation();
        openFupModal(bFup.dataset.fup, bFup.dataset.fuptype || 'q');
        return;
    }
    
    const bDead = e.target.closest && e.target.closest('[data-dead]');
    if (bDead) {
        e.preventDefault();
        e.stopImmediatePropagation();
        const id = bDead.dataset.dead;
        const obj = S.q[id];
        if (!obj) return;
        
        askPick('Why was this lead lost?', [
            ['Price too high', 'Price too high'],
            ['Chose another designer', 'Chose another designer'],
            ['Postponed', 'Postponed / not now'],
            ['No response', 'No response'],
            ['Other', 'Other']
        ], v => {
            obj.out = 'lost';
            obj.lr = v;
            save('q', id);
            render();
            flash('Marked as Dead Lead');
        }, () => {}); 
    }
}, true);

// 5. Override the Today Page to show the new grouped dashboard
const origTodayCard = todayCard;
todayCard = function() {
    let html = origTodayCard();
    
    // Remove the old basic follow-up block
    html = html.replace(/<div style="border:1px solid #e6dcc3;border-radius:10px;padding:8px 10px;margin:8px 0;background:(?:#fffaf0|#f4fbf4)"><b>📞 Clients to follow up.*?<\/div><\/div>/s, '');

    let newHtml = '';
    const t = today();
    const linked = new Set(Object.values(BZ.pj).map(p=>p.qid).filter(Boolean));

    // --- Section A: Overdue / Due Today ---
    const dueQ = Object.values(S.q).filter(q => {
        // Ignore dead leads
        if (q.st !== 'shared' || q.unl || q.out === 'lost' || linked.has(q.id)) return false;
        const base = q.lfu || q.shAt || q.date;
        return (q.nfu && q.nfu <= t) || (!q.nfu && base && (Date.now() - new Date(base).getTime())/864e5 >= 4);
    });
    const dueP = Object.values(BZ.pj).filter(p => {
        if (p.stage === 'Closed') return false;
        const base = p.lfu || p.cr;
        return (p.nfu && p.nfu <= t) || (!p.nfu && base && (Date.now() - new Date(base).getTime())/864e5 >= 4);
    });

    if (dueQ.length || dueP.length) {
        let r = '';
        dueP.forEach(p => {
            r += `<tr><td><span class="mut">Project</span><br><b>${esc(p.name)}</b><td>${esc(p.client)}<td style="color:#b00020;font-weight:bold">${p.nfu ? dmy(p.nfu) : 'Overdue'}<td style="white-space:nowrap"><button class="g" data-fup="${p.id}" data-fuptype="p" style="background:#e0f2fe;color:#0369a1;border-color:#bae6fd;padding:4px 10px">📞 Follow Up</button></td></tr>`;
        });
        dueQ.forEach(q => {
            r += `<tr><td><span class="mut">Quotation</span><br><b>${esc(q.name)}</b><td>${esc(qno(q))}<td style="color:#b00020;font-weight:bold">${q.nfu ? dmy(q.nfu) : 'Overdue'}<td style="white-space:nowrap"><button class="g" data-fup="${q.id}" data-fuptype="q" style="background:#e0f2fe;color:#0369a1;border-color:#bae6fd;padding:4px 10px">📞 Follow Up</button> <button class="g" data-dead="${q.id}" style="background:#fee2e2;color:#b91c1c;border-color:#fca5a5;padding:4px 10px;margin-left:4px">❌ Dead</button></td></tr>`;
        });
        newHtml += `<div style="border:1px solid #f0b4b4;border-radius:10px;padding:8px 10px;margin:8px 0;background:#fff5f5"><b style="color:#b00020">⏰ Overdue Follow Ups</b><div class="sc"><table class="g" style="min-width:600px"><tr><th>Details</th><th>Client/Quote</th><th>Due</th><th></th></tr>${r}</table></div></div>`;
    }

    // --- Section B: Running Projects ---
    const runP = Object.values(BZ.pj).filter(p=>p.stage!='Closed');
    if (runP.length) {
        let r = runP.map(p => `<tr><td><b>${esc(p.name)}</b><td>${esc(p.client)}<td>${esc(p.stage)}<td>${p.nfu ? dmy(p.nfu) : '—'}<td><button class="g" data-fup="${p.id}" data-fuptype="p" style="background:#e0f2fe;color:#0369a1;border-color:#bae6fd;padding:4px 10px">📞 Follow Up</button></tr>`).join('');
        newHtml += `<div style="border:1px solid #e6dcc3;border-radius:10px;padding:8px 10px;margin:8px 0;background:#fffaf0"><b>🏗️ Running Projects</b><div class="sc"><table class="g" style="min-width:700px"><tr><th>Project</th><th>Client</th><th>Stage</th><th>Next Follow Up</th><th></th></tr>${r}</table></div></div>`;
    }

    // --- Section C: Shared Quotations ---
    const sharedQ = Object.values(S.q).filter(q=>q.st==='shared' && !q.unl && q.out!=='lost' && !linked.has(q.id));
    if (sharedQ.length) {
        let r = sharedQ.map(q => `<tr><td><b>${esc(q.name)}</b><br><span class="mut">${esc(qno(q))}</span><td>${esc(q.project||'')}<td>${q.nfu ? dmy(q.nfu) : '—'}<td style="white-space:nowrap"><button class="g" data-fup="${q.id}" data-fuptype="q" style="background:#e0f2fe;color:#0369a1;border-color:#bae6fd;padding:4px 10px">📞 Follow Up</button> <button class="g" data-dead="${q.id}" style="background:#fee2e2;color:#b91c1c;border-color:#fca5a5;padding:4px 10px;margin-left:4px">❌ Dead</button></td></tr>`).join('');
        newHtml += `<div style="border:1px solid #e6dcc3;border-radius:10px;padding:8px 10px;margin:8px 0;background:#fffaf0"><b>📄 Shared Quotations</b><div class="sc"><table class="g" style="min-width:700px"><tr><th>Client</th><th>Project</th><th>Next Follow Up</th><th></th></tr>${r}</table></div></div>`;
    }

    // Inject everything right after the top summary chips
    const chipEnd = html.indexOf('</div>', html.indexOf('<h2>Today'));
    if (chipEnd !== -1) {
        html = html.substring(0, chipEnd + 6) + newHtml + html.substring(chipEnd + 6);
    }

    return html;
};

// 6. Add buttons to the main Quotations list
const origVList = vList;
vList = function() {
    let html = origVList();
    Object.values(S.q).forEach(q => {
        if (q.st === 'shared' && q.out !== 'lost') {
            const target = `<button class="g" data-a="pq" data-i="${q.id}">Preview</button>`;
            const nextTxt = q.nfu ? 'Next follow up: ' + dmy(q.nfu) : 'No follow up scheduled';
            const replacement = target + ` <button class="g" style="background:#e0f2fe;color:#0369a1;border-color:#bae6fd" data-fup="${q.id}" data-fuptype="q" title="${nextTxt}">📞 Follow Up</button> <button class="g" style="background:#fee2e2;color:#b91c1c;border-color:#fca5a5" data-dead="${q.id}" title="Mark as Dead Lead">❌ Dead</button>`;
            
            if (html.includes(target) && !html.includes(`data-fup="${q.id}"`)) {
                html = html.replace(target, replacement);
            }
        }
    });
    return html;
};
    return html;
};
