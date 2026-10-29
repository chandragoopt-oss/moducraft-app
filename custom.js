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
// PATCH: Advanced Pricing Bases & Material Summary & Discounts
// ==========================================
const origVEdit = vEdit;
vEdit = function() {
    let html = origVEdit();
    const q = T();
    if (!q) return html;
    const oldPmoStr = `<div><label>Pricing basis</label>${SEL('q','pmo',q.pmo||'Module rates',['Module rates','Material costing'])}</div>`;
    const newPmoStr = `<div><label>Pricing basis</label><select data-d="q" data-p="pmo"><option value="Module rates" ${q.pmo==='Module rates'||!q.pmo?'selected':''}>Module rates (auto-calculated)</option><option value="Room base" ${q.pmo==='Room base'?'selected':''}>Room base (per sq.ft)</option><option value="Package" ${q.pmo==='Package'?'selected':''}>Package (flat price per room)</option><option value="Material costing" ${q.pmo==='Material costing'?'selected':''}>Material costing (Internal only)</option></select></div>`;
    html = html.replace(oldPmoStr, newPmoStr);
    if (q.pmo === 'Package') {
        html = html.replace('<h3>Rate per sq.ft by area</h3>', '<h3>Package Price (₹) per room</h3>');
        html = html.replace(/\(standard ₹[\d,]+\)/g, '(Package Price)');
        html = html.replace(/placeholder=standard/g, 'placeholder="e.g. 150000"');
    }
    const oldDiscStr = `<div><label>Discount on the quotation</label><div style="display:flex;gap:6px">${SEL('q','dct',q.dct||'%',['%','₹'])}${N('q','dcv',q.dcv||0)}</div></div>`;
    const newDiscStr = `<div style="grid-column: 1 / -1; border-top: 1px dashed var(--line); margin-top: 10px; padding-top: 10px;"><label style="font-weight: bold; color: var(--gold);">Discounts by Section (%)</label><div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;"><div><label>Wooden Work %</label>${N('q','dw',q.dw||0)}</div><div><label>Hardware & Accessories %</label>${N('q','dh',q.dh||0)}</div><div><label>Site / Civil Work %</label>${N('q','ds',q.ds||0)}</div></div></div>`;
    html = html.replace(oldDiscStr, newDiscStr);
    return html;
};
function calcCatTotals(q) {
    let wood = 0, hard = 0, site = 0;
    if (q.pmo === 'Package') { q.rooms.forEach(rm => { if (used(rm).length) wood += (+rm.rate || 0); }); return { wood, hard, site }; }
    q.rooms.forEach(rm => {
        const isSiteRoom = rm.w || rm.sv || /site service|civil|paint|plumbing|electrical/i.test(rm.name);
        rm.rows.forEach(r => {
            if (!r.n) return;
            const c = rowC(q, rm, r), acc = accP(r, q);
            if (isSiteRoom || r.sv || isEl(r)) site += c.p;
            else if (HWX.test(r.n) || RKX.test(r.n) || /hardware|accessory/i.test(r.n)) hard += c.p;
            else { wood += (c.p - acc); hard += acc; }
        });
    });
    return { wood, hard, site };
}
function customDisc(q) {
    const catTotals = calcCatTotals(q);
    let d = 0;
    if (+q.dw > 0) d += catTotals.wood * q.dw / 100;
    if (+q.dh > 0) d += catTotals.hard * q.dh / 100;
    if (+q.ds > 0) d += catTotals.site * q.ds / 100;
    if (d === 0 && +q.dcv > 0) { const g = gt0(q); d = Math.min(g, q.dct == '₹' ? +q.dcv : g * (+q.dcv) / 100); }
    return d;
}
function customGt(q) { return gt0(q) - customDisc(q); }
const origVPrev = vPrev;
vPrev = function() {
    let html = origVPrev();
    const q = window.T ? window.T() : T();
    if (!q) return html;
    const catTotals = calcCatTotals(q), cDisc = customDisc(q), cGt = customGt(q);
    const dw = +q.dw || 0, dh = +q.dh || 0, ds = +q.ds || 0;
    const dW = catTotals.wood * dw / 100, dH = catTotals.hard * dh / 100, dS = catTotals.site * ds / 100;
    let discRows = '';
    if (dW > 0) discRows += `<tr><td>Discount on Wooden Work (${dw}%)<td class="r">− ${fmt(dW)}</tr>`;
    if (dH > 0) discRows += `<tr><td>Discount on Hardware & Accessories (${dh}%)<td class="r">− ${fmt(dH)}</tr>`;
    if (dS > 0) discRows += `<tr><td>Discount on Site / Civil Work (${ds}%)<td class="r">− ${fmt(dS)}</tr>`;
    if (cDisc === 0 && +q.dcv > 0) {
        const g0 = gt0(q), od = Math.min(g0, q.dct == '₹' ? +q.dcv : g0 * (+q.dcv) / 100);
        if (od > 0) discRows += `<tr><td>Discount${q.dct=='₹'?'':' ('+(+q.dcv)+'%)'}<td class="r">− ${fmt(od)}</tr>`;
    }
    let newTotTable = '';
    if (q.pmo === 'Package') {
        const grand = catTotals.wood, dW_pkg = grand * dw / 100;
        newTotTable = `<table class="t"><tr><td>Sub-total<td class="r">${fmt(grand)}</tr>${dW_pkg > 0 ? `<tr><td>Discount on Package (${dw}%)<td class="r">− ${fmt(dW_pkg)}</tr>` : ''}<tr class="tot gt"><td>GRAND TOTAL<td class="r">${fmt(grand - dW_pkg)}</tr></table>`;
        html = html.replace(/<table class="t">[\s\S]*?GRAND TOTAL[\s\S]*?<\/table>/, newTotTable);
        const payHtmlOld = q.pay.map(p => `<tr><td>${esc(p.m)}<td class="r">${esc(p.p)}%<td>${esc(p.t)}<td class="r">${fmt(gt(q)*(parseFloat(p.p)||0)/100)}</tr>`).join('');
        const payHtmlNew = q.pay.map(p => `<tr><td>${esc(p.m)}<td class="r">${esc(p.p)}%<td>${esc(p.t)}<td class="r">${fmt((grand - dW_pkg)*(parseFloat(p.p)||0)/100)}</tr>`).join('');
        if (payHtmlOld.length > 0) html = html.replace(payHtmlOld, payHtmlNew);
    } else {
        newTotTable = `<table class="t"><tr><td>Sub-total<td class="r">${fmt(gt0(q))}</tr>${discRows}<tr class="tot gt"><td>GRAND TOTAL<td class="r">${fmt(cGt)}</tr></table>`;
        html = html.replace(/<table class="t">[\s\S]*?GRAND TOTAL[\s\S]*?<\/table>/, newTotTable);
        const payHtmlOld = q.pay.map(p => `<tr><td>${esc(p.m)}<td class="r">${esc(p.p)}%<td>${esc(p.t)}<td class="r">${fmt(gt(q)*(parseFloat(p.p)||0)/100)}</tr>`).join('');
        const payHtmlNew = q.pay.map(p => `<tr><td>${esc(p.m)}<td class="r">${esc(p.p)}%<td>${esc(p.t)}<td class="r">${fmt(cGt*(parseFloat(p.p)||0)/100)}</tr>`).join('');
        if (payHtmlOld.length > 0) html = html.replace(payHtmlOld, payHtmlNew);
    }
    return html;
};
function injectMaterialSummary() {
    const paper = document.querySelector('.paper');
    if (paper && paper.querySelector('.hero') && !paper.querySelector('#material-summary')) {
        const tbody = paper.querySelector('table.doc > tbody > tr > td');
        if (tbody) {
            const q = T(); if (!q) return false;
            let accessories = new Set();
            q.rooms.forEach(rm => { rm.rows.forEach(r => { rowAcc(r).forEach(a => { if (!HWX.test(a.n)) accessories.add(a.n); }); }); });
            const html = `<div class="pg" id="material-summary" style="break-before: page;"><h2 style="text-align:center;letter-spacing:3px">PROJECT MATERIAL &amp; HARDWARE SUMMARY</h2><p class="nt" style="text-align:center;margin-bottom:20px">This summary outlines the core materials, hardware and accessories selected for this project.</p><table class="t"><tr><th style="width:25%">Plywood Manufacturers</th><td>${GR3.map(g => `<b>${g}:</b> ${brandFor(q, g)}`).join(' &nbsp;|&nbsp; ')}</td></tr><tr><th>Outer Finish (Shutters)</th><td>${q.fo || FIN0}</td></tr><tr><th>Inner Finish / Carcass</th><td>${q.fi || FIN0} (Carcass: BSL ${q.cf || FIN0})</td></tr><tr><th>Hardware Company</th><td>${q.hw || 'Local'}</td></tr><tr><th>Accessories Included</th><td>${Array.from(accessories).sort().join(', ') || 'Standard fittings included'}</td></tr></table></div>`;
            const warranty = tbody.querySelector('#warranty-page');
            if (warranty) warranty.insertAdjacentHTML('beforebegin', html); else tbody.insertAdjacentHTML('beforeend', html);
            return true;
        }
    }
    return false;
}
function removeMaterialSummary() { const el = document.getElementById('material-summary'); if (el) el.remove(); }

// ==========================================
// PATCH: Structured Finishes (Laminate, Acrylic, etc.)
// ==========================================
const origFixSet = fixSet;
fixSet = function() {
    origFixSet();
    if (!S.set.finm) S.set.finm = ['Standard', 'Merino', 'Century', 'Greenlam'];
};
const STD_FINS = ['0.8mm Matt', '0.8mm Gloss', '0.8mm High Gloss', '0.8mm Texture', '0.8mm Special', '0.8mm Stone Finish','1mm Matt', '1mm Gloss', '1mm High Gloss', '1mm Texture', '1mm Special', '1mm Stone Finish','Acrylic Matt', 'Acrylic Gloss','Membrane Matt', 'Membrane Gloss','Veneer'];
const origVSet = vSet;
vSet = function() {
    let html = origVSet();
    const regex = /<div class="card"><h2>Outer \/ inner finishes.*?<button data-a="sa" data-k="fin">\+ Add row<\/button><\/div><\/div>/s;
    if (!regex.test(html)) return html;
    const selM = S.set.selFinMaker || S.set.finm[0];
    const makerFins = S.set.fin.filter(f => { if (f.n.includes(' — ')) return f.n.startsWith(selM + ' — '); return selM === 'Standard'; });
    const puFins = S.set.fin.filter(f => !f.n.includes(' — ') && /PU|Duco|Deco/i.test(f.n));
    const renderGroup = (title, filterFn) => {
        const fins = makerFins.filter(f => filterFn(f.n));
        if (!fins.length) return '';
        return `<div class="sh" style="margin-top: 15px; background: var(--in); color: var(--ink); border: 1px solid var(--line)">${title}</div><table class="g" style="margin-bottom: 10px;"><tr><th>Finish Variant</th><th>Client add-on ₹ per sq.ft</th><th>Our cost ₹ per sheet</th><th></th></tr>${fins.map(f => { const actualIdx = S.set.fin.findIndex(x => x.n === f.n), shortName = f.n.replace(selM + ' — ', ''); return `<tr><td>${esc(shortName)}</td><td>${RB('s',`fin|${actualIdx}|r`,f.r||'')}</td><td>${RB('s',`fin|${actualIdx}|c`,f.c||'')}</td><td><button class="g" data-a="sd" data-k="fin" data-i="${actualIdx}">×</button></td></tr>`; }).join('')}</table>`;
    };
    let newFinHtml = `<div class="card" id="custom-fin-card"><h2>Finishes &amp; Acrylics (Grouped by Maker)</h2><p class="mut">Select a maker to view and edit their rates. When you add a new maker, standard finishes will be auto-generated.</p><div class="bar"><label>Maker / Brand:</label><select id="fin_maker_sel" style="max-width:250px">${S.set.finm.map(m => `<option value="${esc(m)}" ${m===selM?'selected':''}>${esc(m)}</option>`).join('')}</select><button data-fp="add-maker" style="background:var(--gold);color:#fff;border:none;border-radius:6px;padding:6px 12px;cursor:pointer">+ Add New Maker</button></div><div class="sc">${renderGroup('0.8mm Laminate', f => f.includes('0.8mm'))}${renderGroup('1mm Laminate', f => f.includes('1mm'))}${renderGroup('Acrylic', f => f.includes('Acrylic'))}${renderGroup('Membrane', f => f.includes('Membrane'))}${renderGroup('Veneer', f => f.includes('Veneer'))}${renderGroup('Other Finishes', f => !/0.8mm|1mm|Acrylic|Membrane|Veneer/.test(f))}</div><div class="bar"><button class="g" data-fp="add-fin-row">+ Add custom row to ${esc(selM)}</button></div></div><div class="card"><h2>PU / Deco Paint (No Maker Required)</h2><div class="sc"><table class="g"><tr><th>Finish</th><th>Client add-on ₹ per sq.ft</th><th>Our cost ₹ per sheet</th><th></th></tr>${puFins.map(f => { const actualIdx = S.set.fin.findIndex(x => x.n === f.n); return `<tr><td>${esc(f.n)}</td><td>${RB('s',`fin|${actualIdx}|r`,f.r||'')}</td><td>${RB('s',`fin|${actualIdx}|c`,f.c||'')}</td><td><button class="g" data-a="sd" data-k="fin" data-i="${actualIdx}">×</button></td></tr>`; }).join('')}</table></div></div>`;
    return html.replace(regex, newFinHtml);
};
document.addEventListener('click', e => {
    const bMk = e.target.closest('[data-fp="add-maker"]');
    if (bMk) {
        e.preventDefault(); e.stopImmediatePropagation();
        const name = prompt("Enter the new Maker / Brand name (e.g., Merino, Century, Greenlam):");
        if (!name || !name.trim()) return;
        const cleanName = name.trim();
        if (!S.set.finm) S.set.finm = ['Standard'];
        if (S.set.finm.includes(cleanName)) { alert("This maker already exists."); return; }
        S.set.finm.push(cleanName); S.set.selFinMaker = cleanName;
        STD_FINS.forEach(s => { const fullName = cleanName + ' — ' + s; if (!S.set.fin.find(x => x.n === fullName)) S.set.fin.push({ n: fullName, r: 0, c: 0 }); });
        save('s'); render(); flash('Maker "' + cleanName + '" added with standard finishes.'); return;
    }
    const bRow = e.target.closest('[data-fp="add-fin-row"]');
    if (bRow) {
        e.preventDefault(); e.stopImmediatePropagation();
        const m = S.set.selFinMaker || S.set.finm[0];
        S.set.fin.push({ n: (m==='Standard'?'':m+' — '), r: 0, c: 0 });
        save('s'); render();
    }
}, true);
document.addEventListener('change', e => { if (e.target.id === 'fin_maker_sel') { S.set.selFinMaker = e.target.value; render(); } });

// ==========================================
// PATCH: Master Interceptors for PDF & HTML
// ==========================================
const origPaperToPdf_Master = paperToPdf;
paperToPdf = async function(mode) {
    const wInj = injectWarranty();
    const mInj = injectMaterialSummary();
    try { return await origPaperToPdf_Master.apply(this, arguments); } 
    finally { if (wInj) removeWarranty(); if (mInj) removeMaterialSummary(); }
};
document.addEventListener('click', e => {
    const b = e.target.closest('[data-a="dh"]');
    if (b) {
        const paper = document.querySelector('.paper');
        if (paper && paper.querySelector('.hero')) {
            injectWarranty(); injectMaterialSummary();
            setTimeout(() => { removeWarranty(); removeMaterialSummary(); }, 1000);
        }
    }
}, true);

