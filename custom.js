// ModuCraft Custom Patch File
// Paste any new features from Claude below this line.
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
navObserver.observe(document.getElementById('nav'), {childList: true, subtree: true});

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
            ${!isP ? `<button class="g" id="fup_lost" style="background:#fee2e2;color:#b91c1c;border-color:#fca5a5;margin-right:auto">Mark as Lost Lead</button>` : ''}
            <button class="g" id="fup_cancel">Cancel</button>
            <button id="fup_save" style="background:var(--gold);color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-weight:bold">Save Follow Up</button>
        </div>
    `;
    
    o.appendChild(bx);
    document.body.appendChild(o);

    document.getElementById('fup_cancel').onclick = () => o.remove();
    
    if (!isP) {
        document.getElementById('fup_lost').onclick = () => {
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
                flash('Marked as Lost Lead');
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

document.addEventListener('click', e => {
    const bFup = e.target.closest && e.target.closest('[data-fup]');
    if (bFup) { e.preventDefault(); e.stopImmediatePropagation(); openFupModal(bFup.dataset.fup, bFup.dataset.fuptype || 'q'); return; }
    
    const bLost = e.target.closest && e.target.closest('[data-lost]');
    if (bLost) {
        e.preventDefault(); e.stopImmediatePropagation();
        const id = bLost.dataset.lost, obj = S.q[id];
        if (!obj) return;
        askPick('Why was this lead lost?', [
            ['Price too high', 'Price too high'], ['Chose another designer', 'Chose another designer'],
            ['Postponed', 'Postponed / not now'], ['No response', 'No response'], ['Other', 'Other']
        ], v => { obj.out = 'lost'; obj.lr = v; save('q', id); render(); flash('Marked as Lost Lead'); }, () => {}); 
    }

    const bComp = e.target.closest && e.target.closest('[data-complete]');
    if (bComp) {
        e.preventDefault(); e.stopImmediatePropagation();
        const id = bComp.dataset.complete, p = BZ.pj[id];
        if (!p) return;
        askDo('Mark this project as COMPLETED? It will be moved to Closure and removed from follow-ups.', () => {
            p.stage = 'Closure'; bzSave('pj', id); render(); flash('Project marked as Completed');
        });
    }
}, true);

const origTodayCard = todayCard;
todayCard = function() {
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
        dueP.forEach(p => {
            r += `<tr><td><span class="mut">Project</span><br><b>${esc(p.name)}</b><td>${esc(p.client)}<td style="color:#b00020;font-weight:bold">${p.nfu ? dmy(p.nfu) : 'Overdue'}<td style="white-space:nowrap"><button class="g" data-fup="${p.id}" data-fuptype="p" style="background:#e0f2fe;color:#0369a1;border-color:#bae6fd;padding:4px 10px">📞 Follow Up</button> <button class="g" data-complete="${p.id}" style="background:#dcfce7;color:#166534;border-color:#bbf7d0;padding:4px 10px;margin-left:4px">✅ Complete</button></td></tr>`;
        });
        dueQ.forEach(q => {
            r += `<tr><td><span class="mut">Quotation</span><br><b>${esc(q.name)}</b><td>${esc(qno(q))}<td style="color:#b00020;font-weight:bold">${q.nfu ? dmy(q.nfu) : 'Overdue'}<td style="white-space:nowrap"><button class="g" data-fup="${q.id}" data-fuptype="q" style="background:#e0f2fe;color:#0369a1;border-color:#bae6fd;padding:4px 10px">📞 Follow Up</button> <button class="g" data-lost="${q.id}" style="background:#fee2e2;color:#b91c1c;border-color:#fca5a5;padding:4px 10px;margin-left:4px">❌ Lost</button></td></tr>`;
        });
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

const origVList = vList;
vList = function() {
    let html = origVList();
    Object.values(S.q).forEach(q => {
        if (q.st === 'shared' && q.out !== 'lost') {
            const target = `<button class="g" data-a="pq" data-i="${q.id}">Preview</button>`;
            const nextTxt = q.nfu ? 'Next follow up: ' + dmy(q.nfu) : 'No follow up scheduled';
            const replacement = target + ` <button class="g" style="background:#e0f2fe;color:#0369a1;border-color:#bae6fd" data-fup="${q.id}" data-fuptype="q" title="${nextTxt}">📞 Follow Up</button> <button class="g" style="background:#fee2e2;color:#b91c1c;border-color:#fca5a5" data-lost="${q.id}" title="Mark as Lost Lead">❌ Lost</button>`;
            if (html.includes(target) && !html.includes(`data-fup="${q.id}"`)) { html = html.replace(target, replacement); }
        }
    });
    return html;
};


// ==========================================
// PATCH: Append Warranty to Quotation PDF
// ==========================================
function injectWarranty() {
    const paper = document.querySelector('.paper');
    if (paper && paper.querySelector('.hero') && !paper.querySelector('#warranty-page')) {
        const tbody = paper.querySelector('table.doc > tbody > tr > td');
        if (tbody) {
            const warrantyHtml = `
            <div class="pg" id="warranty-page" style="break-before: page;">
                <h2 style="text-align:center;letter-spacing:3px">LIMITED WARRANTY & SERVICE POLICY</h2>
                <p class="nt" style="text-align:center;margin-bottom:20px"><b>Module Studio</b> | Website: www.modulestudio.in<br>Customer Care: 9830864409 (Call & WhatsApp)</p>
                <p class="nt">This document constitutes the formal warranty and service terms for the interior solutions provided by Module Studio. By accepting the quotation and engaging our services, the Customer agrees to the following terms and conditions.</p>
                <div class="sh">1. THE 10-YEAR MATERIAL GUARANTEE</div>
                <p class="nt">Module Studio maintains a strict manufacturing policy of utilizing only premium-grade, highly durable materials. We expressly do not use MDF (Medium Density Fiberboard) in our structural applications. We exclusively work with MR (Moisture Resistant) Plywood, BWR (Boiling Water Resistant) Plywood, BWP (Boiling Water Proof) Plywood, and HDHMR (High Density High Moisture Resistance) boards.</p>
                <p class="nt">Subject to the limitations set forth below, Module Studio provides a comprehensive 10-Year Warranty on the core structural materials (carcass) and shutters of the fitted furniture manufactured by us. This guarantee covers manufacturing defects, structural delamination, and edge-banding failure under standard residential use.</p>
                <div class="sh">2. THIRD-PARTY COMPONENTS (OEM WARRANTIES)</div>
                <p class="nt">The Customer acknowledges that certain components within the project are not manufactured by Module Studio but are procured from Original Equipment Manufacturers (OEMs). These items are strictly governed by the respective manufacturer’s warranty terms:</p>
                <ul class="nt" style="margin-left:20px;padding-left:0">
                    <li><b>Hardware & Accessories:</b> Hinges, channels, handles, and moving parts carry the OEM’s standard warranty.</li>
                    <li><b>Appliances & Sanitary Fixtures:</b> Chimneys, hobs, sinks, taps, etc., carry the OEM’s warranty. Any labor or cleaning charges associated with their servicing will be borne by the Customer.</li>
                    <li><b>Electricals & Lighting:</b> Switches, lights, and wiring components carry the OEM’s warranty. Module Studio is not liable for wiring defects post-handover.</li>
                    <li><b>Mirrors:</b> A 1-year warranty applies strictly to the electrical/LED components only. Module Studio provides no warranty on the mirror glass itself.</li>
                </ul>
                <div class="sh">3. ITEMS EXPRESSLY EXCLUDED (NO WARRANTY)</div>
                <ul class="nt" style="margin-left:20px;padding-left:0">
                    <li>Countertops (Material)</li><li>Civil work, Tiling, and Gas Piping</li><li>Fragile items (Mirror glass, loose glass, etc.)</li><li>Wallpapers (including base preparation and seepage-related peeling)</li><li>Home Automation systems (Smart locks, Wi-Fi cameras, etc.)</li>
                </ul>
                <div class="sh">4. LIMITATIONS OF LIABILITY & WARRANTY VOIDANCE</div>
                <ul class="nt" style="margin-left:20px;padding-left:0">
                    <li><b>Water Damage & Seepage:</b> Damage resulting from continuous dampness or structural leakage exceeding the material's tolerance (e.g., continuous exposure beyond 72 hours for BWP, 48 hours for BWR, and 24 hours for HDHMR).</li>
                    <li><b>Normal Wear & Tear:</b> Scratches, dents, chipping, or discoloration resulting from daily use.</li>
                    <li><b>Environmental Factors:</b> Fading or degradation of laminates/finishes due to excessive exposure to direct sunlight, heat, or moisture.</li>
                    <li><b>Misuse & Negligence:</b> Damage caused by accidents, improper handling, overloading of modules (e.g., tandem units, magic corners), or exposure to harsh chemical solvents (e.g., turpentine, strong cleaners).</li>
                    <li><b>Pests:</b> Damage caused by termites, wood borers, rodents, or pets.</li>
                    <li><b>Rusting:</b> Corrosion of metallic parts due to exposure to household chemicals or moisture.</li>
                    <li><b>Force Majeure:</b> Acts of God, including but not limited to floods, earthquakes, fire, pandemics, or any event beyond Module Studio's control.</li>
                    <li><b>Unauthorized Modifications:</b> Any alterations, repairs, or dismantling performed by the Customer or unauthorized third parties.</li>
                    <li><b>Transfer of Ownership:</b> If the property is sold or the products are resold.</li>
                </ul>
                <div class="sh">5. CLAIMS PROCEDURE</div>
                <ul class="nt" style="margin-left:20px;padding-left:0">
                    <li><b>How to reach us:</b> Visit www.modulestudio.in, or call/WhatsApp us at 9830864409.</li>
                    <li><b>Inspection:</b> An authorized representative will inspect the site to validate the claim.</li>
                    <li><b>Resolution:</b> If approved, Module Studio will, at its sole discretion, repair or replace the defective product. The replaced product will be covered under the original warranty period only; no new warranty shall apply.</li>
                </ul>
                <div class="sh">6. SERVICE & MAINTENANCE POLICY</div>
                <ul class="nt" style="margin-left:20px;padding-left:0">
                    <li><b>Complimentary Service:</b> Module Studio provides one (1) free service visit within 6 months of project handover.</li>
                    <li><b>Chargeable Service:</b> Post the 6-month period, any alignment or maintenance requests will be handled on a chargeable basis.</li>
                </ul>
                <div class="sh">7. GOVERNING LAW & JURISDICTION</div>
                <p class="nt">This warranty policy shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts located in the city/state where the Customer's project site is situated.</p>
                <p class="nt" style="font-style:italic;font-size:10px;margin-top:20px">(Disclaimer: Images provided in the quotation are for representational purposes only. Final products may vary slightly in texture and finish based on material batch availability and site conditions.)</p>
            </div>`;
            tbody.insertAdjacentHTML('beforeend', warrantyHtml);
            return true;
        }
    }
    return false;
}
function removeWarranty() { const wp = document.getElementById('warranty-page'); if (wp) wp.remove(); }


// ==========================================
// PATCH: Advanced Pricing Bases & Material Summary
// ==========================================
const origVEdit = vEdit;
vEdit = function() {
    let html = origVEdit();
    const q = T();
    if (!q) return html;

    const oldPmoStr = `<div><label>Pricing basis</label>${SEL('q','pmo',q.pmo||'Module rates',['Module rates','Material costing'])}</div>`;
    const newPmoStr = `<div><label>Pricing basis</label>
        <select data-d="q" data-p="pmo">
            <option value="Module rates" ${q.pmo==='Module rates'||!q.pmo?'selected':''}>Module rates (auto-calculated)</option>
            <option value="Room base" ${q.pmo==='Room base'?'selected':''}>Room base (per sq.ft)</option>
            <option value="Package" ${q.pmo==='Package'?'selected':''}>Package (flat price per room)</option>
            <option value="Material costing" ${q.pmo==='Material costing'?'selected':''}>Material costing (Internal only)</option>
        </select>
    </div>`;
    html = html.replace(oldPmoStr, newPmoStr);

    if (q.pmo === 'Package') {
        html = html.replace('<h3>Rate per sq.ft by area</h3>', '<h3>Package Price (₹) per room</h3>');
        html = html.replace(/\(standard ₹[\d,]+\)/g, '(Package Price)');
        html = html.replace(/placeholder=standard/g, 'placeholder="e.g. 150000"');
    }

    return html;
};

const origVPrev = vPrev;
vPrev = function() {
    let html = origVPrev();
    const q = T();
    if (q && q.pmo === 'Package') {
        html = html.replace(/<td class="r">₹[\d,]+<\/td>/g, '<td class="r" style="color:#777">Included</td>');
        let grand = 0;
        q.rooms.forEach((rm) => {
            if (used(rm).length) {
                const oldTotalStr = `<tr class="tot"><td colspan="5" class="r">${rm.w?'Section':'Room'} Total<td class="r">${fmt(roomT(q,rm))}</tr>`;
                const newTotalStr = `<tr class="tot"><td colspan="5" class="r">${rm.w?'Section':'Room'} Package Price<td class="r">${fmt(rm.rate || 0)}</tr>`;
                if (html.includes(oldTotalStr)) html = html.replace(oldTotalStr, newTotalStr);
                grand += (+rm.rate || 0);
            }
        });
        const oldGrandStr = `<tr class="tot gt"><td>GRAND TOTAL<td class="r">${fmt(gt(q))}</tr>`;
        const newGrandStr = `<tr class="tot gt"><td>GRAND TOTAL<td class="r">${fmt(grand)}</tr>`;
        html = html.replace(oldGrandStr, newGrandStr);
        const payHtmlOld = q.pay.map(p => `<tr><td>${esc(p.m)}<td class="r">${esc(p.p)}%<td>${esc(p.t)}<td class="r">${fmt(gt(q)*(parseFloat(p.p)||0)/100)}</tr>`).join('');
        const payHtmlNew = q.pay.map(p => `<tr><td>${esc(p.m)}<td class="r">${esc(p.p)}%<td>${esc(p.t)}<td class="r">${fmt(grand*(parseFloat(p.p)||0)/100)}</tr>`).join('');
        html = html.replace(payHtmlOld, payHtmlNew);
    }
    return html;
};

function injectMaterialSummary() {
    const paper = document.querySelector('.paper');
    if (paper && paper.querySelector('.hero') && !paper.querySelector('#material-summary')) {
        const tbody = paper.querySelector('table.doc > tbody > tr > td');
        if (tbody) {
            const q = T();
            if (!q) return false;
            let accessories = new Set();
            q.rooms.forEach(rm => { rm.rows.forEach(r => { rowAcc(r).forEach(a => { if (!HWX.test(a.n)) accessories.add(a.n); }); }); });
            const html = `
            <div class="pg" id="material-summary" style="break-before: page;">
                <h2 style="text-align:center;letter-spacing:3px">PROJECT MATERIAL &amp; HARDWARE SUMMARY</h2>
                <p class="nt" style="text-align:center;margin-bottom:20px">This summary outlines the core materials, hardware and accessories selected for this project.</p>
                <table class="t">
                    <tr><th style="width:25%">Plywood Manufacturers</th><td>${GR3.map(g => `<b>${g}:</b> ${brandFor(q, g)}`).join(' &nbsp;|&nbsp; ')}</td></tr>
                    <tr><th>Outer Finish (Shutters)</th><td>${q.fo || FIN0}</td></tr>
                    <tr><th>Inner Finish / Carcass</th><td>${q.fi || FIN0} (Carcass: BSL ${q.cf || FIN0})</td></tr>
                    <tr><th>Hardware Company</th><td>${q.hw || 'Local'}</td></tr>
                    <tr><th>Accessories Included</th><td>${Array.from(accessories).sort().join(', ') || 'Standard fittings included'}</td></tr>
                </table>
            </div>`;
            const warranty = tbody.querySelector('#warranty-page');
            if (warranty) warranty.insertAdjacentHTML('beforebegin', html);
            else tbody.insertAdjacentHTML('beforeend', html);
            return true;
        }
    }
    return false;
}
function removeMaterialSummary() { const el = document.getElementById('material-summary'); if (el) el.remove(); }


// ==========================================
// PATCH: Group Finishes by Maker in Settings
// ==========================================
const origFixSet = fixSet;
fixSet = function() {
    origFixSet();
    if (!S.set.finm) S.set.finm = ['Standard'];
};

const origVSet = vSet;
vSet = function() {
    let html = origVSet();
    
    const regex = /<div class="card"><h2>Outer \/ inner finishes.*?<button data-a="sa" data-k="fin">\+ Add row<\/button><\/div><\/div>/s;
    
    if (regex.test(html)) {
        const selM = S.set.selFinMaker || S.set.finm[0];
        let newFinHtml = `
        <div class="card" id="custom-fin-card">
            <h2>Outer / Inner Finishes (Grouped by Maker)</h2>
            <p class="mut">Select a maker to view and edit their rates. When you add a new maker, standard finishes (0.8mm/1mm Laminate, Acrylics) will be auto-generated for you.</p>
            
            <div class="bar">
                <label>Maker / Brand:</label>
                <select id="fin_maker_sel" style="max-width:250px">
                    ${S.set.finm.map(m => `<option value="${esc(m)}" ${m===selM?'selected':''}>${esc(m)}</option>`).join('')}
                </select>
                <button data-fp="add-maker" style="background:var(--gold);color:#fff;border:none;border-radius:6px;padding:6px 12px;cursor:pointer">+ Add New Maker</button>
            </div>
            
            <div class="sc">
                <table class="g" style="min-width:600px">
                    <tr><th>Finish</th><th>Client add-on ₹ per sq.ft</th><th>Our cost ₹ per sheet</th><th></th></tr>
                    ${S.set.fin.filter(f => {
                        if (f.n.includes(' — ')) {
                            return f.n.startsWith(selM + ' — ');
                        }
                        return selM === 'Standard';
                    }).map((f, i) => {
                        const actualIdx = S.set.fin.findIndex(x => x.n === f.n);
                        return `
                        <tr>
                            <td>${esc(f.n)}</td>
                            <td>${RB('s',`fin|${actualIdx}|r`,f.r||'')}</td>
                            <td>${RB('s',`fin|${actualIdx}|c`,f.c||'')}</td>
                            <td><button class="g" data-a="sd" data-k="fin" data-i="${actualIdx}">×</button></td>
                        </tr>`;
                    }).join('')}
                </table>
            </div>
            <div class="bar"><button class="g" data-fp="add-fin-row">+ Add custom row to ${esc(selM)}</button></div>
        </div>
        `;
        html = html.replace(regex, newFinHtml);
    }
    return html;
};

document.addEventListener('click', e => {
    const bMk = e.target.closest('[data-fp="add-maker"]');
    if (bMk) {
        const name = prompt("Enter the new Maker / Brand name (e.g., Merino, Century, Greenlam):");
        if (!name || !name.trim()) return;
        const cleanName = name.trim();
        
        if (!S.set.finm) S.set.finm = ['Standard'];
        if (S.set.finm.includes(cleanName)) {
            alert("This maker already exists.");
            return;
        }
        
        S.set.finm.push(cleanName);
        S.set.selFinMaker = cleanName;
        
        const stds = ['0.8mm Laminate', '1.0mm Laminate', 'Acrylic – Glossy', 'Acrylic – Matt', 'Acrylic – High gloss'];
        stds.forEach(s => {
            const fullName = cleanName + ' — ' + s;
            if (!S.set.fin.find(x => x.n === fullName)) {
                S.set.fin.push({ n: fullName, r: 0, c: 0 });
            }
        });
        
        save('s');
        render();
        flash('Maker "' + cleanName + '" added with standard finishes.');
        return;
    }

    const bRow = e.target.closest('[data-fp="add-fin-row"]');
    if (bRow) {
        const m = S.set.selFinMaker || S.set.finm[0];
        S.set.fin.push({ n: (m==='Standard'?'':m+' — '), r: 0, c: 0 });
        save('s');
        render();
    }
});

document.addEventListener('change', e => {
    if (e.target.id === 'fin_maker_sel') {
        S.set.selFinMaker = e.target.value;
        render();
    }
});


// ==========================================
// Master Interceptors for PDF & HTML Generation
// ==========================================
const origPaperToPdf_Master = paperToPdf;
paperToPdf = async function(mode) {
    const wInj = injectWarranty();
    const mInj = injectMaterialSummary();
    try {
        return await origPaperToPdf_Master.apply(this, arguments);
    } finally {
        if (wInj) removeWarranty();
        if (mInj) removeMaterialSummary();
    }
};

// Safe interception for Download File (HTML)
document.addEventListener('click', e => {
    const b = e.target.closest('[data-a="dh"]');
    if (b) {
        const paper = document.querySelector('.paper');
        if (paper && paper.querySelector('.hero')) {
            injectWarranty();
            injectMaterialSummary();
            setTimeout(() => {
                removeWarranty();
                removeMaterialSummary();
            }, 1000);
        }
    }
}, true);
