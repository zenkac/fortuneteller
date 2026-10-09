import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {lookupKasiDate,lunarMatches,validateKasiDataset} from './kasi.ts';
import {solarToLunar,lunarToSolar} from '../../vendor/saju/manseryeok/src/index.ts';
import {computeFourPillars} from '../../vendor/saju/manseryeok/src/pillars.ts';
import {parseKasiMonth,GANJI} from '../../scripts/kasi-calendar-source.mjs';
const source=JSON.parse(readFileSync('aws-site/public/saju/kasi-calendar-20261010.json','utf8'));
const data=validateKasiDataset(source);
test('official days cover the complete 1900–2050 range and every lunar date matches the existing engine',()=>{
  let mismatches=0;const samples:unknown[]=[];
  data.rows.forEach((row,i)=>{
    const date=new Date(Date.UTC(1900,0,1)+i*86400000),y=date.getUTCFullYear(),m=date.getUTCMonth()+1,d=date.getUTCDate();
    const official=lookupKasiDate(data,y,m,d)!;
    assert.equal(official.weekday,'일월화수목금토'[date.getUTCDay()]);
    assert.ok(official.lunarDay>=1&&official.lunarDay<=official.lunarMonthDays);
    assert.ok([29,30].includes(official.lunarMonthDays));assert.ok(GANJI.includes(official.dayGanji));
    if(i>0)assert.equal(Number(row.slice(10,12)),(Number(data.rows[i-1].slice(10,12))+1)%60);
    if(d===15){
      const resolved={instantUTCms:Date.UTC(y,m-1,d,3),apparentMs:Date.UTC(y,m-1,d,12)} as Parameters<typeof computeFourPillars>[0];
      const pillar=computeFourPillars(resolved,y,'midnight').day;
      assert.equal(official.dayGanji.slice(0,2),pillar.heavenlyStem+pillar.earthlyBranch);
    }
    if(!lunarMatches(official,solarToLunar(y,m,d))){mismatches++;if(samples.length<5)samples.push({y,m,d,official,engine:solarToLunar(y,m,d)});}
    assert.deepEqual(lunarToSolar(official.lunarYear,official.lunarMonth,official.lunarDay,official.isLeapMonth),{year:y,month:m,day:d});
  });
  assert.equal(mismatches,0,JSON.stringify(samples));
});
test('known lunar new year and 2023 leap month are exact and missing lunar month ganji stays null',()=>{
  const newYear=lookupKasiDate(data,2026,2,17)!;assert.deepEqual([newYear.lunarYear,newYear.lunarMonth,newYear.lunarDay,newYear.isLeapMonth],[2026,1,1,false]);
  const leap=lookupKasiDate(data,2023,3,22)!;assert.deepEqual([leap.lunarYear,leap.lunarMonth,leap.lunarDay,leap.isLeapMonth],[2023,2,1,true]);assert.equal(leap.monthGanji,null);
  assert.equal(lookupKasiDate(data,1992,10,24)!.dayGanji,'계유(癸酉)');
});
test('out of range and impossible dates do not produce an official verification',()=>{
  for(const args of [[1899,12,31],[2051,1,1],[2026,2,30],[2026,13,1],[2026,1,0],[2026,1.5,1]])assert.equal(lookupKasiDate(data,...args as [number,number,number]),null);
  assert.ok(lookupKasiDate(data,1900,1,1));assert.ok(lookupKasiDate(data,2050,12,31));
});
test('partial and malformed downloads are rejected instead of being labelled official',()=>{
  assert.throws(()=>validateKasiDataset({...data,rows:data.rows.slice(1)}));
  assert.throws(()=>validateKasiDataset({...data,rows:[...data.rows.slice(0,-1),'not a row']}));
  assert.throws(()=>validateKasiDataset({...data,provider:'unknown'}));
  assert.throws(()=>parseKasiMonth('<resultCode>22</resultCode>',2026,1),/KASI_SERVICE_22/);
  assert.throws(()=>parseKasiMonth('<resultCode>00</resultCode><item><solYear>2026</solYear></item>',2026,1),/KASI_FIELD/);
});