// ==========================================
// PATCH: Advanced Purchase Order, Consumables & Payments
// ==========================================
function calcConsumables(q) {
    if (!q) return [];
    const estData = est(q);
    let plyS = 0, lamS = 0;
    Object.values(estData.ply).forEach(x => plyS += x.s18 + x.s6);
    Object.values(estData.ls).forEach(x => lamS += x);
    let skirtLen = 0, moduleCount = 0;
    q.rooms.forEach(rm => rm.rows.forEach(r => {
        if (r.n) { const m = MOD[r.mk]; if (m && !m.au) moduleCount++; if (r.n.includes('PVC Skirting') && r.q) skirtLen += (+r.q || 0); }
    }));
    const cons = [];
    if (plyS > 0) {
        cons.push({ d: 'Wood Adhesive (Fevicol / equivalent)', q: Math.max(1, Math.ceil(lamS * 0.5)), u: 'kg' });
        cons.push({ d: 'Nails - Headless / Brad (Assorted)', q: Math.max(1, Math.ceil(plyS * 0.2)), u: 'kg' });
        cons.push({ d: 'Screws - Assorted (Drywall / Wood)', q: Math.max(1, Math.ceil(plyS * 0.5)), u: 'box' });
        cons.push({ d: 'L-Clamps (Corner Braces)', q: Math.max(1, Math.ceil(moduleCount / 2)), u: 'nos' });
        cons.push({ d: 'Wall PVC Sockets', q: Math.max(1, Math.ceil(moduleCount * 0.5)), u: 'nos' });
    }
    if (skirtLen > 0) cons.push({ d: 'Skirting Clips', q: Math.ceil(skirtLen * 3.33), u: 'nos' });
    return cons;
}
const origVEst = vEst;
vEst = function() {
    let html = origVEst();
    const q = T();
    if (!q) return html;
    const cons = calcConsumables(q);
    if (cons.length) {
        const tableHtml = `<div class="card" style="border-left: 4px solid var(--gold)"><h2>Site Consumables (Auto-Estimated)</h2><p class="mut">Based on the total plywood, laminate sheets, and modules in this quotation.</p><div class="sc"><table class="g" style="min-width: 400px;"><tr><th>Item</th><th class="ro">Qty</th><th>Unit</th></tr>${cons.map(c => `<tr><td>${esc(c.d)}</td><td class="ro">${c.q}</td><td>${esc(c.u)}</td></tr>`).join('')}</table></div></div>`;
        const anchor = html.indexOf('<div class="card"><h2>Our cost vs customer price</h2>');
        if (anchor !== -1) html = html.substring(0, anchor) + tableHtml + html.substring(anchor); else html += tableHtml;
    }
    return html;
};
const origPoFromEst = poFromEst;
poFromEst = function(po, src) {
    const p = BZ.pj[po.pid], q = p && S.q[p.qid];
    if (!q) { flash('Link this PO to a project that has a quotation first'); return; }
    const L = po.lines = po.lines || [], v = BZ.vd[po.vid] || {};
    const add = (d, qty, u, r) => { if(qty>0) L.push({d, q:qty, u, r:Math.round(vdRate(v,d)||r||0), g:+S.set.gst||18}); };
    if (src === 'ply') {
        Object.values(est(q).ply).forEach(x => { add('Plywood '+x.g+' ('+x.b+') 18 mm, 8×4 ft', x.s18, 'sheet', plyRate(x.b,x.g,'18mm')); add('Plywood '+x.g+' ('+x.b+') 6 mm, 8×4 ft', x.s6, 'sheet', plyRate(x.b,x.g,'6mm')); });
    } else if (src === 'lam') {
        Object.keys(est(q).ls).sort(lkSort).forEach(k => add(lamLbl(k)+', 8×4 ft', est(q).ls[k], 'sheet', finCost(k)));
    } else if (src === 'hw') {
        Object.entries(est(q).hw).sort((a,b)=>a[0].localeCompare(b[0])).forEach(([n,qty]) => add(n, qty, accU(n), hwRate(n,q.hw||'Local')));
        calcConsumables(q).forEach(c => { if(!L.some(l=>l.d===c.d)) add(c.d, c.q, c.u, 0); });
    } else if (src === 'elec') {
        q.rooms.forEach(rm => rm.rows.forEach(r => { if (r.n && isEl(r)) add(r.n, r.q || 1, r.u || 'nos', 0); }));
    } else if (src === 'site') {
        q.rooms.forEach(rm => rm.rows.forEach(r => { if (r.n && (rm.sv || rm.w || /paint|gypsum|ceiling|civil|tile|plumbing|waterproofing|putty|primer/i.test(r.n))) { if (!isEl(r) && !/granite|marble|quartz|stone|corian/i.test(r.n)) add(r.n, r.q || 1, r.u || 'nos', 0); } }));
    } else if (src === 'stone') {
        q.rooms.forEach(rm => rm.rows.forEach(r => { if (r.n && /granite|marble|quartz|stone|corian/i.test(r.n)) add(r.n, r.q || 1, r.u || 'sqft', 0); }));
    }
    bzSave('po', po.id); flash('Lines added from the estimate!');
};
const getCatName = (desc) => {
    const d = desc.toLowerCase();
    if (d.includes('plywood') || d.includes('ply') || d.includes('mdf') || d.includes('hdhmr')) return 'Plywood';
    if (d.includes('laminate') || d.includes('veneer') || d.includes('acrylic') || d.includes('membrane') || d.includes('duco') || d.includes('pu paint') || d.includes('finish')) return 'Laminate';
    if (/hinge|channel|handle|drawer|basket|rack|fitting|hardware|accessory|soft close|tandem|adhesive|fevicol|nails?|screws?|clamp|socket|clip|bracket|pin/i.test(d)) return 'Hardware';
    if (/electrical|wiring|switch|light|fan|led|mcb|wire|cable|spot/i.test(d)) return 'Electrical';
    if (/paint|gypsum|ceiling|civil|tile|plumbing|waterproofing|putty|primer/i.test(d)) return 'Site Work';
    if (/granite|marble|quartz|stone|corian|solid surface/i.test(d)) return 'Stone';
    return 'Other';
};
const origPoEdit = poEdit;
poEdit = function(o) {
    let html = origPoEdit(o);
    const oldSel = `<select id="po_src" style="max-width:260px"><option value="ply">From estimate: plywood sheets</option><option value="lam">From estimate: laminate / finish</option><option value="hw">From estimate: hardware</option><option value="stone">From estimate: counter-top stone</option></select>`;
    const newSel = `<select id="po_src" style="max-width:260px"><option value="ply">From estimate: Plywood</option><option value="lam">From estimate: Laminate / Finish</option><option value="hw">From estimate: Hardware & Consumables</option><option value="elec">From estimate: Electrical Items</option><option value="site">From estimate: Site Work (Paint/Civil/Gypsum)</option><option value="stone">From estimate: Stone / Countertop</option></select>`;
    html = html.replace(oldSel, newSel);
    const t = poTot(o);
    let paid = 0; (o.pays || []).forEach(p => paid += (+p.amt || 0));
    const bal = t.tot - paid, catTotals = {}, catPaid = {};
    (o.lines||[]).forEach(l => { if(!l.d) return; const c = getCatName(l.d); catTotals[c] = (catTotals[c]||0) + (l.q||0) * (l.r||0) * (1 + (l.g||0)/100); });
    (o.pays||[]).forEach(p => { const c = p.cat || 'General'; catPaid[c] = (catPaid[c]||0) + (+p.amt||0); });
    let summaryRows = '';
    Object.keys(catTotals).forEach(c => {
        if(catTotals[c] > 0.01) { const cp = catPaid[c] || 0; summaryRows += `<tr><td>${c}</td><td class="ro">${fmt(catTotals[c])}</td><td class="ro" style="color:#15803d">${fmt(cp)}</td><td class="ro" style="color:#b00020">${fmt(catTotals[c] - cp)}</td></tr>`; delete catPaid[c]; }
    });
    Object.keys(catPaid).forEach(c => { if(catPaid[c] > 0.01) summaryRows += `<tr><td>${c}</td><td class="ro">-</td><td class="ro" style="color:#15803d">${fmt(catPaid[c])}</td><td class="ro">-</td></tr>`; });
    const CATE_OPTS = ['General', 'Plywood', 'Laminate', 'Hardware', 'Electrical', 'Site Work', 'Stone', 'Other'];
    const payHtml = `<div class="card"><h3>Payment Tracking (Internal)</h3><div class="dgrid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); margin-bottom: 15px; background: var(--in); padding: 10px; border-radius: 8px;"><div><span class="mut">Total PO Value</span><br><b>${fmt(t.tot)}</b></div><div><span class="mut">Total Paid</span><br><b style="color:#15803d">${fmt(paid)}</b></div><div><span class="mut">Remaining Balance</span><br><b style="color:#b00020">${fmt(bal)}</b></div></div><div class="sc"><table class="g" style="margin-bottom: 15px;"><tr><th>Category Breakdown</th><th class="ro">Total in PO</th><th class="ro">Paid</th><th class="ro">Balance</th></tr>${summaryRows || '<tr><td colspan="4" class="mut">No items in PO.</td></tr>'}</table></div><h4 style="margin-top: 15px;">Payment History</h4><div class="sc"><table class="g" style="min-width:600px"><tr><th>Date</th><th>Amount (₹)</th><th>Category</th><th>Mode</th><th>Ref</th><th>Next Due</th><th></th></tr>${(o.pays||[]).map((p, i) => `<tr><td>${bdt('po', o.id, 'pays.'+i+'.date', p.date)}</td><td>${bn('po', o.id, 'pays.'+i+'.amt', p.amt, 'style="width:100px"')}</td><td>${bs('po', o.id, 'pays.'+i+'.cat', p.cat || 'General', CATE_OPTS)}</td><td>${bs('po', o.id, 'pays.'+i+'.mode', p.mode, ['UPI', 'Bank transfer', 'Cheque', 'Cash'])}</td><td>${bi('po', o.id, 'pays.'+i+'.ref', p.ref, 'style="width:80px"')}</td><td>${bdt('po', o.id, 'pays.'+i+'.next', p.next)}</td><td>${ba('paydelpo', '❌', 'data-i="'+i+'"')}</td></tr>`).join('') || '<tr><td colspan="7" class="mut">No payments recorded yet.</td></tr>'}</table></div><div class="bar noprint">${ba('payaddpo', '+ Record Payment')}</div></div>`;
    const anchor = '<div class="bar noprint"><button data-a="poprint"';
    if (html.includes(anchor)) html = html.replace(anchor, payHtml + anchor); else html += payHtml;
    return html;
};
const origPoDoc_Adv = poDoc;
poDoc = function(o) {
    const v = BZ.vd[o.vid] || {}, p = BZ.pj[o.pid] || {}, q = S.q[p.qid];
    const groups = { ply: [], lam: [], hw: [], elec: [], site: [], stone: [], other: [] };
    (o.lines||[]).forEach(l => { if (l.d) { const c = getCatName(l.d), key = c === 'Plywood' ? 'ply' : c === 'Laminate' ? 'lam' : c === 'Hardware' ? 'hw' : c === 'Electrical' ? 'elec' : c === 'Site Work' ? 'site' : c === 'Stone' ? 'stone' : 'other'; groups[key].push(l); } });
    const fmtQty = (qty) => { const n = +qty || 0, frac = n - Math.floor(n); return frac > 0.1 ? Math.ceil(n) : Math.floor(n); };
    const T1 = (h, rows) => `<table class="t"><tr>${h.map(x=>`<th>${x}</th>`).join('')}</tr>${rows.map(r=>`<tr>${r.map(x=>`<td>${x}</td>`).join('')}</tr>`).join('')}</table>`;
    let html = `<div class="pg"><div class="kv"><div><b>VENDOR DETAILS</b><br>${esc(v.name||'')}<br>${esc(v.addr||'')}<br>${v.person?esc(v.person)+'<br>':''}${esc(v.phone||'')}</div><div><b>DELIVER TO</b><br>${esc(p.name||'')}<br>${esc(p.addr||'')}</div></div><div class="sh">PURCHASE ORDER SUMMARY</div>${o.lines.length ? `<table class="t"><tr><th>#</th><th>Description</th><th>Qty</th><th>Unit</th></tr>${o.lines.map((l,i)=>`<tr><td>${i+1}</td><td>${esc(l.d)}</td><td>${fmtQty(l.q)}</td><td>${esc(l.u)}</td></tr>`).join('')}</table>` : '<p class="nt">No items added.</p>'}${o.note?`<div class="sh">TERMS &amp; NOTES</div><p style="font-size:12px">${esc(o.note)}</p>`:''}<div style="margin-top:40px;display:flex;justify-content:space-between;font-size:12px"><span>Vendor acknowledgement</span><span>For ${esc(co().name)}<br><br>Authorised signatory</span></div></div>`;
    if (groups.ply.length) html += `<div class="pg" style="break-before: page;"><h2 style="text-align:center;letter-spacing:3px">PLYWOOD</h2>${T1(['Description', 'Qty', 'Unit'], groups.ply.map(l => [esc(l.d), fmtQty(l.q), esc(l.u)]))}</div>`;
    if (groups.lam.length) html += `<div class="pg" style="break-before: page;"><h2 style="text-align:center;letter-spacing:3px">LAMINATE & FINISH</h2>${T1(['Description', 'Qty', 'Unit'], groups.lam.map(l => [esc(l.d), fmtQty(l.q), esc(l.u)]))}</div>`;
    if (groups.hw.length) html += `<div class="pg" style="break-before: page;"><h2 style="text-align:center;letter-spacing:3px">HARDWARE & CONSUMABLES</h2>${T1(['Description', 'Qty', 'Unit'], groups.hw.map(l => [esc(l.d), fmtQty(l.q), esc(l.u)]))}</div>`;
    if (groups.elec.length) html += `<div class="pg" style="break-before: page;"><h2 style="text-align:center;letter-spacing:3px">ELECTRICAL ITEMS</h2>${T1(['Description', 'Qty', 'Unit'], groups.elec.map(l => [esc(l.d), fmtQty(l.q), esc(l.u)]))}</div>`;
    if (groups.site.length) html += `<div class="pg" style="break-before: page;"><h2 style="text-align:center;letter-spacing:3px">SITE WORK DETAILS</h2>${T1(['Description', 'Qty', 'Unit'], groups.site.map(l => [esc(l.d), fmtQty(l.q), esc(l.u)]))}</div>`;
    if (groups.stone.length) html += `<div class="pg" style="break-before: page;"><h2 style="text-align:center;letter-spacing:3px">STONE & COUNTERTOPS</h2>${T1(['Description', 'Qty', 'Unit'], groups.stone.map(l => [esc(l.d), fmtQty(l.q), esc(l.u)]))}</div>`;
    if (groups.other.length) html += `<div class="pg" style="break-before: page;"><h2 style="text-align:center;letter-spacing:3px">OTHER ITEMS</h2>${T1(['Description', 'Qty', 'Unit'], groups.other.map(l => [esc(l.d), fmtQty(l.q), esc(l.u)]))}</div>`;
    const metaHtml = `<b>PO: ${esc(o.no)}</b> | Date: <b>${dmy(o.date)}</b><br>Vendor: <b>${esc(v.name||'—')}</b><br>Project: ${esc(p.name||'—')} | Address: ${esc(p.addr||'—')}<br>Delivery Req.: <b style="color:#b00020">${dmy(o.del)}</b><br>Ref: ${q ? esc(qno(q)) : 'N/A'}`;
    return `<div class="bar noprint"><button data-a="dpdf" data-acc="1" data-fn="${esc(o.no)}.pdf">Download PDF</button><button class="g" data-a="ap">Print</button><button class="g" data-bza="docback">← Back</button></div>` + docPaper('PURCHASE ORDER', metaHtml, html);
};
document.addEventListener('click', e => {
    const bAdd = e.target.closest('[data-bza="payaddpo"]');
    if (bAdd) { e.preventDefault(); e.stopImmediatePropagation(); const O = BZ.po[S.po]; if (!O) return; O.pays = O.pays || []; O.pays.push({ date: today(), amt: 0, cat: 'General', mode: 'UPI', ref: '', next: '' }); bzSave('po', O.id); render(); return; }
    const bDel = e.target.closest('[data-bza="paydelpo"]');
    if (bDel) { e.preventDefault(); e.stopImmediatePropagation(); const O = BZ.po[S.po]; if (!O) return; O.pays.splice(+bDel.dataset.i, 1); bzSave('po', O.id); render(); return; }
}, true);
document.addEventListener('change', e => {
    const t = e.target;
    if (t.dataset.bz && t.dataset.bz.startsWith('po|') && t.dataset.bz.includes('|pays.')) {
        if (t.dataset.bz.includes('.amt') || t.dataset.bz.includes('.next') || t.dataset.bz.includes('.date') || t.dataset.bz.includes('.cat')) setTimeout(render, 100);
    }
});

// ==========================================
// STEP 1: GUIDED RATE SETUP
// ==========================================
(function(){
  'use strict';
  if (window.__mcSetupLoaded) return;
  window.__mcSetupLoaded = true;
  function setupStatus() {
    const s = (typeof S !== 'undefined' && S.set) || {}, co = s.co || {}, checks = [];
    const coMissing = ['name','addr','phone','mail'].filter(k => !String(co[k]||'').trim());
    checks.push({ id: 'co', label: 'Company details', status: coMissing.length === 0 ? 'ok' : 'missing', detail: coMissing.length === 0 ? 'Name, address, phone, email set' : 'Missing: ' + coMissing.join(', '), action: 'co' });
    const plr = (s.plr || []).filter(p => p.b && p.g && p.t), plrPriced = plr.filter(p => +(p.r) > 0);
    checks.push({ id: 'plr', label: 'Plywood sheet rates', status: plrPriced.length === 0 ? 'missing' : plrPriced.length === plr.length ? 'ok' : 'partial', detail: plrPriced.length === 0 ? 'No plywood sheet has a rate' : plrPriced.length + ' of ' + plr.length + ' sheets priced', action: 'plr' });
    const fin = s.fin || [], finPriced = fin.filter(f => +(f.c) > 0);
    checks.push({ id: 'fin', label: 'Laminate / finish sheet costs', status: finPriced.length === 0 ? 'missing' : finPriced.length === fin.length ? 'ok' : 'partial', detail: finPriced.length === 0 ? 'No finish has a cost' : finPriced.length + ' of ' + fin.length + ' finishes priced', action: 'fin' });
    const acc = s.acc || [], accPriced = acc.filter(a => +(a.rh)>0 || +(a.re)>0 || +(a.rl)>0);
    checks.push({ id: 'acc', label: 'Hardware / accessory costs', status: accPriced.length === 0 ? 'missing' : accPriced.length === acc.length ? 'ok' : 'partial', detail: accPriced.length === 0 ? 'No accessory has a brand cost' : accPriced.length + ' of ' + acc.length + ' accessories priced', action: 'acc' });
    const lab = +(s.lab) || 0;
    checks.push({ id: 'lab', label: 'Labour & fabrication cost', status: lab > 0 ? 'ok' : 'missing', detail: lab > 0 ? '₹' + lab + ' per sq.ft' : 'Not set — cost is under-estimated', action: 'lab' });
    const mgn = +(s.mgn) || 0;
    checks.push({ id: 'mgn', label: 'Profit margin', status: mgn > 0 ? 'ok' : 'partial', detail: mgn > 0 ? mgn + '%' : 'Using default 35%', action: 'mgn' });
    const gst = +(s.gst) || 0;
    checks.push({ id: 'gst', label: 'GST percentage', status: gst > 0 ? 'ok' : 'missing', detail: gst > 0 ? gst + '%' : 'Not set', action: 'gst' });
    const rooms = (s.rooms || []).filter(r => !r.w), rmsPriced = rooms.filter(r => +(r.r) > 0);
    checks.push({ id: 'rooms', label: 'Room type rates', status: rmsPriced.length === 0 ? 'missing' : rmsPriced.length === rooms.length ? 'ok' : 'partial', detail: rmsPriced.length === 0 ? 'No room has a rate' : rmsPriced.length + ' of ' + rooms.length + ' room types priced', action: 'rooms' });
    return checks;
  }
  const statusIcon = s => s === 'ok' ? '✅' : s === 'partial' ? '⚠️' : '❌';
  const statusColor = s => s === 'ok' ? '#22C55E' : s === 'partial' ? '#F59E0B' : '#EF4444';
  function setupCard() {
    const checks = setupStatus(), ok = checks.filter(c => c.status === 'ok').length, partial = checks.filter(c => c.status === 'partial').length, missing = checks.filter(c => c.status === 'missing').length, total = checks.length, pct = Math.round(ok / total * 100), barColor = missing > 0 ? '#EF4444' : partial > 0 ? '#F59E0B' : '#22C55E';
    let summary = (missing === 0 && partial === 0) ? '<span style="color:#22C55E;font-weight:600">✅ All set</span>' : missing === 0 ? '<span style="color:#F59E0B;font-weight:600">⚠️ Nothing critical missing.</span>' : '<span style="color:#EF4444;font-weight:600">❌ ' + missing + ' critical item(s) missing</span>';
    return '<div class="card" id="setup-card"><h2>Setup checklist</h2><p class="mut" style="margin:4px 0">Before sending quotations, make sure your rates are set up.</p><div style="background:rgba(128,128,128,0.2);border-radius:8px;height:14px;margin:8px 0 4px;overflow:hidden"><div style="background:' + barColor + ';height:14px;width:' + pct + '%;transition:width .3s"></div></div><p style="font-size:13px;margin:0 0 4px"><b>' + ok + '/' + total + '</b> complete</p><p style="font-size:13px;margin:0 0 12px">' + summary + '</p><div class="sc"><table class="g" style="min-width:640px"><tr><th style="width:50px">Status</th><th>Item</th><th>Detail</th><th style="width:90px"></th></tr>' + checks.map(c => { const clr = statusColor(c.status); return '<tr><td style="text-align:center;font-size:18px">' + statusIcon(c.status) + '</td><td><b>' + esc(c.label) + '</b></td><td style="color:' + clr + ';font-weight:600;font-size:12px">' + esc(c.detail) + '</td><td>' + (c.status === 'ok' ? '<span style="color:#22C55E;font-size:18px">✓</span>' : '<button data-setup-go="' + c.action + '" style="background:' + clr + ';color:#fff;border:0;border-radius:6px;padding:5px 10px;font-weight:600;cursor:pointer">Fix →</button>') + '</td></tr>'; }).join('') + '</table></div></div>';
  }
  if (typeof vSet === 'function') { const _vSet = vSet; window.vSet = vSet = function() { return setupCard() + _vSet(); }; }
  if (typeof todayCard === 'function') {
    const _todayCard = todayCard;
    window.todayCard = todayCard = function() {
      const existing = _todayCard(), critical = setupStatus().filter(c => c.status === 'missing');
      if (critical.length === 0) return existing;
      const names = critical.map(c => c.label).join(', ');
      return '<div class="card" style="border-left:6px solid #EF4444;background:rgba(239,68,68,0.12)"><b style="color:#EF4444">⚙️ Setup not complete — ' + critical.length + ' critical item(s) need attention</b><p class="mut" style="margin:4px 0 8px;font-size:13px">Quotations may calculate incorrectly until setup is complete: ' + esc(names) + '.</p><button data-setup-tab style="background:#EF4444;color:#fff;border:0;border-radius:6px;padding:6px 12px;font-weight:600;cursor:pointer">Open setup checklist →</button></div>' + existing;
    };
  }
  document.addEventListener('click', function(e){
    const fix = e.target.closest('[data-setup-go]');
    if (fix) {
      e.preventDefault();
      const map = { co: 'input[data-p="co|name"]', plr: 'input[data-p^="plr|"][data-p$="|r"]', fin: 'input[data-p^="fin|"][data-p$="|c"]', acc: 'input[data-p^="acc|"][data-p$="|rh"]', lab: 'input[data-p="lab"]', mgn: 'input[data-p="mgn"]', gst: 'input[data-p="gst"]', rooms: 'input[data-p^="rooms|"][data-p$="|r"]' };
      const el = document.querySelector(map[fix.dataset.setupGo] || 'body');
      if (el) {
        const parentCard = el.closest('.card');
        if (parentCard && parentCard.classList.contains('cxc')) { parentCard.classList.remove('cxc'); const k = parentCard.dataset.cxk; if (k) { try { const st = JSON.parse(localStorage.getItem('msq_cl') || '{}'); st[k] = 0; localStorage.setItem('msq_cl', JSON.stringify(st)); } catch(x) {} } }
        const details = el.closest('details'); if (details) details.open = true;
        setTimeout(function() {
          const rect = el.getBoundingClientRect(), scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          try { window.scrollTo({ top: rect.top + scrollTop - 150, behavior: 'smooth' }); } catch(x) { el.scrollIntoView(); }
          const prevBg = el.style.backgroundColor, prevShadow = el.style.boxShadow;
          el.style.backgroundColor = 'rgba(245, 158, 11, 0.4)'; el.style.boxShadow = '0 0 0 4px rgba(245, 158, 11, 0.8)'; el.style.transition = 'background-color 0.2s, box-shadow 0.2s';
          setTimeout(function() { try { el.focus(); } catch(x) {} setTimeout(function() { el.style.backgroundColor = prevBg; el.style.boxShadow = prevShadow; setTimeout(() => { el.style.transition = ''; }, 200); }, 2000); }, 500);
        }, 50);
      }
      return;
    }
    const tab = e.target.closest('[data-setup-tab]');
    if (tab) { e.preventDefault(); S.tab = 's'; render(); }
  }, true);
  if ((S.tab === 's' || S.tab === 'h') && typeof render === 'function') setTimeout(function(){ try { render(); } catch(x){} }, 200);
})();

