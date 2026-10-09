import type { SajuChart } from './engine.ts';
import { JIJANGGAN_STRENGTH_DETAILED } from '../../vendor/saju/fortuneteller/src/data/jijanggan_strength_table.ts';
import { HEAVENLY_STEMS, HEAVENLY_STEMS_HANJA, getHeavenlyStemElement, getTenGod, type FiveElement } from '../../vendor/saju/manseryeok/src/index.ts';
import { BRANCH_HIDDEN_STEMS } from '../../vendor/saju/ssaju/src/constants.ts';

// Adapted from hjsh200219/fortuneteller at 844d9f6. Calendar and time corrections remain in the primary engine.
const GENERATES:Record<FiveElement,FiveElement>={목:'화',화:'토',토:'금',금:'수',수:'목'};
const WEIGHTS={year:1,month:3,day:1.5,hour:1};
const THRESHOLDS={veryWeak:22,weak:35,strong:44,veryStrong:58};
const CLIMATE:Record<string,{name:string;condition:string;elements:FiveElement[];meaning:string}>={
  인:{name:'초봄',condition:'아직 찬 기운이 남은 계절',elements:['화','목'],meaning:'화의 따뜻함과 목의 성장으로 출발을 돕는 관점'},
  묘:{name:'중봄',condition:'따뜻해지며 건조함을 살피는 계절',elements:['수'],meaning:'수의 자윤으로 자라나는 기운을 받치는 관점'},
  진:{name:'늦봄',condition:'따뜻함과 습한 토의 기운을 함께 보는 계절',elements:['금','수'],meaning:'금의 정리와 수의 흐름을 함께 살피는 관점'},
  사:{name:'초여름',condition:'열기와 건조함을 살피는 계절',elements:['수','금'],meaning:'수의 식힘과 금의 정리로 열기의 쏠림을 살피는 관점'},
  오:{name:'한여름',condition:'뜨거운 기운이 중심이 되는 계절',elements:['수'],meaning:'수의 식힘으로 화의 열기를 조절하는 관점'},
  미:{name:'늦여름',condition:'여름의 열기와 토의 기운을 함께 보는 계절',elements:['금','수'],meaning:'금의 정리와 수의 흐름으로 열기를 조절하는 관점'},
  신:{name:'초가을',condition:'서늘함과 건조함을 살피는 계절',elements:['수','목'],meaning:'수의 자윤과 목의 성장으로 마름을 살피는 관점'},
  유:{name:'중가을',condition:'금의 기운과 서늘함이 중심이 되는 계절',elements:['화','목'],meaning:'화의 따뜻함과 목의 성장으로 서늘함을 조절하는 관점'},
  술:{name:'늦가을',condition:'서늘함과 마른 토의 기운을 함께 보는 계절',elements:['화'],meaning:'화의 따뜻함으로 차가워지는 흐름을 조절하는 관점'},
  해:{name:'초겨울',condition:'차가움과 습함을 살피는 계절',elements:['화','목'],meaning:'화의 따뜻함과 목의 성장으로 찬 기운을 조절하는 관점'},
  자:{name:'한겨울',condition:'차가운 수의 기운이 중심이 되는 계절',elements:['화'],meaning:'화의 따뜻함으로 찬 기운을 조절하는 관점'},
  축:{name:'늦겨울',condition:'추위와 토의 기운을 함께 보는 계절',elements:['화','목'],meaning:'화의 따뜻함과 목의 성장으로 다음 계절을 준비하는 관점'},
};
const ROLE:Record<string,{title:string;meaning:string;action:string}>={
  비견:{title:'독립성과 동료의 역할',meaning:'자기 기준을 지키면서 동료와 나란히 움직이는 주제',action:'공동 목표 안에서 각자 결정할 범위를 정해보세요.'},
  겁재:{title:'경쟁과 공동 자원의 역할',meaning:'도전을 추진하면서 함께 쓰는 자원의 몫을 나누는 주제',action:'시작 전에 각자의 시간·비용·책임을 합의해보세요.'},
  식신:{title:'꾸준한 제작의 역할',meaning:'기술과 경험을 반복 가능한 결과로 만드는 주제',action:'반복해서 낼 수 있는 작은 결과물 하나를 정해보세요.'},
  상관:{title:'개선과 제안의 역할',meaning:'기존 방식의 불편을 발견해 새로운 방법으로 바꾸는 주제',action:'바꾸고 싶은 점에 대안과 기대 효과를 함께 붙여보세요.'},
  정재:{title:'일정과 자원 관리의 역할',meaning:'정해진 자원과 약속을 꾸준히 운영하는 주제',action:'준비·진행·마감에 드는 시간을 따로 잡아보세요.'},
  편재:{title:'기회와 연결의 역할',meaning:'사람과 정보를 연결해 새 선택지를 만드는 주제',action:'기회를 넓히기 전에 감당할 범위를 먼저 정해보세요.'},
  정관:{title:'기준과 신뢰의 역할',meaning:'분명한 기준과 책임으로 신뢰를 쌓는 주제',action:'잘했다고 판단할 기준을 상대와 먼저 맞춰보세요.'},
  편관:{title:'도전과 대응의 역할',meaning:'어려운 목표나 압박 속에서 실행 순서를 정하는 주제',action:'핵심 문제 하나와 도움을 요청할 지점을 정해보세요.'},
  정인:{title:'학습과 설명의 역할',meaning:'배운 내용을 체계화하고 이해하기 쉽게 전달하는 주제',action:'새로 배운 내용을 한 장으로 정리해 공유해보세요.'},
  편인:{title:'탐구와 다른 시각의 역할',meaning:'익숙한 답을 새 관점으로 검토하고 전문성을 깊게 만드는 주제',action:'가설 하나를 실제 사례에 적용해 확인해보세요.'},
};
const korean=(hanja:string)=>HEAVENLY_STEMS[HEAVENLY_STEMS_HANJA.indexOf(hanja as typeof HEAVENLY_STEMS_HANJA[number])];
export function supportBreakdown(chart:SajuChart){
  if(chart.input.unknownTime||Object.keys(chart.unknownCandidates).length)return null;
  const supportElement=HEAVENLY_STEMS.map(getHeavenlyStemElement).find(e=>GENERATES[e]===chart.dayElement)!;
  const isSupport=(e:FiveElement)=>e===chart.dayElement||e===supportElement;
  const rows=chart.pillars.map(p=>{
    const phases=JIJANGGAN_STRENGTH_DETAILED[p.pillar.earthlyBranch];
    const branchRatio=phases.reduce((sum,phase)=>sum+(isSupport(getHeavenlyStemElement(phase.stem))?phase.strength/100:0),0);
    const stemWeight=p.key==='day'?0:1,branchWeight=WEIGHTS[p.key];
    return {key:p.key,label:p.label,stem:p.pillar.heavenlyStem,branch:p.pillar.earthlyBranch,stemWeight,branchWeight,branchRatio,support:(isSupport(p.stemElement)?stemWeight:0)+branchRatio*branchWeight,total:stemWeight+branchWeight,mainSupports:isSupport(getHeavenlyStemElement(phases.at(-1)!.stem)),phases};
  });
  const score=Math.round(rows.reduce((sum,r)=>sum+r.support,0)/rows.reduce((sum,r)=>sum+r.total,0)*100);
  const level=score>=THRESHOLDS.veryStrong?'very_strong':score>=THRESHOLDS.strong?'strong':score>THRESHOLDS.weak?'medium':score>THRESHOLDS.veryWeak?'weak':'very_weak';
  const label={very_strong:'돕는 쪽으로 크게 기운 구성',strong:'돕는 쪽의 비중이 큰 구성',medium:'두 역할을 함께 살필 구성',weak:'표현·관리·책임 쪽의 비중이 큰 구성',very_weak:'표현·관리·책임 쪽으로 크게 기운 구성'}[level];
  const candidates:FiveElement[]=level.includes('strong')?[GENERATES[chart.dayElement]]:level.includes('weak')?[supportElement,chart.dayElement]:[];
  return {score,level,label,rows,supportElement,candidates};
}
export function monthCommand(chart:SajuChart){
  if(Object.keys(chart.unknownCandidates).length)return null;
  const month=chart.pillars.find(p=>p.key==='month')!;
  const hidden=BRANCH_HIDDEN_STEMS[month.hanja[1]];
  const ordered=[hidden.정기,hidden.중기,hidden.여기].filter(Boolean).map(s=>korean(s!));
  const visible=chart.pillars.filter(p=>p.key!=='day');
  const selected=ordered.find(s=>visible.some(p=>p.pillar.heavenlyStem===s))??ordered[0];
  const positions=visible.filter(p=>p.pillar.heavenlyStem===selected).map(p=>p.label);
  const god=getTenGod(chart.raw.day.heavenlyStem,selected);
  return {month:month.korean,branch:month.pillar.earthlyBranch,selected,positions,god,...ROLE[god],partial:chart.input.unknownTime};
}
export function structureReading(chart:SajuChart){
  if(Object.keys(chart.unknownCandidates).length)return null;
  const month=chart.pillars.find(p=>p.key==='month')!,strength=supportBreakdown(chart),climate=CLIMATE[month.pillar.earthlyBranch];
  const seasonElements=climate.elements.map(element=>({element,visible:chart.counts[element],hidden:chart.pillars.filter(p=>p.hiddenStems.some(s=>getHeavenlyStemElement(korean(s))===element)).map(p=>p.label)}));
  const common=strength?.candidates.filter(e=>climate.elements.includes(e))??[];
  return {strength,climate,seasonElements,common,command:monthCommand(chart)};
}
