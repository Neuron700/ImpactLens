import {describe,it,expect} from 'vitest';
import {calculate,csv,demoProject,difference,kg,newScenario,sensitivity} from '../src/lib/model';
describe('units and calculation',()=>{
 it('converts g, kg and tonnes to kg',()=>{expect(kg(1000,'g')).toBe(1);expect(kg(2,'kg')).toBe(2);expect(kg(2,'tonne')).toBe(2000);expect(()=>kg(-1,'kg')).toThrow()});
 it('calculates material, energy and transport from explicit units',()=>{const s=newScenario('test',1,2,3);s.energy=2;s.energyPrice=.5;s.energyFactor.value=.4;s.distance=100;s.transportMass=10;s.transportPrice=.2;s.transportFactor.value=.1;const r=calculate(s,10);expect(r.materialCost).toBe(20);expect(r.energyCost).toBe(10);expect(r.transportCost).toBe(2);expect(r.materialEmissions).toBe(30);expect(r.energyEmissions).toBe(8);expect(r.transportEmissions).toBe(1);expect(r.cost).toBe(32);expect(r.emissions).toBe(39)});
 it('does not substitute zero for a missing factor',()=>{const s=newScenario('missing');s.components[0].factor.value=null;const r=calculate(s,100);expect(r.emissions).toBeNull();expect(r.excluded).toContain('material emissions');expect(r.warnings.some(w=>w.includes('missing'))).toBe(true)});
 it('rejects incompatible factor units, negatives and zero volume',()=>{const s=newScenario('invalid');s.components[0].factor.unit='kgCO2e/kWh';s.distance=-1;const r=calculate(s,0);expect(r.valid).toBe(false);expect(r.cost).toBeNull();expect(r.issues.length).toBeGreaterThanOrEqual(3)});
 it('does not calculate a percentage from zero baseline',()=>{expect(difference(3,0)).toEqual({absolute:3,percent:null});expect(difference(12,10)).toEqual({absolute:2,percent:20})});
 it('ranks sensitivity based on actual recalculations',()=>{const s=newScenario('sensitivity');const r=sensitivity(s,100,20,'emissions');expect(r.length).toBe(3);expect(r[0].influence).toBeGreaterThanOrEqual(r[1].influence);expect(r.every(x=>x.low<=x.high)).toBe(true)});
 it('exports computed data and escapes scenario names',()=>{const p=demoProject();p.scenarios[0].name='A, "special"';const text=csv(p);expect(text).toContain('"A, ""special"""');expect(text).toContain(String(calculate(p.scenarios[0],p.volume).cost))});
});
