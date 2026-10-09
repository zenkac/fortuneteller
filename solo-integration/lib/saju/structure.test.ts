import {test} from 'node:test';
import assert from 'node:assert/strict';
import {calculateChart,SAMPLE_INPUT} from './engine.ts';
import {supportBreakdown,monthCommand,structureReading} from './structure.ts';
import {JIJANGGAN_STRENGTH_DETAILED} from '../../vendor/saju/fortuneteller/src/data/jijanggan_strength_table.ts';
const now=new Date('2100-12-31T12:00:00Z');
const c=()=>calculateChart(SAMPLE_INPUT,now);
test('all source branch weights sum to 100 and main stems match canonical branch mains',()=>{
  const expected={자:'계',축:'기',인:'갑',묘:'을',진:'무',사:'병',오:'정',미:'기',신:'경',유:'신',술:'무',해:'임'};
  for(const [branch,phases] of Object.entries(JIJANGGAN_STRENGTH_DETAILED)){assert.equal(phases.reduce((s,p)=>s+p.strength,0),100);assert.equal(phases.at(-1)!.stem,expected[branch as keyof typeof expected]);}
});
test('support is manually reproducible and distinguishes positions from visible counts',()=>{
  const result=supportBreakdown(c())!;
  // 임신 경술 계유 을묘: 水/金 support = 1 + 1 + .77 + 3*.29 + 1.5*1 + 0 = 5.14 / 9.5.
  assert.equal(result.score,54);assert.equal(result.supportElement,'금');assert.equal(result.level,'strong');assert.deepEqual(result.candidates,['목']);
  assert.equal(result.rows.reduce((s,r)=>s+r.total,0),9.5);
  const swapped=c();[swapped.pillars[0].pillar.earthlyBranch,swapped.pillars[2].pillar.earthlyBranch]=[swapped.pillars[2].pillar.earthlyBranch,swapped.pillars[0].pillar.earthlyBranch];
  assert.notEqual(supportBreakdown(swapped)!.score,result.score);
});
test('month selection excludes the day stem and chooses revealed main before middle or residual',()=>{
  const chart=c(),month=chart.pillars.find(p=>p.key==='month')!;
  month.pillar.earthlyBranch='술';month.hanja='庚戌';
  const visible=chart.pillars.filter(p=>p.key!=='day');visible.forEach(p=>{p.pillar.heavenlyStem='갑';});
  visible[0].pillar.heavenlyStem='정';assert.equal(monthCommand(chart)!.selected,'정');
  visible[1].pillar.heavenlyStem='무';assert.equal(monthCommand(chart)!.selected,'무');
  visible.forEach(p=>{p.pillar.heavenlyStem='갑';});chart.raw.day.heavenlyStem='정';
  assert.equal(monthCommand(chart)!.selected,'무');assert.deepEqual(monthCommand(chart)!.positions,[]);
});
test('unknown time never supplies a fabricated hour and ambiguous pillars suppress analysis',()=>{
  const unknown=calculateChart({...SAMPLE_INPUT,unknownTime:true},now);
  assert.equal(supportBreakdown(unknown),null);assert.equal(structureReading(unknown)!.command!.partial,true);
  const ambiguous=calculateChart({...SAMPLE_INPUT,year:2024,month:2,day:4,unknownTime:true},now);
  assert.equal(structureReading(ambiguous),null);
});
test('seasonal candidates use solar-term branch and compare presence across actual pillars',()=>{
  const s=structureReading(c())!;assert.equal(s.climate.name,'늦가을');assert.deepEqual(s.climate.elements,['화']);
  assert.equal(s.seasonElements[0].visible,0);assert.deepEqual(s.seasonElements[0].hidden,['월주']);assert.deepEqual(s.common,[]);
  assert.doesNotMatch(JSON.stringify(s),/undefined|NaN/);
  for(let month=1;month<=12;month++){
    const chart=calculateChart({...SAMPLE_INPUT,month,day:15},now);const result=structureReading(chart)!;
    assert.ok(result.strength!.score>=0&&result.strength!.score<=100);
    for(const e of result.seasonElements)assert.equal(e.visible,chart.counts[e.element]);
  }
});