// ==========================================
// STEP 2: GST / NON-GST INVOICE
// ==========================================
(function(){
  'use strict';
  if (window.__mcInvoiceLoaded_v2) return;
  window.__mcInvoiceLoaded_v2 = true;
  function ensureSettings() { if (!S || !S.set) return; if (!S.set.invPrefix) S.set.invPrefix = 'INV'; if (!S.set.sac) S.set.sac = '9954'; if (!S.set.co) S.set.co = {}; if (!S.set.co.state) S.set.co.state = 'West Bengal'; if (!S.set.co.gstin) S.set.co.gstin = ''; if (!S.set.gst) S.set.gst = 18; }
  function amtWords(n) {
    n = Math.round(Math.abs(+n || 0)); if (n === 0) return 'Zero Rupees Only';
    const a = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'], t = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
    const two = x => x < 20 ? a[x] : t[Math.floor(x/10)] + (x%10 ? ' ' + a[x%10] : ''), three = x => (x >= 100 ? a[Math.floor(x/100)] + ' Hundred' + (x%100 ? ' and ' : '') : '') + (x%100 ? two(x%100) : '');
    let r = ''; const cr = Math.floor(n / 1e7); n %= 1e7; const lk = Math.floor(n / 1e5); n %= 1e5; const th = Math.floor(n / 1e3); n %= 1e3;
    if (cr) r += three(cr) + ' Crore '; if (lk) r += two(lk) + ' Lakh '; if (th) r += two(th) + ' Thousand '; if (n) r += three(n);
    return 'Rupees ' + r.trim() + ' Only';
  }
  function nextInvoiceNo() {
    const d = new Date(), fyStart = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1, fy = String(fyStart).slice(-2) + String(fyStart + 1).slice(-2), prefix = (S.set.invPrefix || 'INV') + '-' + fy + '-';
    let maxN = 0;
    try { Object.values(BZ.pj || {}).forEach(p => { (p.inv || []).forEach(inv => { if (inv.no && String(inv.no).indexOf(prefix) === 0) { const n = parseInt(String(inv.no).slice(prefix.length), 10); if (!isNaN(n) && n > maxN) maxN = n; } }); }); } catch(e) {}
    return prefix + String(maxN + 1).padStart(4, '0');
  }
  function computeInv(inv) {
    const amt = +inv.amount || 0, r = n => Math.round(n * 100) / 100;
    if (inv.gst === false) return { taxable: r(amt), cgst: 0, sgst: 0, igst: 0, totalTax: 0, total: r(amt) };
    const rate = +inv.gstRate || 18, intra = inv.intraState !== false;
    let taxable, cgst, sgst, igst, total;
    if (inv.mode === 'total') { total = amt; taxable = amt / (1 + rate/100); } else { taxable = amt; total = amt * (1 + rate/100); }
    if (intra) { cgst = taxable * rate / 200; sgst = taxable * rate / 200; igst = 0; } else { cgst = 0; sgst = 0; igst = taxable * rate / 100; }
    return { taxable: r(taxable), cgst: r(cgst), sgst: r(sgst), igst: r(igst), totalTax: r(cgst+sgst+igst), total: r(total) };
  }
  function invTab(p) {
    ensureSettings();
    const invs = (p.inv || []).slice(), active = invs.filter(i => i.status !== 'Cancelled'), totalTaxable = active.reduce((a, i) => a + computeInv(i).taxable, 0), totalGst = active.reduce((a, i) => a + computeInv(i).totalTax, 0), total = active.reduce((a, i) => a + computeInv(i).total, 0), contract = +p.val || 0, balanceToInvoice = Math.max(0, contract - totalTaxable), hasAnyGst = invs.some(i => i.gst !== false && i.status !== 'Cancelled');
    const rows = invs.map((inv, i) => {
      const c = computeInv(inv), off = inv.status === 'Cancelled', isGst = inv.gst !== false, badge = '<span style="font-size:10px;padding:1px 6px;border-radius:4px;background:' + (isGst ? 'rgba(31,78,121,.15)' : 'rgba(128,128,128,.2)') + ';color:inherit;font-weight:600">' + (isGst ? 'GST' : 'NON-GST') + '</span>';
      return '<tr style="' + (off ? 'opacity:.5;text-decoration:line-through' : '') + '"><td><b>' + esc(inv.no || '—') + '</b> ' + badge + (off ? ' <span style="color:#EF4444">cancelled</span>' : '') + '</td><td>' + (inv.date ? dmy(inv.date) : '—') + '</td><td>' + esc(inv.milestone || inv.description || '—') + '</td><td class="ro">' + fmt(c.taxable) + '</td><td class="ro">' + (isGst ? fmt(c.totalTax) : '—') + '</td><td class="ro"><b>' + fmt(c.total) + '</b></td><td>' + (off ? '<span style="color:#EF4444">Cancelled</span>' : '<span style="color:#22C55E">' + esc(inv.status || 'Issued') + '</span>') + '</td><td style="white-space:nowrap"><button class="g" data-inv-act="view" data-i="' + i + '">View</button> ' + (off ? '' : '<button class="g" data-inv-act="cancel" data-i="' + i + '">Cancel</button>') + '</td></tr>';
    }).join('');
    const tile = (l, v, sub, col) => '<div style="padding:8px;background:' + (col || 'rgba(31,78,121,0.08)') + ';border-radius:8px"><div class="mut" style="font-size:11px">' + l + '</div><div style="font-size:18px;font-weight:bold;color:#1F4E79">' + v + '</div><div class="mut" style="font-size:11px">' + sub + '</div></div>';
    let tiles = tile('Contract value', fmt(contract), 'pre-GST') + tile('Invoiced (taxable)', fmt(totalTaxable), (contract > 0 ? Math.round(totalTaxable / contract * 100) : 0) + '% of contract');
    if (hasAnyGst || totalGst > 0) tiles += tile('GST invoiced', fmt(totalGst), 'CGST+SGST+IGST');
    tiles += tile('Total invoiced', fmt(total), hasAnyGst ? 'incl. GST' : 'no tax', 'rgba(34,197,94,0.12)') + tile('Balance to invoice', fmt(balanceToInvoice), 'taxable', balanceToInvoice > 0 ? 'rgba(245,158,11,0.12)' : 'rgba(34,197,94,0.12)');
    return '<div class="card"><h3>Invoices</h3><p class="mut" style="margin:4px 0">Choose GST Invoice for a GST-registered business, or Non-GST for a plain invoice.</p><div class="dgrid" style="grid-template-columns:repeat(auto-fit,minmax(160px,1fr));margin:10px 0">' + tiles + '</div><div class="bar noprint" style="margin-top:12px"><button data-inv-act="create" style="background:#1F4E79;color:#fff;border:0;border-radius:6px;padding:8px 16px;font-weight:600;cursor:pointer">+ Create Invoice</button></div>' + (invs.length ? '<div class="sc" style="margin-top:10px"><table class="g" style="min-width:820px"><tr><th>Invoice No.</th><th>Date</th><th>Description</th><th class="ro">Taxable</th><th class="ro">GST</th><th class="ro">Total</th><th>Status</th><th></th></tr>' + rows + '</table></div>' : '<p class="mut" style="margin-top:12px">No invoices yet.</p>') + '</div>';
  }
  function invCreateDialog(p) {
    ensureSettings();
    const c = co(), q = S.q[p.qid], invs = (p.inv || []).filter(i => i.status !== 'Cancelled'), alreadyInvoiced = invs.reduce((a, i) => a + computeInv(i).taxable, 0), contract = +p.val || 0, remaining = Math.max(0, contract - alreadyInvoiced), hasGstin = !!(c.gstin && String(c.gstin).trim()), defaultType = hasGstin ? 'gst' : 'nongst';
    const payOpts = (p.pays || []).map((x, i) => '<option value="' + i + '">' + esc(x.n) + ' — ' + esc(x.p || 0) + '% → ' + fmt(x.amt) + '</option>').join(''), defaultDesc = 'Interior design & turnkey execution services' + (q ? ' as per quotation ' + qno(q) : '') + ' — ' + (p.name || 'project');
    const body = '<div style="grid-column:1/-1"><label>Invoice type</label><select id="inv_type"><option value="gst"' + (defaultType==='gst'?' selected':'') + '>GST Invoice — with tax breakdown</option><option value="nongst"' + (defaultType==='nongst'?' selected':'') + '>Non-GST Invoice — plain, no tax</option></select><small id="inv_type_hint" style="display:block;margin-top:4px"></small></div><div><label>Invoice date</label><input type="date" id="inv_date" value="' + new Date().toISOString().slice(0, 10) + '"></div><div><label>Against milestone (optional)</label><select id="inv_ms"><option value="">— None —</option>' + payOpts + '</select></div><div style="grid-column:1/-1"><label>Description of service</label><input id="inv_desc" value="' + esc(defaultDesc) + '"></div><div id="inv_gst_fields" style="display:contents"><div><label>Mode</label><select id="inv_mode"><option value="taxable">Amount is TAXABLE value</option><option value="total">Amount is TOTAL incl. GST</option></select></div><div><label>GST rate (%)</label><input type="number" id="inv_rate" min="0" max="28" value="' + (S.set.gst || 18) + '"></div><div><label>Place of supply</label><input id="inv_pos" value="' + esc(p.placeOfSupply || c.state || 'West Bengal') + '"></div><div><label>Tax type</label><select id="inv_intra"><option value="1">Intra-state (CGST + SGST)</option><option value="0">Inter-state (IGST)</option></select></div><div><label>SAC code</label><input id="inv_sac" value="' + esc(S.set.sac || '9954') + '"></div><div><label>Client GSTIN (optional)</label><input id="inv_cgstin" value="' + esc(p.clientGstin || '') + '" placeholder="15-character GSTIN" maxlength="15" style="text-transform:uppercase"></div></div><div><label>Amount (₹)</label><input type="number" id="inv_amt" min="0" step="0.01" value="' + remaining + '"></div><div style="grid-column:1/-1"><label>Notes (optional)</label><textarea id="inv_notes" rows="2"></textarea></div><div style="grid-column:1/-1;padding:10px;background:rgba(31,78,121,0.06);border-radius:8px;margin-top:6px"><b>Preview:</b> <span id="inv_preview" class="mut">Enter amount</span></div>';
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:flex-start;justify-content:center;z-index:100001;padding:20px;overflow-y:auto';
    modal.innerHTML = '<div style="background:var(--card,#fff);color:var(--ink,#222);border-radius:12px;padding:20px;max-width:720px;width:100%;box-shadow:0 10px 40px rgba(0,0,0,.4);margin:auto"><h3 style="margin-top:0">Create Invoice</h3><p class="mut" style="margin:4px 0 14px;font-size:13px">Invoice No. will be: <b>' + nextInvoiceNo() + '</b></p><div class="dgrid" style="grid-template-columns:1fr 1fr;gap:10px">' + body + '</div><div class="bar" style="margin-top:14px;justify-content:flex-end"><button class="g" id="inv_cancel">Cancel</button><button id="inv_save" style="background:#1F4E79;color:#fff;border:0;border-radius:6px;padding:8px 20px;font-weight:600;cursor:pointer">Create Invoice</button></div></div>';
    document.body.appendChild(modal);
    const $ = id => document.getElementById(id);
    const updateTypeVisibility = () => { const isGst = $('inv_type').value === 'gst'; document.getElementById('inv_gst_fields').style.display = isGst ? 'contents' : 'none'; const hint = $('inv_type_hint'); if (isGst && !hasGstin) hint.innerHTML = '<span style="color:#EF4444">⚠ GSTIN not set. Non-compliant.</span>'; else if (!isGst) hint.innerHTML = '<span class="mut">No tax, plain invoice.</span>'; else hint.innerHTML = '<span class="mut">GST invoice.</span>'; };
    const updatePreview = () => {
      const amt = +$('inv_amt').value || 0, isGst = $('inv_type').value === 'gst';
      if (!amt) { $('inv_preview').textContent = 'Enter amount'; return; }
      if (!isGst) { $('inv_preview').innerHTML = 'Amount: <b>' + fmt(amt) + '</b>'; return; }
      const rate = +$('inv_rate').value || 0, intra = $('inv_intra').value === '1', mode = $('inv_mode').value, comp = computeInv({ amount: amt, gstRate: rate, intraState: intra, mode: mode, gst: true });
      let html = 'Taxable: <b>' + fmt(comp.taxable) + '</b>';
      if (intra) html += ' · CGST @ ' + (rate/2) + '%: ' + fmt(comp.cgst) + ' · SGST @ ' + (rate/2) + '%: ' + fmt(comp.sgst); else html += ' · IGST @ ' + rate + '%: ' + fmt(comp.igst);
      $('inv_preview').innerHTML = html + ' · <b>Total: ' + fmt(comp.total) + '</b>';
    };
    ['inv_amt','inv_rate','inv_intra','inv_mode','inv_type'].forEach(id => $(id).addEventListener('input', updatePreview));
    ['inv_mode','inv_type'].forEach(id => $(id).addEventListener('change', updatePreview));
    $('inv_type').addEventListener('change', updateTypeVisibility);
    $('inv_ms').addEventListener('change', () => { if ($('inv_ms').value !== '') { const x = p.pays[+$('inv_ms').value]; if (x) $('inv_amt').value = x.amt || 0; } updatePreview(); });
    updateTypeVisibility(); updatePreview();
    $('inv_cancel').onclick = () => modal.remove();
    $('inv_save').onclick = () => {
      const amount = +$('inv_amt').value || 0; if (amount <= 0) return alert('Enter an amount > 0');
      const isGst = $('inv_type').value === 'gst'; if (isGst && !hasGstin && !confirm('GSTIN blank. Proceed anyway?')) return;
      const inv = { id: 'inv' + Date.now().toString(36), no: nextInvoiceNo(), date: $('inv_date').value || new Date().toISOString().slice(0, 10), amount: amount, gst: isGst, gstRate: isGst ? (+$('inv_rate').value || 18) : 0, intraState: isGst ? ($('inv_intra').value === '1') : true, mode: isGst ? $('inv_mode').value : 'taxable', description: $('inv_desc').value.trim(), sac: isGst ? ($('inv_sac').value.trim() || '9954') : '', milestone: $('inv_ms').value !== '' ? (p.pays[+$('inv_ms').value] || {}).n || '' : '', placeOfSupply: isGst ? $('inv_pos').value.trim() : '', clientGstin: isGst ? $('inv_cgstin').value.trim() : '', status: 'Issued', notes: $('inv_notes').value.trim(), created: Date.now() };
      p.inv = p.inv || []; p.inv.push(inv); try { bzSave('pj', p.id); } catch(e) {}
      try { audEvt('pj', p.id, p.name, 'Invoice issued', inv.no); } catch(e) {}
      S.bzdoc = { t: 'inv', id: p.id, i: p.inv.length - 1 }; modal.remove(); render();
    };
  }
  function invDoc(p, inv) {
    if (!inv) return '<div class="card"><p>Invoice not found.</p><button class="g" data-bza="docback">← Back</button></div>';
    ensureSettings();
    const c = co(), comp = computeInv(inv), q = S.q[p.qid], isGst = inv.gst !== false, gstRate = +inv.gstRate || 18, half = gstRate / 2, off = inv.status === 'Cancelled';
    const recipient = '<b>' + esc(p.client || 'Client') + '</b><br>' + esc(p.addr || '') + '<br>' + (p.phone ? 'Phone: ' + esc(p.phone) + '<br>' : '') + (isGst && inv.clientGstin ? 'GSTIN: <b>' + esc(inv.clientGstin) + '</b>' : '');
    const rowDesc = inv.description || ('Interior design & turnkey execution services' + (q ? ' as per quotation ' + qno(q) : '')), milestoneNote = inv.milestone ? '<br><small class="mut">Milestone: ' + esc(inv.milestone) + '</small>' : '';
    let tableHeader, row1, totRow, taxRows, grandTotal, reverseCharge;
    if (isGst) {
      tableHeader = '<tr><th style="width:50px">S.No</th><th>Description of Service</th><th style="width:100px">SAC</th><th class="r" style="width:130px">Amount (₹)</th></tr>';
      row1 = '<tr><td>1</td><td>' + esc(rowDesc) + milestoneNote + '</td><td>' + esc(inv.sac || '9954') + '</td><td class="r">' + fmt(comp.taxable) + '</td></tr>';
      totRow = '<tr class="tot"><td colspan="3" class="r"><b>Taxable Value</b></td><td class="r"><b>' + fmt(comp.taxable) + '</b></td></tr>';
      taxRows = inv.intraState !== false ? '<tr><td colspan="3" class="r">CGST @ ' + half + '%</td><td class="r">' + fmt(comp.cgst) + '</td></tr><tr><td colspan="3" class="r">SGST @ ' + half + '%</td><td class="r">' + fmt(comp.sgst) + '</td></tr>' : '<tr><td colspan="3" class="r">IGST @ ' + gstRate + '%</td><td class="r">' + fmt(comp.igst) + '</td></tr>';
      grandTotal = '<tr class="tot gt"><td colspan="3" class="r"><b>Total Invoice Value</b></td><td class="r"><b>' + fmt(comp.total) + '</b></td></tr>';
      reverseCharge = '<p style="font-size:11px;margin-top:6px"><b>Reverse Charge:</b> No</p>';
    } else {
      tableHeader = '<tr><th style="width:50px">S.No</th><th>Description of Service</th><th class="r" style="width:130px">Amount (₹)</th></tr>';
      row1 = '<tr><td>1</td><td>' + esc(rowDesc) + milestoneNote + '</td><td class="r">' + fmt(comp.total) + '</td></tr>';
      totRow = ''; taxRows = ''; grandTotal = '<tr class="tot gt"><td colspan="2" class="r"><b>Total Invoice Value</b></td><td class="r"><b>' + fmt(comp.total) + '</b></td></tr>'; reverseCharge = '';
    }
    const body = (off ? '<div style="border:2px solid #b00020;color:#b00020;padding:8px;font-weight:bold;text-align:center;margin-bottom:10px">CANCELLED</div>' : '') + '<div style="margin:10px 0 6px;font-weight:bold;font-size:12px;color:#4D5A4A;letter-spacing:1px">BILL TO</div><div style="margin-bottom:14px">' + recipient + '</div><table class="t">' + tableHeader + row1 + totRow + taxRows + grandTotal + '</table><p style="font-size:12px;margin-top:10px"><b>Amount in words:</b> ' + esc(amtWords(comp.total)) + '</p>' + reverseCharge + (inv.notes ? '<div class="sh">NOTES</div><p style="font-size:12px">' + esc(inv.notes) + '</p>' : '') + '<div style="display:flex;justify-content:space-between;margin-top:40px;font-size:12px"><div>This is a computer-generated invoice.</div><div style="text-align:center">For <b>' + esc(c.name || 'Company') + '</b><br><br><br>Authorised Signatory</div></div>';
    let meta = (isGst ? 'Tax Invoice' : 'Invoice') + '<br>No.: <b>' + esc(inv.no) + '</b><br>Date: ' + (inv.date ? dmy(inv.date) : dmy(new Date().toISOString().slice(0, 10))) + '<br>';
    if (isGst && c.gstin) meta += 'GSTIN: <b>' + esc(c.gstin) + '</b><br>';
    if (isGst) meta += 'Place of Supply: ' + esc(inv.placeOfSupply || c.state || 'West Bengal');
    return '<div class="bar noprint"><button data-a="dpdf" data-acc="1" data-fn="' + (isGst ? 'GST-Invoice-' : 'Invoice-') + esc(String(inv.no).replace(/\//g, '-')) + '.pdf">Download PDF</button><button class="g" data-a="ap">Print</button>' + (off ? '' : '<button class="g" data-inv-act="cancel-doc" data-i="' + p.inv.indexOf(inv) + '">Cancel this invoice</button>') + '<button class="g" data-bza="docback">← Back</button></div>' + docPaper(isGst ? 'TAX INVOICE' : 'INVOICE', meta, body);
  }
  if (typeof PJTABS !== 'undefined' && PJTABS.push && !PJTABS.some(t => t[0]==='inv')) PJTABS.push(['inv', 'Invoices', 'fs']);
  if (typeof ERPT !== 'undefined' && ERPT.push && ERPT.indexOf('inv') < 0) ERPT.push('inv');
  if (window.erpTab) { const _erpTab = window.erpTab; window.erpTab = function(p, T) { if (T === 'inv') return invTab(p); return _erpTab(p, T); }; }
  if (window.vProj) { const _vProj = window.vProj; window.vProj = function() { if (S.bzdoc && S.bzdoc.t === 'inv') { const proj = BZ.pj[S.bzdoc.id]; return proj ? invDoc(proj, (proj.inv || [])[S.bzdoc.i]) : _vProj(); } return _vProj(); }; }
  if (window.vSet) { const _vSet2 = window.vSet; window.vSet = function() { return _vSet2() + invoiceSettingsCard(); }; }
  function invoiceSettingsCard() {
    ensureSettings();
    const c = S.set.co || {}, hasGstin = !!(c.gstin && String(c.gstin).trim());
    return '<div class="card"><h3>GST / Non-GST Invoicing</h3><p class="mut" style="margin:4px 0 12px">Leave GSTIN blank if not registered.</p><div class="dgrid" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr))"><div><label>Your GSTIN</label><input data-setup-inv="co|gstin" value="' + esc(c.gstin || '') + '" placeholder="15-character GSTIN" maxlength="15" style="text-transform:uppercase"></div><div><label>Your state</label><input data-setup-inv="co|state" value="' + esc(c.state || '') + '" placeholder="e.g. West Bengal"></div><div><label>Invoice number prefix</label><input data-setup-inv="invPrefix" value="' + esc(S.set.invPrefix || 'INV') + '"></div><div><label>Default SAC code</label><input data-setup-inv="sac" value="' + esc(S.set.sac || '9954') + '"></div><div><label>Default GST rate (%)</label><input type="number" data-setup-inv="gst" value="' + (S.set.gst || 18) + '" min="0" max="28"></div></div><p class="mut" style="margin-top:10px;font-size:11px"><b>Next invoice number:</b> ' + nextInvoiceNo() + ' (resets every April 1). Default: <b>' + (hasGstin ? 'GST' : 'Non-GST') + '</b>.</p></div>';
  }
  document.addEventListener('change', e => { const t = e.target; if (!t.dataset || !t.dataset.setupInv) return; const path = t.dataset.setupInv; if (path.indexOf('co|') === 0) S.set.co[path.slice(3)] = t.value.trim(); else if (path === 'gst') S.set.gst = +t.value || 18; else S.set[path] = t.value.trim(); try { save('s'); } catch(x) {} try { flash('Saved'); } catch(x) {} });
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-inv-act]'); if (!btn) return; e.preventDefault();
    const action = btn.dataset.invAct, p = (S.bzdoc && S.bzdoc.id) ? BZ.pj[S.bzdoc.id] : BZ.pj[S.pj]; if (!p) return;
    if (action === 'create') return invCreateDialog(p);
    if (action === 'view') { S.bzdoc = { t: 'inv', id: p.id, i: +btn.dataset.i }; return render(); }
    if (action === 'cancel' || action === 'cancel-doc') {
      const inv = (p.inv || [])[+btn.dataset.i]; if (!inv) return;
      if (!confirm('Cancel invoice ' + inv.no + '?')) return;
      inv.status = 'Cancelled'; inv.cancelledAt = Date.now();
      try { bzSave('pj', p.id); } catch(x) {} try { audEvt('pj', p.id, p.name, 'Invoice cancelled', inv.no); } catch(x) {}
      render();
    }
  });
})();

