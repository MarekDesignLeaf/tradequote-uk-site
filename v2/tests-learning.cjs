"use strict";
const A=require("node:assert/strict");
const E=require("./engine.js");
const L=require("./learning-reconciled.js");
let passed=0;
function check(name,fn){
  try{fn();console.log("PASS "+name);passed++}
  catch(err){console.error("FAIL "+name,err);process.exitCode=1}
}
function job(hrs=18){
 const p=E.defaults();
 for(const k of Object.keys(p.actuals))p.actuals[k]="100";
 return {project:p,result:E.build(p),hours:hrs};
}
check("Require actual job hours",()=>{
 const j=job();
 A.throws(()=>L.archive(j.project,j.result,""),/hours/i);
});
check("Require all actual cost categories",()=>{
 const j=job();j.project.actuals.travel="";
 A.throws(()=>L.archive(j.project,j.result,18),/actual travel/i);
});
check("Archive cost reconciliation",()=>{
 const j=job();const a=L.archive(j.project,j.result,19);
 A.equal(a.actualHours,19);A.equal(a.actualCost,600);
 A.equal(a.type,"fence");A.ok(a.estimatedCost>0);
 A.equal(a.costBasis,"direct-expenditure-v2");
 A.equal(a.estimatedCost,j.result.direct);
});
check("One or two jobs never imply a recommendation",()=>{
 const j=job(),a=L.archive(j.project,j.result,19);
 A.equal(L.insight([a,a],"fence").ready,false);
});
check("Three jobs calculate actual/estimated median",()=>{
 const j=job();const a=L.archive(j.project,j.result,19);
 const h=[a,{...a,actualHours:40,actualCost:400},
 {...a,actualHours:24,actualCost:700}];
 const r=L.insight(h,"fence");
 A.equal(r.ready,true);A.equal(r.count,3);
 A.equal(r.medianLabourFactor,L.insight(h,"fence").medianLabourFactor);
});
check("Unknown cost basis is not used as compatible history",()=>{
 const j=job(),a=L.archive(j.project,j.result,19);
 const legacy={...a};delete legacy.costBasis;
 A.equal(L.insight([legacy,legacy,legacy],"fence").ready,false);
});
check("Other trade is never silently pooled",()=>{
 const j=job(),a=L.archive(j.project,j.result,19);
 A.equal(L.insight([a,a,a],"patio").count,0);
});
check("Reject negative actual cost",()=>{
 const j=job();j.project.actuals.materials=-10;
 A.throws(()=>L.archive(j.project,j.result,19),/actual materials/i);
});
console.log("V2 history: "+passed+"/7 tests passed");