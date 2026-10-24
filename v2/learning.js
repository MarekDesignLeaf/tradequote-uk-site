/* TradeQuote UK V2: local job-outcome learning. No personal data is sent anywhere.
   Deterministic historical ratios, not a price forecast or AI prediction. */
(function(root,factory){
 const api=factory();
 if(typeof module==="object"&&module.exports) module.exports=api;
 root.TradeQuoteLearning=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 const money=x=>Math.round((x+Number.EPSILON*x)*100)/100;
 const median=x=>{const a=[...x].sort((a,b)=>a-b);const mid=Math.floor(a.length/2);
   return a.length%2?a[mid]:(a[mid-1]+a[mid])/2;};
 const names=["materials","labour","equipment","disposal","travel","other"];
 function archive(project,calculation,actualHours){
   if(!project||!calculation||!project.actuals)throw Error("An estimate and actuals are required.");
   const hrs=Number(actualHours);
   if(actualHours===""||actualHours===null||!Number.isFinite(hrs)||hrs<=0||hrs>100000)throw Error("Enter verified actual worker hours.");
   let total=0;
   for(const name of names){
     const value=project.actuals[name];
     if(value===""||value===null||value===undefined||!Number.isFinite(Number(value))||Number(value)<0)
       throw Error("Enter actual "+name+" cost (enter 0 if there was none).");
     total+=Number(value);
   }
   const quantity=calculation.trade==="fence"?calculation.dimensions.totalLength:calculation.dimensions.area;
   if(quantity<=0||calculation.labourHours<=0||calculation.cost<=0)throw Error("Estimate must have positive scope, labour and cost.");
   return {type:calculation.trade,reference:String(project.reference||"").slice(0,90),
     quantity:money(quantity),unit:calculation.trade==="fence"?"m":"m²",
     estimatedHours:calculation.labourHours,actualHours:money(hrs),
     estimatedCost:calculation.cost,actualCost:money(total),
     archivedAt:new Date().toISOString()};
 }
 function insight(history,trade){
   if(!Array.isArray(history))throw Error("History must be an array.");
   const sample=history.filter(r=>r&&r.type===trade&&
     Number(r.estimatedHours)>0&&Number(r.actualHours)>0&&
     Number(r.estimatedCost)>0&&Number.isFinite(Number(r.actualCost))&&Number(r.actualCost)>=0);
   const base={count:sample.length,ready:sample.length>=3};
   if(!base.ready)return {...base,message:"Record at least 3 complete jobs of this type before comparing productivity. No adjustment recommended."};
   const labourRatio=median(sample.map(r=>r.actualHours/r.estimatedHours));
   const costRatio=median(sample.map(r=>r.actualCost/r.estimatedCost));
   return {...base,medianLabourFactor:money(labourRatio),medianCostFactor:money(costRatio),
     message:"Your last "+sample.length+" saved jobs: median actual/estimated hours "+
       money(labourRatio)+"×, cost "+money(costRatio)+"×. Review causes before changing rate assumptions. This is not a future prediction."};
 }
 return {archive,insight};
});