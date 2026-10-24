/* TradeQuote UK V2. Original deterministic estimator; no live supplier rates.
   BSD-3-Clause-style internal preview; third-party implementation not copied. */
(function(root,factory) {
  const api=factory();
  if(typeof module==="object" && module.exports) module.exports=api;
  root.TradeQuoteV2=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
"use strict";
const round=x=>Math.round((x+Number.EPSILON*x)*100)/100;
const ceil=x=>Math.ceil(x-1e-9);
const gbp=x=>"£"+round(x).toLocaleString("en-GB",{minimumFractionDigits:2,maximumFractionDigits:2});
function num(x,name,lo=0,hi=1000000){
  const v=Number(x);
  if(x===""||x===null||x===undefined||!Number.isFinite(v)||v<lo||v>hi) throw Error(name+" must be a number between "+lo+" and "+hi+".");
  return v;
}
function defaults(){
  return {
    version:2,trade:"fence",reference:"EXAMPLE-001",customer:"",tradingName:"",description:"",
    fence:{runs:[{name:"Boundary run",length:12.9,gates:1}],panelWidth:1.83,gateWidth:0.93,
      panelPrice:30,postPrice:16,postmixBagsPerPost:2,postmixPrice:7.5,
      gravelBoardPrice:12,gravelBoards:true,fixingPacks:1,fixingPackPrice:14,
      gateKitPrice:135,removeHoursPerM:0.3,holeHoursPerPost:0.55,installHoursPerPanel:0.75,gateHours:2.0},
    patio:{length:5,width:4,slabLengthMm:600,slabWidthMm:600,wastePercent:10,slabPrice:12,
      baseDepthMm:150,baseDensity:2.05,basePricePerTonne:55,baseAllowancePercent:10,
      sandDepthMm:40,sandDensity:1.6,sandPricePerTonne:60,
      jointKgPerM2:3,jointBagKg:15,jointBagPrice:32,geotextileRollCoverage:25,geoRollPrice:27,
      excavationDepthMm:210,bulkingFactor:1.3,skipCapacityM3:5,skipPrice:320,
      edgingM:0,edgingPricePerM:11,drainageM:0,drainagePricePerM:20,
      digHoursPerM2:0.45,subbaseHoursPerM2:0.25,layHoursPerM2:0.8,jointHoursPerM2:0.18},
    common:{internalLabourRate:23,crewSize:2,hoursPerDay:8,setupHours:2,equipmentDayCost:45,
      delivery:65,otherMaterials:0,overheadPercent:12,contingencyPercent:10,
      targetMargin:25,discountPercent:0,chargeVat:false,
      priceSource:"ILLUSTRATIVE ONLY",priceChecked:"",extraDisposal:0},
    scenario:{materialRisePercent:12,labourOverrunPercent:20,extraDisposal:80,extraDays:1},
    checks:{measurements:false,ground:false,utilities:false,access:false,waste:false,
      supplier:false,scope:false,regulations:false},
    variations:[],actuals:{materials:"",labour:"",equipment:"",disposal:"",travel:"",other:""},
  };
}
function build(input){
  if(!input||typeof input!=="object") throw Error("Project required");
  const d=structuredClone(input);
  if(d.trade!=="fence"&&d.trade!=="patio")throw Error("Choose fence or patio.");
  const rows=[], risks=[], warns=[];
  const add=(kind,item,qty,unit,price)=>{
    if(qty<=0)return;
    if(!Number.isFinite(qty)||!Number.isFinite(price))throw Error("Invalid price/quantity for "+item);
    const unitCost=num(price,item+" unit price");
    rows.push({kind,item,qty:round(qty),unit,unitCost:round(unitCost),amount:round(qty*unitCost)});
  };
  let dimensions={};
  if(d.trade==="fence"){
    const f=d.fence;
    if(!Array.isArray(f.runs)||f.runs.length<1||f.runs.length>25) throw Error("Enter 1 to 25 fence runs.");
    const pw=num(f.panelWidth,"Panel width",0.1,10),gw=num(f.gateWidth,"Gate opening",0.1,4);
    let panels=0,posts=0,gates=0,totalLength=0,opening=0;
    for(const run of f.runs){
      const length=num(run.length,"Fence run length",0,1000);
      const count=num(run.gates,"Gate count",0,10);
      if(!Number.isInteger(count))throw Error("Gate count must be whole.");
      if(count*gw>length+0.000001)throw Error("Gate openings exceed length in "+(run.name||"run"));
      const p=ceil(Math.max(0,length-count*gw)/pw);
      panels+=p;posts+=p+(length>0?1:0)+count;gates+=count;totalLength+=length;opening+=count*gw;
    }
    const bags=ceil(posts*num(f.postmixBagsPerPost,"Bags per post",0,15));
    dimensions={totalLength:round(totalLength),panelLength:round(totalLength-opening),panels,posts,gates,bags};
    add("materials","Fence panels",panels,"each",f.panelPrice);
    add("materials","Posts (estimate; verify layout)",posts,"each",f.postPrice);
    add("materials","Postmix",bags,"bags",f.postmixPrice);
    if(f.gravelBoards)add("materials","Gravel boards",panels,"each",f.gravelBoardPrice);
    add("materials","Fixings",num(f.fixingPacks,"Fixing packs",0,10000),"pack",f.fixingPackPrice);
    add("materials","Gate kit",gates,"each",f.gateKitPrice);
    add("labour","Remove old fencing",totalLength*num(f.removeHoursPerM,"Removal productivity",0,30),"hours",d.common.internalLabourRate);
    add("labour","Excavate post holes",posts*num(f.holeHoursPerPost,"Hole productivity",0,30),"hours",d.common.internalLabourRate);
    add("labour","Install panels",panels*num(f.installHoursPerPanel,"Panel productivity",0,30),"hours",d.common.internalLabourRate);
    add("labour","Install gates",gates*num(f.gateHours,"Gate productivity",0,30),"hours",d.common.internalLabourRate);
    risks.push("Post count is conservative and depends on actual gate placement, corners and shared endpoints.",
       "Allow for stepped runs, sloped ground, buried services and boundary permissions.",
       "Gate hardware, gatepost specification and finishing must be confirmed.");
    if(totalLength===0)warns.push("Fence length is zero.");
  }else{
    const p=d.patio;
    const l=num(p.length,"Patio length",0,250),w=num(p.width,"Patio width",0,250);
    const area=l*w;
    const slabL=num(p.slabLengthMm,"Slab length",50,2000)/1000;
    const slabW=num(p.slabWidthMm,"Slab width",50,2000)/1000;
    const count=ceil(area*(1+num(p.wastePercent,"Cut/waste allowance",0,80)/100)/(slabL*slabW));
    const mot=round(area*num(p.baseDepthMm,"MOT depth",0,700)/1000*num(p.baseDensity,"MOT density",1,3)*
      (1+num(p.baseAllowancePercent,"MOT allowance",0,80)/100));
    const sand=round(area*num(p.sandDepthMm,"Bedding depth",0,250)/1000*num(p.sandDensity,"Sand density",1,2.5));
    const joint=ceil(area*num(p.jointKgPerM2,"Jointing rate",0,25)/num(p.jointBagKg,"Jointing pack size",1,100));
    const geo=ceil(area/num(p.geotextileRollCoverage,"Roll area",1,1000));
    const excav=round(area*num(p.excavationDepthMm,"Excavation depth",0,1000)/1000);
    const loose=round(excav*num(p.bulkingFactor,"Bulking",1,3));
    const skips=ceil(loose/num(p.skipCapacityM3,"Skip capacity",1,20));
    dimensions={area:round(area),slabs:count,motTonnes:mot,sandTonnes:sand,jointBags:joint,geoRolls:geo,excavM3:excav,looseM3:loose,skips};
    add("materials","Paving units",count,"each",p.slabPrice);
    add("materials","MOT Type 1 (indicative tonnes)",mot,"tonnes",p.basePricePerTonne);
    add("materials","Bedding sand (indicative tonnes)",sand,"tonnes",p.sandPricePerTonne);
    add("materials","Jointing compound",joint,"bags",p.jointBagPrice);
    add("materials","Geotextile",geo,"rolls",p.geoRollPrice);
    add("materials","Edging",num(p.edgingM,"Edging length"),"metres",p.edgingPricePerM);
    add("materials","Drainage channel",num(p.drainageM,"Channel length"),"metres",p.drainagePricePerM);
    add("disposal","Spoil skips (volume only)",skips,"skips",p.skipPrice);
    add("labour","Excavate and prepare",area*num(p.digHoursPerM2,"Excavation productivity",0,40),"hours",d.common.internalLabourRate);
    add("labour","Install subbase",area*num(p.subbaseHoursPerM2,"Subbase productivity",0,40),"hours",d.common.internalLabourRate);
    add("labour","Lay paving",area*num(p.layHoursPerM2,"Paving productivity",0,40),"hours",d.common.internalLabourRate);
    add("labour","Joint and finish",area*num(p.jointHoursPerM2,"Finishing productivity",0,40),"hours",d.common.internalLabourRate);
    risks.push("Skip count is volume-only: weight limits and permitted waste types can change requirements.",
       "Confirm drainage fall, thresholds, damp-proof course clearance and planning requirements.",
       "Density and coverage defaults are illustrative and must be replaced by supplier data.");
    if(area===0)warns.push("Patio area is zero.");
  }
  const c=d.common;
  add("materials","Other materials",num(c.otherMaterials,"Other materials"),"job",1);
  add("labour","Setup / clearing",num(c.setupHours,"Setup hours",0,400),"hours",c.internalLabourRate);
  const labourHours=round(rows.filter(r=>r.kind==="labour").reduce((s,r)=>s+r.qty,0));
  const crew=num(c.crewSize,"Crew size",1,30),hoursPerDay=num(c.hoursPerDay,"Hours per day",1,24);
  const crewDays=ceil(labourHours/(crew*hoursPerDay));
  add("equipment","Equipment hire",crewDays,"days",c.equipmentDayCost);
  add("travel","Delivery/transport",num(c.delivery,"Delivery/transport"),"job",1);
  add("disposal","Extra disposal allowance",num(c.extraDisposal,"Disposal allowance"),"job",1);
  const subtotals={};
  for(const kind of ["materials","labour","equipment","disposal","travel"]){
    subtotals[kind]=round(rows.filter(r=>r.kind===kind).reduce((s,r)=>s+r.amount,0));
  }
  const direct=round(Object.values(subtotals).reduce((s,v)=>s+v,0));
  const overhead=round(direct*num(c.overheadPercent,"Overhead",0,100)/100);
  const contingency=round(direct*num(c.contingencyPercent,"Contingency",0,100)/100);
  const cost=round(direct+overhead+contingency);
  const margin=num(c.targetMargin,"Target margin",0,80),discount=num(c.discountPercent,"Discount",0,100);
  const basePrice=round(cost/(1-margin/100));
  const discountAmount=round(basePrice*discount/100);
  const net=round(basePrice-discountAmount);
  const profit=round(net-cost),actualMargin=net?round(100*profit/net):0;
  const vat=c.chargeVat?round(net*0.2):0,gross=round(net+vat);
  if(profit<0)warns.push("PRICE BELOW MODELLED COST.");
  if(actualMargin+0.01<margin)warns.push("Discount reduces margin below target.");
  if(!String(c.priceSource||"").trim()||String(c.priceSource).includes("ILLUSTRATIVE"))warns.push("Example prices are not validated against a supplier quote.");
  if(!c.priceChecked)warns.push("No date recorded for supplier prices.");
  const scenario=d.scenario;
  const stress={materials:round(subtotals.materials*num(scenario.materialRisePercent,"Material stress",0,300)/100),
    labour:round(subtotals.labour*num(scenario.labourOverrunPercent,"Labour stress",0,300)/100),
    disposal:num(scenario.extraDisposal,"Disposal stress",0,1000000),
    equipment:round(num(scenario.extraDays,"Equipment days stress",0,365)*num(c.equipmentDayCost,"Equipment hire rate"))};
  const stressExtra=round(Object.values(stress).reduce((s,v)=>s+v,0));
  const stressedCost=round(cost+stressExtra);
  const stressedProfit=round(net-stressedCost);
  const minReprice=round(stressedCost/(1-margin/100));
  const allowed=new Set(["measurements","ground","utilities","access","waste","supplier","scope","regulations"]);
  const pending=Array.from(allowed).filter(k=>!d.checks || d.checks[k]!==true);
  if(pending.length)warns.push(pending.length+" pre-quote checklist items await confirmation.");
  if(d.trade==="fence" && dimensions.gates>0 && !d.checks.ground)warns.push("Gate-post specification requires site check.");
  const variations=(d.variations||[]).map(v=>{
    const costDelta=num(v.cost,"Variation cost",0,100000),priceDelta=num(v.price,"Variation price",0,100000);
    return {description:String(v.description||"").slice(0,180),cost:costDelta,price:priceDelta,
      approved:v.approved===true};
  });
  const approved=variations.filter(v=>v.approved);
  const approvedCost=round(approved.reduce((s,v)=>s+v.cost,0));
  const approvedPrice=round(approved.reduce((s,v)=>s+v.price,0));
  const revisedProfit=round(profit+approvedPrice-approvedCost);
  const revisedNet=round(net+approvedPrice);
  const revisedVat=c.chargeVat?round(revisedNet*0.2):0;
  const revisedGross=round(revisedNet+revisedVat);
  const actualEntries=Object.entries(d.actuals||{}).filter(([k,v])=>v!==""&&v!==null&&v!==undefined);
  const validActual=actualEntries.map(([k,v])=>[k,num(v,"Actual "+k,0,10000000)]);
  const actualTotal=validActual.length?round(validActual.reduce((s,[k,v])=>s+v,0)):null;
  const actualVariance=actualTotal===null?null:round(actualTotal-(cost+approvedCost));
  if(variations.some(v=>!v.approved))warns.push("Unapproved variations are excluded from revised agreed revenue and cost.");
  return {trade:d.trade,rows,dimensions,risks,warns,labourHours,crewDays,subtotals,direct,
    overhead,contingency,cost,margin,basePrice,discountAmount,net,profit,actualMargin,vat,gross,
    stress,stressExtra,stressedCost,stressedProfit,minReprice,pending,variations,approvedCost,
    approvedPrice,revisedProfit,revisedNet,revisedVat,revisedGross,actualTotal,actualVariance,vatCaution:"VAT is illustrative; only apply if correct for this supplier and job."};
}
function clientDraft(project,result){
  const ref=String(project.reference||"Unassigned").replace(/[\r\n]/g," ").slice(0,100);
  const name=String(project.tradingName||"Trading name to be confirmed").replace(/[\r\n]/g," ").slice(0,100);
  const scope=result.trade==="fence"?"Fence work, approx "+result.dimensions.totalLength+"m, "+result.dimensions.panels+
    " panels, "+result.dimensions.gates+" gate(s)": "Patio work, approx "+result.dimensions.area+"m²";
  return [
    name.toUpperCase()+" | DRAFT QUOTATION",
    "Reference: "+ref,
    "Work: "+scope,
    "Description: "+String(project.description||"Subject to final written specification").replace(/[\r\n]/g," ").slice(0,300),
    "",
    "Price before VAT: "+gbp(result.revisedNet),
    "VAT (if applicable): "+gbp(result.revisedVat),
    "Total proposed price: "+gbp(result.revisedGross),
    "",
    "Approved variations: "+(result.variations.filter(v=>v.approved).map(v=>v.description+" ("+gbp(v.price)+")").join("; ")||"None"),
    "Excludes unagreed site changes, buried services, planning/permissions and unforeseen ground conditions.",
    "Materials, scope, boundaries, access and VAT treatment must be verified before issue.",
    "Variations require written agreement before work.",
    "DRAFT ONLY. Not a firm offer until reviewed and signed by the trader."
  ].join("\n");
}
return {defaults,build,clientDraft,gbp,round};
});