// ==========================================
// STEP 3: PACKAGE TEMPLATES
// ==========================================
(function(){
  'use strict';
  if (window.__mcPackagesLoaded_v2) return;
  window.__mcPackagesLoaded_v2 = true;
  const PACKAGES = {
    'pkg_kitchen': { name: '🍳 Only Kitchen (Standard)', rooms: [{ name: 'KITCHEN', t: 'KITCHEN', items: [ { mk: 'kb2', q: 4 }, { mk: 'kw2', q: 2 }, { mk: 'ktp', q: 1 }, { mk: 'kl2', q: 2 }, { mk: 'kbsk', q: 1 } ]}] },
    'pkg_mbed': { name: '🛏️ Only Master Bedroom', rooms: [{ name: 'MASTER BEDROOM', t: 'MASTER BEDROOM', items: [ { mk: 'wh3', q: 1 }, { mk: 'wl2', q: 1 }, { mk: 'bdbx', q: 1 }, { mk: 'bst', q: 2 }, { mk: 'drs', q: 1 }, { mk: 'tvw', q: 1 } ]}] },
    'pkg_living': { name: '🛋️ Only Living Room', rooms: [{ name: 'LIVING ROOM', t: 'LIVING ROOM', items: [ { mk: 'tvb', q: 1 }, { mk: 'tvp', q: 1 }, { mk: 'shr', q: 1 }, { mk: 'cru', q: 1 } ]}] },
    'pkg_beds_only': { name: '🛌 Bedrooms Only (Master + 2)', rooms: [{ name: 'MASTER BEDROOM', t: 'MASTER BEDROOM', items: [ { mk: 'wh3', q: 1 }, { mk: 'wl2', q: 1 }, { mk: 'bdbx', q: 1 }, { mk: 'bst', q: 2 }, { mk: 'drs', q: 1 } ]},{ name: 'BEDROOM 2', t: 'BEDROOM 2', items: [ { mk: 'wh2', q: 1 }, { mk: 'wl1', q: 1 }, { mk: 'bdpl', q: 1 }, { mk: 'bst', q: 2 }, { mk: 'std', q: 1 } ]},{ name: 'BEDROOM 3', t: 'BEDROOM 3', items: [ { mk: 'wh2', q: 1 }, { mk: 'wl1', q: 1 }, { mk: 'bdpl', q: 1 }, { mk: 'bst', q: 1 }, { mk: 'std', q: 1 } ]}] },
    'pkg_1bhk': { name: '🏠 1BHK Package (Kitchen + 1 Bed + Living)', rooms: [{ name: 'KITCHEN', t: 'KITCHEN', items: [ { mk: 'kb2', q: 4 }, { mk: 'kw2', q: 2 }, { mk: 'ktp', q: 1 }, { mk: 'kl2', q: 2 }, { mk: 'kbsk', q: 1 } ]},{ name: 'MASTER BEDROOM', t: 'MASTER BEDROOM', items: [ { mk: 'wh3', q: 1 }, { mk: 'wl2', q: 1 }, { mk: 'bdbx', q: 1 }, { mk: 'bst', q: 2 }, { mk: 'drs', q: 1 }, { mk: 'tvw', q: 1 } ]},{ name: 'LIVING ROOM', t: 'LIVING ROOM', items: [ { mk: 'tvb', q: 1 }, { mk: 'tvp', q: 1 }, { mk: 'shr', q: 1 }, { mk: 'cru', q: 1 } ]}] },
    'pkg_2bhk': { name: '🏘️ 2BHK Package (Kitchen + 2 Beds + Living)', rooms: [{ name: 'KITCHEN', t: 'KITCHEN', items: [ { mk: 'kb2', q: 4 }, { mk: 'kw2', q: 2 }, { mk: 'ktp', q: 1 }, { mk: 'kl2', q: 2 }, { mk: 'kbsk', q: 1 } ]},{ name: 'MASTER BEDROOM', t: 'MASTER BEDROOM', items: [ { mk: 'wh3', q: 1 }, { mk: 'wl2', q: 1 }, { mk: 'bdbx', q: 1 }, { mk: 'bst', q: 2 }, { mk: 'drs', q: 1 } ]},{ name: 'BEDROOM 2', t: 'BEDROOM 2', items: [ { mk: 'wh2', q: 1 }, { mk: 'wl1', q: 1 }, { mk: 'bdpl', q: 1 }, { mk: 'bst', q: 2 }, { mk: 'std', q: 1 } ]},{ name: 'LIVING ROOM', t: 'LIVING ROOM', items: [ { mk: 'tvb', q: 1 }, { mk: 'tvp', q: 1 }, { mk: 'shr', q: 1 }, { mk: 'cru', q: 1 } ]}] },
    'pkg_3bhk': { name: '🏢 3BHK Package (Full House)', rooms: [{ name: 'KITCHEN', t: 'KITCHEN', items: [ { mk: 'kb2', q: 6 }, { mk: 'kw2', q: 3 }, { mk: 'ktp', q: 1 }, { mk: 'kl2', q: 3 }, { mk: 'kbsk', q: 1 } ]},{ name: 'MASTER BEDROOM', t: 'MASTER BEDROOM', items: [ { mk: 'wh4', q: 1 }, { mk: 'wl2', q: 1 }, { mk: 'bdbx', q: 1 }, { mk: 'bst', q: 2 }, { mk: 'drs', q: 1 }, { mk: 'tvw', q: 1 } ]},{ name: 'BEDROOM 2', t: 'BEDROOM 2', items: [ { mk: 'wh3', q: 1 }, { mk: 'wl2', q: 1 }, { mk: 'bdbx', q: 1 }, { mk: 'bst', q: 2 }, { mk: 'std', q: 1 } ]},{ name: 'BEDROOM 3', t: 'BEDROOM 3', items: [ { mk: 'wh2', q: 1 }, { mk: 'wl1', q: 1 }, { mk: 'bdpl', q: 1 }, { mk: 'bst', q: 2 }, { mk: 'std', q: 1 } ]},{ name: 'LIVING ROOM', t: 'LIVING ROOM', items: [ { mk: 'tvb', q: 1 }, { mk: 'tvp', q: 1 }, { mk: 'shr', q: 1 }, { mk: 'cru', q: 1 } ]}] },
    'pkg_office': { name: '💼 Office / Commercial Basic', rooms: [{ name: 'RECEPTION', t: 'RECEPTION', items: [ { mk: 'utl', q: 1 }, { mk: 'shr', q: 1 }, { mk: 'cru', q: 1 } ]},{ name: 'WORKSTATION AREA', t: 'OPEN WORKSTATION AREA', items: [ { mk: 'std', q: 4 } ]},{ name: 'CABIN', t: 'PRIVATE CABIN', items: [ { mk: 'std', q: 1 }, { mk: 'utl', q: 1 } ]}] }
  };
  function applyPackage(pkgId) {
    const pkg = PACKAGES[pkgId]; if (!pkg) return;
    let q = T();
    if (!q) { const id = 'q' + Date.now().toString(36); S.q[id] = { id, ts: Date.now(), name: '', by: lastBy(), project: '', address: '', contact: '', date: new Date().toISOString().slice(0, 10), rooms: [], ir: {}, grp: id, rev: 0, seq: 1, st: 'draft', pay: cl(S.set.pay), notes: S.set.notes }; S.cur = id; S.tab = 'e'; q = S.q[id]; }
    pkg.rooms.forEach(pkgRoom => {
      const newRoom = { id: 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2,5), t: pkgRoom.t, name: pkgRoom.name, w: 0, rate: '', rows: [] };
      pkgRoom.items.forEach(item => { const m = MOD[item.mk]; if (!m) return; const r = modRow(newRoom, m, m.sw[Math.floor(m.sw.length/2)] || m.w0, m.h, q); r.q = item.q || 1; newRoom.rows.push(r); });
      if (typeof syncAuto === 'function') syncAuto(newRoom);
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
    modal.querySelectorAll('[data-pkg-id]').forEach(btn => { btn.onclick = () => { applyPackage(btn.dataset.pkgId); modal.remove(); }; btn.onmouseenter = () => btn.style.background = 'var(--bg)'; btn.onmouseleave = () => btn.style.background = 'var(--in)'; });
    document.getElementById('pkg_cancel').onclick = () => modal.remove();
  }
  if (window.vList) { const _vList = window.vList; window.vList = function() { return _vList().replace('<button data-a="nq">+ New quotation</button>', '<button data-a="nq">+ New quotation</button><button class="g" id="btn-insert-pkg" style="border-color:#1F4E79;color:#1F4E79;font-weight:600">📦 Insert Package</button>'); }; }
  if (window.vEdit) { const _vEdit = window.vEdit; window.vEdit = function() { return _vEdit().replace('<button data-a="sv">Save quotation</button>', '<button data-a="sv">Save quotation</button><button class="g" id="btn-insert-pkg" style="border-color:#1F4E79;color:#1F4E79;font-weight:600">📦 Insert Package</button>'); }; }
  document.addEventListener('click', function(e) { if (e.target.id === 'btn-insert-pkg') { e.preventDefault(); showPackageModal(); } });
})();

// ==========================================
// STEP 4: ENQUIRY TRACKER (PRE-QUOTATION)
// ==========================================
(function(){
  'use strict';
  if (window.__mcEnqLoaded) return;
  window.__mcEnqLoaded = true;
  
  const GOOGLE_URL = "https://script.google.com/macros/s/AKfycbwgMExM7rKaDkJ4-LvUnb_HLpO4TL4-CKDkNEzuSWLiExCetpAT0sox2A1_-NL9clRM/exec";
  const API_KEY = "ModuCraft@2026";

  window.ENQ = JSON.parse(localStorage.getItem('msq_enq_data') || '{}');
  window.saveEnq = function() { localStorage.setItem('msq_enq_data', JSON.stringify(window.ENQ)); };
  
  window.vEnq = function() {
    const list = Object.values(window.ENQ).sort((a, b) => (b.date || '').localeCompare(a.date || '')), t = today();
    const rows = list.map(e => {
      const isOverdue = e.nextFollowUp && e.nextFollowUp <= t, badge = e.status === 'Won' ? '<span style="color:#15803d">Won</span>' : e.status === 'Lost' ? '<span style="color:#b00020">Lost</span>' : `<span style="color:#1F4E79">${e.status || 'Enquiry'}</span>`;
      return `<tr><td><b>${esc(e.name)}</b><br><span class="mut">${esc(e.phone)}</span></td><td>${esc(e.project)}</td><td>${esc(e.budget || '—')}</td><td style="${isOverdue ? 'color:#b00020;font-weight:bold' : ''}">${e.nextFollowUp ? dmy(e.nextFollowUp) : '—'}</td><td>${badge}</td><td style="white-space:nowrap"><button class="g" data-enq-act="edit" data-id="${e.id}">Edit</button>${e.status !== 'Won' ? `<button data-enq-act="convert" data-id="${e.id}" style="background:#1F4E79;color:#fff;border:0;border-radius:6px;padding:4px 10px;cursor:pointer;margin-left:4px">→ Quote</button>` : ''}</td></tr>`;
    }).join('');
    return `<div class="card"><div class="bar noprint"><h2>Enquiries / Leads</h2><button data-enq-act="new" style="background:#1F4E79;color:#fff;border:0;border-radius:6px;padding:6px 12px;font-weight:600;cursor:pointer;margin-left:auto">+ New Enquiry</button></div><p class="mut">Track potential clients before creating a quotation.</p><div class="sc"><table class="g" style="min-width:760px"><tr><th>Client</th><th>Project / Requirement</th><th>Budget</th><th>Next Follow Up</th><th>Status</th><th></th></tr>${rows || '<tr><td colspan="6" class="mut">No enquiries logged yet.</td></tr>'}</table></div></div>`;
  };

  const navObserver = new MutationObserver(() => {
    const nav = document.getElementById('nav');
    if (!nav || document.querySelector('#nav button[data-v="enq"]') || (typeof navOK === 'function' && !navOK('q'))) return;
    const btn = document.createElement('button'); btn.dataset.a = 'tab'; btn.dataset.v = 'enq'; btn.className = (S.tab === 'enq') ? 'on' : ''; btn.textContent = 'Enquiries'; btn.onclick = () => { S.tab = 'enq'; render(); };
    const firstBtn = nav.querySelector('button'); if (firstBtn) firstBtn.after(btn); else nav.appendChild(btn);
  });
  
  if (document.getElementById('nav')) navObserver.observe(document.getElementById('nav'), { childList: true });
  
  const _render = window.render;
  window.render = function() {
    if (S.tab === 'enq') { document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('on', b.dataset.v === 'enq')); document.getElementById('app').innerHTML = window.vEnq(); const btn = document.querySelector('#nav button[data-v="enq"]'); if (btn) btn.classList.add('on'); return; }
    const btn = document.querySelector('#nav button[data-v="enq"]'); if (btn) btn.classList.remove('on'); _render.apply(this, arguments);
  };

    function openEnqModal(id) {
    const isNew = !id;
    const e = isNew ? { id: 'e' + Date.now().toString(36), date: today(), status: 'Enquiry' } : window.ENQ[id];
    const o = document.createElement('div'); 
    o.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:flex-start;justify-content:center;z-index:100001;padding:20px;overflow-y:auto';
    
    o.innerHTML = `<div style="background:var(--card,#fff);color:var(--ink,#222);border-radius:12px;padding:20px;max-width:500px;width:100%;box-shadow:0 10px 40px rgba(0,0,0,.4);margin:auto"><h3 style="margin-top:0">${isNew ? 'New Enquiry' : 'Edit Enquiry'}</h3><div class="dgrid" style="grid-template-columns:1fr 1fr;gap:10px"><div style="grid-column:1/-1"><label>Client Name *</label><input id="eq_name" value="${esc(e.name||'')}"></div><div><label>Phone / Email</label><input id="eq_phone" value="${esc(e.phone||'')}"></div><div><label>Project (e.g. 2BHK)</label><input id="eq_proj" value="${esc(e.project||'')}"></div><div><label>Budget</label><input id="eq_bud" value="${esc(e.budget||'')}"></div><div><label>Next Follow Up</label><input type="date" id="eq_date" value="${e.nextFollowUp||''}"></div><div style="grid-column:1/-1"><label>Notes</label><textarea id="eq_notes" rows="2">${esc(e.notes||'')}</textarea></div><div style="grid-column:1/-1"><label>Status</label><select id="eq_status">${['Enquiry','Quoted','Won','Lost'].map(s=>`<option ${e.status===s?'selected':''}>${s}</option>`).join('')}</select></div></div><div class="bar" style="margin-top:14px;justify-content:flex-end">${!isNew ? `<button class="g" id="eq_del" style="margin-right:auto;color:#b00020;border-color:#fca5a5">Delete</button>` : ''}<button class="g" id="eq_cancel">Cancel</button><button id="eq_save" style="background:#1F4E79;color:#fff;border:0;border-radius:6px;padding:8px 20px;font-weight:600;cursor:pointer">Save</button></div></div>`;
    
    document.body.appendChild(o);
        // NEW: Do the lock check in the background so it doesn't freeze the app
    if (!isNew) {
        const saveBtn = document.getElementById('eq_save');
        if(saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Locking...'; }
        
        const userName = localStorage.getItem('msq_me') || 'Someone';
        fetch(GOOGLE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'lock_record', sheetName: 'enquiries', recordId: id, userName: userName })
        })
        .then(res => res.json())
        .then(lockData => {
            if (!lockData.success) {
                alert(`🚨 ALERT: ${lockData.lockedBy} is currently editing this record. Please wait or refresh.`);
                o.remove(); // Close the window since they can't edit it
                return; 
            }
            window.currentEditOpenedAt = window.ENQ[id].updated_at || Date.now(); 
            if(saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Save'; }
        })
        .catch(err => {
            console.error("Lock check failed:", err);
            if(saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Save'; }
        });
    }
    
    document.getElementById('eq_cancel').onclick = () => o.remove();
    if (!isNew) {
      document.getElementById('eq_del').onclick = () => { 
        if (confirm('Delete this enquiry?')) { 
          delete window.ENQ[id]; 
          window.saveEnq(); 
          o.remove(); 
          render(); 
        } 
      };
    }
    
    document.getElementById('eq_save').onclick = async () => {
      const name = document.getElementById('eq_name').value.trim(); 
      if (!name) return alert('Client name is required.');
      
      e.name = name; 
      e.phone = document.getElementById('eq_phone').value.trim(); 
      e.project = document.getElementById('eq_proj').value.trim(); 
      e.budget = document.getElementById('eq_bud').value.trim(); 
      e.nextFollowUp = document.getElementById('eq_date').value; 
      e.notes = document.getElementById('eq_notes').value.trim(); 
      e.status = document.getElementById('eq_status').value;

      // --- CONFLICT CHECK & UNLOCK ---
      if (!isNew) {
          const userName = localStorage.getItem('msq_me') || 'Someone';
          try {
              const conflictRes = await fetch(GOOGLE_URL, {
                  method: 'POST',
                  headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                  body: JSON.stringify({ action: 'check_conflict', sheetName: 'enquiries', recordId: id, openedAt: window.currentEditOpenedAt, userName: userName })
              });
              const conflictData = await conflictRes.json();
              
              if (conflictData.hasConflict) {
                  alert(conflictData.message);
                  return; 
              }

              fetch(GOOGLE_URL, {
                  method: 'POST',
                  headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                  body: JSON.stringify({ action: 'unlock_record', sheetName: 'enquiries', recordId: id })
              });
          } catch (err) {
              console.error("Conflict check failed", err);
          }
      }

      window.ENQ[e.id] = e; 
      window.saveEnq();
      
      // --- ACTUALLY SAVE TO GOOGLE SHEETS ---
      try {
          fetch(GOOGLE_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify({ 
                  action: 'save', 
                  collection: 'enquiries',
                  id: e.id,
                  data: e,
                  apiKey: API_KEY
              })
          })
          .then(res => res.json())
          .then(res => console.log("✅ CLOUD SAVE SUCCESS:", res))
          .catch(err => console.error("❌ CLOUD SAVE FAILED:", err));
      } catch(err) { 
          console.log("Cloud save failed", err); 
      }

      if (isNew) {
        const wText = `New Enquiry Alert!\n\nClient: ${e.name}\nProject: ${e.project || 'Not specified'}\nPhone: ${e.phone || 'Not provided'}\nBudget: ${e.budget || 'Not specified'}\nNext Follow-up: ${e.nextFollowUp || 'None'}\n\nSent from ModuCraft.`, waOwner = `https://wa.me/919830051060?text=${encodeURIComponent(wText)}`, waPartner = `https://wa.me/919830864409?text=${encodeURIComponent(wText)}`;
        o.innerHTML = `<div style="background:var(--card,#fff);color:var(--ink,#222);border-radius:12px;padding:20px;max-width:400px;width:100%;box-shadow:0 10px 40px rgba(0,0,0,.4);margin:auto;text-align:center"><h3 style="margin-top:0;color:#22C55E">✅ Enquiry Saved</h3><p class="mut" style="font-size:13px;margin-bottom:16px">Do you want to alert the team via WhatsApp?</p><div style="display:flex;flex-direction:column;gap:8px"><a href="${waOwner}" target="_blank" style="background:#25D366;color:#fff;text-decoration:none;padding:10px;border-radius:6px;font-weight:bold;display:block">📱 Notify Owner (9830051060)</a><a href="${waPartner}" target="_blank" style="background:#25D366;color:#fff;text-decoration:none;padding:10px;border-radius:6px;font-weight:bold;display:block">📱 Notify Partner (9830864409)</a></div><button class="g" id="eq_done" style="margin-top:16px;width:100%">Close</button></div>`;
        document.getElementById('eq_done').onclick = () => { o.remove(); render(); flash('Enquiry saved'); };
      } else { 
        o.remove(); 
        render(); 
        flash('Enquiry updated'); 
      }
    };
  }

  // --- LISTENER (This was the missing piece!) ---
  document.addEventListener('click', function(ev) {
    const btn = ev.target.closest('[data-enq-act]'); if (!btn) return; ev.preventDefault();
    const act = btn.dataset.enqAct, id = btn.dataset.id;
    if (act === 'new') openEnqModal();
    else if (act === 'edit') openEnqModal(id);
    else if (act === 'convert') {
      const e = window.ENQ[id]; if (!e) return;
      if (confirm(`Create a new quotation for ${e.name}?`)) {
        window.newQ(); const q = window.T();
        if (q) { q.name = e.name; q.contact = e.phone; q.project = e.project || q.project; q.by = window.lastBy(); window.save('q', q.id); }
        e.status = 'Quoted'; window.saveEnq(); S.tab = 'e'; render(); flash('Converted to new quotation');
      }
    }
  });
})();
// ==========================================
// STEP 5: PROJECT EXPENSES & CASH-FLOW FORECAST
// ==========================================
(function(){
  'use strict';
  if (window.__mcExpensesLoaded) return;
  window.__mcExpensesLoaded = true;

  // 1. Add the "Expenses" tab to the Project view
  if (typeof PJTABS !== 'undefined' && PJTABS.push && !PJTABS.some(t => t[0]==='exp')) {
    PJTABS.push(['exp', 'Expenses', 'fs']);
  }
  if (typeof ERPT !== 'undefined' && ERPT.push && ERPT.indexOf('exp') < 0) {
    ERPT.push('exp');
  }

  // 2. Render the Expenses Tab inside a Project
  function expTab(p) {
    const fl = canRate();
    const can = S.w && (fl || S.lvl=='staff');
    const exps = p.expenses || [];
    const total = exps.reduce((a, x) => a + (+x.amt || 0), 0);
    const catTotals = {};
    exps.forEach(x => { catTotals[x.cat || 'Other'] = (catTotals[x.cat || 'Other'] || 0) + (+x.amt || 0); });

    const rows = exps.map((x, i) => `
      <tr>
        <td>${bdt('pj', p.id, 'expenses.'+i+'.date', x.date)}</td>
        <td>${bs('pj', p.id, 'expenses.'+i+'.cat', x.cat || 'Other', ['Transport', 'Labour', 'Material', 'Food / Water', 'Site Misc', 'Other'])}</td>
        <td>${bi('pj', p.id, 'expenses.'+i+'.desc', x.desc, 'style="min-width:180px"')}</td>
        <td>${bn('pj', p.id, 'expenses.'+i+'.amt', x.amt, 'style="width:100px"')}</td>
        <td>${bi('pj', p.id, 'expenses.'+i+'.by', x.by, 'style="width:100px" placeholder="Paid by"')}</td>
        <td>${can ? ba('exdel', '❌', 'data-i="'+i+'"') : ''}</td>
      </tr>
    `).join('');

    const summary = Object.entries(catTotals).map(([c, a]) => 
      `<span class="chip" style="margin-right:4px">${esc(c)}: ${fmt(a)}</span>`
    ).join('');

    return `<div class="card">
      <div class="bar noprint">
        <h3>Project Expenses</h3>
        ${can ? ba('exadd', '+ Add Expense', '', '') : ''}
        <span style="margin-left:auto;font-size:16px"><b>Total: ${fmt(total)}</b></span>
      </div>
      <p class="mut">Track direct project costs not covered by Purchase Orders (labour, transport, site misc). This calculates your true profit.</p>
      <div class="bar" style="margin-bottom:10px">${summary || '<span class="mut">No categories yet.</span>'}</div>
      
      <div class="sc">
        <table class="g" style="min-width:600px">
          <tr><th>Date</th><th>Category</th><th>Description</th><th>Amount (₹)</th><th>Paid By</th><th></th></tr>
          ${rows || '<tr><td colspan="6" class="mut">No expenses recorded for this project yet.</td></tr>'}
        </table>
      </div>
    </div>
    <div class="card">
      <h3>Profitability Check</h3>
      <div class="dgrid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
        <div><span class="mut">Contract Value</span><br><b>${fmt(p.val)}</b></div>
        <div><span class="mut">Vendor POs</span><br><b>${fmt(pjSpend(p.id))}</b></div>
        <div><span class="mut">Direct Expenses</span><br><b>${fmt(total)}</b></div>
        <div><span class="mut">Real Profit</span><br><b style="color:${(+p.val||0) - (pjSpend(p.id) + total) > 0 ? '#15803d' : '#b00020'}">${fmt((+p.val||0) - (pjSpend(p.id) + total))}</b></div>
      </div>
    </div>`;
  }

  // 3. Intercept the Project render to show the tab
  if (window.erpTab) {
    const _erpTab = window.erpTab;
    window.erpTab = function(p, T) {
      if (T === 'exp') return expTab(p);
      return _erpTab(p, T);
    };
  }

  // 4. Handle Add/Delete Expenses
  document.addEventListener('click', e => {
    const bAdd = e.target.closest('[data-bza="exadd"]');
    if (bAdd) {
      e.preventDefault(); e.stopImmediatePropagation();
      const p = (S.bzdoc && S.bzdoc.id) ? BZ.pj[S.bzdoc.id] : BZ.pj[S.pj];
      if (!p || !S.w) return;
      p.expenses = p.expenses || [];
      p.expenses.push({ date: today(), cat: 'Transport', desc: '', amt: 0, by: uName() });
      bzSave('pj', p.id); render(); return;
    }
    const bDel = e.target.closest('[data-bza="exdel"]');
    if (bDel) {
      e.preventDefault(); e.stopImmediatePropagation();
      const p = (S.bzdoc && S.bzdoc.id) ? BZ.pj[S.bzdoc.id] : BZ.pj[S.pj];
      if (!p || !S.w) return;
      if (confirm('Delete this expense?')) {
        p.expenses.splice(+bDel.dataset.i, 1);
        bzSave('pj', p.id); render();
      }
      return;
    }
  }, true);

  // 5. Add Cash Flow Forecast to the Today Dashboard
  const origTodayCard = todayCard;
  todayCard = function() {
    let html = origTodayCard();
    let inflow = 0, outflow = 0;
    const t = today(), t30 = addDays(t, 30);

    // Calculate Inflow (Client Payments Due)
    Object.values(BZ.pj).filter(isProjectActive).forEach(p => {
      pjPend(p).forEach(o => {
        if (o.pend > 0 && o.x.due && o.x.due <= t30) inflow += o.pend;
      });
    });

    // Calculate Outflow (Vendor POs Due)
    Object.values(BZ.po).filter(o => ['Sent', 'Part received'].includes(o.st)).forEach(o => {
      if (o.del && o.del <= t30) {
        const tTot = poTot(o).tot;
        let paid = 0;
        (o.pays || []).forEach(p => paid += (+p.amt || 0));
        const bal = tTot - paid;
        if (bal > 0) outflow += bal;
      }
    });

    const net = inflow - outflow;
    
    if (inflow > 0 || outflow > 0) {
      const cfHtml = `<div class="card" style="border-left:6px solid #F59E0B; background:#fffdf5">
        <h3>💵 Cash Flow Forecast (Next 30 Days)</h3>
        <div class="dgrid" style="grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));">
          <div><span class="mut">Expected Inflow (Clients)</span><br><b style="color:#15803d;font-size:18px">${fmt(inflow)}</b></div>
          <div><span class="mut">Expected Outflow (Vendors)</span><br><b style="color:#b00020;font-size:18px">${fmt(outflow)}</b></div>
          <div><span class="mut">Net Projection</span><br><b style="color:${net >= 0 ? '#15803d' : '#b00020'};font-size:18px">${fmt(net)}</b></div>
        </div>
        <p class="mut" style="margin:8px 0 0;font-size:12px">Based on client payment milestones and vendor delivery dates due in the next 30 days.</p>
      </div>`;

      // Safely prepend the Cash Flow card
      html = cfHtml + html;
    }

    return html;
  };

  console.log('[ModuCraft +] Expenses & Cash-Flow loaded');
})();
// ==========================================
// STEP 6: DAILY SITE REPORT (PHOTOS & MILESTONES)
// ==========================================
(function(){
  'use strict';
  if (window.__mcDailyLoaded) return;
  window.__mcDailyLoaded = true;

  // 1. Add the "Daily Report" tab
  if (typeof PJTABS !== 'undefined' && PJTABS.push && !PJTABS.some(t => t[0]==='drep')) {
    PJTABS.push(['drep', 'Daily Site Report', 'fslv']);
  }
  if (typeof ERPT !== 'undefined' && ERPT.push && ERPT.indexOf('drep') < 0) {
    ERPT.push('drep');
  }

  // 2. Render the Daily Report Tab
  function drepTab(p) {
    const can = S.w && (S.lvl === 'full' || S.lvl === 'staff' || S.lvl === 'site');
    const reps = (p.daily || []).slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    
    const cards = reps.map((rep, i) => {
      // Find expenses matching this date
      const exps = (p.expenses || []).filter(e => e.date === rep.date);
      const expTotal = exps.reduce((t, e) => t + (+e.amt || 0), 0);
      
      const expHtml = exps.length ? `
        <div style="margin-top:10px; border-top:1px dashed var(--line); padding-top:8px;">
          <span style="font-size:11px;font-weight:bold;color:#b00020">Payments / Expenses (${fmt(expTotal)})</span>
          ${exps.map(e => `<div style="font-size:12px;margin-top:2px">• ${esc(e.cat)}: ${esc(e.desc)} — <b>${fmt(e.amt)}</b> (${esc(e.by || '')})</div>`).join('')}
        </div>` : '';

      const photosHtml = (rep.photos || []).length ? `
        <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:10px;">
          ${rep.photos.map(phId => {
            const ph = ERP.ph[phId];
            return ph ? `<img src="${ph.d}" data-phv="${phId}" style="height:70px; border-radius:6px; cursor:pointer; object-fit:cover; border:1px solid var(--line);">` : '';
          }).join('')}
        </div>` : '';

      return `<div class="card" style="margin-bottom:10px; border-left:4px solid #1F4E79;">
        <div class="bar" style="margin-bottom:4px">
          <b style="font-size:15px;color:#1F4E79">📅 ${dmy(rep.date)}</b>
          ${can ? `<button class="g" data-drep-act="del" data-i="${i}" style="margin-left:auto;padding:2px 6px;font-size:11px">Delete</button>` : ''}
        </div>
        <p style="margin:4px 0;font-size:13px;white-space:pre-wrap;">${esc(rep.summary)}</p>
        ${photosHtml}
        ${expHtml}
      </div>`;
    }).join('');

    return `<div class="card">
      <div class="bar noprint">
        <h3>Daily Site Reports</h3>
        ${can ? `<button data-drep-act="new" style="background:#1F4E79;color:#fff;border:0;border-radius:6px;padding:6px 12px;font-weight:600;cursor:pointer;margin-left:auto">+ Log Today's Report</button>` : ''}
      </div>
      <p class="mut" style="margin-bottom:12px">Keep a daily record of work done, site photos, and cash payments. Visible to the client if you enable it in their portal.</p>
      <div style="max-height:70vh;overflow-y:auto;padding-right:4px">
        ${cards || '<p class="mut" style="text-align:center;padding:20px">No daily reports logged yet.</p>'}
      </div>
    </div>`;
  }

  // 3. Intercept Project render to show the tab
  if (window.erpTab) {
    const _erpTab = window.erpTab;
    window.erpTab = function(p, T) {
      if (T === 'drep') return drepTab(p);
      return _erpTab(p, T);
    };
  }

  // 4. Modal for Adding a Report
  function openDailyModal(p) {
    const o = document.createElement('div');
    o.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:flex-start;justify-content:center;z-index:100001;padding:20px;overflow-y:auto';
    
    // Find pending POs or just allow manual entry
    o.innerHTML = `<div style="background:var(--card,#fff);color:var(--ink,#222);border-radius:12px;padding:20px;max-width:500px;width:100%;box-shadow:0 10px 40px rgba(0,0,0,.5);margin:auto">
      <h3 style="margin-top:0">New Daily Report</h3>
      <div class="dgrid" style="grid-template-columns:1fr;gap:10px;">
        <div><label>Date</label><input type="date" id="dr_date" value="${today()}"></div>
        <div><label>Work Summary (What was done today?)</label><textarea id="dr_sum" rows="3" placeholder="e.g. Kitchen base units installed. Wardrobe carcass delivered."></textarea></div>
        
        <div style="border-top:1px solid var(--line);padding-top:10px;margin-top:6px;">
          <label style="font-weight:bold;color:#b00020">Contractor Payment / Site Expense (Optional)</label>
          <div class="dgrid" style="grid-template-columns:1fr 1fr;gap:6px;margin-top:4px;">
            <div><select id="dr_cat">${['Labour', 'Transport', 'Material', 'Site Misc', 'Other'].map(c=>`<option>${c}</option>`).join('')}</select></div>
            <div><input type="number" id="dr_amt" placeholder="Amount ₹" min="0"></div>
          </div>
          <div style="margin-top:6px;"><input id="dr_desc" placeholder="Paid to / Description (e.g. Paid Ramesh for cutting)"></div>
        </div>

        <div style="border-top:1px solid var(--line);padding-top:10px;margin-top:6px;">
          <label style="font-weight:bold;color:#1F4E79">Site Photos</label>
          <input type="file" id="dr_photos" accept="image/*" multiple style="margin-top:4px;">
          <div id="dr_prev" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;"></div>
        </div>
      </div>
      
      <div class="bar" style="margin-top:16px;justify-content:flex-end">
        <button class="g" id="dr_cancel">Cancel</button>
        <button id="dr_save" style="background:#1F4E79;color:#fff;border:0;border-radius:6px;padding:8px 20px;font-weight:600;cursor:pointer">Save Report</button>
      </div>
    </div>`;
    document.body.appendChild(o);

    const fileInput = document.getElementById('dr_photos');
    const prevBox = document.getElementById('dr_prev');
    let uploadedPhotos = []; // temporarily hold base64s

    fileInput.addEventListener('change', () => {
      prevBox.innerHTML = '';
      uploadedPhotos = [];
      const files = fileInput.files;
      if (files.length > 5) alert('Please select up to 5 photos per report.');
      
      Array.from(files).slice(0, 5).forEach(file => {
        const r = new FileReader();
        r.onload = (e) => {
          const im = new Image();
          im.onload = () => {
            const m = Math.min(1, 800 / Math.max(im.width, im.height));
            const c = document.createElement('canvas');
            c.width = Math.round(im.width * m); c.height = Math.round(im.height * m);
            c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
            const b64 = c.toDataURL('image/jpeg', .7);
            uploadedPhotos.push(b64);
            prevBox.innerHTML += `<img src="${b64}" style="height:50px;border-radius:4px;">`;
          };
          im.src = e.target.result;
        };
        r.readAsDataURL(file);
      });
    });

    document.getElementById('dr_cancel').onclick = () => o.remove();
    document.getElementById('dr_save').onclick = () => {
      const date = document.getElementById('dr_date').value;
      const sum = document.getElementById('dr_sum').value.trim();
      if (!date) return alert('Please select a date.');
      
      p.daily = p.daily || [];
      const repId = 'dr' + Date.now().toString(36);
      
      // Save photos
      const phIds = uploadedPhotos.map(b64 => phStore(p.id, b64));
      
      // Save expenses
      const amt = +document.getElementById('dr_amt').value || 0;
      if (amt > 0) {
        p.expenses = p.expenses || [];
        p.expenses.push({
          date: date,
          cat: document.getElementById('dr_cat').value,
          desc: document.getElementById('dr_desc').value.trim() || 'Site Expense',
          amt: amt,
          by: uName()
        });
      }

      // Save report
      p.daily.unshift({ id: repId, date: date, summary: sum, photos: phIds });
      bzSave('pj', p.id);
      try { audEvt('pj', p.id, p.name, 'Daily report added', date); } catch(e) {}
      o.remove();
      render();
      flash('Daily report saved!');
    };
  }

  // 5. Handle Clicks
  document.addEventListener('click', e => {
    const bNew = e.target.closest('[data-drep-act="new"]');
    if (bNew) {
      e.preventDefault(); e.stopImmediatePropagation();
      const p = (S.bzdoc && S.bzdoc.id) ? BZ.pj[S.bzdoc.id] : BZ.pj[S.pj];
      if (p) openDailyModal(p);
      return;
    }
    
    const bDel = e.target.closest('[data-drep-act="del"]');
    if (bDel) {
      e.preventDefault(); e.stopImmediatePropagation();
      const p = (S.bzdoc && S.bzdoc.id) ? BZ.pj[S.bzdoc.id] : BZ.pj[S.pj];
      if (p && confirm('Delete this daily report? Photos will remain in the gallery.')) {
        const reps = (p.daily || []).slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        const toDelete = reps[+bDel.dataset.i];
        p.daily = p.daily.filter(x => x.id !== toDelete.id);
        bzSave('pj', p.id); render();
      }
      return;
    }
  }, true);
})(); //
    // ==========================================
// STEP 7: CARPENTER / LABOUR PIECE-RATE BILLING
// ==========================================
(function(){
  'use strict';
  if (window.__mcCarpLoaded) return;
  window.__mcCarpLoaded = true;

  // 1. Add the "Carpenter Billing" tab
  if (typeof PJTABS !== 'undefined' && PJTABS.push && !PJTABS.some(t => t[0]==='carp')) {
    PJTABS.push(['carp', 'Carpenter / Labour', 'fs']);
  }
  if (typeof ERPT !== 'undefined' && ERPT.push && ERPT.indexOf('carp') < 0) {
    ERPT.push('carp');
  }

  // 2. Render the Carpenter Billing Tab
  function carpTab(p) {
    const q = S.q[p.qid];
    const totalSqft = q ? (typeof est === 'function' ? est(q).sq : 0) : 0;
    
    // Initialize data structure
    p.carp = p.carp || { rate: 0, extras: [], pays: [] };
    
    const rate = +p.carp.rate || 0;
    const baseCost = totalSqft * rate;
    const extraTotal = (p.carp.extras || []).reduce((a, x) => a + (+x.amt || 0), 0);
    const totalPayable = baseCost + extraTotal;
    const paidTotal = (p.carp.pays || []).reduce((a, x) => a + (+x.amt || 0), 0);
    const balance = totalPayable - paidTotal;
    const can = S.w;

    const payRows = (p.carp.pays || []).map((x, i) => `
      <tr>
        <td>${bdt('pj', p.id, 'carp.pays.'+i+'.date', x.date)}</td>
        <td>${bn('pj', p.id, 'carp.pays.'+i+'.amt', x.amt, 'style="width:100px"')}</td>
        <td>${bs('pj', p.id, 'carp.pays.'+i+'.mode', x.mode || 'Cash', ['Cash', 'UPI', 'Bank'])}</td>
        <td>${bi('pj', p.id, 'carp.pays.'+i+'.note', x.note, 'style="min-width:150px"')}</td>
        <td>${can ? ba('cpdel', '❌', 'data-i="'+i+'"', 'data-type="pay"') : ''}</td>
      </tr>
    `).join('');

    const extraRows = (p.carp.extras || []).map((x, i) => `
      <tr>
        <td>${bi('pj', p.id, 'carp.extras.'+i+'.desc', x.desc, 'style="min-width:200px"')}</td>
        <td>${bn('pj', p.id, 'carp.extras.'+i+'.amt', x.amt, 'style="width:100px"')}</td>
        <td>${can ? ba('cpdel', '❌', 'data-i="'+i+'"', 'data-type="extra"') : ''}</td>
      </tr>
    `).join('');

    return `<div class="card">
      <div class="bar noprint">
        <h3>🔨 Carpenter / Labour Billing</h3>
        ${!q ? '<span style="color:#b00020;font-size:12px;margin-left:10px">⚠ No quotation linked to this project.</span>' : ''}
      </div>
      <p class="mut">Calculate labor payments based on the BOQ square footage.</p>
      
      <div class="dgrid" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr));margin:10px 0">
        <div style="padding:10px;background:var(--in);border-radius:8px">
          <div class="mut" style="font-size:11px">Total Work (SQ.FT)</div>
          <div style="font-size:20px;font-weight:bold;color:#1F4E79">${totalSqft}</div>
        </div>
        <div style="padding:10px;background:var(--in);border-radius:8px">
          <div class="mut" style="font-size:11px">Labour Rate (₹/sqft)</div>
          <div>${bn('pj', p.id, 'carp.rate', p.carp.rate, 'style="font-size:20px;font-weight:bold;width:100px"')}</div>
        </div>
        <div style="padding:10px;background:var(--in);border-radius:8px">
          <div class="mut" style="font-size:11px">Calculated Labour Cost</div>
          <div style="font-size:20px;font-weight:bold;color:#1F4E79">${fmt(baseCost)}</div>
        </div>
      </div>
    </div>

    <div class="dgrid" style="grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px;align-items:start">
      <div class="card">
        <h3>Extra Work / Additions</h3>
        <p class="mut" style="font-size:12px">Add polishing, extra fittings, or work outside the BOQ.</p>
        <div class="sc">
          <table class="g">
            <tr><th>Description</th><th>Amount</th><th></th></tr>
            ${extraRows || '<tr><td colspan="3" class="mut">No extra work added.</td></tr>'}
          </table>
        </div>
        <div class="bar noprint">${can ? ba('cpadd', '+ Add Extra Work', '', 'data-type="extra"') : ''}</div>
      </div>

      <div class="card">
        <h3>Payment History</h3>
        <p class="mut" style="font-size:12px">Track advances and milestone payments made to the carpenter.</p>
        <div class="sc">
          <table class="g" style="min-width:450px">
            <tr><th>Date</th><th>Amount</th><th>Mode</th><th>Note</th><th></th></tr>
            ${payRows || '<tr><td colspan="5" class="mut">No payments recorded.</td></tr>'}
          </table>
        </div>
        <div class="bar noprint">${can ? ba('cpadd', '+ Record Payment', '', 'data-type="pay"') : ''}</div>
      </div>
    </div>

    <div class="card" style="border-left:6px solid ${balance <= 0 ? '#15803d' : '#F59E0B'}">
      <h3>Summary</h3>
      <div class="dgrid" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">
        <div><span class="mut">Base Labour Cost</span><br><b>${fmt(baseCost)}</b></div>
        <div><span class="mut">Extra Work</span><br><b>${fmt(extraTotal)}</b></div>
        <div><span class="mut">Total Payable</span><br><b>${fmt(totalPayable)}</b></div>
        <div><span class="mut">Total Paid</span><br><b style="color:#15803d">${fmt(paidTotal)}</b></div>
        <div><span class="mut">Balance Remaining</span><br><b style="color:${balance > 0 ? '#b00020' : '#15803d'}">${fmt(balance)}</b></div>
      </div>
    </div>`;
  }

  // 3. Intercept Project render to show the tab
  if (window.erpTab) {
    const _erpTab = window.erpTab;
    window.erpTab = function(p, T) {
      if (T === 'carp') return carpTab(p);
      return _erpTab(p, T);
    };
  }

  // 4. Handle Add/Delete
  document.addEventListener('click', e => {
    const bAdd = e.target.closest('[data-bza="cpadd"]');
    const bDel = e.target.closest('[data-bza="cpdel"]');
    if (!bAdd && !bDel) return;
    
    e.preventDefault(); e.stopImmediatePropagation();
    const p = (S.bzdoc && S.bzdoc.id) ? BZ.pj[S.bzdoc.id] : BZ.pj[S.pj];
    if (!p || !S.w) return;
    
    p.carp = p.carp || { rate: 0, extras: [], pays: [] };
    
    if (bAdd) {
      const type = bAdd.dataset.type;
      if (type === 'pay') p.carp.pays.push({ date: today(), amt: 0, mode: 'Cash', note: '' });
      else p.carp.extras.push({ desc: '', amt: 0 });
      bzSave('pj', p.id); render();
    } else if (bDel) {
      if (confirm('Delete this record?')) {
        const type = bDel.dataset.type, idx = +bDel.dataset.i;
        if (type === 'pay') p.carp.pays.splice(idx, 1);
        else p.carp.extras.splice(idx, 1);
        bzSave('pj', p.id); render();
      }
    }
  }, true);
  
  // Re-render when rate or amounts change to update totals instantly
  document.addEventListener('change', e => {
    if (e.target.dataset && e.target.dataset.bz && e.target.dataset.bz.startsWith('pj|') && e.target.dataset.bz.includes('carp.')) {
      setTimeout(render, 100);
    }
  });

  console.log('[ModuCraft +] Carpenter Billing loaded');
})();
// ==========================================
// STEP 8 & 9: DEPARTMENT SEGREGATION & ADVANCED ACCESS CONTROL (FIXED)
// ==========================================
(function(){
  'use strict';
  if (window.__mcDeptAclLoaded_v2) return;
  window.__mcDeptAclLoaded_v2 = true;

  window.MC_DEPTS = {
    admin:    { name: '👑 Admin View', tabs: ['h', 'r', 'enq', 'q', 'e', 'p', 'j', 'd', 'f', 'a', 'm', 'v', 's', 'x'] },
    sales:    { name: '💼 Sales & Quotes', tabs: ['enq', 'q', 'e', 'p'] },
    design:   { name: '📐 Design & Site', tabs: ['j', 'd', 'f', 'a'] },
    purchase: { name: '📦 Purchase & Factory', tabs: ['v', 'm', 's'] },
    accounts: { name: '💰 Accounts', tabs: ['h', 'r', 'x'] }
  };

  let curDept = localStorage.getItem('msq_dept') || 'admin';

  // FIX 1: Update the local variable so render() applies the new department immediately
  window.MC_setDept = function(dept) {
    if (!MC_DEPTS[dept]) return;
    curDept = dept; 
    localStorage.setItem('msq_dept', dept);
    if (!MC_DEPTS[dept].tabs.includes(S.tab)) S.tab = 'h';
    render();
  };

  // FIX 2: Fix header layout so dropdown sits nicely next to the nav
  window.MC_injectSwitcher = function() {
    const top = document.querySelector('.top');
    const isOwner = S.role === 'Owner' || S.role === 'Editor' || !S.role;
    
    if (!isOwner) {
      const el = document.getElementById('dept_sw');
      if (el) el.remove();
      return;
    }

    if (!top || document.getElementById('dept_sw')) return;

    const div = document.createElement('div');
    div.id = 'dept_sw';
    div.style.cssText = 'margin-left:auto; display:flex; align-items:center;';
    
    const sel = document.createElement('select');
    sel.style.cssText = 'background:#1F2937; color:#fff; border:1px solid #ffffff44; padding:6px 12px; border-radius:6px; font-weight:bold; cursor:pointer; font-size:13px; outline:none;';
    Object.entries(MC_DEPTS).forEach(([k, v]) => {
      sel.innerHTML += `<option value="${k}" ${k === curDept ? 'selected' : ''}>${v.name}</option>`;
    });

    sel.onchange = (e) => MC_setDept(e.target.value);
    div.appendChild(sel);
    
    const nav = document.getElementById('nav');
    if (nav) {
        // Remove the auto-margin from nav so it sits next to our dropdown
        nav.style.marginLeft = '12px';
        top.insertBefore(div, nav);
    }
  };

  // Keep department locked for non-owners based on their Access & Sharing profile
  const origApplyLvl = window.applyLvl;
  window.applyLvl = function() {
    origApplyLvl();
    if (S.role !== 'Owner' && S.role !== 'Editor') {
      const entry = S.acl.find(x => (x.id && x.id == S.uid) || (x.em && S.myEmail && x.em == S.myEmail.toLowerCase()));
      if (entry && entry.dept && MC_DEPTS[entry.dept]) {
        if (curDept !== entry.dept) {
          curDept = entry.dept;
          localStorage.setItem('msq_dept', curDept);
          if (!MC_DEPTS[curDept].tabs.includes(S.tab)) S.tab = 'h';
        }
      } else {
        if (curDept !== 'sales') {
          curDept = 'sales';
          localStorage.setItem('msq_dept', curDept);
        }
      }
    } else {
      curDept = localStorage.getItem('msq_dept') || 'admin';
    }
  };

  const navObserver = new MutationObserver(() => {
    MC_injectSwitcher();
    const nav = document.getElementById('nav');
    if (!nav) return;
    const allowed = MC_DEPTS[curDept] ? MC_DEPTS[curDept].tabs : MC_DEPTS.admin.tabs;
    nav.querySelectorAll('button[data-a="tab"]').forEach(b => {
      b.style.display = allowed.includes(b.dataset.v) ? '' : 'none';
    });
  });

  if (document.getElementById('nav')) {
    navObserver.observe(document.getElementById('nav'), { childList: true, subtree: true });
  }

  // Rebuild Access & Sharing to include Department selection
  window.vShare = function() {
    if(window.__OFFLINE) return licInfoCard()+(localStorage.getItem('msq_owner_key')?licOwnerCard():'');
    const adm = S.role=='Owner'||S.role=='Editor';
    const deptOpts = Object.entries(MC_DEPTS).map(([k, v]) => `<option value="${k}">${v.name}</option>`).join('');

    const userRows = S.acl.map(x => {
      const cDept = x.dept || 'admin';
      return `<tr>
        <td ${x.id?`data-pn="${esc(x.id)}"`:''}>${x.id?'…':esc(x.em)}</td>
        <td><select data-acl="${esc(x.id||x.em)}">${Object.entries(LN).map(([k,v])=>`<option value="${k}"${x.lvl==k?' selected':''}>${v}</option>`).join('')}</select></td>
        <td><select data-acldept="${esc(x.id||x.em)}">${Object.entries(MC_DEPTS).map(([k,v])=>`<option value="${k}"${cDept==k?' selected':''}>${v.name}</option>`).join('')}</select></td>
        <td><button class="g" data-a="acx" data-id="${esc(x.id||x.em)}">Remove</button></td>
      </tr>`;
    }).join('') || '<tr><td colspan=4 class="mut">No one listed yet.</tr>';

    return `<div class="card">
      <h2>Access & Sharing</h2>
      <p>Your access: <b>${esc(S.role||'Unknown')}</b> • screen level: <b>${LN[S.lvl||'full']}</b></p>
      <div class="bar"><input id="lnk" readonly value="${ARTL}" style="max-width:420px"><button data-a="cp">Copy app link</button></div>
    </div>
    ${adm?`<div class="card">
      <h3>People &amp; access levels</h3>
      <p class="mut">Invite the person in claude.ai → <b>Share</b> (Viewer = cannot save, Contributor = can save). Then add their email below and select their <b>Department</b> to lock their screen.</p>
      <div class="bar">
        <input id="aem" type="email" placeholder="Email address" style="max-width:220px">
        <select id="alv" style="max-width:200px">${Object.entries(LN).map(([k,v])=>`<option value="${k}"${k=='view'?' selected':''}>${v}</option>`).join('')}</select>
        <select id="adept" style="max-width:180px">${deptOpts}</select>
        <button data-a="ae">Add User</button>
      </div>
      <input id="psq" data-ps placeholder="Or search a person by name…" style="max-width:340px">
      <div id="psr"></div>
      <div class="sc">
        <table class="g" style="min-width:640px">
          <tr><th>Person / Email</th><th>Access Level</th><th>Department Lock</th><th></th></tr>
          ${userRows}
        </table>
      </div>
    </div>`:''}
    ${adm?teamCard()+licOwnerCard():''}
    <div class="card"><h3>Important</h3><p>Department locks control what each person's <b>screen</b> shows. Everyone invited to the app technically receives its stored data, so a technically skilled person could still look up rates.</p></div>`;
  };

  // Handle saving Department lock changes in the table
  document.addEventListener('change', e => {
    if (e.target.dataset.acldept) {
      const id = e.target.dataset.acldept;
      const entry = S.acl.find(a => (a.id || a.em) == id);
      if (entry) {
        entry.dept = e.target.value;
        saveAcl();
        flash('Department lock updated');
      }
    }
  });

  // Handle Add User button
  document.addEventListener('click', e => {
    const bAdd = e.target.closest('[data-a="ae"]');
    if (!bAdd) return;
    e.preventDefault(); e.stopImmediatePropagation();
    
    const em = (document.getElementById('aem').value || '').trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(em)) return flash('Enter a valid email address');
    
    const lv = document.getElementById('alv').value;
    const dept = document.getElementById('adept').value;
    
    S.acl = S.acl.filter(x => x.em != em);
    S.acl.push({ em, lvl: lv, dept });
    saveAcl();
    render();
    
    window.open('mailto:' + em + '?subject=' + encodeURIComponent('Access to ' + co().name + ' quotation app') + '&body=' + encodeURIComponent('Hello,\n\nPlease open our quotation app: ' + ARTL + '\n(Sign in to claude.ai with this email address.)\n\nYour access level: ' + LN[lv] + '\nDepartment: ' + MC_DEPTS[dept].name + '\n\n' + co().name), '_blank');
  }, true);

  // Admin Dashboard Metrics
  const origTodayCard = todayCard;
  todayCard = function() {
    let html = origTodayCard();
    if (curDept !== 'admin' && curDept !== 'accounts') return html;

    const pjs = Object.values(BZ.pj).filter(isProjectActive);
    const qs = Object.values(S.q);
    const pos = Object.values(BZ.po);

    const totalPipeline = qs.filter(q => q.st === 'shared' && q.out !== 'lost').reduce((a, q) => a + gt(q), 0);
    let totalReceivable = 0;
    pjs.forEach(p => { const r = pjRcv(p), v = +p.val || 0; if (v > r) totalReceivable += (v - r); });
    const pendingVendors = pos.filter(p => ['Draft', 'Sent', 'Part received'].includes(p.st)).length;

    const metricsHtml = `
      <div class="dgrid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin: 15px 0;">
        <div class="card" style="margin:0; border-top:4px solid #1F4E79;"><div class="mut" style="font-size:11px">Sales Pipeline</div><div style="font-size:22px; font-weight:bold; color:#1F4E79;">${fmt(totalPipeline)}</div></div>
        <div class="card" style="margin:0; border-top:4px solid #22C55E;"><div class="mut" style="font-size:11px">Active Projects</div><div style="font-size:22px; font-weight:bold; color:#22C55E;">${pjs.length}</div></div>
        <div class="card" style="margin:0; border-top:4px solid #EF4444;"><div class="mut" style="font-size:11px">Receivables (To Collect)</div><div style="font-size:22px; font-weight:bold; color:#EF4444;">${fmt(totalReceivable)}</div></div>
        <div class="card" style="margin:0; border-top:4px solid #F59E0B;"><div class="mut" style="font-size:11px">POs Pending</div><div style="font-size:22px; font-weight:bold; color:#F59E0B;">${pendingVendors}</div></div>
      </div>`;

        // Safely prepend the Metrics card
    html = metricsHtml + html;
    return html;
  };

  // Override render to enforce the locked state
  const _render = window.render;
  window.render = function() {
    MC_injectSwitcher();
    _render.apply(this, arguments);
    const allowed = MC_DEPTS[curDept] ? MC_DEPTS[curDept].tabs : MC_DEPTS.admin.tabs;
    document.querySelectorAll('#nav button[data-a="tab"]').forEach(b => {
      b.style.display = allowed.includes(b.dataset.v) ? '' : 'none';
    });
  };

  console.log('[ModuCraft +] Department Segregation & Advanced Access v2 loaded');
})();
// ==========================================
// STEP 10: SET BROWSER TAB FAVICON TO APP LOGO
// ==========================================
(function(){
  'use strict';
  function setFavicon() {
    const logoImg = document.getElementById('tl');
    // Only run if the logo image exists and has loaded a base64/src
    if (logoImg && logoImg.src) {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.type = 'image/png';
      link.href = logoImg.src;
    }
  }

  // Run when the page loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setFavicon);
  } else {
    setFavicon();
  }
})();
// ==========================================
// STEP 11: GLOBAL SEARCH & MOBILE BOTTOM NAV (PHASE 3)
// ==========================================
(function(){
  'use strict';
  if (window.__mcPhase3Loaded) return;
  window.__mcPhase3Loaded = true;

  // 1. Inject CSS for the new UI elements
  const css = document.createElement('style');
  css.textContent = `
    /* Global Search Styles */
    #gs-wrap { position: relative; margin-left: 10px; margin-right: auto; }
    #gs-input { background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); color: #fff; padding: 6px 12px 6px 30px; border-radius: 20px; width: 200px; font-size: 13px; transition: all 0.3s; }
    #gs-input:focus { width: 280px; background: rgba(255,255,255,0.25); outline: none; border-color: #fff; }
    #gs-input::placeholder { color: rgba(255,255,255,0.6); }
    #gs-icon { position: absolute; left: 10px; top: 8px; font-size: 12px; color: rgba(255,255,255,0.7); }
    #gs-results { position: absolute; top: 40px; left: 0; width: 320px; background: var(--card); color: var(--ink); border: 1px solid var(--line); border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); z-index: 100000; display: none; max-height: 400px; overflow-y: auto; }
    .gs-item { padding: 10px 12px; border-bottom: 1px solid var(--line); cursor: pointer; transition: background 0.2s; }
    .gs-item:hover { background: var(--in); }
    .gs-item b { display: block; font-size: 14px; margin-bottom: 2px; }
    .gs-item span { font-size: 11px; color: var(--mut); }
    .gs-badge { display: inline-block; font-size: 10px; padding: 1px 6px; border-radius: 4px; background: #1F4E79; color: #fff; margin-right: 6px; }

    /* Mobile Bottom Nav Styles */
    #mob-nav { display: none; position: fixed; bottom: 0; left: 0; right: 0; background: var(--card); border-top: 1px solid var(--line); z-index: 99999; padding-bottom: env(safe-area-inset-bottom, 0px); }
    .mob-btn { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 8px 0; background: transparent; border: 0; color: var(--mut); font-size: 10px; cursor: pointer; }
    .mob-btn.on { color: var(--gold); font-weight: bold; }
    .mob-btn i { font-size: 20px; margin-bottom: 2px; font-style: normal; }
    
    @media screen and (max-width: 900px) {
      #mob-nav { display: flex; }
      body { padding-bottom: 65px; } /* Prevent content from hiding behind nav */
      nav#nav { display: none !important; } /* Hide desktop nav */
      #gs-wrap { display: none; } /* Hide search on mobile for space */
      #dept_sw { margin-left: auto !important; }
    }
  `;
  document.head.appendChild(css);

  // 2. Inject the HTML elements
  const topBar = document.querySelector('.top');
  if (topBar && !document.getElementById('gs-wrap')) {
    const searchWrap = document.createElement('div');
    searchWrap.id = 'gs-wrap';
    searchWrap.innerHTML = `
      <span id="gs-icon">🔍</span>
      <input id="gs-input" placeholder="Search clients, projects, quotes..." autocomplete="off">
      <div id="gs-results"></div>
    `;
    topBar.appendChild(searchWrap);

    const mobNav = document.createElement('div');
    mobNav.id = 'mob-nav';
    mobNav.innerHTML = `
      <button class="mob-btn" data-mob-tab="h"><i>🏠</i>Home</button>
      <button class="mob-btn" data-mob-tab="q"><i>📄</i>Quotes</button>
      <button class="mob-btn" data-mob-tab="j"><i>🏗️</i>Projects</button>
      <button class="mob-btn" data-mob-tab="s"><i>⚙️</i>Menu</button>
    `;
    document.body.appendChild(mobNav);
  }

  // 3. Global Search Logic
  const input = document.getElementById('gs-input');
  const results = document.getElementById('gs-results');

  if (input) {
    input.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      if (q.length < 2) { results.style.display = 'none'; return; }
      
      let html = '';
      let count = 0;

      // Search Quotations
      Object.values(S.q).forEach(x => {
        if (count > 15) return;
        const match = (x.name||'').toLowerCase().includes(q) || (x.project||'').toLowerCase().includes(q) || (qno(x)||'').toLowerCase().includes(q);
        if (match) {
          html += `<div class="gs-item" data-gs-act="q" data-id="${x.id}"><b><span class="gs-badge">Quote</span> ${esc(x.name)}</b><span>${esc(x.project)} • ${qno(x)}</span></div>`;
          count++;
        }
      });

      // Search Projects
      Object.values(BZ.pj).forEach(x => {
        if (count > 15) return;
        const match = (x.name||'').toLowerCase().includes(q) || (x.client||'').toLowerCase().includes(q) || (x.addr||'').toLowerCase().includes(q);
        if (match) {
          html += `<div class="gs-item" data-gs-act="p" data-id="${x.id}"><b><span class="gs-badge" style="background:#22C55E">Project</span> ${esc(x.name)}</b><span>${esc(x.client)} • ${esc(x.stage)}</span></div>`;
          count++;
        }
      });

      // Search Enquiries
      Object.values(window.ENQ || {}).forEach(x => {
        if (count > 15) return;
        const match = (x.name||'').toLowerCase().includes(q) || (x.project||'').toLowerCase().includes(q) || (x.phone||'').toLowerCase().includes(q);
        if (match) {
          html += `<div class="gs-item" data-gs-act="e" data-id="${x.id}"><b><span class="gs-badge" style="background:#F59E0B">Enquiry</span> ${esc(x.name)}</b><span>${esc(x.project)} • ${esc(x.phone)}</span></div>`;
          count++;
        }
      });

      if (html) {
        results.innerHTML = html;
        results.style.display = 'block';
      } else {
        results.innerHTML = '<div style="padding:12px;font-size:13px;color:#666">No results found.</div>';
        results.style.display = 'block';
      }
    });

    // Close search when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#gs-wrap')) results.style.display = 'none';
    });
  }

  // 4. Handle Search Result Clicks
  document.addEventListener('click', (e) => {
    const item = e.target.closest('[data-gs-act]');
    if (!item) return;
    const act = item.dataset.gsAct, id = item.dataset.id;
    
    results.style.display = 'none';
    input.value = '';

    if (act === 'q') { S.tab = 'e'; S.cur = id; render(); }
    else if (act === 'p') { S.tab = 'j'; S.pj = id; S.pt = 'ov'; render(); }
    else if (act === 'e') { S.tab = 'enq'; render(); } // In future, we can auto-open the modal
  });

  // 5. Handle Mobile Bottom Nav Clicks
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-mob-tab]');
    if (!btn) return;
    S.tab = btn.dataset.mobTab;
    render();
  });

  // 6. Keep active states updated on render
  const _render = window.render;
  window.render = function() {
    _render.apply(this, arguments);
    // Update mobile nav active state
    document.querySelectorAll('[data-mob-tab]').forEach(b => {
      b.classList.toggle('on', b.dataset.mobTab === S.tab);
    });
  };

  console.log('[ModuCraft +] Global Search & Mobile Nav loaded');
})();
// ==========================================
// STEP 12: DESIGN-FIRST WORKFLOW & SETTINGS
// ==========================================
(function(){
  'use strict';
  if (window.__mcDesignFirstLoaded_v2) return;
  window.__mcDesignFirstLoaded_v2 = true;

  // 1. Create a helper to generate a Draft Quote from an Enquiry
  window.mc_createDraftFromEnq = function(enqId) {
    const enq = window.ENQ[enqId];
    if (!enq) return null;

    // Check if a quote exists
    let existing = Object.values(S.q).find(q => q.enqId === enqId);
    if (existing) return existing.id;

    // Create new
    const newQid = 'q' + Date.now().toString(36);
    const newQ = {
      id: newQid,
      enqId: enqId,
      ts: Date.now(),
      name: enq.name,
      contact: enq.phone,
      project: enq.project,
      by: lastBy() || uName(),
      address: '',
      date: new Date().toISOString().slice(0, 10),
      rooms: [{
        id: 'r' + Date.now().toString(36),
        t: 'MASTER BEDROOM',
        name: 'MASTER BEDROOM',
        w: 0,
        rate: '',
        rows: [],
        dim: { L: 3600, W: 3000, H: 2700 }
      }],
      ir: {},
      grp: newQid,
      rev: 0,
      seq: 1,
      st: 'draft',
      pay: cl(S.set.pay),
      notes: S.set.notes
    };

    S.q[newQid] = newQ;
    enq.status = 'Quoted';
    if (window.saveEnq) window.saveEnq();
    save('q', newQid);
    return newQid;
  };

  // 2. Inject the "Start Design" screen when no quote is selected
  function renderDesignStarter() {
    const enqs = Object.values(window.ENQ || {}).filter(e => e.status !== 'Lost' && e.status !== 'Won');
    
    const cards = enqs.map(e => `
      <div class="card" style="margin-bottom:10px; display:flex; align-items:center; justify-content:space-between; border-left:4px solid #B08D57;">
        <div>
          <b style="font-size:16px;color:#1F4E79">${esc(e.name)}</b><br>
          <span class="mut" style="font-size:12px">${esc(e.project || 'No project')} • ${esc(e.phone)}</span>
        </div>
        <button data-ds-start="${e.id}" style="background:#B08D57;color:#fff;border:0;border-radius:6px;padding:8px 16px;font-weight:bold;cursor:pointer">Start Designing →</button>
      </div>
    `).join('');

    return `<div class="card">
      <h2>🎨 Design Workspace</h2>
      <p class="mut">Select an active Enquiry (Lead) to start designing. A draft quotation will be created automatically in the background.</p>
      <div class="bar noprint" style="margin-bottom:16px;">
        <button data-a="tab" data-v="enq" class="g">+ Create New Enquiry</button>
        <button data-a="tab" data-v="q" class="g">View Existing Quotations</button>
      </div>
      ${cards || '<div class="warn">No active enquiries found. Please create a new enquiry first.</div>'}
    </div>`;
  }

  // 3. Extract the Settings HTML so it can be used in Design and Floor Plan
  function getDesignSettingsHTML(q) {
    const s = S.set;
    const IO = srt(s.items,i=>i.n).map(i=>`<option>${esc(i.n)}</option>`).join('');
    
    // We replicate the exact block from Image 2 using the app's native data binding (data-d="q")
    return `<details class="card" style="margin-bottom:12px; background:var(--in); border:1px solid var(--line);">
      <summary style="font-weight:bold; color:#1F4E79; cursor:pointer; padding:4px;">⚙️ Project Materials, Hardware & Pricing Settings</summary>
      <div class="fg" style="margin-top:10px;">
        ${(q.pm=q.pm||{},'')}
        ${GR3.map((g,gi)=>`<div><label>Ply maker — ${g}</label><input list="dl_pm${gi}" data-d="q" data-p="pm|${g}" data-newmk="${g}" value="${esc(brandFor(q,g))}" placeholder="type any maker"><datalist id="dl_pm${gi}">${brandsFor(g).map(b=>`<option value="${esc(b)}">`).join('')}</datalist></div>`).join('')}
        <div><label>Hardware / accessories company</label><input list="dl_hw" data-d="q" data-p="hw" data-newhw value="${esc(q.hw||'Local')}" placeholder="type any company"><datalist id="dl_hw">${BRANDS.map(b=>`<option value="${esc(b)}">`).join('')}</datalist></div>
        <div><label>Carcass finish — all units (BSL: both sides)</label>${SEL('q','cf',q.cf||FIN0,lamNames())}</div>
        <div><label>Inner laminate code / colour</label>${I('q','ccol',q.ccol||'','placeholder="e.g. White 8112"')}</div>
        <div><label>Outer laminate code / colour</label>${I('q','scol',q.scol||'','placeholder="e.g. Walnut W12"')}</div>
        <div><label>Shutter finish — outer</label>${SEL('q','fo',q.fo||FIN0,S.set.fin.map(x=>x.n))}</div>
        <div><label>Shutter finish — inner</label>${SEL('q','fi',q.fi||FIN0,S.set.fin.map(x=>x.n))}</div>
        <div><label>Pricing basis</label>
          <select data-d="q" data-p="pmo">
            <option value="Module rates" ${q.pmo==='Module rates'||!q.pmo?'selected':''}>Module rates (auto-calculated)</option>
            <option value="Room base" ${q.pmo==='Room base'?'selected':''}>Room base (per sq.ft)</option>
            <option value="Package" ${q.pmo==='Package'?'selected':''}>Package (flat price per room)</option>
            <option value="Material costing" ${q.pmo==='Material costing'?'selected':''}>Material costing (Internal only)</option>
          </select>
        </div>
        <div style="grid-column: 1 / -1; border-top: 1px dashed var(--line); margin-top: 10px; padding-top: 10px;">
          <label style="font-weight: bold; color: var(--gold);">Discounts by Section (%)</label>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-top:4px;">
            <div><label>Wooden Work %</label>${N('q','dw',q.dw||0)}</div>
            <div><label>Hardware & Accessories %</label>${N('q','dh',q.dh||0)}</div>
            <div><label>Site / Civil Work %</label>${N('q','ds',q.ds||0)}</div>
          </div>
        </div>
        <div><label>Electrical fittings included in the total?</label>${SEL('q','elx',q.elx||'Yes',['Yes','No'])}</div>
      </div>
    </details>`;
  }

  // 4. Override the Design and Floor Plan tabs
  const origVDesign = window.vDesign;
  window.vDesign = function() {
    if (!S.cur || !S.q[S.cur]) return renderDesignStarter();
    const q = S.q[S.cur];
    return getDesignSettingsHTML(q) + origVDesign();
  };

  const origVPlan = window.vPlan;
  window.vPlan = function() {
    if (!S.cur || !S.q[S.cur]) return renderDesignStarter();
    const q = S.q[S.cur];
    return getDesignSettingsHTML(q) + origVPlan();
  };

  // 5. Handle clicking the "Start Designing" button in the new Dashboard
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('[data-ds-start]');
    if (!btn) return;
    e.preventDefault();
    
    const enqId = btn.dataset.dsStart;
    const newQid = window.mc_createDraftFromEnq(enqId);
    
    if (newQid) {
      S.cur = newQid;
      // If they clicked from the Floor Plan tab, keep them there. 
      // If they clicked from Design tab, keep them there.
      render();
      flash('Draft quotation created! You can now design.');
    }
  });

  // 6. Add the button to the Enquiry tab too
  const origVEnq = window.vEnq;
  window.vEnq = function() {
    let html = origVEnq();
    Object.values(window.ENQ).forEach(e => {
      const target = `<button class="g" data-enq-act="edit" data-id="${e.id}">Edit</button>`;
      const designBtn = `<button data-ds-start="${e.id}" style="background:#B08D57;color:#fff;border:0;border-radius:6px;padding:4px 10px;cursor:pointer;margin-left:4px">🎨 Design</button>`;
      if (html.includes(target) && !html.includes(`data-ds-start="${e.id}"`)) {
        html = html.replace(target, target + designBtn);
      }
    });
    return html;
  };

  console.log('[ModuCraft +] Design-First Workflow v2 loaded');
})();

