export type MassUnit='g'|'kg'|'tonne';
export type Factor={id:string;name:string;value:number|null;unit:'kgCO2e/kg'|'kgCO2e/kWh'|'kgCO2e/tkm';source:string;url:string;year:string;region:string;boundary:string;status:'demo'|'user'|'estimated'|'verified'|'missing';notes:string};
export type Component={id:string;name:string;mass:number|null;unit:MassUnit;price:number|null;factor:Factor};
export type Scenario={id:string;name:string;description:string;components:Component[];energy:number|null;energyPrice:number|null;energyFactor:Factor;distance:number|null;transportMass:number|null;transportPrice:number|null;transportFactor:Factor;transportMode:string;notes:string};
export type Snapshot={id:string;at:string;scenario:Scenario;volume:number;result:Result};
export type Project={id:string;name:string;description:string;category:string;volume:number;currency:string;period:string;boundary:string;baselineId:string;scenarios:Scenario[];history:Snapshot[]};
export type Result={valid:boolean;issues:string[];warnings:string[];cost:number|null;emissions:number|null;perUnitCost:number|null;perUnitEmissions:number|null;materialCost:number|null;energyCost:number|null;transportCost:number|null;materialEmissions:number|null;energyEmissions:number|null;transportEmissions:number|null;timestamp:string;formulaVersion:string;included:string[];excluded:string[]};
export const FORMULA_VERSION='1.0';
export function kg(value:number,unit:MassUnit){if(!Number.isFinite(value)||value<0)throw Error('Invalid mass');switch(unit){case 'g':return value/1000;case 'kg':return value;case 'tonne':return value*1000;default:throw Error('Unsupported mass unit')}}
const good=(v:number|null)=>v!==null&&Number.isFinite(v)&&v>=0;
export function calculate(s:Scenario,volume:number):Result{
 const issues:string[]=[],warnings:string[]=[],included:string[]=[],excluded:string[]=[];
 if(!Number.isFinite(volume)||volume<=0)issues.push('Production volume must be greater than zero.');
 if(!s.components.length)issues.push('Add at least one material component.');
 let mc=0,me=0,materialCostComplete=true,materialEmissionComplete=true;
 for(const c of s.components){let mass:number|null=null;try{if(!good(c.mass))throw Error();mass=kg(c.mass!,c.unit)}catch{issues.push(`${c.name}: mass must be nonnegative and use a supported unit.`)}
 if(!good(c.price)){if(c.price===null){materialCostComplete=false;warnings.push(`${c.name}: material price missing.`)}else issues.push(`${c.name}: invalid price.`)}else if(mass!==null)mc+=mass*c.price!*volume;
 if(c.factor.unit!=='kgCO2e/kg'){issues.push(`${c.name}: incompatible material factor unit.`);materialEmissionComplete=false}else if(!good(c.factor.value)){if(c.factor.value===null){materialEmissionComplete=false;warnings.push(`${c.name}: material emission factor missing.`)}else issues.push(`${c.name}: invalid factor.`)}else if(mass!==null)me+=mass*c.factor.value!*volume;
 if(c.factor.status!=='verified')warnings.push(`${c.name}: factor is ${c.factor.status}; not independently verified.`)}
 const pairs=[['energy',s.energy],['energy price',s.energyPrice],['distance',s.distance],['transported mass',s.transportMass],['transport price',s.transportPrice],['energy factor',s.energyFactor.value],['transport factor',s.transportFactor.value]] as const;
 for(const [name,value] of pairs)if(value!==null&&!good(value))issues.push(`${name}: must be nonnegative.`);
 if(s.energyFactor.unit!=='kgCO2e/kWh')issues.push('Incompatible energy factor unit.');if(s.transportFactor.unit!=='kgCO2e/tkm')issues.push('Incompatible transport factor unit.');
 const energyCost=s.energy===null?null:s.energyPrice===null?null:s.energy*s.energyPrice*volume;
 const energyEmissions=s.energy===null||s.energyFactor.value===null?null:s.energy*s.energyFactor.value*volume;
 const transportCost=s.distance===null||s.transportMass===null||s.transportPrice===null?null:(s.transportMass/1000)*s.distance*s.transportPrice*volume;
 const transportEmissions=s.distance===null||s.transportMass===null||s.transportFactor.value===null?null:(s.transportMass/1000)*s.distance*s.transportFactor.value*volume;
 if(s.energy===null||s.energyPrice===null)warnings.push('Energy cost is incomplete.');if(energyEmissions===null)warnings.push('Energy emissions are incomplete.');if(transportCost===null)warnings.push('Transport cost is incomplete.');if(transportEmissions===null)warnings.push('Transport emissions are incomplete.');
 if(s.energyFactor.status!=='verified'||s.transportFactor.status!=='verified')warnings.push('Energy or transport factor is not independently verified.');
 const mCost=materialCostComplete?mc:null,mEm=materialEmissionComplete?me:null;
 const cost=mCost!==null&&energyCost!==null&&transportCost!==null?mCost+energyCost+transportCost:null;
 const emissions=mEm!==null&&energyEmissions!==null&&transportEmissions!==null?mEm+energyEmissions+transportEmissions:null;
 for(const [label,value] of [['material cost',mCost],['energy cost',energyCost],['transport cost',transportCost],['material emissions',mEm],['energy emissions',energyEmissions],['transport emissions',transportEmissions]] as const)(value===null?excluded:included).push(label);
 const valid=issues.length===0;return {valid,issues,warnings,cost:valid?cost:null,emissions:valid?emissions:null,perUnitCost:valid&&cost!==null?cost/volume:null,perUnitEmissions:valid&&emissions!==null?emissions/volume:null,materialCost:valid?mCost:null,energyCost:valid?energyCost:null,transportCost:valid?transportCost:null,materialEmissions:valid?mEm:null,energyEmissions:valid?energyEmissions:null,transportEmissions:valid?transportEmissions:null,timestamp:new Date().toISOString(),formulaVersion:FORMULA_VERSION,included,excluded};
}
export function difference(value:number|null,baseline:number|null){if(value===null||baseline===null)return {absolute:null,percent:null};return {absolute:value-baseline,percent:baseline===0?null:(value-baseline)/baseline*100}}
export function sensitivity(s:Scenario,volume:number,range:number,metric:'cost'|'emissions'){
 const params=[{key:'mass',label:'Material mass'},{key:'distance',label:'Transport distance'},{key:'energy',label:'Energy use'}] as const;
 return params.flatMap(p=>{const v=p.key==='mass'?s.components[0]?.mass:p.key==='distance'?s.distance:s.energy;if(v===null||v===undefined||!good(v))return [];const change=(factor:number)=>{const clone=structuredClone(s);if(p.key==='mass')clone.components[0].mass=v*factor;else if(p.key==='distance')clone.distance=v*factor;else clone.energy=v*factor;return calculate(clone,volume)[metric]};const low=change(1-range/100),high=change(1+range/100);return low===null||high===null?[]:[{...p,low,high,influence:Math.abs(high-low)}]}).sort((a,b)=>b.influence-a.influence)
}
const factor=(name:string,value:number,unit:Factor['unit']):Factor=>({id:crypto.randomUUID(),name,value,unit,source:'Illustrative demonstration value',url:'',year:'',region:'Not specified',boundary:'Illustrative only',status:'demo',notes:'Demo data — not verified for real-world decisions.'});
export function newScenario(name:string,mass=.15,price=2,f=.9):Scenario{return {id:crypto.randomUUID(),name,description:'',components:[{id:crypto.randomUUID(),name:'Packaging material',mass,unit:'kg',price,factor:factor('Material factor',f,'kgCO2e/kg')}],energy:.3,energyPrice:.18,energyFactor:factor('Electricity factor',.4,'kgCO2e/kWh'),distance:150,transportMass:mass,transportPrice:.12,transportFactor:factor('Road transport factor',.1,'kgCO2e/tkm'),transportMode:'Road',notes:'Illustrative assumptions; replace with reviewed data.'}}
export function demoProject():Project{const scenarios=[newScenario('Baseline · Material A',.15,2,.9),newScenario('Alternative · Material B',.12,2.8,.6),newScenario('Alternative · Recycled',.14,2.4,.35)];return {id:crypto.randomUUID(),name:'Packaging study',description:'Illustrative packaging comparison',category:'Packaging',volume:10000,currency:'USD',period:'2026',boundary:'Material, energy and transport; excludes use and end-of-life.',baselineId:scenarios[0].id,scenarios,history:[]}}
export function csv(project:Project){const header=['Scenario','Currency','Volume','Total cost','Cost per unit','Total kg CO2e','kg CO2e per unit','Warnings'];const quote=(v:unknown)=>`"${String(v??'').replace(/"/g,'""')}"`;return [header,...project.scenarios.map(s=>{const r=calculate(s,project.volume);return [s.name,project.currency,project.volume,r.cost,r.perUnitCost,r.emissions,r.perUnitEmissions,r.warnings.join('; ')]})].map(row=>row.map(quote).join(',')).join('\r\n')}
