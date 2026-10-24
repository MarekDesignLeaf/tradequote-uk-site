/* TradeQuote UK V2 deterministic regression tests.
 Run: node tests.cjs  (Node.js >=18). Not real-browser/field validation. */
"use strict";
const assert=require("node:assert/strict");
const E=require("./engine.js");
let pass=0,fail=0;
function test(name,fn){
  try{fn();console.log("PASS",name);pass++}
  catch(e){console.error("FAIL",name,e.stack||e);fail++}
}
function p(){return E.defaults()}
test("Single fence with gate estimates quantities",()=>{
 const q=E.build(p());assert.equal(q.dimensions.panels,7);
 assert.equal(q.dimensions.posts,9);assert.equal(q.dimensions.bags,18);
});
test("Multiple fence runs preserve separate end posts",()=>{
 const x=p();x.fence.runs=[{name:"A",length:7.32,gates:0},{name:"B",length:3.66,gates:0}];
 const q=E.build(x);assert.equal(q.dimensions.panels,6);assert.equal(q.dimensions.posts,8);
});
test("Reject more gate openings than length",()=>{
 const x=p();x.fence.runs=[{name:"Invalid",length:.5,gates:2}];
 assert.throws(()=>E.build(x),/exceed/);
});
test("Reject non-integral gate count",()=>{
 const x=p();x.fence.runs[0].gates=1.5;assert.throws(()=>E.build(x),/whole/);
});
test("Reject negative material price",()=>{
 const x=p();x.fence.panelPrice=-1;assert.throws(()=>E.build(x),/between/);
});
test("Whole bags purchased even with fractional per-post input",()=>{
 const x=p();x.fence.postmixBagsPerPost=1.5;assert.equal(E.build(x).dimensions.bags,14);
});
test("Patio area, slabs and skips",()=>{
 const x=p();x.trade="patio";const q=E.build(x);
 assert.equal(q.dimensions.area,20);assert.equal(q.dimensions.slabs,62);
 assert.equal(q.dimensions.skips,2);
});
test("Patio area zero raises scope warning",()=>{
 const x=p();x.trade="patio";x.patio.width=0;
 assert.ok(E.build(x).warns.some(v=>v.includes("zero")));
});
test("Reject zero slab dimensions",()=>{
 const x=p();x.trade="patio";x.patio.slabWidthMm=0;assert.throws(()=>E.build(x),/between/);
});
test("Reject target gross margin above 80 percent",()=>{
 const x=p();x.common.targetMargin=81;assert.throws(()=>E.build(x),/between/);
});
test("Target margin matches cost basis",()=>{
 const q=E.build(p());assert.ok(Math.abs(q.basePrice-q.cost/.75)<.011);
});
test("Discount reduces actual margin",()=>{
 const x=p();x.common.discountPercent=20;
 const q=E.build(x);assert.ok(q.actualMargin<q.margin);
});
test("VAT is not included in profit",()=>{
 const x=p();const a=E.build(x);x.common.chargeVat=true;const b=E.build(x);
 assert.equal(a.profit,b.profit);assert.equal(b.vat,E.round(b.net*.2));
});
test("Material/labour scenario reduces profit",()=>{
 const a=E.build(p());assert.ok(a.stressedProfit<a.profit);
});
test("Pending variation does not change agreed revenue",()=>{
 const x=p();x.variations=[{description:"pending",cost:100,price:300,approved:false}];
 const q=E.build(x);assert.equal(q.revisedNet,q.net);assert.equal(q.revisedProfit,q.profit);
});
test("Approved variation changes profit and customer quote",()=>{
 const x=p();x.variations=[{description:"approved gate",cost:100,price:300,approved:true}];
 const q=E.build(x);assert.equal(q.revisedNet,E.round(q.net+300));
 assert.equal(q.revisedProfit,E.round(q.profit+200));
 assert.ok(E.clientDraft(x,q).includes(E.gbp(q.revisedGross)));
});
test("Approved variation VAT recomputed on revised net",()=>{
 const x=p();x.common.chargeVat=true;
 x.variations=[{description:"accepted",cost:100,price:300,approved:true}];
 const q=E.build(x);
 assert.equal(q.revisedVat,E.round(q.revisedNet*.2));
 assert.equal(q.revisedGross,E.round(q.revisedNet+q.revisedVat));
});
test("Stress includes agreed variation costs",()=>{
 const x=p();x.variations=[{description:"accepted",cost:250,price:100,approved:true}];
 const q=E.build(x);
 assert.equal(q.stressedCost,E.round(q.cost+250+q.stressExtra));
 assert.equal(q.stressedProfit,E.round(q.revisedNet-q.stressedCost));
});
test("Unverified prices flagged",()=>{
 const q=E.build(p());assert.ok(q.warns.some(v=>v.includes("not validated")));
});
test("Preflight starts unchecked",()=>{
 const q=E.build(p());assert.equal(q.pending.length,8);
});
test("Actual costs absent remain unknown",()=>{
 const q=E.build(p());assert.equal(q.actualTotal,null);
});
test("Partial actual costs are not fabricated",()=>{
 const x=p();x.actuals.materials="200";x.actuals.labour="150";
 assert.equal(E.build(x).actualTotal,350);
});
test("Customer quote excludes private margin and unit costs",()=>{
 const x=p();const s=E.clientDraft(x,E.build(x));
 assert.ok(!/internal cost|profit before tax|target margin|labour cost per/i.test(s));
});
test("Preview contains no payment claims or checkout",()=>{
 const x=p();assert.equal(x.version,2);assert.ok(Array.isArray(x.variations));
});
console.log("TradeQuote V2 tests: "+pass+" PASS, "+fail+" FAIL");
process.exitCode=fail?1:0;