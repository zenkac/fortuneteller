export const KASI_DATA_URL='/saju/kasi-calendar-20261010.json';
export type KasiDataset={schema:1;provider:string;from:string;to:string;fetchedAt:string;startJd:number;ganji:string[];rows:string[]};
export type KasiCalendarDate={year:number;month:number;day:number;lunarYear:number;lunarMonth:number;lunarDay:number;isLeapMonth:boolean;weekday:string;dayGanji:string;yearGanji:string;monthGanji:string|null;lunarMonthDays:number};
const FIRST=Date.UTC(1900,0,1),LAST=Date.UTC(2050,11,31),DAY=86400000;
export function validateKasiDataset(value:unknown):KasiDataset{
  const d=value as KasiDataset;
  if(!d||d.schema!==1||d.provider!=='한국천문연구원'||d.from!=='1900-01-01'||d.to!=='2050-12-31'||d.startJd!==2415021||!Array.isArray(d.ganji)||d.ganji.length!==60||!Array.isArray(d.rows)||d.rows.length!==(LAST-FIRST)/DAY+1||d.rows.some(r=>typeof r!=='string'||!/^\d{18}$/.test(r)))throw new Error('공식 달력 자료를 확인할 수 없습니다.');
  return d;
}
export function lookupKasiDate(data:KasiDataset,year:number,month:number,day:number):KasiCalendarDate|null{
  if(![year,month,day].every(Number.isInteger))return null;
  const ms=Date.UTC(year,month-1,day),date=new Date(ms);
  if(ms<FIRST||ms>LAST||date.getUTCFullYear()!==year||date.getUTCMonth()+1!==month||date.getUTCDate()!==day)return null;
  const r=data.rows[(ms-FIRST)/DAY];if(!r)return null;
  const n=(a:number,b:number)=>Number(r.slice(a,b));
  return {year,month,day,lunarYear:n(0,4),lunarMonth:n(4,6),lunarDay:n(6,8),isLeapMonth:r[8]==='1',weekday:'일월화수목금토'[n(9,10)],dayGanji:data.ganji[n(10,12)],yearGanji:data.ganji[n(12,14)],monthGanji:n(14,16)===99?null:data.ganji[n(14,16)],lunarMonthDays:n(16,18)};
}
export function lunarMatches(official:KasiCalendarDate,lunar:{year:number;month:number;day:number;isLeapMonth:boolean}){
  return official.lunarYear===lunar.year&&official.lunarMonth===lunar.month&&official.lunarDay===lunar.day&&official.isLeapMonth===lunar.isLeapMonth;
}
let pending:Promise<KasiDataset>|undefined;
export function loadKasiCalendar(){
  if(!pending)pending=fetch(KASI_DATA_URL).then(r=>{if(!r.ok)throw new Error('공식 달력 자료를 불러오지 못했습니다.');return r.json();}).then(validateKasiDataset).catch(e=>{pending=undefined;throw e;});
  return pending;
}
