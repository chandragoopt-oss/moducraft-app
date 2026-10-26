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
// PATCH: Follow Up System & Reminders
// ==========================================

// 1. Create the Popup Modal
function openFupModal(qid) {
    const q = S.q[qid];
    if (!q || q.st !== 'shared') return;
    
    // Default to 4 days from now
    const defDate = q.nfu ? q.nfu : addDays(today(), 4);

    const o = document.createElement('div');
    o.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:99999;padding:16px';
    
    const bx = document.createElement('div');
    bx.style.cssText = 'background:var(--card,#fff);color:var(--ink,#222);border-radius:12px;padding:18px;max-width:420px;width:100%;box-shadow:0 8px 30px rgba(0,0,0,.35);border:1px solid var(--line)';
    
    const historyHtml = (q.fups || []).map(f => `
        <div style="font-size:11px;margin-bottom:6px;padding-bottom:6px;border-bottom:1px dashed var(--line)">
            <b>${dmy(f.date)}:</b> ${esc(f.note)} <br><span class="mut" style="font-size:10px">Next scheduled: ${dmy(f.next)}</span>
        </div>
    `).join('');

    bx.innerHTML = `
        <h3 style="margin-top:0;color:var(--gr)">Follow Up: ${esc(q.name)}</h3>
        <p class="mut" style="font-size:12px;margin-bottom:12px">Quotation: ${esc(qno(q))}</p>
        
        <label style="font-size:12px;color:var(--mut);display:block;margin-bottom:4px">What was the result of the follow up?</label>
        <textarea id="fup_note" style="width:100%;height:80px;margin-bottom:12px;padding:8px;border:1px solid var(--line);border-radius:6px;background:var(--in);color:var(--ink);font-family:inherit" placeholder="e.g. Called client. They need 2 more days to review. Next call on Friday."></textarea>
        
        <label style="font-size:12px;color:var(--mut);display:block;margin-bottom:4px">Next follow-up date (defaults to 4 days)</label>
        <input type="date" id="fup_date" value="${defDate}" style="width:100%;margin-bottom:16px;padding:8px;border:1px solid var(--line);border-radius:6px;background:var(--in);color:var(--ink);font-family:inherit">
        
        ${historyHtml ? `<div style="margin-bottom:16px;max-height:120px;overflow-y:auto"><label style="font-size:12px;color:var(--mut);display:block;margin-bottom:4px">Previous Follow Ups</label>${historyHtml}</div>` : ''}

        <div style="display:flex;justify-content:flex-end;gap:8px">
            <button class="g" id="fup_cancel">Cancel</button>
            <button id="fup_save" style="background:var(--gold);color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-weight:bold">Save Follow Up</button>
        </div>
    `;
    
    o.appendChild(bx);
    document.body.appendChild(o);

    document.getElementById('fup_cancel').onclick = () => o.remove();
    
    document.getElementById('fup_save').onclick = () => {
        const note = document.getElementById('fup_note').value.trim();
        const next = document.getElementById('fup_date').value;
        if (!next) { alert('Please select a date for the next follow up.'); return; }
        
        q.fups = q.fups || [];
        q.fups.unshift({ date: today(), note: note || 'Followed up (no notes)', next });
        q.nfu = next;
        q.lfu = today();
        
        save('q', q.id);
        o.remove();
        render();
        flash('Follow-up recorded! Reminder set for ' + dmy(next));
    };
}

// Catch clicks on the Follow Up button (prevents the main app from throwing an error)
document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-fup]');
    if (b) {
        e.preventDefault();
        e.stopImmediatePropagation();
        openFupModal(b.dataset.fup);
    }
}, true);

// 2. Override the Today Page to show Follow Up Reminders
const origTodayCard = todayCard;
todayCard = function() {
    let html = origTodayCard();
    
    const t = today();
    const pj = Object.values(BZ.pj).filter(p=>p.stage!='Closed');
    const all = Object.values(S.q);
    const newest = q=>!all.some(x=>G(x)==G(q)&&(x.rev||0)>(q.rev||0));
    const linked = new Set(pj.map(p=>p.qid));
    
    // Find shared quotations that are due for follow up (or overdue)
    // Default is 4 days from sharing if no specific date is set
    const fu = all.filter(q => 
        q.st == 'shared' && !q.unl && !linked.has(q.id) && q.out !== 'lost' && newest(q) && 
        ((q.nfu && q.nfu <= t) || (!q.nfu && (Date.now()-(q.shAt||new Date(q.date||t).getTime()))/864e5 >= 4))
    );

    // Only replace the section if there are follow-ups to show
    if (fu.length) {
        let rows = fu.map(q => {
            const nextDate = q.nfu ? `<span style="color:#b00020;font-weight:bold">Due: ${dmy(q.nfu)}</span>` : '<span style="color:#b00020;font-weight:bold">No date set</span>';
            return `<tr>
                <td>${esc(q.name)}<br><span class="mut">${esc(q.project||'')}</span>
                <td>${esc(qno(q))}
                <td>${nextDate}
                <td style="white-space:nowrap">
                    <button class="g" data-tdy="fwa" data-id="${q.id}">WhatsApp</button>
                    <button class="g" data-fup="${q.id}" style="background:#e0f2fe;color:#0369a1;border-color:#bae6fd">📞 Log Follow Up</button>
                    <button class="g" data-tdy="flost" data-id="${q.id}">Lost</button>
                    <button class="g" data-chk="open" data-id="${q.id}">Open</button>
                </td>
            </tr>`;
        }).join('');

        const newSec = `<div style="border:1px solid #e6dcc3;border-radius:10px;padding:8px 10px;margin:8px 0;background:#fffaf0"><b>📞 Clients to follow up</b> <span class="mut">(${fu.length})</span>
            <div class="sc"><table class="g" style="min-width:700px"><tr><th>Client</th><th>Quotation</th><th>Next Follow Up</th><th></th></tr>${rows}</table></div>
        </div>`;

        // Replace the original basic follow-up block with our enhanced version
        const regex = /<div style="border:1px solid #e6dcc3;border-radius:10px;padding:8px 10px;margin:8px 0;background:#fffaf0"><b>📞 Clients to follow up.*?<\/table><\/div><\/div>/s;
        html = html.replace(regex, newSec);
    }
    
    return html;
};

// 3. Add the "Follow Up" button to the main Quotations list
const origVList = vList;
vList = function() {
    let html = origVList();
    Object.values(S.q).forEach(q => {
        if (q.st === 'shared') {
            const target = `<button class="g" data-a="pq" data-i="${q.id}">Preview</button>`;
            const nextTxt = q.nfu ? 'Next follow up: ' + dmy(q.nfu) : 'No follow up scheduled';
            const replacement = target + ` <button class="g" style="background:#e0f2fe;color:#0369a1;border-color:#bae6fd" data-fup="${q.id}" title="${nextTxt}">📞 Follow Up</button>`;
            
            if (html.includes(target) && !html.includes(`data-fup="${q.id}"`)) {
                html = html.replace(target, replacement);
            }
        }
    });
    return html;
};