// ==========================================
// FIX: Mobile navigation (all tabs, department-aware, "More" sheet)
// ==========================================
(function () {
  'use strict';
  if (window.__mcMobNavFix) return;
  window.__mcMobNavFix = true;

  const LABELS = {
    h:   ['🏠', 'Home'],
    q:   ['📄', 'Quotations'],
    j:   ['🏗️', 'Projects'],
    v:   ['📦', 'Vendors'],
    r:   ['📊', 'Reports'],
    e:   ['✏️', 'Edit'],
    p:   ['👁️', 'Preview'],
    a:   ['🔧', 'Accessories'],
    m:   ['📐', 'Ply & Hardware'],
    d:   ['🎨', 'Design'],
    f:   ['📏', 'Floor Plan'],
    s:   ['⚙️', 'Settings'],
    x:   ['🔐', 'Access & Sharing'],
    enq: ['📋', 'Enquiries']
  };

  function currentDept() {
    try { return localStorage.getItem('msq_dept') || 'admin'; }
    catch (e) { return 'admin'; }
  }

  function allowedTabs() {
    const deptTabs = (window.MC_DEPTS && MC_DEPTS[currentDept()])
      ? MC_DEPTS[currentDept()].tabs
      : null;
    return Object.keys(LABELS).filter(function (k) {
      if (typeof navOK === 'function' && !navOK(k)) return false;
      if (deptTabs && !deptTabs.includes(k)) return false;
      return true;
    });
  }

  function rebuildMobileNav() {
    const mob = document.getElementById('mob-nav');
    if (!mob) return;
    const A = allowedTabs();
    const quick = ['h', 'q', 'j'].filter(function (k) { return A.includes(k); });
    const showMoreActive = !quick.includes(S.tab);
    let html = '';
    quick.forEach(function (k) {
      const pair = LABELS[k];
      const on = S.tab === k ? ' on' : '';
      html += '<button class="mob-btn' + on + '" data-mob-tab="' + k + '">' +
              '<i>' + pair[0] + '</i>' + pair[1] + '</button>';
    });
    html += '<button class="mob-btn' + (showMoreActive ? ' on' : '') +
            '" data-mob-more="1"><i>☰</i>More</button>';
    mob.innerHTML = html;
  }

  function openMenu() {
    const A = allowedTabs();
    const prev = document.getElementById('mob-menu');
    if (prev) prev.remove();

    const overlay = document.createElement('div');
    overlay.id = 'mob-menu';
    overlay.style.cssText =
      'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:100002;' +
      'display:flex;align-items:flex-end;justify-content:center;' +
      'padding:12px 12px calc(76px + env(safe-area-inset-bottom,0px))';

    const box = document.createElement('div');
    box.style.cssText =
      'background:var(--card,#fff);color:var(--ink,#222);border-radius:16px;' +
      'padding:14px;max-width:460px;width:100%;max-height:72vh;overflow-y:auto;' +
      'box-shadow:0 -12px 40px rgba(0,0,0,.4)';

    let html = '<h3 style="margin:0 0 10px;text-align:center;color:var(--gr,#4D5A4A)">Menu</h3>';
    A.forEach(function (k) {
      const pair = LABELS[k];
      const on = S.tab === k;
      html += '<button data-mob-go="' + k + '" style="display:flex;align-items:center;' +
        'gap:12px;width:100%;margin:4px 0;padding:12px 14px;' +
        'border:1px solid ' + (on ? 'var(--gold,#B08D57)' : 'var(--line,#ddd)') + ';' +
        'background:' + (on ? 'var(--gold,#B08D57)' : 'var(--in,#faf8f4)') + ';' +
        'color:' + (on ? '#fff' : 'var(--ink,#222)') + ';' +
        'border-radius:10px;font-size:15px;font-weight:600;cursor:pointer;text-align:left">' +
        '<span style="font-size:20px">' + pair[0] + '</span>' +
        '<span>' + pair[1] + '</span></button>';
    });
    html += '<button id="mob-menu-close" style="width:100%;margin-top:10px;padding:10px;' +
      'border:1px solid var(--line,#ddd);background:transparent;color:var(--ink,#222);' +
      'border-radius:10px;font-size:14px;cursor:pointer">Close</button>';
    box.innerHTML = html;
    overlay.appendChild(box);

    overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });
    box.querySelector('#mob-menu-close').onclick = function () { overlay.remove(); };
    box.querySelectorAll('[data-mob-go]').forEach(function (b) {
      b.onclick = function () {
        S.tab = b.dataset.mobGo;
        overlay.remove();
        render();
      };
    });
    document.body.appendChild(overlay);
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('[data-mob-more]')) {
      e.preventDefault();
      e.stopImmediatePropagation();
      openMenu();
    }
  }, true);

  const _render = window.render;
  if (_render) {
    window.render = function () {
      _render.apply(this, arguments);
      try { rebuildMobileNav(); } catch (e) {}
    };
  }

  const _setDept = window.MC_setDept;
  if (_setDept) {
    window.MC_setDept = function (dept) {
      if (!window.MC_DEPTS || !MC_DEPTS[dept]) return;
      if (!MC_DEPTS[dept].tabs.includes(S.tab)) {
        S.tab = MC_DEPTS[dept].tabs[0] || 'h';
      }
      _setDept(dept);
    };
  }

  setTimeout(rebuildMobileNav, 500);
  window.addEventListener('resize', function () {
    clearTimeout(window.__mobNavT);
    window.__mobNavT = setTimeout(rebuildMobileNav, 200);
  });
})();

