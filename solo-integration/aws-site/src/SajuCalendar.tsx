import {useEffect,useState} from 'react';
import type {SajuChart} from '../../lib/saju/engine.ts';
import {loadKasiCalendar,lookupKasiDate,lunarMatches,type KasiDataset} from '../../lib/saju/kasi.ts';

export default function SajuCalendar({chart}:{chart:SajuChart}){
  const [data,setData]=useState<KasiDataset|null>(null),[error,setError]=useState(false);
  useEffect(()=>{let active=true;loadKasiCalendar().then(d=>{if(active)setData(d);}).catch(()=>{if(active)setError(true);});return()=>{active=false;};},[]);
  const official=data?lookupKasiDate(data,chart.solar.year,chart.solar.month,chart.solar.day):null;
  const matching=official?lunarMatches(official,chart.lunar):false;
  return <details className="sj-official-calendar"><summary><span>한국천문연구원 달력 확인</span><b>{error?'자료를 불러오지 못했어요':!data?'자료 확인 중':!official?'수록 범위 밖':matching?'음력·윤달 일치':'변환 정보 확인 필요'}</b></summary><div>{official?<><dl><div><dt>양력</dt><dd>{official.year}.{official.month}.{official.day} · {official.weekday}요일</dd></div><div><dt>공식 음력</dt><dd>{official.lunarYear}.{official.lunarMonth}.{official.lunarDay} · {official.isLeapMonth?'윤달':'평달'}</dd></div><div><dt>음력 한 달</dt><dd>{official.lunarMonthDays}일</dd></div><div><dt>달력의 일진</dt><dd>{official.dayGanji}</dd></div></dl>{!matching&&<p className="sj-warning">만세력의 음력 변환값과 공식 달력 자료가 다릅니다. 출생 기록과 윤달 여부를 확인해주세요. 이 표는 한국천문연구원의 달력값입니다.</p>}<p>달력의 일진은 입력한 양력 날짜 기준입니다. 진태양시·서머타임 보정과 23시 일 경계를 적용한 사주 일주는 달라질 수 있습니다. 사주 연주·월주는 음력 설·초하루가 아닌 입춘·절입 순간으로 계산합니다.</p></>:<p>{error?'달력 확인 자료를 불러오지 못했습니다. 기존 만세력 계산 결과를 표시하고 있습니다.':data?'공식 수집 자료는 1900~2050년입니다. 이 날짜는 기존 만세력 엔진으로 계산하며, 공식 자료와 대조했다는 표시는 하지 않습니다.':'공식 달력 자료를 불러오고 있습니다.'}</p>}<p>출처: <a href="https://www.data.go.kr/data/15012679/openapi.do" target="_blank" rel="noreferrer">한국천문연구원 음양력 정보 API</a>{data&&` · 수집 ${new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'numeric',day:'numeric'}).format(new Date(data.fetchedAt))} · 1900~2050년`}</p><p>공개 달력 자료를 한 번 내려받아 브라우저 안에서 대조합니다. 이름과 생년월시를 API로 전송하지 않습니다.</p></div></details>;
}
