/* TradeQuote V2: cost-basis-safe job outcome comparison. */
(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  root.TradeQuoteLearning=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
"use strict";
const keys=["materials","labour","equipment","disposal","travel","other"];
const round=x=>Math.round((x+Number.EPSILON*x)*100)/100;
const median=xs=>{const a=[...xs].sort((x,y)=>x-y);const m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2;};
function archive(project,estimate,hours){
 const h=Number(hours);
 if(hours===""||hours===null||!Number.isFinite(h)||h<=0||h>100000)throw Error("Enter verified actual worker hours.");
 if(!project||!project.actuals||!estimate)throw Error("A complete estimate is required.");
 let spent=0;
 for(const k of keys){
   const raw=project.actuals[k];
   if(raw===""||raw===undefined||raw===null||!Number.isFinite(Number(raw))||Number(raw)<0)
     throw Error("Enter actual "+k+" cost (use 0 if none).");
   spent+=Number(raw);
 }
 const quantity=estimate.trade==="fence"?estimate.dimensions.totalLength:estimate.dimensions.area;
 const budget=round(estimate.direct+estimate.approvedCost);
 if(quantity<=0||estimate.labourHours<=0||budget<=0)throw Error("Valid scope and costs required.");
 return {type:estimate.trade,reference:String(project.reference||"").slice(0,90),
  quantity:round(quantity),unit:estimate.trade==="fence"?"m":"m²",
  estimatedHours:estimate.labourHours,actualHours:round(h),
  estimatedCost:budget,actualCost:round(spent),costBasis:"direct-expenditure-v2",
  archivedAt:new Date().toISOString()};
}
function insight(history,trade){
 if(!Array.isArray(history))throw Error("History must be an array.");
 const sample=history.filter(r=>r&&r.type===trade&&r.costBasis==="direct-expenditure-v2"&&
  Number(r.estimatedHours)>0&&Number(r.actualHours)>0&&
  Number(r.estimatedCost)>0&&Number.isFinite(Number(r.actualCost))&&Number(r.actualCost)>=0);
 const base={count:sample.length,ready:sample.length>=3};
 if(!base.ready)return {...base,message:"At least 3 comparable completed jobs are required. Unverified or older cost bases are excluded."};
 const labour=round(median(sample.map(r=>r.actualHours/r.estimatedHours)));
 const cost=round(median(sample.map(r=>r.actualCost/r.estimatedCost)));
 return {...base,medianLabourFactor:labour,medianCostFactor:cost,
 message:"Historical medians over "+sample.length+" comparable jobs: hours "+labour+"×; direct costs "+cost+"×. Diagnose differences before updating estimates; not a prediction."};
}
return {archive,insight};
});