// ==========================================
// FIX: Public Enquiries Sync (Date, Time, Platform)
// ==========================================
(function() {
  if (window.__mcEnqSyncLoaded) return;
  window.__mcEnqSyncLoaded = true;

  const GOOGLE_URL = "https://script.google.com/macros/s/AKfycbwgMExM7rKaDkJ4-LvUnb_HLpO4TL4-CKDkNEzuSWLiExCetpAT0sox2A1_-NL9clRM/exec";
  const API_KEY = "ModuCraft@2026";

  async function fetchEnquiries() {
    try {
      const res = await fetch(GOOGLE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'read', collection: 'enquiries', apiKey: API_KEY })
      });
      const data = await res.json();
      
      if (data.ok && data.data) {
        let updated = false;
        Object.values(data.data).forEach(row => {
          if (!window.ENQ[row.id]) {
            window.ENQ[row.id] = {
              id: row.id,
              name: row.name,
              phone: row.phone,
              project: row.project,
              budget: row.budget,
              notes: row.notes,
              platform: row.platform || 'App',
              date: row.date ? row.date.split('T')[0] : new Date().toISOString().split('T')[0],
              time: row.date ? new Date(row.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '',
              status: 'Enquiry'
            };
            updated = true;
          }
        });
        
        if (updated) {
          window.saveEnq();
          if (S.tab === 'enq') render();
        }
      }
    } catch(e) {
      console.log("Enquiry sync error:", e);
    }
  }

  // Override the Enquiries View to show Platform, Date & Time
  const _vEnq = window.vEnq;
  window.vEnq = function() {
    let html = _vEnq();
    html = html.replace('<th>Next Follow Up</th>', '<th>Source & Date</th><th>Next Follow Up</th>');
    
    Object.values(window.ENQ).forEach(e => {
      const rowTarget = `<tr><td><b>${esc(e.name)}</b><br><span class="mut">${esc(e.phone)}</span></td><td>${esc(e.project)}</td><td>${esc(e.budget || '—')}</td>`;
      const sourceInfo = `<td><b style="color:#B08D57">${esc(e.platform || 'Manual')}</b><br><span class="mut" style="font-size:11px">${dmy(e.date)} ${e.time || ''}</span></td>`;
      
      if (html.includes(rowTarget)) {
        html = html.replace(rowTarget, rowTarget + sourceInfo);
      }
    });
    
    return html;
  };

  setTimeout(fetchEnquiries, 1500);
  setInterval(fetchEnquiries, 15000);

  document.addEventListener('click', e => {
    if (e.target.closest && e.target.closest('[data-enq-act="refresh"]')) {
      e.preventDefault();
      fetchEnquiries();
      alert("Checking for new enquiries...");
    }
  });

  const _render = window.render;
  window.render = function() {
    _render.apply(this, arguments);
    if (S.tab === 'enq') {
      setTimeout(() => {
        const bar = document.querySelector('.card .bar.noprint');
        if (bar && !bar.querySelector('[data-enq-act="refresh"]')) {
          bar.innerHTML += `<button class="g" data-enq-act="refresh" style="margin-left:10px">↻ Sync</button>`;
        }
      }, 100);
    }
  };
})();

