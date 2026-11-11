/* Module Studio presentation structure. Studio master pages are immutable in the editor. */
(function(){
  const studio=[
    {key:"about",title:"About Us",section:"studio",locked:true,body:"Module Studio is an interior design and execution studio delivering thoughtful residential and commercial spaces—from planning and material selection to fabrication and handover."},
    {key:"how-we-work",title:"How We Work",section:"studio",locked:true,body:"Understand requirements · Prepare the 2D layout · Finalise design direction · Develop 3D and materials · Approve quotation · Execute and hand over."},
    {key:"why",title:"Why Module Studio",section:"studio",locked:true,body:"End-to-end interior solutions · Thoughtful space planning · Customised furniture and modular solutions · Material and finish curation · Precision fabrication and site execution."}
  ];
  const closing=[
    {key:"commitments",title:"Our Commitments",section:"commercial",locked:false,body:"Commitments are generated from the approved project scope and quotation. Confirm included rooms, deliverables, materials, execution activities and exclusions."},
    {key:"milestones",title:"Quotation & Payment Milestones",section:"commercial",locked:false,body:"Use the approved quotation as the source of truth. Standard milestone schedule applies only where confirmed for this project."},
    {key:"contact",title:"Contact Us",section:"studio",locked:true,body:"MODULE STUDIO · www.modulestudio.in"}
  ];
  const defaults={
    moodboard:["Room-wise Moodboard","Theme Comparison","Colour Palette","Material & Finish Palette","Next Steps"],
    "first-design":["Design Vision","Project Overview","Existing / Proposed Plan","3D Plan / Isometric View","Space Planning","Room-wise Concepts","Material & Finish Selection","Lighting Concept","Furniture & Special Features","Next Steps"],
    "final-design":["Key Plan","3D Plan","Room-wise Elevations","Element Details","Material Specifications","Material Summary","Design & Execution Process","Important Notes & Exclusions"]
  };
  window.PresentationTemplates={studio,closing,defaults,makeSlides(type){
    const cover={key:"cover",title:"Cover Page",section:"cover",locked:false,body:"Client name · Project name · Presentation date"};
    const project=(defaults[type]||defaults.moodboard).map((title,i)=>({key:"project-"+i+"-"+Date.now(),title,section:"project",locked:false,body:"Add project-specific content here."}));
    return [cover,...studio.map(x=>({...x})),...project,...closing.map(x=>({...x}))];
  }};
})();