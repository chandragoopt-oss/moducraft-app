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
// PATCH: Advanced Pricing Bases & Material Summary & Discounts
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

    const oldDiscStr = `<div><label>Discount on the quotation</label><div style="display:flex;gap:6px">${SEL('q','dct',q.dct||'%',['%','₹'])}${N('q','dcv',q.dcv||0)}</div></div>`;
    const newDiscStr = `
    <div style="grid-column: 1 / -1; border-top: 1px dashed var(--line); margin-top: 10px; padding-top: 10px;">
        <label style="font-weight: bold; color: var(--gold);">Discounts by Section (%)</label>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">
            <div><label>Wooden Work %</label>${N('q','dw',q.dw||0)}</div>
            <div><label>Hardware & Accessories %</label>${N('q','dh',q.dh||0)}</div>
            <div><label>Site / Civil Work %</label>${N('q','ds',q.ds||0)}</div>
        </div>
    </div>
    `;
    html = html.replace(oldDiscStr, newDiscStr);

    return html;
};

function calcCatTotals(q) {
    let wood = 0, hard = 0, site = 0;
    if (q.pmo === 'Package') {
        q.rooms.forEach(rm => { if (used(rm).length) wood += (+rm.rate || 0); });
        return { wood, hard, site };
    }
    q.rooms.forEach(rm => {
        const isSiteRoom = rm.w || rm.sv || /site service|civil|paint|plumbing|electrical/i.test(rm.name);
        rm.rows.forEach(r => {
            if (!r.n) return;
            const c = rowC(q, rm, r);
            const acc = accP(r, q);
            if (isSiteRoom || r.sv || isEl(r)) {
                site += c.p;
            } else if (HWX.test(r.n) || RKX.test(r.n) || /hardware|accessory/i.test(r.n)) {
                hard += c.p;
            } else {
                wood += (c.p - acc);
                hard += acc;
            }
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
    
    if (d === 0 && +q.dcv > 0) {
        const g = gt0(q);
        d = Math.min(g, q.dct == '₹' ? +q.dcv : g * (+q.dcv) / 100);
    }
    return d;
}
function customGt(q) { return gt0(q) - customDisc(q); }

const origVPrev = vPrev;
vPrev = function() {
    let html = origVPrev();
    const q = window.T ? window.T() : T();
    if (!q) return html;

    const catTotals = calcCatTotals(q);
    const cDisc = customDisc(q);
    const cGt = customGt(q);
    const dw = +q.dw || 0, dh = +q.dh || 0, ds = +q.ds || 0;
    const dW = catTotals.wood * dw / 100, dH = catTotals.hard * dh / 100, dS = catTotals.site * ds / 100;

    let discRows = '';
    if (dW > 0) discRows += `<tr><td>Discount on Wooden Work (${dw}%)<td class="r">− ${fmt(dW)}</tr>`;
    if (dH > 0) discRows += `<tr><td>Discount on Hardware & Accessories (${dh}%)<td class="r">− ${fmt(dH)}</tr>`;
    if (dS > 0) discRows += `<tr><td>Discount on Site / Civil Work (${ds}%)<td class="r">− ${fmt(dS)}</tr>`;

    if (cDisc === 0 && +q.dcv > 0) {
        const g0 = gt0(q);
        const od = Math.min(g0, q.dct == '₹' ? +q.dcv : g0 * (+q.dcv) / 100);
        if (od > 0) discRows += `<tr><td>Discount${q.dct=='₹'?'':' ('+(+q.dcv)+'%)'}<td class="r">− ${fmt(od)}</tr>`;
    }

    let newTotTable = '';
    if (q.pmo === 'Package') {
        const grand = catTotals.wood;
        const dW_pkg = grand * dw / 100;
        newTotTable = `<table class="t">
            <tr><td>Sub-total<td class="r">${fmt(grand)}</tr>
            ${dW_pkg > 0 ? `<tr><td>Discount on Package (${dw}%)<td class="r">− ${fmt(dW_pkg)}</tr>` : ''}
            <tr class="tot gt"><td>GRAND TOTAL<td class="r">${fmt(grand - dW_pkg)}</tr>
        </table>`;
        html = html.replace(/<table class="t">[\s\S]*?GRAND TOTAL[\s\S]*?<\/table>/, newTotTable);
        
        const payHtmlOld = q.pay.map(p => `<tr><td>${esc(p.m)}<td class="r">${esc(p.p)}%<td>${esc(p.t)}<td class="r">${fmt(gt(q)*(parseFloat(p.p)||0)/100)}</tr>`).join('');
        const payHtmlNew = q.pay.map(p => `<tr><td>${esc(p.m)}<td class="r">${esc(p.p)}%<td>${esc(p.t)}<td class="r">${fmt((grand - dW_pkg)*(parseFloat(p.p)||0)/100)}</tr>`).join('');
        if (payHtmlOld.length > 0) html = html.replace(payHtmlOld, payHtmlNew);
    } else {
        newTotTable = `<table class="t">
            <tr><td>Sub-total<td class="r">${fmt(gt0(q))}</tr>
            ${discRows}
            <tr class="tot gt"><td>GRAND TOTAL<td class="r">${fmt(cGt)}</tr>
        </table>`;
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
// PATCH: Structured Finishes (Laminate, Acrylic, etc.)
// ==========================================
const origFixSet = fixSet;
fixSet = function() {
    origFixSet();
    if (!S.set.finm) S.set.finm = ['Standard', 'Merino', 'Century', 'Greenlam'];
};

const STD_FINS = [
    '0.8mm Matt', '0.8mm Gloss', '0.8mm High Gloss', '0.8mm Texture', '0.8mm Special', '0.8mm Stone Finish',
    '1mm Matt', '1mm Gloss', '1mm High Gloss', '1mm Texture', '1mm Special', '1mm Stone Finish',
    'Acrylic Matt', 'Acrylic Gloss',
    'Membrane Matt', 'Membrane Gloss',
    'Veneer'
];

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
        return `
            <div class="sh" style="margin-top: 15px; background: var(--in); color: var(--ink); border: 1px solid var(--line)">${title}</div>
            <table class="g" style="margin-bottom: 10px;">
                <tr><th>Finish Variant</th><th>Client add-on ₹ per sq.ft</th><th>Our cost ₹ per sheet</th><th></th></tr>
                ${fins.map(f => {
                    const actualIdx = S.set.fin.findIndex(x => x.n === f.n);
                    const shortName = f.n.replace(selM + ' — ', '');
                    return `<tr><td>${esc(shortName)}</td><td>${RB('s',`fin|${actualIdx}|r`,f.r||'')}</td><td>${RB('s',`fin|${actualIdx}|c`,f.c||'')}</td><td><button class="g" data-a="sd" data-k="fin" data-i="${actualIdx}">×</button></td></tr>`;
                }).join('')}
            </table>
        `;
    };

    let newFinHtml = `
    <div class="card" id="custom-fin-card">
        <h2>Finishes &amp; Acrylics (Grouped by Maker)</h2>
        <p class="mut">Select a maker to view and edit their rates. When you add a new maker, standard finishes will be auto-generated.</p>
        <div class="bar">
            <label>Maker / Brand:</label>
            <select id="fin_maker_sel" style="max-width:250px">${S.set.finm.map(m => `<option value="${esc(m)}" ${m===selM?'selected':''}>${esc(m)}</option>`).join('')}</select>
            <button data-fp="add-maker" style="background:var(--gold);color:#fff;border:none;border-radius:6px;padding:6px 12px;cursor:pointer">+ Add New Maker</button>
        </div>
        <div class="sc">
            ${renderGroup('0.8mm Laminate', f => f.includes('0.8mm'))}
            ${renderGroup('1mm Laminate', f => f.includes('1mm'))}
            ${renderGroup('Acrylic', f => f.includes('Acrylic'))}
            ${renderGroup('Membrane', f => f.includes('Membrane'))}
            ${renderGroup('Veneer', f => f.includes('Veneer'))}
            ${renderGroup('Other Finishes', f => !/0.8mm|1mm|Acrylic|Membrane|Veneer/.test(f))}
        </div>
        <div class="bar"><button class="g" data-fp="add-fin-row">+ Add custom row to ${esc(selM)}</button></div>
    </div>
    <div class="card">
        <h2>PU / Deco Paint (No Maker Required)</h2>
        <div class="sc">
            <table class="g">
                <tr><th>Finish</th><th>Client add-on ₹ per sq.ft</th><th>Our cost ₹ per sheet</th><th></th></tr>
                ${puFins.map(f => {
                    const actualIdx = S.set.fin.findIndex(x => x.n === f.n);
                    return `<tr><td>${esc(f.n)}</td><td>${RB('s',`fin|${actualIdx}|r`,f.r||'')}</td><td>${RB('s',`fin|${actualIdx}|c`,f.c||'')}</td><td><button class="g" data-a="sd" data-k="fin" data-i="${actualIdx}">×</button></td></tr>`;
                }).join('')}
            </table>
        </div>
    </div>`;
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

document.addEventListener('change', e => {
    if (e.target.id === 'fin_maker_sel') { S.set.selFinMaker = e.target.value; render(); }
});


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
        if (r.n) {
            const m = MOD[r.mk];
            if (m && !m.au) moduleCount++;
            if (r.n.includes('PVC Skirting') && r.q) skirtLen += (+r.q || 0);
        }
    }));

    const cons = [];
    if (plyS > 0) {
        cons.push({ d: 'Wood Adhesive (Fevicol / equivalent)', q: Math.max(1, Math.ceil(lamS * 0.5)), u: 'kg' });
        cons.push({ d: 'Nails - Headless / Brad (Assorted)', q: Math.max(1, Math.ceil(plyS * 0.2)), u: 'kg' });
        cons.push({ d: 'Screws - Assorted (Drywall / Wood)', q: Math.max(1, Math.ceil(plyS * 0.5)), u: 'box' });
        cons.push({ d: 'L-Clamps (Corner Braces)', q: Math.max(1, Math.ceil(moduleCount / 2)), u: 'nos' });
        cons.push({ d: 'Wall PVC Sockets', q: Math.max(1, Math.ceil(moduleCount * 0.5)), u: 'nos' });
    }
    if (skirtLen > 0) {
        cons.push({ d: 'Skirting Clips', q: Math.ceil(skirtLen * 3.33), u: 'nos' });
    }
    return cons;
}

const origVEst = vEst;
vEst = function() {
    let html = origVEst();
    const q = T();
    if (!q) return html;
    
    const cons = calcConsumables(q);
    if (cons.length) {
        const tableHtml = `<div class="card" style="border-left: 4px solid var(--gold)"><h2>Site Consumables (Auto-Estimated)</h2><p class="mut">Based on the total plywood, laminate sheets, and modules in this quotation.</p>
        <div class="sc"><table class="g" style="min-width: 400px;"><tr><th>Item</th><th class="ro">Qty</th><th>Unit</th></tr>
        ${cons.map(c => `<tr><td>${esc(c.d)}</td><td class="ro">${c.q}</td><td>${esc(c.u)}</td></tr>`).join('')}
        </table></div></div>`;
        const anchor = html.indexOf('<div class="card"><h2>Our cost vs customer price</h2>');
        if (anchor !== -1) html = html.substring(0, anchor) + tableHtml + html.substring(anchor);
        else html += tableHtml;
    }
    return html;
};

const origPoFromEst = poFromEst;
poFromEst = function(po, src) {
    const p = BZ.pj[po.pid], q = p && S.q[p.qid];
    if (!q) { flash('Link this PO to a project that has a quotation first'); return; }
    
    const L = po.lines = po.lines || [];
    const v = BZ.vd[po.vid] || {};
    const add = (d, qty, u, r) => { if(qty>0) L.push({d, q:qty, u, r:Math.round(vdRate(v,d)||r||0), g:+S.set.gst||18}); };

    if (src === 'ply') {
        Object.values(est(q).ply).forEach(x => {
            add('Plywood '+x.g+' ('+x.b+') 18 mm, 8×4 ft', x.s18, 'sheet', plyRate(x.b,x.g,'18mm'));
            add('Plywood '+x.g+' ('+x.b+') 6 mm, 8×4 ft', x.s6, 'sheet', plyRate(x.b,x.g,'6mm'));
        });
    } else if (src === 'lam') {
        Object.keys(est(q).ls).sort(lkSort).forEach(k => add(lamLbl(k)+', 8×4 ft', est(q).ls[k], 'sheet', finCost(k)));
    } else if (src === 'hw') {
        Object.entries(est(q).hw).sort((a,b)=>a[0].localeCompare(b[0])).forEach(([n,qty]) => add(n, qty, accU(n), hwRate(n,q.hw||'Local')));
        calcConsumables(q).forEach(c => { if(!L.some(l=>l.d===c.d)) add(c.d, c.q, c.u, 0); });
    } else if (src === 'elec') {
        q.rooms.forEach(rm => rm.rows.forEach(r => { if (r.n && isEl(r)) add(r.n, r.q || 1, r.u || 'nos', 0); }));
    } else if (src === 'site') {
        q.rooms.forEach(rm => rm.rows.forEach(r => {
            if (r.n && (rm.sv || rm.w || /paint|gypsum|ceiling|civil|tile|plumbing|waterproofing|putty|primer/i.test(r.n))) {
                if (!isEl(r) && !/granite|marble|quartz|stone|corian/i.test(r.n)) add(r.n, r.q || 1, r.u || 'nos', 0);
            }
        }));
    } else if (src === 'stone') {
        q.rooms.forEach(rm => rm.rows.forEach(r => {
            if (r.n && /granite|marble|quartz|stone|corian/i.test(r.n)) add(r.n, r.q || 1, r.u || 'sqft', 0);
        }));
    }
    bzSave('po', po.id);
    flash('Lines added from the estimate!');
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
    const newSel = `<select id="po_src" style="max-width:260px">
        <option value="ply">From estimate: Plywood</option>
        <option value="lam">From estimate: Laminate / Finish</option>
        <option value="hw">From estimate: Hardware & Consumables</option>
        <option value="elec">From estimate: Electrical Items</option>
        <option value="site">From estimate: Site Work (Paint/Civil/Gypsum)</option>
        <option value="stone">From estimate: Stone / Countertop</option>
    </select>`;
    html = html.replace(oldSel, newSel);

    const t = poTot(o);
    let paid = 0;
    (o.pays || []).forEach(p => paid += (+p.amt || 0));
    const bal = t.tot - paid;
    
    const catTotals = {};
    (o.lines||[]).forEach(l => {
        if(!l.d) return;
        const c = getCatName(l.d);
        const amt = (l.q||0) * (l.r||0) * (1 + (l.g||0)/100);
        catTotals[c] = (catTotals[c]||0) + amt;
    });

    const catPaid = {};
    (o.pays||[]).forEach(p => {
        const c = p.cat || 'General';
        catPaid[c] = (catPaid[c]||0) + (+p.amt||0);
    });

    let summaryRows = '';
    Object.keys(catTotals).forEach(c => {
        if(catTotals[c] > 0.01) {
            const cp = catPaid[c] || 0;
            summaryRows += `<tr><td>${c}</td><td class="ro">${fmt(catTotals[c])}</td><td class="ro" style="color:#15803d">${fmt(cp)}</td><td class="ro" style="color:#b00020">${fmt(catTotals[c] - cp)}</td></tr>`;
            delete catPaid[c];
        }
    });
    Object.keys(catPaid).forEach(c => {
        if(catPaid[c] > 0.01) {
             summaryRows += `<tr><td>${c}</td><td class="ro">-</td><td class="ro" style="color:#15803d">${fmt(catPaid[c])}</td><td class="ro">-</td></tr>`;
        }
    });

    const CATE_OPTS = ['General', 'Plywood', 'Laminate', 'Hardware', 'Electrical', 'Site Work', 'Stone', 'Other'];

    const payHtml = `
    <div class="card">
        <h3>Payment Tracking (Internal)</h3>
        
        <div class="dgrid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); margin-bottom: 15px; background: var(--in); padding: 10px; border-radius: 8px;">
            <div><span class="mut">Total PO Value</span><br><b>${fmt(t.tot)}</b></div>
            <div><span class="mut">Total Paid</span><br><b style="color:#15803d">${fmt(paid)}</b></div>
            <div><span class="mut">Remaining Balance</span><br><b style="color:#b00020">${fmt(bal)}</b></div>
        </div>

        <div class="sc">
            <table class="g" style="margin-bottom: 15px;">
                <tr><th>Category Breakdown</th><th class="ro">Total in PO</th><th class="ro">Paid</th><th class="ro">Balance</th></tr>
                ${summaryRows || '<tr><td colspan="4" class="mut">No items in PO.</td></tr>'}
            </table>
        </div>

        <h4 style="margin-top: 15px;">Payment History</h4>
        <div class="sc">
            <table class="g" style="min-width:600px">
                <tr><th>Date</th><th>Amount (₹)</th><th>Category</th><th>Mode</th><th>Ref</th><th>Next Due</th><th></th></tr>
                ${(o.pays||[]).map((p, i) => `
                <tr>
                    <td>${bdt('po', o.id, 'pays.'+i+'.date', p.date)}</td>
                    <td>${bn('po', o.id, 'pays.'+i+'.amt', p.amt, 'style="width:100px"')}</td>
                    <td>${bs('po', o.id, 'pays.'+i+'.cat', p.cat || 'General', CATE_OPTS)}</td>
                    <td>${bs('po', o.id, 'pays.'+i+'.mode', p.mode, ['UPI', 'Bank transfer', 'Cheque', 'Cash'])}</td>
                    <td>${bi('po', o.id, 'pays.'+i+'.ref', p.ref, 'style="width:80px"')}</td>
                    <td>${bdt('po', o.id, 'pays.'+i+'.next', p.next)}</td>
                    <td>${ba('paydelpo', '✕', 'data-i="'+i+'"')}</td>
                </tr>`).join('') || '<tr><td colspan="7" class="mut">No payments recorded yet.</td></tr>'}
            </table>
        </div>
        <div class="bar noprint">${ba('payaddpo', '+ Record Payment')}</div>
    </div>
    `;
    
    const anchor = '<div class="bar noprint"><button data-a="poprint"';
    if (html.includes(anchor)) html = html.replace(anchor, payHtml + anchor);
    else html += payHtml;
    return html;
};

const origPoDoc_Adv = poDoc;
poDoc = function(o) {
    const v = BZ.vd[o.vid] || {};
    const p = BZ.pj[o.pid] || {};
    const q = S.q[p.qid];
    
    const groups = { ply: [], lam: [], hw: [], elec: [], site: [], stone: [], other: [] };
    (o.lines||[]).forEach(l => { 
        if (l.d) {
            const c = getCatName(l.d);
            const key = c === 'Plywood' ? 'ply' : c === 'Laminate' ? 'lam' : c === 'Hardware' ? 'hw' : c === 'Electrical' ? 'elec' : c === 'Site Work' ? 'site' : c === 'Stone' ? 'stone' : 'other';
            groups[key].push(l);
        }
    });

    const fmtQty = (qty) => {
        const n = +qty || 0; const frac = n - Math.floor(n);
        return frac > 0.1 ? Math.ceil(n) : Math.floor(n);
    };

    const T1 = (h, rows) => `<table class="t"><tr>${h.map(x=>`<th>${x}</th>`).join('')}</tr>${rows.map(r=>`<tr>${r.map(x=>`<td>${x}</td>`).join('')}</tr>`).join('')}</table>`;

    let html = `<div class="pg">
        <div class="kv">
            <div><b>VENDOR DETAILS</b><br>${esc(v.name||'')}<br>${esc(v.addr||'')}<br>${v.person?esc(v.person)+'<br>':''}${esc(v.phone||'')}</div>
            <div><b>DELIVER TO</b><br>${esc(p.name||'')}<br>${esc(p.addr||'')}</div>
        </div>
        <div class="sh">PURCHASE ORDER SUMMARY</div>
        ${o.lines.length ? `<table class="t"><tr><th>#</th><th>Description</th><th>Qty</th><th>Unit</th></tr>${o.lines.map((l,i)=>`<tr><td>${i+1}</td><td>${esc(l.d)}</td><td>${fmtQty(l.q)}</td><td>${esc(l.u)}</td></tr>`).join('')}</table>` : '<p class="nt">No items added.</p>'}
        ${o.note?`<div class="sh">TERMS &amp; NOTES</div><p style="font-size:12px">${esc(o.note)}</p>`:''}
        <div style="margin-top:40px;display:flex;justify-content:space-between;font-size:12px">
            <span>Vendor acknowledgement</span>
            <span>For ${esc(co().name)}<br><br>Authorised signatory</span>
        </div>
    </div>`;

    if (groups.ply.length) html += `<div class="pg" style="break-before: page;"><h2 style="text-align:center;letter-spacing:3px">PLYWOOD</h2>${T1(['Description', 'Qty', 'Unit'], groups.ply.map(l => [esc(l.d), fmtQty(l.q), esc(l.u)]))}</div>`;
    if (groups.lam.length) html += `<div class="pg" style="break-before: page;"><h2 style="text-align:center;letter-spacing:3px">LAMINATE & FINISH</h2>${T1(['Description', 'Qty', 'Unit'], groups.lam.map(l => [esc(l.d), fmtQty(l.q), esc(l.u)]))}</div>`;
    if (groups.hw.length) html += `<div class="pg" style="break-before: page;"><h2 style="text-align:center;letter-spacing:3px">HARDWARE & CONSUMABLES</h2>${T1(['Description', 'Qty', 'Unit'], groups.hw.map(l => [esc(l.d), fmtQty(l.q), esc(l.u)]))}</div>`;
    if (groups.elec.length) html += `<div class="pg" style="break-before: page;"><h2 style="text-align:center;letter-spacing:3px">ELECTRICAL ITEMS</h2>${T1(['Description', 'Qty', 'Unit'], groups.elec.map(l => [esc(l.d), fmtQty(l.q), esc(l.u)]))}</div>`;
    if (groups.site.length) html += `<div class="pg" style="break-before: page;"><h2 style="text-align:center;letter-spacing:3px">SITE WORK DETAILS</h2>${T1(['Description', 'Qty', 'Unit'], groups.site.map(l => [esc(l.d), fmtQty(l.q), esc(l.u)]))}</div>`;
    if (groups.stone.length) html += `<div class="pg" style="break-before: page;"><h2 style="text-align:center;letter-spacing:3px">STONE & COUNTERTOPS</h2>${T1(['Description', 'Qty', 'Unit'], groups.stone.map(l => [esc(l.d), fmtQty(l.q), esc(l.u)]))}</div>`;
    if (groups.other.length) html += `<div class="pg" style="break-before: page;"><h2 style="text-align:center;letter-spacing:3px">OTHER ITEMS</h2>${T1(['Description', 'Qty', 'Unit'], groups.other.map(l => [esc(l.d), fmtQty(l.q), esc(l.u)]))}</div>`;

    const metaHtml = `
        <b>PO: ${esc(o.no)}</b> | Date: <b>${dmy(o.date)}</b><br>
        Vendor: <b>${esc(v.name||'—')}</b><br>
        Project: ${esc(p.name||'—')} | Address: ${esc(p.addr||'—')}<br>
        Delivery Req.: <b style="color:#b00020">${dmy(o.del)}</b><br>
        Ref: ${q ? esc(qno(q)) : 'N/A'}
    `;
    
    return `<div class="bar noprint">
        <button data-a="dpdf" data-acc="1" data-fn="${esc(o.no)}.pdf">Download PDF</button>
        <button class="g" data-a="ap">Print</button>
        <button class="g" data-bza="docback">← Back</button>
    </div>` + docPaper('PURCHASE ORDER', metaHtml, html);
};

document.addEventListener('click', e => {
    const bAdd = e.target.closest('[data-bza="payaddpo"]');
    if (bAdd) {
        e.preventDefault(); e.stopImmediatePropagation();
        const O = BZ.po[S.po]; if (!O) return;
        O.pays = O.pays || [];
        O.pays.push({ date: today(), amt: 0, cat: 'General', mode: 'UPI', ref: '', next: '' });
        bzSave('po', O.id); render(); return;
    }
    const bDel = e.target.closest('[data-bza="paydelpo"]');
    if (bDel) {
        e.preventDefault(); e.stopImmediatePropagation();
        const O = BZ.po[S.po]; if (!O) return;
        O.pays.splice(+bDel.dataset.i, 1);
        bzSave('po', O.id); render(); return;
    }
}, true);

document.addEventListener('change', e => {
    const t = e.target;
    if (t.dataset.bz && t.dataset.bz.startsWith('po|') && t.dataset.bz.includes('|pays.')) {
        if (t.dataset.bz.includes('.amt') || t.dataset.bz.includes('.next') || t.dataset.bz.includes('.date') || t.dataset.bz.includes('.cat')) {
            setTimeout(render, 100);
        }
    }
});


// ==========================================
// STEP 1: GUIDED RATE SETUP
// ==========================================
(function(){
  'use strict';
  if (window.__mcSetupLoaded) { console.log('[ModuCraft +] Guided setup already loaded'); return; }
  window.__mcSetupLoaded = true;

  function setupStatus() {
    const s = (typeof S !== 'undefined' && S.set) || {};
    const co = s.co || {};
    const checks = [];

    const coMissing = ['name','addr','phone','mail'].filter(k => !String(co[k]||'').trim());
    checks.push({
      id: 'co', label: 'Company details',
      status: coMissing.length === 0 ? 'ok' : 'missing',
      detail: coMissing.length === 0 ? 'Name, address, phone, email set' : 'Missing: ' + coMissing.join(', '),
      action: 'co'
    });

    const plr = (s.plr || []).filter(p => p.b && p.g && p.t);
    const plrPriced = plr.filter(p => +(p.r) > 0);
    checks.push({
      id: 'plr', label: 'Plywood sheet rates',
      status: plrPriced.length === 0 ? 'missing' : plrPriced.length === plr.length ? 'ok' : 'partial',
      detail: plrPriced.length === 0
        ? 'No plywood sheet has a rate — material costing will not work'
        : plrPriced.length === plr.length
          ? 'All ' + plr.length + ' sheets priced'
          : plrPriced.length + ' of ' + plr.length + ' sheets priced — grades with no rate will fall back to ₹0',
      action: 'plr'
    });

    const fin = s.fin || [];
    const finPriced = fin.filter(f => +(f.c) > 0);
    checks.push({
      id: 'fin', label: 'Laminate / finish sheet costs',
      status: finPriced.length === 0 ? 'missing' : finPriced.length === fin.length ? 'ok' : 'partial',
      detail: finPriced.length === 0
        ? 'No finish has a cost — material costing will not work'
        : finPriced.length === fin.length
          ? 'All ' + fin.length + ' finishes priced'
          : finPriced.length + ' of ' + fin.length + ' finishes priced — unused finishes at ₹0 are fine',
      action: 'fin'
    });

    const acc = s.acc || [];
    const accPriced = acc.filter(a => +(a.rh)>0 || +(a.re)>0 || +(a.rl)>0);
    checks.push({
      id: 'acc', label: 'Hardware / accessory costs',
      status: accPriced.length === 0 ? 'missing' : accPriced.length === acc.length ? 'ok' : 'partial',
      detail: accPriced.length === 0
        ? 'No accessory has a brand cost — margin will be over-estimated'
        : accPriced.length === acc.length
          ? 'All ' + acc.length + ' accessories priced'
          : accPriced.length + ' of ' + acc.length + ' accessories priced',
      action: 'acc'
    });

    const lab = +(s.lab) || 0;
    checks.push({
      id: 'lab', label: 'Labour & fabrication cost',
      status: lab > 0 ? 'ok' : 'missing',
      detail: lab > 0 ? '₹' + lab + ' per sq.ft' : 'Not set — cost is under-estimated (margin will look higher than it is)',
      action: 'lab'
    });

    const mgn = +(s.mgn) || 0;
    checks.push({
      id: 'mgn', label: 'Profit margin',
      status: mgn > 0 ? 'ok' : 'partial',
      detail: mgn > 0 ? mgn + '%' : 'Using default 35% — set explicitly to override',
      action: 'mgn'
    });

    const gst = +(s.gst) || 0;
    checks.push({
      id: 'gst', label: 'GST percentage',
      status: gst > 0 ? 'ok' : 'missing',
      detail: gst > 0 ? gst + '%' : 'Not set — purchase orders will not have GST',
      action: 'gst'
    });

    const rooms = (s.rooms || []).filter(r => !r.w);
    const rmsPriced = rooms.filter(r => +(r.r) > 0);
    checks.push({
      id: 'rooms', label: 'Room type rates',
      status: rmsPriced.length === 0 ? 'missing' : rmsPriced.length === rooms.length ? 'ok' : 'partial',
      detail: rmsPriced.length === 0
        ? 'No room has a rate — module pricing will be ₹0'
        : rmsPriced.length === rooms.length
          ? 'All ' + rooms.length + ' room types priced'
          : rmsPriced.length + ' of ' + rooms.length + ' room types priced',
      action: 'rooms'
    });

    return checks;
  }

  const statusIcon = s => s === 'ok' ? '✅' : s === 'partial' ? '⚠️' : '❌';
  const statusColor = s => s === 'ok' ? '#22C55E' : s === 'partial' ? '#F59E0B' : '#EF4444';

  function setupCard() {
    const checks = setupStatus();
    const ok = checks.filter(c => c.status === 'ok').length;
    const partial = checks.filter(c => c.status === 'partial').length;
    const missing = checks.filter(c => c.status === 'missing').length;
    const total = checks.length;
    const pct = Math.round(ok / total * 100);
    const barColor = missing > 0 ? '#EF4444' : partial > 0 ? '#F59E0B' : '#22C55E';

    let summary;
    if (missing === 0 && partial === 0) {
      summary = '<span style="color:#22C55E;font-weight:600">✅ All set — quotations will calculate correctly.</span>';
    } else if (missing === 0) {
      summary = '<span style="color:#F59E0B;font-weight:600">⚠️ Nothing critical missing.</span> ' + partial + ' item' + (partial > 1 ? 's are' : ' is') + ' partly set — quotations will work, but some entries may show ₹0.';
    } else {
      summary = '<span style="color:#EF4444;font-weight:600">❌ ' + missing + ' critical item' + (missing > 1 ? 's are' : ' is') + ' missing</span> — quotations may calculate incorrectly until fixed.';
    }

    return '<div class="card" id="setup-card"><h2>Setup checklist</h2>' +
      '<p class="mut" style="margin:4px 0">Before sending quotations, make sure your rates are set up. Each field saves automatically.</p>' +
      '<div style="background:rgba(128,128,128,0.2);border-radius:8px;height:14px;margin:8px 0 4px;overflow:hidden">' +
        '<div style="background:' + barColor + ';height:14px;width:' + pct + '%;transition:width .3s"></div>' +
      '</div>' +
      '<p style="font-size:13px;margin:0 0 4px"><b>' + ok + '/' + total + '</b> complete' + (missing > 0 ? ' · <b style="color:#EF4444">' + missing + '</b> critical' : '') + (partial > 0 ? ' · <span style="color:#F59E0B;font-weight:600">' + partial + ' partial</span>' : '') + '</p>' +
      '<p style="font-size:13px;margin:0 0 12px">' + summary + '</p>' +
      '<div class="sc"><table class="g" style="min-width:640px"><tr><th style="width:50px">Status</th><th>Item</th><th>Detail</th><th style="width:90px"></th></tr>' +
      checks.map(c => {
        const clr = statusColor(c.status);
        return '<tr>' +
          '<td style="text-align:center;font-size:18px">' + statusIcon(c.status) + '</td>' +
          '<td><b>' + esc(c.label) + '</b></td>' +
          '<td style="color:' + clr + ';font-weight:600;font-size:12px">' + esc(c.detail) + '</td>' +
          '<td>' + (c.status === 'ok'
            ? '<span style="color:#22C55E;font-size:18px">✓</span>'
            : '<button data-setup-go="' + c.action + '" style="background:' + clr + ';color:#fff;border:0;border-radius:6px;padding:5px 10px;font-weight:600;cursor:pointer">Fix →</button>'
          ) + '</td>' +
        '</tr>';
      }).join('') +
      '</table></div></div>';
  }

  if (typeof vSet === 'function') {
    const _vSet = vSet;
    window.vSet = vSet = function() { return setupCard() + _vSet(); };
  }

  if (typeof todayCard === 'function') {
    const _todayCard = todayCard;
    window.todayCard = todayCard = function() {
      const existing = _todayCard();
      const critical = setupStatus().filter(c => c.status === 'missing');
      if (critical.length === 0) return existing;
      const names = critical.map(c => c.label).join(', ');
      const banner = '<div class="card" style="border-left:6px solid #EF4444;background:rgba(239,68,68,0.12)">' +
        '<b style="color:#EF4444">⚙️ Setup not complete — ' + critical.length + ' critical item' + (critical.length > 1 ? 's' : '') + ' need attention</b>' +
        '<p class="mut" style="margin:4px 0 8px;font-size:13px">Quotations may calculate incorrectly until setup is complete: ' + esc(names) + '.</p>' +
        '<button data-setup-tab style="background:#EF4444;color:#fff;border:0;border-radius:6px;padding:6px 12px;font-weight:600;cursor:pointer">Open setup checklist →</button></div>';
      return banner + existing;
    };
  }

  document.addEventListener('click', function(e){
    const fix = e.target.closest('[data-setup-go]');
    if (fix) {
      e.preventDefault();
      const map = {
        co: 'input[data-p="co|name"]',
        plr: 'input[data-p^="plr|"][data-p$="|r"]',
        fin: 'input[data-p^="fin|"][data-p$="|c"]',
        acc: 'input[data-p^="acc|"][data-p$="|rh"]',
        lab: 'input[data-p="lab"]',
        mgn: 'input[data-p="mgn"]',
        gst: 'input[data-p="gst"]',
        rooms: 'input[data-p^="rooms|"][data-p$="|r"]'
      };
      const el = document.querySelector(map[fix.dataset.setupGo] || 'body');
      if (el) {
        const parentCard = el.closest('.card');
        if (parentCard && parentCard.classList.contains('cxc')) {
          parentCard.classList.remove('cxc');
          const k = parentCard.dataset.cxk;
          if (k) {
            try {
              const st = JSON.parse(localStorage.getItem('msq_cl') || '{}');
              st[k] = 0;
              localStorage.setItem('msq_cl', JSON.stringify(st));
            } catch(x) {}
          }
        }
        const details = el.closest('details');
        if (details) details.open = true;
        
        setTimeout(function() {
          const rect = el.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          try {
            window.scrollTo({ top: rect.top + scrollTop - 150, behavior: 'smooth' });
          } catch(x) {
            el.scrollIntoView();
          }
          const prevBg = el.style.backgroundColor;
          const prevShadow = el.style.boxShadow;
          el.style.backgroundColor = 'rgba(245, 158, 11, 0.4)';
          el.style.boxShadow = '0 0 0 4px rgba(245, 158, 11, 0.8)';
          el.style.transition = 'background-color 0.2s, box-shadow 0.2s';
          setTimeout(function() {
            try { el.focus(); } catch(x) {}
            setTimeout(function() {
              el.style.backgroundColor = prevBg;
              el.style.boxShadow = prevShadow;
              setTimeout(() => { el.style.transition = ''; }, 200);
            }, 2000);
          }, 500);
        }, 50);
      }
      return;
    }
    const tab = e.target.closest('[data-setup-tab]');
    if (tab) { e.preventDefault(); S.tab = 's'; render(); }
  }, true);

  if ((S.tab === 's' || S.tab === 'h') && typeof render === 'function') {
    setTimeout(function(){ try { render(); } catch(x){} }, 200);
  }

  console.log('[ModuCraft +] Guided rate setup loaded');
})();


// ==========================================
// STEP 2: GST / NON-GST INVOICE
// ==========================================
(function(){
  'use strict';
  if (window.__mcInvoiceLoaded_v2) { console.log('[ModuCraft +] Invoice v2 already loaded'); return; }
  window.__mcInvoiceLoaded_v2 = true;

  function ensureSettings() {
    if (!S || !S.set) return;
    if (!S.set.invPrefix) S.set.invPrefix = 'INV';
    if (!S.set.sac) S.set.sac = '9954';
    if (!S.set.co) S.set.co = {};
    if (!S.set.co.state) S.set.co.state = 'West Bengal';
    if (!S.set.co.gstin) S.set.co.gstin = '';
    if (!S.set.gst) S.set.gst = 18;
  }

  function amtWords(n) {
    n = Math.round(Math.abs(+n || 0));
    if (n === 0) return 'Zero Rupees Only';
    const a = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
    const t = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
    const two = x => x < 20 ? a[x] : t[Math.floor(x/10)] + (x%10 ? ' ' + a[x%10] : '');
    const three = x => (x >= 100 ? a[Math.floor(x/100)] + ' Hundred' + (x%100 ? ' and ' : '') : '') + (x%100 ? two(x%100) : '');
    let r = '';
    const cr = Math.floor(n / 1e7); n %= 1e7;
    const lk = Math.floor(n / 1e5); n %= 1e5;
    const th = Math.floor(n / 1e3); n %= 1e3;
    if (cr) r += three(cr) + ' Crore ';
    if (lk) r += two(lk) + ' Lakh ';
    if (th) r += two(th) + ' Thousand ';
    if (n) r += three(n);
    return 'Rupees ' + r.trim() + ' Only';
  }

  function nextInvoiceNo() {
    const d = new Date();
    const fyStart = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
    const fy = String(fyStart).slice(-2) + String(fyStart + 1).slice(-2);
    const prefix = (S.set.invPrefix || 'INV') + '-' + fy + '-';
    let maxN = 0;
    try {
      Object.values(BZ.pj || {}).forEach(function(p) {
        (p.inv || []).forEach(function(inv) {
          if (inv.no && String(inv.no).indexOf(prefix) === 0) {
            const n = parseInt(String(inv.no).slice(prefix.length), 10);
            if (!isNaN(n) && n > maxN) maxN = n;
          }
        });
      });
    } catch(e) {}
    return prefix + String(maxN + 1).padStart(4, '0');
  }

  function computeInv(inv) {
    const amt = +inv.amount || 0;
    const r = n => Math.round(n * 100) / 100;
    if (inv.gst === false) {
      return { taxable: r(amt), cgst: 0, sgst: 0, igst: 0, totalTax: 0, total: r(amt) };
    }
    const rate = +inv.gstRate || 18;
    const intra = inv.intraState !== false;
    let taxable, cgst, sgst, igst, total;
    if (inv.mode === 'total') { total = amt; taxable = amt / (1 + rate/100); }
    else { taxable = amt; total = amt * (1 + rate/100); }
    if (intra) { cgst = taxable * rate / 200; sgst = taxable * rate / 200; igst = 0; }
    else { cgst = 0; sgst = 0; igst = taxable * rate / 100; }
    return { taxable: r(taxable), cgst: r(cgst), sgst: r(sgst), igst: r(igst), totalTax: r(cgst+sgst+igst), total: r(total) };
  }

  function invTab(p) {
    ensureSettings();
    const invs = (p.inv || []).slice();
    const active = invs.filter(function(i){ return i.status !== 'Cancelled'; });
    const totalTaxable = active.reduce(function(a, i){ return a + computeInv(i).taxable; }, 0);
    const totalGst = active.reduce(function(a, i){ return a + computeInv(i).totalTax; }, 0);
    const total = active.reduce(function(a, i){ return a + computeInv(i).total; }, 0);
    const contract = +p.val || 0;
    const balanceToInvoice = Math.max(0, contract - totalTaxable);
    const hasAnyGst = invs.some(function(i){ return i.gst !== false && i.status !== 'Cancelled'; });

    const rows = invs.map(function(inv, i) {
      const c = computeInv(inv);
      const off = inv.status === 'Cancelled';
      const isGst = inv.gst !== false;
      const badge = '<span style="font-size:10px;padding:1px 6px;border-radius:4px;background:' +
        (isGst ? 'rgba(31,78,121,.15)' : 'rgba(128,128,128,.2)') + ';color:inherit;font-weight:600">' +
        (isGst ? 'GST' : 'NON-GST') + '</span>';
      return '<tr style="' + (off ? 'opacity:.5;text-decoration:line-through' : '') + '">' +
        '<td><b>' + esc(inv.no || '—') + '</b> ' + badge + (off ? ' <span style="color:#EF4444">cancelled</span>' : '') + '</td>' +
        '<td>' + (inv.date ? dmy(inv.date) : '—') + '</td>' +
        '<td>' + esc(inv.milestone || inv.description || '—') + '</td>' +
        '<td class="ro">' + fmt(c.taxable) + '</td>' +
        '<td class="ro">' + (isGst ? fmt(c.totalTax) : '—') + '</td>' +
        '<td class="ro"><b>' + fmt(c.total) + '</b></td>' +
        '<td>' + (off ? '<span style="color:#EF4444">Cancelled</span>' : '<span style="color:#22C55E">' + esc(inv.status || 'Issued') + '</span>') + '</td>' +
        '<td style="white-space:nowrap"><button class="g" data-inv-act="view" data-i="' + i + '">View</button> ' +
          (off ? '' : '<button class="g" data-inv-act="cancel" data-i="' + i + '">Cancel</button>') + '</td>' +
      '</tr>';
    }).join('');

    const tile = function(l, v, sub, col) {
      return '<div style="padding:8px;background:' + (col || 'rgba(31,78,121,0.08)') + ';border-radius:8px">' +
        '<div class="mut" style="font-size:11px">' + l + '</div>' +
        '<div style="font-size:18px;font-weight:bold;color:#1F4E79">' + v + '</div>' +
        '<div class="mut" style="font-size:11px">' + sub + '</div></div>';
    };

    let tiles = tile('Contract value', fmt(contract), 'pre-GST')
      + tile('Invoiced (taxable)', fmt(totalTaxable), (contract > 0 ? Math.round(totalTaxable / contract * 100) : 0) + '% of contract');
    if (hasAnyGst || totalGst > 0) tiles += tile('GST invoiced', fmt(totalGst), 'CGST+SGST+IGST');
    tiles += tile('Total invoiced', fmt(total), hasAnyGst ? 'incl. GST' : 'no tax', 'rgba(34,197,94,0.12)')
      + tile('Balance to invoice', fmt(balanceToInvoice), 'taxable', balanceToInvoice > 0 ? 'rgba(245,158,11,0.12)' : 'rgba(34,197,94,0.12)');

    return '<div class="card"><h3>Invoices</h3>' +
      '<p class="mut" style="margin:4px 0">Choose <b>GST Invoice</b> for a GST-registered business (tax breakdown + GSTIN printed). Choose <b>Non-GST Invoice</b> for a plain invoice with no tax words.</p>' +
      '<div class="dgrid" style="grid-template-columns:repeat(auto-fit,minmax(160px,1fr));margin:10px 0">' + tiles + '</div>' +
      '<div class="bar noprint" style="margin-top:12px"><button data-inv-act="create" style="background:#1F4E79;color:#fff;border:0;border-radius:6px;padding:8px 16px;font-weight:600;cursor:pointer">+ Create Invoice</button></div>' +
      (invs.length
        ? '<div class="sc" style="margin-top:10px"><table class="g" style="min-width:820px"><tr><th>Invoice No.</th><th>Date</th><th>Description</th><th class="ro">Taxable</th><th class="ro">GST</th><th class="ro">Total</th><th>Status</th><th></th></tr>' + rows + '</table></div>'
        : '<p class="mut" style="margin-top:12px">No invoices yet. Click "Create Invoice" to raise the first one.</p>') +
      '</div>';
  }

  function invCreateDialog(p) {
    ensureSettings();
    const c = co();
    const q = S.q[p.qid];
    const invs = (p.inv || []).filter(function(i){ return i.status !== 'Cancelled'; });
    const alreadyInvoiced = invs.reduce(function(a, i){ return a + computeInv(i).taxable; }, 0);
    const contract = +p.val || 0;
    const remaining = Math.max(0, contract - alreadyInvoiced);
    const hasGstin = !!(c.gstin && String(c.gstin).trim());
    const defaultType = hasGstin ? 'gst' : 'nongst';
    const payOpts = (p.pays || []).map(function(x, i){
      return '<option value="' + i + '">' + esc(x.n) + ' — ' + esc(x.p || 0) + '% → ' + fmt(x.amt) + '</option>';
    }).join('');
    const defaultDesc = 'Interior design & turnkey execution services' + (q ? ' as per quotation ' + qno(q) : '') + ' — ' + (p.name || 'project');

    const body =
      '<div style="grid-column:1/-1"><label>Invoice type</label><select id="inv_type"><option value="gst"' + (defaultType==='gst'?' selected':'') + '>GST Invoice — with tax breakdown, GSTIN, SAC</option><option value="nongst"' + (defaultType==='nongst'?' selected':'') + '>Non-GST Invoice — plain, no tax, no GST words</option></select><small id="inv_type_hint" style="display:block;margin-top:4px"></small></div>' +
      '<div><label>Invoice date</label><input type="date" id="inv_date" value="' + new Date().toISOString().slice(0, 10) + '"></div>' +
      '<div><label>Against milestone (optional)</label><select id="inv_ms"><option value="">— None —</option>' + payOpts + '</select></div>' +
      '<div style="grid-column:1/-1"><label>Description of service (printed on invoice)</label><input id="inv_desc" value="' + esc(defaultDesc) + '"></div>' +
      '<div id="inv_gst_fields" style="display:contents">' +
        '<div><label>Mode</label><select id="inv_mode"><option value="taxable">Amount entered is TAXABLE value</option><option value="total">Amount entered is TOTAL incl. GST</option></select></div>' +
        '<div><label>GST rate (%)</label><input type="number" id="inv_rate" min="0" max="28" value="' + (S.set.gst || 18) + '"></div>' +
        '<div><label>Place of supply</label><input id="inv_pos" value="' + esc(p.placeOfSupply || c.state || 'West Bengal') + '"></div>' +
        '<div><label>Tax type</label><select id="inv_intra"><option value="1">Intra-state (CGST + SGST)</option><option value="0">Inter-state (IGST)</option></select></div>' +
        '<div><label>SAC code</label><input id="inv_sac" value="' + esc(S.set.sac || '9954') + '"></div>' +
        '<div><label>Client GSTIN (optional)</label><input id="inv_cgstin" value="' + esc(p.clientGstin || '') + '" placeholder="15-character GSTIN" maxlength="15" style="text-transform:uppercase"></div>' +
      '</div>' +
      '<div><label>Amount (₹)</label><input type="number" id="inv_amt" min="0" step="0.01" value="' + remaining + '"></div>' +
      '<div style="grid-column:1/-1"><label>Notes (optional)</label><textarea id="inv_notes" rows="2"></textarea></div>' +
      '<div style="grid-column:1/-1;padding:10px;background:rgba(31,78,121,0.06);border-radius:8px;margin-top:6px"><b>Preview:</b> <span id="inv_preview" class="mut">Enter amount</span></div>';

    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:flex-start;justify-content:center;z-index:100001;padding:20px;overflow-y:auto';
    modal.innerHTML = '<div style="background:var(--card,#fff);color:var(--ink,#222);border-radius:12px;padding:20px;max-width:720px;width:100%;box-shadow:0 10px 40px rgba(0,0,0,.4);margin:auto">' +
      '<h3 style="margin-top:0">Create Invoice</h3>' +
      '<p class="mut" style="margin:4px 0 14px;font-size:13px">Invoice No. will be: <b>' + nextInvoiceNo() + '</b></p>' +
      '<div class="dgrid" style="grid-template-columns:1fr 1fr;gap:10px">' + body + '</div>' +
      '<div class="bar" style="margin-top:14px;justify-content:flex-end">' +
        '<button class="g" id="inv_cancel">Cancel</button>' +
        '<button id="inv_save" style="background:#1F4E79;color:#fff;border:0;border-radius:6px;padding:8px 20px;font-weight:600;cursor:pointer">Create Invoice</button>' +
      '</div></div>';
    document.body.appendChild(modal);

    const $ = function(id){ return document.getElementById(id); };

    const updateTypeVisibility = function(){
      const isGst = $('inv_type').value === 'gst';
      document.getElementById('inv_gst_fields').style.display = isGst ? 'contents' : 'none';
      const hint = $('inv_type_hint');
      if (isGst && !hasGstin) {
        hint.innerHTML = '<span style="color:#EF4444">⚠ Your GSTIN is not set in Settings — a GST invoice without your GSTIN is non-compliant. Add it in Settings & Rates → GST/Non-GST Invoicing.</span>';
      } else if (!isGst) {
        hint.innerHTML = '<span class="mut">No tax, no GSTIN, no GST words — plain invoice. Amount is the total.</span>';
      } else {
        hint.innerHTML = '<span class="mut">GST invoice with CGST/SGST or IGST breakdown.</span>';
      }
    };

    const updatePreview = function(){
      const amt = +$('inv_amt').value || 0;
      const isGst = $('inv_type').value === 'gst';
      if (!amt) { $('inv_preview').textContent = 'Enter amount'; return; }
      if (!isGst) {
        $('inv_preview').innerHTML = 'Amount: <b>' + fmt(amt) + '</b> <span class="mut">(no tax — plain invoice)</span>';
        return;
      }
      const rate = +$('inv_rate').value || 0;
      const intra = $('inv_intra').value === '1';
      const mode = $('inv_mode').value;
      const comp = computeInv({ amount: amt, gstRate: rate, intraState: intra, mode: mode, gst: true });
      let html = 'Taxable: <b>' + fmt(comp.taxable) + '</b>';
      if (intra) html += ' · CGST @ ' + (rate/2) + '%: ' + fmt(comp.cgst) + ' · SGST @ ' + (rate/2) + '%: ' + fmt(comp.sgst);
      else html += ' · IGST @ ' + rate + '%: ' + fmt(comp.igst);
      html += ' · <b>Total: ' + fmt(comp.total) + '</b>';
      $('inv_preview').innerHTML = html;
    };

    ['inv_amt','inv_rate','inv_intra','inv_mode','inv_type'].forEach(function(id){ $(id).addEventListener('input', updatePreview); });
    ['inv_mode','inv_type'].forEach(function(id){ $(id).addEventListener('change', updatePreview); });
    $('inv_type').addEventListener('change', updateTypeVisibility);
    $('inv_ms').addEventListener('change', function(){
      if ($('inv_ms').value !== '') {
        const x = p.pays[+$('inv_ms').value];
        if (x) $('inv_amt').value = x.amt || 0;
      }
      updatePreview();
    });
    updateTypeVisibility();
    updatePreview();

    $('inv_cancel').onclick = function(){ modal.remove(); };
    $('inv_save').onclick = function(){
      const amount = +$('inv_amt').value || 0;
      if (amount <= 0) { alert('Enter an amount greater than 0'); return; }
      const isGst = $('inv_type').value === 'gst';
      if (isGst && !hasGstin) {
        if (!confirm('Your company GSTIN is blank — a GST invoice without GSTIN is non-compliant.\n\nProceed anyway?')) return;
      }
      const inv = {
        id: 'inv' + Date.now().toString(36),
        no: nextInvoiceNo(),
        date: $('inv_date').value || new Date().toISOString().slice(0, 10),
        amount: amount,
        gst: isGst,
        gstRate: isGst ? (+$('inv_rate').value || 18) : 0,
        intraState: isGst ? ($('inv_intra').value === '1') : true,
        mode: isGst ? $('inv_mode').value : 'taxable',
        description: $('inv_desc').value.trim(),
        sac: isGst ? ($('inv_sac').value.trim() || '9954') : '',
        milestone: $('inv_ms').value !== '' ? (p.pays[+$('inv_ms').value] || {}).n || '' : '',
        placeOfSupply: isGst ? $('inv_pos').value.trim() : '',
        clientGstin: isGst ? $('inv_cgstin').value.trim() : '',
        status: 'Issued',
        notes: $('inv_notes').value.trim(),
        created: Date.now()
      };
      p.inv = p.inv || [];
      p.inv.push(inv);
      try { bzSave('pj', p.id); } catch(e) {}
      try { audEvt('pj', p.id, p.name, 'Invoice issued', (isGst ? 'GST ' : 'Non-GST ') + inv.no + ' · ' + fmt(computeInv(inv).total)); } catch(e) {}
      S.bzdoc = { t: 'inv', id: p.id, i: p.inv.length - 1 };
      modal.remove();
      render();
    };
  }

  function invDoc(p, inv) {
    if (!inv) return '<div class="card"><p>Invoice not found.</p><button class="g" data-bza="docback">← Back</button></div>';
    ensureSettings();
    const c = co();
    const comp = computeInv(inv);
    const q = S.q[p.qid];
    const isGst = inv.gst !== false;
    const gstRate = +inv.gstRate || 18;
    const half = gstRate / 2;
    const off = inv.status === 'Cancelled';

    const recipient =
      '<b>' + esc(p.client || 'Client') + '</b><br>' +
      esc(p.addr || '') + '<br>' +
      (p.phone ? 'Phone: ' + esc(p.phone) + '<br>' : '') +
      (isGst && inv.clientGstin ? 'GSTIN: <b>' + esc(inv.clientGstin) + '</b>' : '');

    const rowDesc = inv.description || ('Interior design & turnkey execution services' + (q ? ' as per quotation ' + qno(q) : ''));
    const milestoneNote = inv.milestone ? '<br><small class="mut">Milestone: ' + esc(inv.milestone) + '</small>' : '';

    let tableHeader, row1, totRow, taxRows, grandTotal, reverseCharge;

    if (isGst) {
      tableHeader = '<tr><th style="width:50px">S.No</th><th>Description of Service</th><th style="width:100px">SAC</th><th class="r" style="width:130px">Amount (₹)</th></tr>';
      row1 = '<tr><td>1</td><td>' + esc(rowDesc) + milestoneNote + '</td><td>' + esc(inv.sac || '9954') + '</td><td class="r">' + fmt(comp.taxable) + '</td></tr>';
      totRow = '<tr class="tot"><td colspan="3" class="r"><b>Taxable Value</b></td><td class="r"><b>' + fmt(comp.taxable) + '</b></td></tr>';
      taxRows = inv.intraState !== false
        ? '<tr><td colspan="3" class="r">CGST @ ' + half + '%</td><td class="r">' + fmt(comp.cgst) + '</td></tr>' +
          '<tr><td colspan="3" class="r">SGST @ ' + half + '%</td><td class="r">' + fmt(comp.sgst) + '</td></tr>'
        : '<tr><td colspan="3" class="r">IGST @ ' + gstRate + '%</td><td class="r">' + fmt(comp.igst) + '</td></tr>';
      grandTotal = '<tr class="tot gt"><td colspan="3" class="r"><b>Total Invoice Value</b></td><td class="r"><b>' + fmt(comp.total) + '</b></td></tr>';
      reverseCharge = '<p style="font-size:11px;margin-top:6px"><b>Reverse Charge:</b> No</p>';
    } else {
      tableHeader = '<tr><th style="width:50px">S.No</th><th>Description of Service</th><th class="r" style="width:130px">Amount (₹)</th></tr>';
      row1 = '<tr><td>1</td><td>' + esc(rowDesc) + milestoneNote + '</td><td class="r">' + fmt(comp.total) + '</td></tr>';
      totRow = '';
      taxRows = '';
      grandTotal = '<tr class="tot gt"><td colspan="2" class="r"><b>Total Invoice Value</b></td><td class="r"><b>' + fmt(comp.total) + '</b></td></tr>';
      reverseCharge = '';
    }

    const body =
      (off ? '<div style="border:2px solid #b00020;color:#b00020;padding:8px;font-weight:bold;text-align:center;margin-bottom:10px">CANCELLED</div>' : '') +
      '<div style="margin:10px 0 6px;font-weight:bold;font-size:12px;color:#4D5A4A;letter-spacing:1px">BILL TO</div>' +
      '<div style="margin-bottom:14px">' + recipient + '</div>' +
      '<table class="t">' + tableHeader + row1 + totRow + taxRows + grandTotal + '</table>' +
      '<p style="font-size:12px;margin-top:10px"><b>Amount in words:</b> ' + esc(amtWords(comp.total)) + '</p>' +
      reverseCharge +
      (inv.notes ? '<div class="sh">NOTES</div><p style="font-size:12px">' + esc(inv.notes) + '</p>' : '') +
      '<div style="display:flex;justify-content:space-between;margin-top:40px;font-size:12px">' +
        '<div>This is a computer-generated invoice.</div>' +
        '<div style="text-align:center">For <b>' + esc(c.name || 'Company') + '</b><br><br><br>Authorised Signatory</div>' +
      '</div>';

    let meta = (isGst ? 'Tax Invoice' : 'Invoice') + '<br>' +
      'No.: <b>' + esc(inv.no) + '</b><br>' +
      'Date: ' + (inv.date ? dmy(inv.date) : dmy(new Date().toISOString().slice(0, 10))) + '<br>';
    if (isGst && c.gstin) meta += 'GSTIN: <b>' + esc(c.gstin) + '</b><br>';
    if (isGst) meta += 'Place of Supply: ' + esc(inv.placeOfSupply || c.state || 'West Bengal');

    const title = isGst ? 'TAX INVOICE' : 'INVOICE';
    const filePrefix = isGst ? 'GST-Invoice-' : 'Invoice-';

    return '<div class="bar noprint">' +
      '<button data-a="dpdf" data-acc="1" data-fn="' + filePrefix + esc(String(inv.no).replace(/\//g, '-')) + '.pdf">Download PDF</button>' +
      '<button class="g" data-a="ap">Print</button>' +
      (off ? '' : '<button class="g" data-inv-act="cancel-doc" data-i="' + p.inv.indexOf(inv) + '">Cancel this invoice</button>') +
      '<button class="g" data-bza="docback">← Back</button>' +
    '</div>' + docPaper(title, meta, body);
  }

  if (typeof PJTABS !== 'undefined' && PJTABS.push && !PJTABS.some(function(t){return t[0]==='inv';})) {
    PJTABS.push(['inv', 'Invoices', 'fs']);
  }
  if (typeof ERPT !== 'undefined' && ERPT.push && ERPT.indexOf('inv') < 0) {
    ERPT.push('inv');
  }

  if (window.erpTab) {
    const _erpTab = window.erpTab;
    window.erpTab = function(p, T) {
      if (T === 'inv') return invTab(p);
      return _erpTab(p, T);
    };
  }
  if (window.vProj) {
    const _vProj = window.vProj;
    window.vProj = function() {
      if (S.bzdoc && S.bzdoc.t === 'inv') {
        const proj = BZ.pj[S.bzdoc.id];
        if (!proj) return _vProj();
        return invDoc(proj, (proj.inv || [])[S.bzdoc.i]);
      }
      return _vProj();
    };
  }
  if (window.vSet) {
    const _vSet2 = window.vSet;
    window.vSet = function() { return _vSet2() + invoiceSettingsCard(); };
  }

  function invoiceSettingsCard() {
    ensureSettings();
    const c = S.set.co || {};
    const hasGstin = !!(c.gstin && String(c.gstin).trim());
    return '<div class="card"><h3>GST / Non-GST Invoicing</h3>' +
      '<p class="mut" style="margin:4px 0 12px">Leave <b>GSTIN blank</b> if you are not GST-registered — new invoices will default to Non-GST and won\'t show any GST terms. Fill it in if you are registered.</p>' +
      '<div class="dgrid" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr))">' +
        '<div><label>Your GSTIN (blank = not registered)</label><input data-setup-inv="co|gstin" value="' + esc(c.gstin || '') + '" placeholder="15-character GSTIN" maxlength="15" style="text-transform:uppercase"></div>' +
        '<div><label>Your state</label><input data-setup-inv="co|state" value="' + esc(c.state || '') + '" placeholder="e.g. West Bengal"></div>' +
        '<div><label>Invoice number prefix</label><input data-setup-inv="invPrefix" value="' + esc(S.set.invPrefix || 'INV') + '"></div>' +
        '<div><label>Default SAC code</label><input data-setup-inv="sac" value="' + esc(S.set.sac || '9954') + '"><small class="mut">Only used on GST invoices.</small></div>' +
        '<div><label>Default GST rate (%)</label><input type="number" data-setup-inv="gst" value="' + (S.set.gst || 18) + '" min="0" max="28"><small class="mut">Only used on GST invoices.</small></div>' +
      '</div>' +
      '<p class="mut" style="margin-top:10px;font-size:11px"><b>Next invoice number:</b> ' + nextInvoiceNo() + ' (resets every April 1). Default for new invoices: <b>' + (hasGstin ? 'GST' : 'Non-GST') + '</b>.</p>' +
    '</div>';
  }

  document.addEventListener('change', function(e) {
    const t = e.target;
    if (!t.dataset || !t.dataset.setupInv) return;
    const path = t.dataset.setupInv;
    if (path.indexOf('co|') === 0) S.set.co[path.slice(3)] = t.value.trim();
    else if (path === 'gst') S.set.gst = +t.value || 18;
    else S.set[path] = t.value.trim();
    try { save('s'); } catch(x) {}
    try { flash('Saved'); } catch(x) {}
  });

  document.addEventListener('click', function(e) {
    const btn = e.target.closest('[data-inv-act]');
    if (!btn) return;
    e.preventDefault();
    const action = btn.dataset.invAct;
    const p = (S.bzdoc && S.bzdoc.id) ? BZ.pj[S.bzdoc.id] : BZ.pj[S.pj];
    if (!p) return;
    if (action === 'create') { invCreateDialog(p); return; }
    if (action === 'view') { S.bzdoc = { t: 'inv', id: p.id, i: +btn.dataset.i }; render(); return; }
    if (action === 'cancel' || action === 'cancel-doc') {
      const inv = (p.inv || [])[+btn.dataset.i];
      if (!inv) return;
      if (!confirm('Cancel invoice ' + inv.no + '?\n\nThe number stays on record but the invoice is marked CANCELLED. This number cannot be reused.')) return;
      inv.status = 'Cancelled';
      inv.cancelledAt = Date.now();
      try { bzSave('pj', p.id); } catch(x) {}
      try { audEvt('pj', p.id, p.name, 'Invoice cancelled', (inv.gst === false ? 'Non-GST ' : 'GST ') + inv.no); } catch(x) {}
      render();
      return;
    }
  });

  if (typeof render === 'function') {
    setTimeout(function(){ try { render(); } catch(x){} }, 300);
  }

  console.log('[ModuCraft +] GST / Non-GST invoice v2 loaded');
})();


// ==========================================
// STEP 3: PACKAGE TEMPLATES
// ==========================================
(function(){
  'use strict';
  if (window.__mcPackagesLoaded_v2) return;
  window.__mcPackagesLoaded_v2 = true;

  const PACKAGES = {
    'pkg_kitchen': { name: '🍳 Only Kitchen (Standard)', rooms: [
      { name: 'KITCHEN', t: 'KITCHEN', items: [ { mk: 'kb2', q: 4 }, { mk: 'kw2', q: 2 }, { mk: 'ktp', q: 1 }, { mk: 'kl2', q: 2 }, { mk: 'kbsk', q: 1 } ]}
    ]},
    'pkg_mbed': { name: '🛏️ Only Master Bedroom', rooms: [
      { name: 'MASTER BEDROOM', t: 'MASTER BEDROOM', items: [ { mk: 'wh3', q: 1 }, { mk: 'wl2', q: 1 }, { mk: 'bdbx', q: 1 }, { mk: 'bst', q: 2 }, { mk: 'drs', q: 1 }, { mk: 'tvw', q: 1 } ]}
    ]},
    'pkg_living': { name: '🛋️ Only Living Room', rooms: [
      { name: 'LIVING ROOM', t: 'LIVING ROOM', items: [ { mk: 'tvb', q: 1 }, { mk: 'tvp', q: 1 }, { mk: 'shr', q: 1 }, { mk: 'cru', q: 1 } ]}
    ]},
    'pkg_beds_only': { name: '🛌 Bedrooms Only (Master + 2)', rooms: [
      { name: 'MASTER BEDROOM', t: 'MASTER BEDROOM', items: [ { mk: 'wh3', q: 1 }, { mk: 'wl2', q: 1 }, { mk: 'bdbx', q: 1 }, { mk: 'bst', q: 2 }, { mk: 'drs', q: 1 } ]},
      { name: 'BEDROOM 2', t: 'BEDROOM 2', items: [ { mk: 'wh2', q: 1 }, { mk: 'wl1', q: 1 }, { mk: 'bdpl', q: 1 }, { mk: 'bst', q: 2 }, { mk: 'std', q: 1 } ]},
      { name: 'BEDROOM 3', t: 'BEDROOM 3', items: [ { mk: 'wh2', q: 1 }, { mk: 'wl1', q: 1 }, { mk: 'bdpl', q: 1 }, { mk: 'bst', q: 1 }, { mk: 'std', q: 1 } ]}
    ]},
    'pkg_1bhk': { name: '🏠 1BHK Package (Kitchen + 1 Bed + Living)', rooms: [
      { name: 'KITCHEN', t: 'KITCHEN', items: [ { mk: 'kb2', q: 4 }, { mk: 'kw2', q: 2 }, { mk: 'ktp', q: 1 }, { mk: 'kl2', q: 2 }, { mk: 'kbsk', q: 1 } ]},
      { name: 'MASTER BEDROOM', t: 'MASTER BEDROOM', items: [ { mk: 'wh3', q: 1 }, { mk: 'wl2', q: 1 }, { mk: 'bdbx', q: 1 }, { mk: 'bst', q: 2 }, { mk: 'drs', q: 1 }, { mk: 'tvw', q: 1 } ]},
      { name: 'LIVING ROOM', t: 'LIVING ROOM', items: [ { mk: 'tvb', q: 1 }, { mk: 'tvp', q: 1 }, { mk: 'shr', q: 1 }, { mk: 'cru', q: 1 } ]}
    ]},
    'pkg_2bhk': { name: '🏘️ 2BHK Package (Kitchen + 2 Beds + Living)', rooms: [
      { name: 'KITCHEN', t: 'KITCHEN', items: [ { mk: 'kb2', q: 4 }, { mk: 'kw2', q: 2 }, { mk: 'ktp', q: 1 }, { mk: 'kl2', q: 2 }, { mk: 'kbsk', q: 1 } ]},
      { name: 'MASTER BEDROOM', t: 'MASTER BEDROOM', items: [ { mk: 'wh3', q: 1 }, { mk: 'wl2', q: 1 }, { mk: 'bdbx', q: 1 }, { mk: 'bst', q: 2 }, { mk: 'drs', q: 1 } ]},
      { name: 'BEDROOM 2', t: 'BEDROOM 2', items: [ { mk: 'wh2', q: 1 }, { mk: 'wl1', q: 1 }, { mk: 'bdpl', q: 1 }, { mk: 'bst', q: 2 }, { mk: 'std', q: 1 } ]},
      { name: 'LIVING ROOM', t: 'LIVING ROOM', items: [ { mk: 'tvb', q: 1 }, { mk: 'tvp', q: 1 }, { mk: 'shr', q: 1 }, { mk: 'cru', q: 1 } ]}
    ]},
    'pkg_3bhk': { name: '🏢 3BHK Package (Full House)', rooms: [
      { name: 'KITCHEN', t: 'KITCHEN', items: [ { mk: 'kb2', q: 6 }, { mk: 'kw2', q: 3 }, { mk: 'ktp', q: 1 }, { mk: 'kl2', q: 3 }, { mk: 'kbsk', q: 1 } ]},
      { name: 'MASTER BEDROOM', t: 'MASTER BEDROOM', items: [ { mk: 'wh4', q: 1 }, { mk: 'wl2', q: 1 }, { mk: 'bdbx', q: 1 }, { mk: 'bst', q: 2 }, { mk: 'drs', q: 1 }, { mk: 'tvw', q: 1 } ]},
      { name: 'BEDROOM 2', t: 'BEDROOM 2', items: [ { mk: 'wh3', q: 1 }, { mk: 'wl2', q: 1 }, { mk: 'bdbx', q: 1 }, { mk: 'bst', q: 2 }, { mk: 'std', q: 1 } ]},
      { name: 'BEDROOM 3', t: 'BEDROOM 3', items: [ { mk: 'wh2', q: 1 }, { mk: 'wl1', q: 1 }, { mk: 'bdpl', q: 1 }, { mk: 'bst', q: 2 }, { mk: 'std', q: 1 } ]},
      { name: 'LIVING ROOM', t: 'LIVING ROOM', items: [ { mk: 'tvb', q: 1 }, { mk: 'tvp', q: 1 }, { mk: 'shr', q: 1 }, { mk: 'cru', q: 1 } ]}
    ]},
    'pkg_office': { name: '💼 Office / Commercial Basic', rooms: [
      { name: 'RECEPTION', t: 'RECEPTION', items: [ { mk: 'utl', q: 1 }, { mk: 'shr', q: 1 }, { mk: 'cru', q: 1 } ]},
      { name: 'WORKSTATION AREA', t: 'OPEN WORKSTATION AREA', items: [ { mk: 'std', q: 4 } ]},
      { name: 'CABIN', t: 'PRIVATE CABIN', items: [ { mk: 'std', q: 1 }, { mk: 'utl', q: 1 } ]}
    ]}
  };

  function applyPackage(pkgId) {
    const pkg = PACKAGES[pkgId];
    if (!pkg) return;
    
    let q = T();
    if (!q) {
      const id = 'q' + Date.now().toString(36);
      S.q[id] = { id, ts: Date.now(), name: '', by: lastBy(), project: '', address: '', contact: '', date: new Date().toISOString().slice(0, 10), rooms: [], ir: {}, grp: id, rev: 0, seq: 1, st: 'draft', pay: cl(S.set.pay), notes: S.set.notes };
      S.cur = id;
      S.tab = 'e';
      q = S.q[id];
    }

    pkg.rooms.forEach(pkgRoom => {
      const newRoom = {
        id: 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2,5),
        t: pkgRoom.t,
        name: pkgRoom.name,
        w: 0,
        rate: '',
        rows: []
      };

      pkgRoom.items.forEach(item => {
        const m = MOD[item.mk];
        if (!m) return;
        const r = modRow(newRoom, m, m.sw[Math.floor(m.sw.length/2)] || m.w0, m.h, q);
        r.q = item.q || 1;
        newRoom.rows.push(r);
      });
      
      if (typeof syncAuto === 'function') syncAuto(newRoom);
      q.rooms.push(newRoom);
    });

    save('q', S.cur);
    render();
    flash('Package added successfully!');
  }

  function showPackageModal() {
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:flex-start;justify-content:center;z-index:100001;padding:20px;overflow-y:auto';
    
    const btnHtml = Object.entries(PACKAGES).map(([id, p]) => 
      `<button data-pkg-id="${id}" style="background:var(--in);color:var(--ink);border:1px solid var(--line);text-align:left;padding:12px;font-size:15px;margin-bottom:8px;display:block;width:100%;border-radius:8px;font-weight:600;cursor:pointer;transition:background 0.2s">${p.name}</button>`
    ).join('');

    modal.innerHTML = `
      <div style="background:var(--card,#fff);color:var(--ink,#222);border-radius:12px;padding:20px;max-width:480px;width:100%;box-shadow:0 10px 40px rgba(0,0,0,.5);margin:auto">
        <h3 style="margin-top:0">Insert Package Template</h3>
        <p class="mut" style="font-size:13px;margin-bottom:16px">Choose a pre-built set of rooms and modules. They will be added to your current quotation, and you can edit the sizes/quantities after.</p>
        <div style="max-height:60vh;overflow-y:auto;padding-right:4px">${btnHtml}</div>
        <button id="pkg_cancel" style="margin-top:14px;width:100%;background:transparent;border:1px solid var(--line);color:var(--ink);padding:10px;border-radius:8px;font-weight:600;cursor:pointer">Cancel</button>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelectorAll('[data-pkg-id]').forEach(btn => {
      btn.onclick = () => { applyPackage(btn.dataset.pkgId); modal.remove(); };
      btn.onmouseenter = () => btn.style.background = 'var(--bg)';
      btn.onmouseleave = () => btn.style.background = 'var(--in)';
    });
    document.getElementById('pkg_cancel').onclick = () => modal.remove();
  }

  if (window.vList) {
    const _vList = window.vList;
    window.vList = function() {
      let html = _vList();
      html = html.replace('<button data-a="nq">+ New quotation</button>', '<button data-a="nq">+ New quotation</button><button class="g" id="btn-insert-pkg" style="border-color:#1F4E79;color:#1F4E79;font-weight:600">📦 Insert Package</button>');
      return html;
    };
  }

  if (window.vEdit) {
    const _vEdit = window.vEdit;
    window.vEdit = function() {
      let html = _vEdit();
      html = html.replace('<button data-a="sv">Save quotation</button>', '<button data-a="sv">Save quotation</button><button class="g" id="btn-insert-pkg" style="border-color:#1F4E79;color:#1F4E79;font-weight:600">📦 Insert Package</button>');
      return html;
    };
  }

  document.addEventListener('click', function(e) {
    if (e.target.id === 'btn-insert-pkg') {
      e.preventDefault();
      showPackageModal();
    }
  });

  console.log('[ModuCraft +] Package templates v2 loaded');
})();


