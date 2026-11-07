/* ===== MODULE STUDIO TERMS ADDON (Final Fix) ===== */
(function () {
  if (window.__mstudioTermsLoaded) return;
  window.__mstudioTermsLoaded = true;

  const CLAUSES = [
    ['1. CONTRACT DOCUMENTS & ORDER OF PRECEDENCE', [
      "1.1 The agreement for the project consists of the accepted quotation, room-wise BOQ, approved drawings and specifications, approved material/finish selections, written change orders, project-specific schedules and this document.",
      "1.2 The accepted quotation and BOQ are the primary commercial reference. Descriptions, dimensions, quantities, materials, finishes and accessories will be interpreted according to the approved documents.",
      "1.3 If documents conflict, the parties will first refer to the latest mutually approved written revision. Order of precedence: (a) signed change order/latest written approval; (b) accepted quotation and BOQ; (c) approved drawings and specifications; (d) this document; (e) other project correspondence.",
      "1.4 Any obvious clerical, typographical or calculation error will be brought to the customer's attention promptly. A correction affecting price or scope requires written communication and customer approval before the affected additional work proceeds. MODULE STUDIO will not use this clause to unilaterally increase an accepted price or remove agreed items."
    ]],
    ['2. SCOPE OF WORK & EXCLUSIONS', [
      "2.1 Only the work, modules, quantities, materials, finishes, accessories and services expressly listed in the accepted quotation/BOQ are included.",
      "2.2 Items not expressly included are excluded. Unless specifically quoted, exclusions may include civil alterations, structural work, plumbing, electrical rewiring, appliance supply or installation, countertop/stone work, painting, false ceiling, glass/metal works, curtains, blinds, loose furniture, decor, internet/networking, automation, air-conditioning, exhaust/ducting, and third-party products or services.",
      "2.3 Optional items such as electrical work and countertop work will be treated as separate scope and price items. No optional work will be assumed included merely because it appears in a drawing or discussion.",
      "2.4 The quotation identifies the module name, cabinet/shutter material and colour, dimensions, selected accessories and applicable module image/name and price. Individual hardware cost need not be separately itemised unless expressly agreed; the selected accessories and specifications must nevertheless be identifiable.",
      "2.5 Any work outside the accepted scope will be treated as additional work and handled under Clause 8."
    ]],
    ['3. SITE MEASUREMENT, DRAWINGS & APPROVALS', [
      "3.1 Initial estimates or layouts may be based on information available at the time. Final production dimensions must be confirmed through site measurement and/or approved drawings.",
      "3.2 The customer must review dimensions, layouts, door/window clearances, appliance sizes, service points, module configuration, finishes and other project-specific details before giving final approval.",
      "3.3 The customer is responsible for confirming that appliance models, plumbing/electrical points and third-party equipment are compatible with the approved design, unless the relevant coordination is expressly included in the quotation.",
      "3.4 Production or procurement dependent on customer approval will begin only after the required written approval is received. Delayed approvals may affect the project schedule."
    ]],
    ['4. PRICE, TAXES & PRICE PROTECTION', [
      "4.1 The accepted quotation records the agreed price for the stated scope, quantities and specifications. Applicable GST and other statutory taxes/charges will be treated exactly as stated in the quotation or tax invoice.",
      "4.2 The 90-day price protection applies from the quotation date to the quoted scope and specifications, provided the quotation is accepted within its stated validity. It does not freeze prices for later additions, reductions, specification changes, quantity changes or a materially revised project.",
      "4.3 Where a supplier discontinues a specified product or it becomes unavailable, MODULE STUDIO will inform the customer and propose a reasonably comparable alternative for written approval before substitution, together with any price or timeline impact.",
      "4.4 No price or scope change will be made unilaterally. Revised amounts must be communicated and approved in writing before the affected additional or changed work proceeds."
    ]],
    ['5. PAYMENT TERMS', [
      "5.1 Unless the accepted quotation states a different written schedule, payments are due at these milestones: 40% on order confirmation; 20% when carpentry is 50% complete; 20% on finalisation of laminate shades/finishes; 15% at the final colour/finishing stage; and 5% at handover.",
      "5.2 MODULE STUDIO will communicate when a milestone is reached and the corresponding payment becomes due. The customer should make payment using the authorised payment details stated in the quotation or invoice and retain proof of payment.",
      "5.3 Delayed payments may affect procurement, production, delivery and installation dates. MODULE STUDIO will communicate the impact and may pause the affected work after giving written notice where payment remains outstanding.",
      "5.4 The final 5% is payable at handover. The customer should inspect the completed work within the agreed inspection period and record visible snags in writing. Inspection or snagging must not be unreasonably delayed; nor will a minor snag automatically prevent handover of an otherwise complete and usable area. The parties should record any agreed holdback or alternate arrangement in writing.",
      "5.5 Any undisputed overdue amount remains payable in accordance with the accepted quotation and applicable law. Nothing in this clause limits statutory customer rights."
    ]],
    ['6. PROJECT SCHEDULE, SITE READINESS & DELAYS', [
      "6.1 Indicative project durations are 15 calendar days for the specified civil/site preparation period and 45 working days for furniture execution/installation. The accepted quotation or project schedule must identify the applicable start point and any project-specific variation.",
      "6.2 Unless expressly agreed otherwise, the furniture timeline begins only after required site measurements, final drawings/specifications, customer approvals, initial/milestone payments, material/finish selections and site readiness are in place.",
      "6.3 The customer must provide safe and reasonable site access, electricity, water where required, working space, permissions, lift/access arrangements and completed prerequisite civil/services work. The site must be sufficiently dry, secure and ready for installation.",
      "6.4 Delays caused by customer decisions or approvals, late payments, site not being ready, restricted access, building permissions, other contractors, changes in scope, supplier shortages, transport disruption, force majeure or events beyond reasonable control may extend the schedule by a reasonable period. MODULE STUDIO will communicate material schedule impacts.",
      "6.5 Any revised completion date should be recorded in writing. Time estimates are not a guarantee where dependencies outside MODULE STUDIO's reasonable control affect the work."
    ]],
    ['7. CUSTOMER RESPONSIBILITIES', [
      "7.1 The customer must provide accurate project information, timely decisions and approvals, access to the site and a responsible point of contact.",
      "7.2 The customer must arrange building/society permissions, work-hour permissions, parking/loading access and any deposits or permissions required from the property management, unless the quotation expressly includes these arrangements.",
      "7.3 The customer must protect personal belongings and clear the work area before installation. The customer should inform MODULE STUDIO of concealed pipes, wiring, structural restrictions or other known site conditions.",
      "7.4 The customer should coordinate other contractors so they do not obstruct or damage MODULE STUDIO's work. Damage caused by third parties after installation may be chargeable to the responsible party/customer, subject to evidence and applicable law."
    ]],
    ['8. CHANGES, VARIATIONS & ADDITIONAL WORK', [
      "8.1 Any request to change layout, dimensions, modules, materials, finishes, accessories, quantities or scope after approval must be submitted and assessed for feasibility.",
      "8.2 MODULE STUDIO will communicate the price and timeline impact of a variation before proceeding. Additional work will begin only after written customer approval.",
      "8.3 Where work or materials have already been procured, fabricated or installed, reasonable and documented cancellation, replacement, return, wastage, additional material, labour, transportation or fabrication costs arising from the requested change may be charged after prior communication.",
      "8.4 If a requested change is technically, commercially or supplier-wise not feasible, the originally approved specification will remain applicable unless both parties agree otherwise in writing."
    ]],
    ['9. PROCUREMENT, MATERIALS & SUBSTITUTIONS', [
      "9.1 Materials and products will be procured according to the approved quotation and selections, subject to normal manufacturing tolerances, batch variations and product availability.",
      "9.2 Natural materials, laminates, veneers, stones, glass, metals and printed/coloured finishes may show reasonable variations in shade, grain, texture, pattern or reflection between samples, batches and installed surfaces. Samples are a guide and may not reproduce the entire finished surface exactly.",
      "9.3 No material or finish substitution that materially changes the approved specification will be made without informing the customer and obtaining written approval, except where an urgent safety measure is reasonably necessary.",
      "9.4 Manufacturer warranties, product guarantees and care instructions for third-party materials, fittings, appliances and accessories are governed by the relevant manufacturer/supplier terms."
    ]],
    ['10. CUSTOMER-REQUESTED SUSPENSION', [
      "10.1 A customer-requested project suspension must be submitted in writing, stating the requested start date and reason.",
      "10.2 MODULE STUDIO will assess the impact on costs, resource availability, procurement, storage, fabrication and project timelines and communicate the consequences to the customer.",
      "10.3 Once the suspension-related requirements are resolved and the customer confirms resumption, an approved buffer of 7 calendar days will apply for resumption planning, subject to resource and site availability. Any additional impact will be communicated.",
      "10.4 Costs reasonably incurred during the suspension, including committed procurement, storage, demobilisation/remobilisation or supplier charges, may be recoverable where communicated and documented."
    ]],
    ['11. DELIVERY, ACCESS & TRANSPORTATION', [
      "11.1 Delivery and installation arrangements will follow the accepted quotation and confirmed site conditions. The customer must ensure suitable access and a clear route to the installation area.",
      "11.2 A special manual lifting/carrying charge may apply only where the delivery is above the second floor and no service lift is available. Any applicable charge must be communicated to the customer before delivery.",
      "11.3 Delays or additional handling caused by inaccurate access information, blocked access, building restrictions or site conditions may affect the schedule and may result in reasonable additional costs where communicated and documented."
    ]],
    ['12. INSTALLATION, INSPECTION & SNAG LIST', [
      "12.1 After installation, MODULE STUDIO will carry out reasonable visual and functional checks of the supplied and installed furniture. Where applicable, drawers, hinges, channels, shutters, lift-up mechanisms and other installed hardware will be checked for basic operation.",
      "12.2 The customer or authorised representative may observe the demonstration during final inspection. Relevant operating and care instructions will be shared where applicable.",
      "12.3 Visible installation-related issues identified at inspection should be recorded in a written snag list, preferably with photographs and location details. MODULE STUDIO will review the list and arrange rectification of accepted installation-related snags within a reasonable period, taking into account access, parts and site conditions.",
      "12.4 A snag list is not a mechanism to add new scope or change approved specifications. New requests will be assessed under Clause 8.",
      "12.5 Electrical appliances, plumbing systems and third-party products are subject to their respective supplier/manufacturer testing and warranty arrangements unless specifically included in MODULE STUDIO's scope."
    ]],
    ['13. PARTIAL HANDOVER & ROOM-WISE COMPLETION', [
      "13.1 For projects covering multiple rooms or areas, MODULE STUDIO may offer independently completed and usable areas for phased handover.",
      "13.2 Each agreed partial handover will be documented in writing, identifying completed areas, pending areas, outstanding snags (if any), handover date and any area-specific warranty commencement date.",
      "13.3 Payment milestones will continue according to the accepted quotation and payment schedule unless a different arrangement is agreed in writing.",
      "13.4 Pending work in one area will not automatically prevent handover of another independently completed and usable area. Separate handover documentation will not reduce applicable customer warranty or statutory rights."
    ]],
    ['14. CLEANING, WASTE & SITE RESTORATION', [
      "14.1 MODULE STUDIO will leave its immediate work area in a reasonably orderly condition after installation and remove packaging/offcuts generated by its work to the designated collection point, to the extent stated in the quotation.",
      "14.2 The customer will arrange a designated waste collection/disposal area and the final removal of project debris from the property/premises, unless waste removal is expressly included in the quotation.",
      "14.3 Deep cleaning of the entire premises is included only if expressly listed in the accepted quotation. Otherwise, post-construction/deep cleaning is excluded and should be arranged separately by the customer."
    ]],
    ['15. WARRANTY & AFTER-SALES SERVICE', [
      "15.1 MODULE STUDIO provides a 10-year limited workmanship warranty for eligible workmanship performed directly by MODULE STUDIO, commencing from the documented final handover date for the relevant project or separately handed-over area.",
      "15.2 This workmanship warranty covers defects directly attributable to faulty workmanship in the installed work, subject to inspection and the exclusions below. The remedy may be repair or rectification of the affected workmanship at MODULE STUDIO's reasonable discretion, consistent with applicable law.",
      "15.3 The warranty does not automatically cover materials, laminates, boards, hardware, hinges, channels, accessories, appliances, glass, stone, electrical/plumbing components or other products supplied by third parties; such items are covered, if at all, by the applicable manufacturer/supplier warranty, which will be passed on or identified where available.",
      "15.4 Unless caused by covered workmanship, the warranty excludes normal wear and tear; misuse, overloading or impact; accidental or deliberate damage; water seepage, dampness, flooding, excessive heat, fire or pest/termite attack; building movement or structural defects; unauthorised repairs or alterations; poor maintenance or failure to follow care instructions; and damage caused by third parties or events beyond reasonable control.",
      "15.5 The customer should notify MODULE STUDIO promptly after discovering a potential warranty issue, providing the project reference, description and photographs where possible. MODULE STUDIO may inspect the site before deciding whether the issue is covered.",
      "15.6 The warranty is limited to the affected covered work and does not create a blanket guarantee of the entire premises or unrelated products. Nothing in this clause excludes or restricts rights that cannot lawfully be excluded under applicable consumer law."
    ]],
    ['16. CANCELLATION & TERMINATION', [
      "16.1 A customer wishing to cancel the project must notify MODULE STUDIO in writing.",
      "16.2 On cancellation, the parties will prepare a fair account of work completed, materials ordered or customised, supplier commitments, fabrication completed, services performed, payments received and materials that can reasonably be cancelled, returned or reused.",
      "16.3 MODULE STUDIO may deduct or recover reasonable, evidenced costs and the value of work/services already performed, together with non-recoverable supplier or cancellation charges actually incurred. Any recoverable or reusable materials and any unspent balance will be accounted for transparently.",
      "16.4 No automatic forfeiture of all amounts paid or arbitrary penalty will apply merely because the project is cancelled. Any settlement will be itemised and handled in accordance with applicable law.",
      "16.5 If either party materially breaches the agreement, the other party should give written notice describing the breach and a reasonable opportunity to remedy it, where capable of remedy. If unresolved, either party may exercise its rights under the agreement and applicable law."
    ]],
    ['17. INTELLECTUAL PROPERTY, PHOTOGRAPHS & CONFIDENTIALITY', [
      "17.1 Drawings, designs, 3D views, layouts, BOQ formats and other creative or technical materials prepared by MODULE STUDIO remain its intellectual property unless the parties agree otherwise in writing. The customer receives permission to use the approved project documents for execution of the specific project at the stated site.",
      "17.2 The customer must not reproduce, commercially exploit, distribute or provide MODULE STUDIO's drawings/designs to another fabricator for a different project without written permission, except to the extent required by law or expressly agreed.",
      "17.3 MODULE STUDIO will treat customer contact details, site information, drawings and commercial information as confidential and use them for project delivery, service, records and legal/compliance purposes.",
      "17.4 Photographs or videos of the completed project for portfolio, website or social media use will be taken or published only with the customer's prior consent. The customer may withhold consent without affecting the agreed project services."
    ]],
    ['18. SAFETY, ACCESS & THIRD-PARTY WORK', [
      "18.1 The customer must disclose known site hazards and ensure that the work area is reasonably safe and accessible.",
      "18.2 MODULE STUDIO is responsible for its own personnel and subcontractors engaged for its scope, subject to applicable law. The customer remains responsible for work carried out by separately appointed contractors and for coordination of their activities unless otherwise agreed.",
      "18.3 MODULE STUDIO is not responsible for defects in pre-existing building conditions, concealed services or third-party work outside its contracted scope, except to the extent caused by MODULE STUDIO's negligence or breach."
    ]],
    ['19. FORCE MAJEURE', [
      "19.1 Neither party will be treated as in breach for delay caused by events beyond reasonable control, including natural disasters, severe weather, fire, epidemic/pandemic restrictions, government action, civil disturbance, transport disruption, major supplier shutdown or interruption of essential services.",
      "19.2 The affected party will inform the other as reasonably practicable. The schedule will be extended for the period reasonably affected, and the parties will discuss practical steps to minimise disruption."
    ]],
    ['20. LIABILITY & STATUTORY RIGHTS', [
      "20.1 Each party remains responsible for its obligations and for loss or damage to the extent caused by its breach, negligence or wilful misconduct, subject to applicable law.",
      "20.2 Nothing in this document excludes liability or a customer remedy that cannot lawfully be excluded or limited, including rights available under applicable consumer protection legislation.",
      "20.3 To the extent permitted by law, MODULE STUDIO is not responsible for indirect loss arising from matters outside its contracted scope or reasonable control. This clause does not limit liability for fraud, wilful misconduct, negligence where liability cannot be excluded, or statutory consumer rights."
    ]],
    ['21. COMPLAINTS, COMMUNICATION & DISPUTE RESOLUTION', [
      "21.1 Project instructions, approvals, variations, suspension requests, snag lists and cancellation notices should be communicated in writing through the contact details or communication channel recorded in the quotation.",
      "21.2 The parties will first attempt to resolve any concern through good-faith discussion and a written record of the issue and proposed resolution.",
      "21.3 If the matter remains unresolved, either party may pursue remedies available under applicable Indian law before the competent forum. Any contractual venue or jurisdiction provision must be completed in the project quotation only after legal review and cannot override mandatory statutory jurisdiction."
    ]],
    ['22. GENERAL', [
      "22.1 Any amendment to the agreed scope, price, schedule or these project-specific terms must be recorded in writing and accepted by both parties.",
      "22.2 If any provision is found unenforceable, the remaining provisions will continue to the extent permitted by law.",
      "22.3 A delay or failure to enforce a provision does not by itself waive the right to enforce it later.",
      "22.4 This document should be read with the accepted quotation and project-specific schedules. If a project-specific term is intended to override a general term, it must identify the clause and be expressly accepted in writing."
    ]]
  ];

  const clauseHtml = ([title, subs]) =>
    '<div style="margin-top:7px; break-inside:avoid; page-break-inside:avoid;">' +
      '<div style="background:#efe7d6;color:#4D5A4A;font-weight:700;padding:3px 8px;font-size:9px;letter-spacing:.5px;border-left:3px solid #B08D57">' + esc(title) + '</div>' +
      subs.map(s => '<p style="margin:2px 0 0;font-size:8.5px;line-height:1.35;color:#3a3a3a;text-align:justify">' + esc(s) + '</p>').join('') +
    '</div>';

  // Balanced into 4 pages
  const PART_B1 = '<div class="pg" style="font-size:8.5px;color:#3a3a3a;">' +
    '<h2 style="text-align:center;letter-spacing:3px;color:#B08D57;font-size:14px;margin:0 0 4px">PART B — DETAILED TERMS &amp; CONDITIONS (1/4)</h2>' +
    '<p style="text-align:center;font-size:9px;color:#888;margin:0 0 8px;font-style:italic">These terms govern how the project will be delivered. Please read them with your accepted quotation, BOQ and approved drawings.</p>' +
    CLAUSES.slice(0,5).map(clauseHtml).join('') + '</div>';

  const PART_B2 = '<div class="pg" style="font-size:8.5px;color:#3a3a3a;">' +
    '<h2 style="text-align:center;letter-spacing:3px;color:#B08D57;font-size:14px;margin:0 0 8px">PART B — DETAILED TERMS &amp; CONDITIONS (2/4)</h2>' +
    CLAUSES.slice(5,11).map(clauseHtml).join('') + '</div>';

  const PART_B3 = '<div class="pg" style="font-size:8.5px;color:#3a3a3a;">' +
    '<h2 style="text-align:center;letter-spacing:3px;color:#B08D57;font-size:14px;margin:0 0 8px">PART B — DETAILED TERMS &amp; CONDITIONS (3/4)</h2>' +
    CLAUSES.slice(11,17).map(clauseHtml).join('') + '</div>';

  const PART_B4 = '<div class="pg" style="font-size:8.5px;color:#3a3a3a;">' +
    '<h2 style="text-align:center;letter-spacing:3px;color:#B08D57;font-size:14px;margin:0 0 8px">PART B — DETAILED TERMS &amp; CONDITIONS (4/4)</h2>' +
    CLAUSES.slice(17).map(clauseHtml).join('') + '</div>';

  const PART_A_CARDS = [
    ['#B08D57','#fff9ee','#e6d5b3','Thoughtful design. Clear specifications.','We plan and fabricate according to the approved layout, dimensions, module descriptions, materials, finishes and accessories recorded in your quotation and approved drawings.'],
    ['#4D5A4A','#f2f7f2','#c5dcc5','Material &amp; finish approval before production','You review every material, colour, finish and accessory selection. Production proceeds against the final approved specifications.'],
    ['#3B6DA8','#eef4fa','#c2d5e8','Transparent, milestone-based payments','The payment plan is linked to defined project stages. The exact amount at each stage is shown in your quotation or payment schedule.'],
    ['#C89B2A','#fff8e6','#e8d89b','90-day price protection','The quoted price is protected for 90 days from the quotation date, subject to scope, quantities, specifications and assumptions remaining unchanged.'],
    ['#B1433C','#fef2f2','#ecc5c5','10-year limited workmanship warranty','Eligible workmanship by MODULE STUDIO is covered by a limited 10-year warranty (subject to coverage, exclusions and applicable law in Part B).'],
    ['#7B4F9E','#f5f0f8','#d4c5e0','Progress coordination &amp; documented approvals','Important decisions affecting design, material, price, scope and schedule are recorded in writing, helping both parties track approvals.'],
    ['#2E8B6B','#ecf7f3','#bcdcd0','Installation checks &amp; handover','Reasonable visual and functional checks are carried out at installation completion. Visible issues are recorded through the snag-list process.'],
    ['#555','#f0f0f0','#d0d0d0','After-sales support','Warranty and service requests can be raised using the contact details on this document and your quotation.']
  ];

  function partA(q) {
    const cards = PART_A_CARDS.map(([ac,bg,bd,title,body]) =>
      '<div style="background:'+bg+';border:1px solid '+bd+';border-left:4px solid '+ac+';border-radius:6px;padding:8px 10px">' +
        '<b style="color:'+ac+';font-size:10.5px">✦ '+title+'</b>' +
        '<p style="margin:3px 0 0;font-size:9.5px;color:#4a4a4a;line-height:1.4">'+body+'</p>' +
      '</div>'
    ).join('');
    const commitment = S.set.cm.map(x => '• ' + esc(x)).join('<br/>');
    
    // Notes moved to Page 11 (Part A)
    const notesHtml = q.notes ? `<div style="background:#fff3cd; border:1px solid #ffe69c; border-radius:8px; padding:12px 16px; margin-bottom:16px;"><b style="color:#664d03;font-size:12px;letter-spacing:1px">NOTES, EXCLUSIONS & ADDITIONAL COST ITEMS</b><div style="font-size:10px;color:#664d03;margin-top:6px;white-space:pre-line;line-height:1.5;">${esc(q.notes)}</div></div>` : '';

    return '<div class="pg">' +
      notesHtml +
      '<h2 style="text-align:center;letter-spacing:3px;color:#B08D57;margin-top:6px;font-size:15px">YOUR MODULE STUDIO EXPERIENCE</h2>' +
      '<p style="text-align:center;font-size:11px;color:#666;margin:0 0 12px;font-style:italic">Designing Spaces. Defining Lifestyles.</p>' +
      '<div style="background:linear-gradient(135deg,#1F2937 0%,#3A4A5F 100%);color:#fff;border-radius:8px;padding:12px 18px;text-align:center;margin-bottom:10px">' +
        '<div style="font-size:9px;letter-spacing:4px;color:#D8C4A5">MODULE STUDIO</div>' +
        '<div style="font-size:14px;letter-spacing:1px;margin-top:3px">A clear, considered approach to designing, fabricating &amp; installing spaces</div>' +
        '<div style="font-size:10px;color:#D8C4A5;margin-top:2px">that work beautifully for everyday life.</div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:7px">' + cards + '</div>' +
      '<div style="margin-top:10px;background:#f5f1ea;border-left:4px solid #B08D57;padding:8px 12px;border-radius:4px;font-size:10px;color:#4D5A4A">' +
        '<b style="color:#B08D57">OUR COMMITMENT TO YOU</b><br/>' + commitment +
      '</div>' +
    '</div>';
  }

  function partC(q, c) {
    const blank = '___________________________';
    return '<div class="pg">' +
      '<h2 style="text-align:center;letter-spacing:3px;color:#B08D57;font-size:14px;margin:0 0 6px">PART C — CUSTOMER ACCEPTANCE &amp; SIGNATURES</h2>' +
      '<p style="font-size:11px;color:#4a4a4a;margin:6px 0;line-height:1.5">I/We confirm that I/we have reviewed the accepted quotation, BOQ, applicable drawings and specifications, project-specific payment schedule, and this Customer Quotation Guide &amp; Project Terms document. I/We understand the included scope, exclusions, material/finish selections, project dependencies, payment milestones and the separate detailed Terms &amp; Conditions.</p>' +
      '<p style="font-size:11px;color:#4a4a4a;margin:6px 0;line-height:1.5">I/We confirm that any optional work, exclusions, special site conditions and agreed variations have been recorded in the quotation or an attached written approval. I/We have had the opportunity to ask questions and seek clarification before acceptance.</p>' +
      
      '<table class="t" style="margin-top:14px">' +
        '<tr><th style="width:45%;background:#1F2937;color:#fff">Acceptance details</th><th style="background:#1F2937;color:#fff">To be completed</th></tr>' +
        '<tr><td><b>Customer name(s)</b></td><td>' + (esc(q.name) || blank) + '</td></tr>' +
        '<tr><td><b>Project address</b></td><td>' + (esc(q.address) || blank) + '</td></tr>' +
        '<tr><td><b>Quotation / work order number</b></td><td>' + esc(qno(q)) + '</td></tr>' +
        '<tr><td><b>Accepted quotation amount</b></td><td><b>' + fmt(gt(q)) + '</b></td></tr>' +
        '<tr><td><b>Prepared by</b></td><td>' + (esc(q.by) || blank) + '</td></tr>' +
        '<tr><td><b>Date</b></td><td>' + qd(q) + '</td></tr>' +
      '</table>' +
      
      // Using Flexbox with a solid white background to prevent PDF text bleeding
            '<table style="width:100%; margin-top:60px; border-collapse:collapse; page-break-inside:avoid; position:relative; z-index:10; background-color:#ffffff;">' +
        '<tr>' +
          '<td style="width:45%; border:none; padding:0; vertical-align:bottom; background-color:#ffffff;">' +
            '<div style="border-bottom:1px solid #333; height:60px; background-color:#ffffff;"></div>' +
            '<div style="font-size:11px; font-weight:bold; margin-top:6px;">Customer Signature</div>' +
            '<div style="font-size:10px; color:#666; margin-top:4px;">Date: _____________________</div>' +
          '</td>' +
          '<td style="width:10%; border:none; background-color:#ffffff;"></td>' + 
          '<td style="width:45%; border:none; padding:0; vertical-align:bottom; background-color:#ffffff;">' +
            '<div style="border-bottom:1px solid #333; height:60px; background-color:#ffffff;"></div>' +
            '<div style="font-size:11px; font-weight:bold; margin-top:6px;">For ' + esc(c.name) + '</div>' +
            '<div style="font-size:10px; color:#666; margin-top:4px;">Prepared by: <b>' + esc(q.by) + '</b><br>Principal Interior Designer</div>' +
          '</td>' +
        '</tr>' +
      '</table>' +
      
      '<p style="text-align:center;font-size:10px;color:#666;margin-top:50px;font-style:italic">MODULE STUDIO | Designing Spaces. Defining Lifestyles.</p>' +
      '<p style="text-align:center;font-size:10px;color:#666;margin:2px 0">' + esc(c.web) + ' &nbsp;|&nbsp; WhatsApp &amp; Call: ' + esc(c.phone) + '</p>' +
    '</div>';
  }

  const _render = window.render;
  window.render = function () {
    _render.apply(this, arguments);
    if (typeof S === 'undefined' || S.tab !== 'p') return;
    
    const paper = document.querySelector('#app .paper');
    if (!paper) return;
    
    // Hide Old Legacy Sections
    paper.querySelectorAll('.pg, .card').forEach(el => {
      const txt = el.textContent || '';
      if (txt.includes('PROJECT MATERIAL & HARDWARE SUMMARY') || txt.includes('LIMITED WARRANTY & SERVICE POLICY')) {
        el.style.display = 'none';
      }
    });

    // Append New Sections
    if (!paper.querySelector('#mstudio-terms')) {
      const q = T();
      const c = co();
      if (!q) return;
      const cell = paper.querySelector('tbody > tr > td');
      if (!cell) return;
      
      const div = document.createElement('div');
      div.id = 'mstudio-terms';
      div.innerHTML = partA(q) + PART_B1 + PART_B2 + PART_B3 + PART_B4 + partC(q, c);
      cell.appendChild(div);
    }
  };
})();