// ==========================================
// ENHANCED ENQUIRIES: Filtering, Grouping, Deleting
// ==========================================
(function() {
  if (window.__mcEnqManagerLoaded) return;
  window.__mcEnqManagerLoaded = true;

  const GOOGLE_URL = "https://script.google.com/macros/s/AKfycbwgMExM7rKaDkJ4-LvUnb_HLpO4TL4-CKDkNEzuSWLiExCetpAT0sox2A1_-NL9clRM/exec";
  const API_KEY = "ModuCraft@2026";

  // 1. Handle Deleting
  window.mcDeleteEnq = async function(id) {
    if(!confirm("Are you sure you want to permanently delete this enquiry? This will also remove it from Google Sheets.")) return;
    
    // Remove from local memory and save
    delete window.ENQ[id];
    window.saveEnq();
    
    // Remove from Google Sheets
    try {
      await fetch(GOOGLE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'delete', collection: 'enquiries', id: id, apiKey: API_KEY })
      });
    } catch(e) { console.log("Failed to delete from cloud", e); }
    
    render(); // Refresh screen
  };

  // 2. Handle Status Changes
  window.mcUpdateEnqStatus = function(id, newStatus) {
    if(window.ENQ[id]) {
      window.ENQ[id].status = newStatus;
      window.saveEnq();
      render(); // Refresh to move it to the right tab
    }
  };

  // 3. The New Enquiries View
  const _vEnq = window.vEnq;
  window.vEnq = function() {
    // Get all enquiries and sort by date (newest first)
    const allEnqs = Object.values(window.ENQ || {}).sort((a,b) => {
      const d1 = new Date(a.date + ' ' + (a.time || '00:00')).getTime();
      const d2 = new Date(b.date + ' ' + (b.time || '00:00')).getTime();
      return d2 - d1;
    });

    if (!S.enqFilter) S.enqFilter = 'all';
    
    // Tabs definition
    const tabs = [
      ['all', 'All Leads'],
      ['new', 'New'],
      ['followup', 'Follow-up'],
      ['quoted', 'Quoted'],
      ['won', 'Won 🏆'],
      ['lost', 'Lost ❌']
    ];

    // Filter logic
    const filtered = allEnqs.filter(e => {
      if (S.enqFilter === 'all') return true;
      const st = (e.status || 'Enquiry').toLowerCase();
      if (S.enqFilter === 'new') return st === 'enquiry' || st === 'new';
      if (S.enqFilter === 'quoted') return st === 'quoted';
      if (S.enqFilter === 'won') return st === 'won';
      if (S.enqFilter === 'lost') return st === 'lost';
      if (S.enqFilter === 'followup') return e.nfu && e.nfu <= today();
      return true;
    });

    // Group by Date
    const grouped = {};
    filtered.forEach(e => {
      let dateStr = e.date || new Date().toISOString().split('T')[0];
      // Format the date nicely
      const dObj = new Date(dateStr);
      const isToday = dateStr === today();
      const isYesterday = dateStr === addDays(today(), -1);
      
      const displayDate = isToday ? "TODAY" : isYesterday ? "YESTERDAY" : dObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      
      if (!grouped[displayDate]) grouped[displayDate] = [];
      grouped[displayDate].push(e);
    });

    // Build UI
    let html = `<div class="card" style="border-top: 4px solid #1F4E79;">
      <div class="bar noprint">
        <h2>Enquiries & Leads</h2>
        <button data-enq-act="new" style="background:#1F4E79;color:#fff;border:0;border-radius:6px;padding:6px 12px;font-weight:600;cursor:pointer;margin-left:auto">+ Manual Enquiry</button>
        <button class="g" data-enq-act="refresh" style="margin-left:8px">↻ Sync</button>
      </div>
      
      <div class="bar" style="margin-bottom:15px; gap:5px; flex-wrap:wrap;">
        ${tabs.map(([key, label]) => {
          const active = S.enqFilter === key;
          const count = key === 'all' ? allEnqs.length : allEnqs.filter(e => {
            const st = (e.status || 'Enquiry').toLowerCase();
            if(key === 'new') return st === 'enquiry' || st === 'new';
            if(key === 'followup') return e.nfu && e.nfu <= today();
            return st === key;
          }).length;
          
          return `<button class="${active ? '' : 'g'}" style="padding:5px 15px; border-radius:20px; ${active ? 'background:#B08D57;border-color:#B08D57;color:#fff;' : ''}" data-enq-filter="${key}">${label} (${count})</button>`;
        }).join('')}
      </div>`;

    if (Object.keys(grouped).length === 0) {
      html += `<p class="mut" style="text-align:center; padding: 20px;">No enquiries found in this category.</p>`;
    } else {
      Object.keys(grouped).forEach(dateLabel => {
        html += `<div style="margin-top: 15px; margin-bottom: 5px; font-weight: bold; color: #666; font-size: 13px; border-bottom: 2px solid #eee; padding-bottom: 4px;">📅 ${dateLabel}</div>`;
        html += `<div class="sc"><table class="g" style="min-width: 950px;">
          <tr>
            <th style="width: 20%;">Client Details</th>
            <th style="width: 25%;">Project / Address</th>
            <th style="width: 15%;">Budget & Source</th>
            <th style="width: 15%;">Status</th>
            <th style="width: 25%; text-align: right;">Actions</th>
          </tr>`;
          
        grouped[dateLabel].forEach(e => {
          const stColor = e.status === 'Won' ? '#15803d' : e.status === 'Lost' ? '#b00020' : '#1F4E79';
          
          html += `<tr>
            <td>
              <b style="font-size: 15px;">${esc(e.name)}</b><br>
              <span class="mut" style="font-size:12px">📞 ${esc(e.phone)}</span><br>
              <span class="mut" style="font-size:11px">${e.email ? '✉️ '+esc(e.email) : ''}</span>
            </td>
            <td>
              <b>${esc(e.project || '—')}</b><br>
              <span class="mut" style="font-size:11px">📍 ${esc(e.address || 'No address')}</span>
            </td>
            <td>
              <b style="color:#B08D57">${esc(e.budget || '—')}</b><br>
              <span class="mut" style="font-size:11px">${esc(e.platform || 'Website')} • ${e.time || ''}</span>
              ${e.notes ? `<br><button class="g" onclick="alert('REQUIREMENTS:\\n\\n' + \`${esc(e.notes).replace(/`/g, "'")}\`)" style="padding:2px 6px;font-size:10px;margin-top:4px">View Details</button>` : ''}
            </td>
            <td>
              <select onchange="mcUpdateEnqStatus('${e.id}', this.value)" style="font-weight: bold; color: ${stColor}; border-color: ${stColor}; padding: 4px; border-radius: 4px;">
                <option value="Enquiry" ${e.status === 'Enquiry' ? 'selected' : ''}>New</option>
                <option value="Quoted" ${e.status === 'Quoted' ? 'selected' : ''}>Quoted</option>
                <option value="Won" ${e.status === 'Won' ? 'selected' : ''}>Won</option>
                <option value="Lost" ${e.status === 'Lost' ? 'selected' : ''}>Lost</option>
              </select>
            </td>
            <td style="text-align: right; white-space: nowrap;">
              <button class="g" data-enq-act="edit" data-id="${e.id}" style="padding: 4px 8px; font-size: 12px;">Edit</button>
              ${e.status !== 'Won' ? `<button data-enq-act="convert" data-id="${e.id}" style="background:#1F4E79;color:#fff;border:0;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:12px;margin-left:4px">Quote</button>` : ''}
              <button onclick="mcDeleteEnq('${e.id}')" style="background:#fee2e2;color:#b91c1c;border:1px solid #fca5a5;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:12px;margin-left:4px;font-weight:bold;">🗑️</button>
            </td>
          </tr>`;
        });
        html += `</table></div>`;
      });
    }
    html += `</div>`;
    return html;
  };

  // 4. Handle Filter Clicks
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('[data-enq-filter]');
    if (btn) {
      e.preventDefault();
      S.enqFilter = btn.dataset.enqFilter;
      render();
    }
  });
})();

// ==========================================
// STEP 13: ADVANCED FINANCIAL REPORTING (P&L) - FINAL
// ==========================================
console.log("P&L SCRIPT STARTING...");
(function() {
    'use strict';
    if (window.__mcPnlLoaded_vFinal) return;
    window.__mcPnlLoaded_vFinal = true;

    setInterval(function() {
        try {
            if (typeof S === 'undefined' || S.tab !== 'r') return;
            
            const app = document.getElementById('app');
            if (!app || document.getElementById('pnl-card-injected')) return;

            let reportsCard = null;
            const cards = app.querySelectorAll('.card');
            for (let c of cards) {
                if (c.textContent && c.textContent.includes('Reports & analytics')) {
                    reportsCard = c;
                    break;
                }
            }
            if (!reportsCard) return;

            let rows = '', totRev = 0, totCost = 0, totProfit = 0;
            const pjs = (typeof BZ !== 'undefined' && BZ.pj) ? Object.values(BZ.pj) : [];

            pjs.forEach(p => {
                if (p.stage === 'Closed' || p.stage === 'Closure') return;
                
                const q = (S.q && p.qid) ? S.q[p.qid] : null;
                
                // Safe Math
                let rev = 0;
                try { rev = +(p.val || (q && gt ? gt(q) : 0)) || 0; } catch(e) {}
                
                let poCost = 0;
                try { poCost = +(pjSpend ? pjSpend(p.id) : 0) || 0; } catch(e) {}
                
                let labCost = 0;
                try {
                    if (p.carp) {
                        const sqft = (q && est) ? (est(q).sq || 0) : 0;
                        const extras = (p.carp.extras || []).reduce((a,x) => a + (+x.amt || 0), 0);
                        labCost = (sqft * (+p.carp.rate || 0)) + extras;
                    }
                } catch(e) {}
                
                let expCost = 0;
                try { expCost = (p.expenses || []).reduce((a,x) => a + (+x.amt || 0), 0); } catch(e) {}

                const totalCost = poCost + labCost + expCost;
                const profit = rev - totalCost;
                const margin = rev > 0 ? (profit / rev) * 100 : 0;

                totRev += rev; totCost += totalCost; totProfit += profit;

                const fRev = typeof fmt === 'function' ? fmt(rev) : rev;
                const fPo = typeof fmt === 'function' ? fmt(poCost) : poCost;
                const fLab = typeof fmt === 'function' ? fmt(labCost) : labCost;
                const fExp = typeof fmt === 'function' ? fmt(expCost) : expCost;
                const fTot = typeof fmt === 'function' ? fmt(totalCost) : totalCost;
                const fProf = typeof fmt === 'function' ? fmt(profit) : profit;
                const eName = typeof esc === 'function' ? esc(p.name) : p.name;
                const eClient = typeof esc === 'function' ? esc(p.client || '') : (p.client || '');

                rows += `
                <tr>
                    <td><b>${eName}</b><br><span class="mut">${eClient}</span></td>
                    <td class="ro">${fRev}</td>
                    <td class="ro" style="color:#b00020">${fPo}</td>
                    <td class="ro" style="color:#b00020">${fLab}</td>
                    <td class="ro" style="color:#b00020">${fExp}</td>
                    <td class="ro"><b>${fTot}</b></td>
                    <td class="ro" style="color:${profit >= 0 ? '#15803d' : '#b00020'}"><b>${fProf}</b></td>
                    <td class="ro" style="color:${margin >= 0 ? '#15803d' : '#b00020'}">${margin.toFixed(1)}%</td>
                </tr>`;
            });

            if (!rows) rows = '<tr><td colspan="8" class="mut" style="text-align:center;">No active projects found.</td></tr>';

            const fTR = typeof fmt === 'function' ? fmt(totRev) : totRev;
            const fTC = typeof fmt === 'function' ? fmt(totCost) : totCost;
            const fTP = typeof fmt === 'function' ? fmt(totProfit) : totProfit;
            const totalMargin = totRev > 0 ? ((totProfit / totRev) * 100).toFixed(1) : '0.0';

            const pnlHtml = `
            <div class="card" id="pnl-card-injected" style="border-left: 4px solid #B08D57; margin-bottom: 20px; background: rgba(176, 141, 87, 0.05);">
                <h3>📊 True Project Profit & Loss (P&L)</h3>
                <p class="mut">Your real profit based on Contract Value minus Vendor POs, Carpenter/Labour projections, and Direct Site Expenses.</p>
                <div class="sc">
                    <table class="g" style="min-width: 950px;">
                        <tr>
                            <th>Project / Client</th>
                            <th class="ro">Contract Value</th>
                            <th class="ro">Vendor POs</th>
                            <th class="ro">Labour (Proj.)</th>
                            <th class="ro">Direct Exp.</th>
                            <th class="ro">Total Cost</th>
                            <th class="ro">Profit</th>
                            <th class="ro">Margin %</th>
                        </tr>
                        ${rows}
                        <tr style="background:var(--in); font-weight:bold; border-top: 2px solid var(--line);">
                            <td>TOTAL PORTFOLIO</td>
                            <td class="ro">${fTR}</td>
                            <td class="ro" colspan="3">Total Costs: ${fTC}</td>
                            <td class="ro">${fTC}</td>
                            <td class="ro" style="color:${totProfit >= 0 ? '#15803d' : '#b00020'}">${fTP}</td>
                            <td class="ro" style="color:${totProfit >= 0 ? '#15803d' : '#b00020'}">${totalMargin}%</td>
                        </tr>
                    </table>
                </div>
            </div>`;

            reportsCard.insertAdjacentHTML('beforebegin', pnlHtml);
            console.log("P&L Card successfully injected!");

        } catch (err) {
            console.error("P&L Script error: ", err);
        }
    }, 1000);
    
    console.log('[ModuCraft +] Advanced Financial P&L Reporting (FINAL) loaded');
})();


// ==========================================
// CONFLICT CHECK WHEN SAVING QUOTATIONS
// ==========================================
document.addEventListener('click', async function(e) {
    // Find if they clicked the Save button for a quotation
    const saveBtn = e.target.closest('button[data-a="sv"]');
    
    // If it's not the save button, or if we already checked it, let it pass
    if (!saveBtn || saveBtn.dataset.bypassLock === "true") return;

    const quoteId = S.cur;
    
    // If it's a brand new quotation (no updated_at yet), just save normally
    if (!quoteId || !S.q[quoteId] || !S.q[quoteId].updated_at) {
        return; 
    }

    // Stop the normal save process for a second
    e.preventDefault();
    e.stopImmediatePropagation();

    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = 'Checking...';
    saveBtn.disabled = true;

    const userName = localStorage.getItem('msq_me') || 'Someone';

    try {
        // 1. Ask Google if anyone else saved it
        const conflictRes = await fetch(GOOGLE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ 
                action: 'check_conflict', 
                sheetName: 'quotes', 
                recordId: quoteId, 
                openedAt: window.currentQuoteOpenedAt, 
                userName: userName 
            })
        });
        const conflictData = await conflictRes.json();
        
        if (conflictData.hasConflict) {
            alert(conflictData.message);
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
            return; // STOP! Do not save.
        }

        // 2. Unlock the record so others can edit it now
        fetch(GOOGLE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'unlock_record', sheetName: 'quotes', recordId: quoteId })
        });

        // 3. Proceed with the actual save
        saveBtn.dataset.bypassLock = "true"; // Tell our code to ignore it this time
        saveBtn.click(); // Click it again to let the app save normally

    } catch(err) {
        console.error("Conflict check failed", err);
        // If the internet fails, just save anyway so you don't lose work
        saveBtn.dataset.bypassLock = "true";
        saveBtn.click();
    }
}, true); // The 'true' makes this run before the app's normal save

// ==========================================
// REAL OPTIMISTIC LOCK FOR QUOTATIONS
// ==========================================
document.addEventListener('click', async function(e) {
    const editBtn = e.target.closest('button[data-a="oq"]');
    if (!editBtn) return;

    const quoteId = editBtn.dataset.i;
    if (!quoteId) return;

    e.preventDefault();
    e.stopImmediatePropagation();

    // 1. OPEN THE QUOTE INSTANTLY (No waiting!)
    S.tab = 'e';
    S.cur = quoteId;
    render();

    // 2. Lock the Save button in the background
    const saveBtn = document.querySelector('button[data-a="sv"]');
    let originalSaveText = 'Save quotation';
    if (saveBtn) {
        originalSaveText = saveBtn.innerHTML;
        saveBtn.innerHTML = '🔒 Checking...';
        saveBtn.disabled = true;
        saveBtn.style.opacity = '0.5';
    }

    // 3. Ask Google for the lock
    const userName = localStorage.getItem('mc_user_name') || localStorage.getItem('msq_me') || 'Someone';
    try {
        const lockRes = await fetch("https://script.google.com/macros/s/AKfycbwgMExM7rKaDkJ4-LvUnb_HLpO4TL4-CKDkNEzuSWLiExCetpAT0sox2A1_-NL9clRM/exec", {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'lock_record', sheetName: 'quotes', recordId: quoteId, userName: userName })
        });
        const lockData = await lockRes.json();
        
                                        // NEW: Safely handle old 'undefined' locks in the database
                // This catches 'undefined', 'null', empty strings, and 'Someone'
                const badLock = !lockData.lockedBy || String(lockData.lockedBy).includes('undefined') || String(lockData.lockedBy).includes('null') || lockData.lockedBy === 'Someone';

                if (!lockData.success && !badLock) {
                    alert(`🚨 ALERT: ${lockData.lockedBy} is currently editing this quotation.`);
                    S.tab = 'q'; // Go back to the quotations list
                    render();
                    return; 
                }

        // SUCCESS! Unlock the Save button
        window.currentQuoteOpenedAt = S.q[quoteId] ? (S.q[quoteId].updated_at || Date.now()) : Date.now();
        if (saveBtn) {
            saveBtn.innerHTML = originalSaveText;
            saveBtn.disabled = false;
            saveBtn.style.opacity = '1';
        }
        
    } catch(err) {
        console.error("Lock failed:", err);
        // If internet fails, just let them edit so they don't lose work
        if (saveBtn) {
            saveBtn.innerHTML = originalSaveText;
            saveBtn.disabled = false;
            saveBtn.style.opacity = '1';
        }
    }
}, true);

// ==========================================
// CLOUD SYNC FOR DELETING QUOTATIONS
// ==========================================
document.addEventListener('click', function(e) {
    const delBtn = e.target.closest('button[data-a="dq"]');
    if (!delBtn) return;
    
    const quoteId = delBtn.dataset.i;
    if (!quoteId) return;

    // We let the app delete it from your screen normally.
    // In the background, we tell Google Sheets to delete it too.
    fetch("https://script.google.com/macros/s/AKfycbwgMExM7rKaDkJ4-LvUnb_HLpO4TL4-CKDkNEzuSWLiExCetpAT0sox2A1_-NL9clRM/exec", {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ 
            action: 'delete', 
            collection: 'quotes', 
            id: quoteId, 
            apiKey: "ModuCraft@2026" 
        })
    })
    .then(res => res.json())
    .then(res => console.log("✅ CLOUD DELETE SUCCESS:", res))
    .catch(err => console.error("❌ CLOUD DELETE FAILED:", err));
}, true);