// ==========================================
// STEP 4: ENQUIRY TRACKER (PRE-QUOTATION)
// ==========================================
(function(){
  'use strict';
  if (window.__mcEnqLoaded) return;
  window.__mcEnqLoaded = true;

  // Initialize Data Storage
  window.ENQ = JSON.parse(localStorage.getItem('msq_enq_data') || '{}');
  window.saveEnq = function() {
    localStorage.setItem('msq_enq_data', JSON.stringify(window.ENQ));
  };

  // Render the Enquiry List
  window.vEnq = function() {
    const list = Object.values(window.ENQ).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const t = today();

    const rows = list.map(e => {
      const isOverdue = e.nextFollowUp && e.nextFollowUp <= t;
      const badge = e.status === 'Won' ? '<span style="color:#15803d">Won</span>' : 
                    e.status === 'Lost' ? '<span style="color:#b00020">Lost</span>' : 
                    `<span style="color:#1F4E79">${e.status || 'Enquiry'}</span>`;
      
      return `<tr>
        <td><b>${esc(e.name)}</b><br><span class="mut">${esc(e.phone)}</span></td>
        <td>${esc(e.project)}</td>
        <td>${esc(e.budget || '—')}</td>
        <td style="${isOverdue ? 'color:#b00020;font-weight:bold' : ''}">${e.nextFollowUp ? dmy(e.nextFollowUp) : '—'}</td>
        <td>${badge}</td>
        <td style="white-space:nowrap">
          <button class="g" data-enq-act="edit" data-id="${e.id}">Edit</button>
          ${e.status !== 'Won' ? `<button data-enq-act="convert" data-id="${e.id}" style="background:#1F4E79;color:#fff;border:0;border-radius:6px;padding:4px 10px;cursor:pointer;margin-left:4px">→ Quote</button>` : ''}
        </td>
      </tr>`;
    }).join('');

    return `<div class="card">
      <div class="bar noprint">
        <h2>Enquiries / Leads</h2>
        <button data-enq-act="new" style="background:#1F4E79;color:#fff;border:0;border-radius:6px;padding:6px 12px;font-weight:600;cursor:pointer;margin-left:auto">+ New Enquiry</button>
      </div>
      <p class="mut">Track potential clients before creating a quotation. Convert them to a quote with one click.</p>
      <div class="sc">
        <table class="g" style="min-width:760px">
          <tr><th>Client</th><th>Project / Requirement</th><th>Budget</th><th>Next Follow Up</th><th>Status</th><th></th></tr>
          ${rows || '<tr><td colspan="6" class="mut">No enquiries logged yet.</td></tr>'}
        </table>
      </div>
    </div>`;
  };

  // Add the Tab to the Navigation Menu
  const navObserver = new MutationObserver(() => {
    const nav = document.getElementById('nav');
    if (!nav || document.querySelector('#nav button[data-v="enq"]')) return;
    if (typeof navOK === 'function' && !navOK('q')) return; 

    const btn = document.createElement('button');
    btn.dataset.a = 'tab';
    btn.dataset.v = 'enq';
    btn.className = (S.tab === 'enq') ? 'on' : '';
    btn.textContent = 'Enquiries';
    btn.onclick = () => { S.tab = 'enq'; render(); };
    
    const firstBtn = nav.querySelector('button');
    if (firstBtn) firstBtn.after(btn);
    else nav.appendChild(btn);
  });
  if (document.getElementById('nav')) {
    navObserver.observe(document.getElementById('nav'), { childList: true });
  }

  const _render = window.render;
  window.render = function() {
    if (S.tab === 'enq') {
      document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('on', b.dataset.v === 'enq'));
      document.getElementById('app').innerHTML = window.vEnq();
      const btn = document.querySelector('#nav button[data-v="enq"]');
      if (btn) btn.classList.add('on');
      return;
    }
    const btn = document.querySelector('#nav button[data-v="enq"]');
    if (btn) btn.classList.remove('on');
    _render.apply(this, arguments);
  };

  // Modal for Add / Edit
  function openEnqModal(id) {
    const isNew = !id;
    const e = isNew ? { id: 'e' + Date.now().toString(36), date: today(), status: 'Enquiry' } : window.ENQ[id];
    
    const o = document.createElement('div');
    o.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:flex-start;justify-content:center;z-index:100001;padding:20px;overflow-y:auto';
    
    o.innerHTML = `<div style="background:var(--card,#fff);color:var(--ink,#222);border-radius:12px;padding:20px;max-width:500px;width:100%;box-shadow:0 10px 40px rgba(0,0,0,.4);margin:auto">
      <h3 style="margin-top:0">${isNew ? 'New Enquiry' : 'Edit Enquiry'}</h3>
      <div class="dgrid" style="grid-template-columns:1fr 1fr;gap:10px">
        <div style="grid-column:1/-1"><label>Client Name *</label><input id="eq_name" value="${esc(e.name||'')}"></div>
        <div><label>Phone / Email</label><input id="eq_phone" value="${esc(e.phone||'')}"></div>
        <div><label>Project (e.g. 2BHK)</label><input id="eq_proj" value="${esc(e.project||'')}"></div>
        <div><label>Budget</label><input id="eq_bud" value="${esc(e.budget||'')}"></div>
        <div><label>Next Follow Up</label><input type="date" id="eq_date" value="${e.nextFollowUp||''}"></div>
        <div style="grid-column:1/-1"><label>Notes</label><textarea id="eq_notes" rows="2">${esc(e.notes||'')}</textarea></div>
        <div style="grid-column:1/-1"><label>Status</label><select id="eq_status">${['Enquiry','Quoted','Won','Lost'].map(s=>`<option ${e.status===s?'selected':''}>${s}</option>`).join('')}</select></div>
      </div>
      <div class="bar" style="margin-top:14px;justify-content:flex-end">
        ${!isNew ? `<button class="g" id="eq_del" style="margin-right:auto;color:#b00020;border-color:#fca5a5">Delete</button>` : ''}
        <button class="g" id="eq_cancel">Cancel</button>
        <button id="eq_save" style="background:#1F4E79;color:#fff;border:0;border-radius:6px;padding:8px 20px;font-weight:600;cursor:pointer">Save</button>
      </div>
    </div>`;
    document.body.appendChild(o);

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

    document.getElementById('eq_save').onclick = () => {
      const name = document.getElementById('eq_name').value.trim();
      if (!name) { alert('Client name is required'); return; }
      e.name = name;
      e.phone = document.getElementById('eq_phone').value.trim();
      e.project = document.getElementById('eq_proj').value.trim();
      e.budget = document.getElementById('eq_bud').value.trim();
      e.nextFollowUp = document.getElementById('eq_date').value;
      e.notes = document.getElementById('eq_notes').value.trim();
      e.status = document.getElementById('eq_status').value;
      
      window.ENQ[e.id] = e;
      window.saveEnq();
      
      // WHATSAPP ALERT SYSTEM
      if (isNew) {
        const wText = `New Enquiry Alert!\n\nClient: ${e.name}\nProject: ${e.project || 'Not specified'}\nPhone: ${e.phone || 'Not provided'}\nBudget: ${e.budget || 'Not specified'}\nNext Follow-up: ${e.nextFollowUp || 'None'}\n\nSent from ModuCraft.`;
        const waOwner = `https://wa.me/919830051060?text=${encodeURIComponent(wText)}`;
        const waPartner = `https://wa.me/919830864409?text=${encodeURIComponent(wText)}`;
        
        // Change modal to success/notify screen
        o.innerHTML = `<div style="background:var(--card,#fff);color:var(--ink,#222);border-radius:12px;padding:20px;max-width:400px;width:100%;box-shadow:0 10px 40px rgba(0,0,0,.4);margin:auto;text-align:center">
          <h3 style="margin-top:0;color:#22C
