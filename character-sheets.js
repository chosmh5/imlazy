'use strict';
window.CharacterSheets=(()=>{
  const data=window.RP_CHARACTER_SHEETS||{axes:[],entries:{},scale:5};
  const catalog=window.RP_CATALOG;
  const stories=new Map(catalog.sessions.map(s=>[s.id,s]));
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const sheetFor=c=>data.entries[c.id];
  const classData=window.RP_CHARACTER_CLASSES||{classes:{},characters:{}};
  const classFor=c=>{
    const assigned=classData.characters[c.id],definition=classData.classes[assigned?.code];
    return definition?{...definition,...assigned}:null;
  };
  const classLabel=job=>`${job.name}${job.estimated?' · 추정':''}`;
  const classIcon=job=>{
    const unconfirmed=!job||job.estimated,icon=unconfirmed?classData.unknown:job;
    return icon?.svg?`<span class="class-icon${unconfirmed?' is-unconfirmed':''}" aria-hidden="true">${icon.svg}</span>`:'';
  };
  const cardHeading=c=>{
    const job=classFor(c),icon=classIcon(job);
    const portrait=window.CharacterPortraits?.characterHTML(c.id,'card')||'';
    return `<div class="character-card-heading${icon?' has-class':''}${portrait?' has-portrait':''}">${portrait}<div class="character-card-identity"><h2>${esc(c.name)}</h2><div class="character-class${job?'':' is-unknown'}"><span>${job?esc(classLabel(job)):'직업 미확인'}</span>${icon}</div></div></div>`;
  };
  const sourceLink=(id,label)=>{const s=stories.get(id);return s?`<a class="source-link" href="read.html?id=${encodeURIComponent(id)}">${esc(label||s.title)} <span aria-hidden="true">↗</span></a>`:'';};
  const readyCount=Object.keys(data.entries).length;
  const storyOnlyCount=Object.values(data.entries).filter(s=>s.mode==='stories').length;
  const sheetLabel=s=>s?.recordLabel?'기록 항목 소개':s?.mode==='stories'?'이야기 수록 · 분석 기록 부족':s?.scope==='limited'?'장면 기반 소개·평가':s?'소개·평가 수록':'업데이트 중';
  const status=c=>sheetFor(c)?'ready':'pending';
  const searchText=c=>{const s=sheetFor(c),job=classFor(c);return [job?classLabel(job):'직업 미확인',...(s?[s.tagline,...s.tags,...s.facts.map(f=>f.value)]:[])].join(' ');};
  const card=c=>{const s=sheetFor(c);return `<span class="sheet-status ${s?'ready':'pending'}">${sheetLabel(s)}</span><p class="card-tagline">${esc(s?.tagline||'소개와 성향을 정리하고 있습니다. 참가 기록은 바로 볼 수 있어요.')}</p>${s?`<div class="trait-tags">${s.tags.map(t=>`<span>${esc(t)}</span>`).join('')}</div>`:''}`;};
  const coordinates=(index,value,radius=112)=>{const a=-Math.PI/2+index*Math.PI/3;return [200+Math.cos(a)*radius*value/5,160+Math.sin(a)*radius*value/5];};
  const point=p=>p.map(n=>n.toFixed(2)).join(',');
  const traitFor=(sheet,id)=>sheet.traits[id]||{score:null,text:'현재 기록만으로 이 성향의 강도를 평가할 근거가 부족합니다.',source:null,supportingSources:[]};
  function radar(sheet){
    const rated=data.axes.filter(a=>Number.isInteger(traitFor(sheet,a.id).score));
    const complete=rated.length===data.axes.length;
    const polygons=[1,2,3,4,5].map(n=>`<polygon class="radar-ring" points="${data.axes.map((a,i)=>point(coordinates(i,n))).join(' ')}"/>`).join('');
    const spokes=data.axes.map((a,i)=>`<line class="radar-spoke" x1="200" y1="160" x2="${coordinates(i,5)[0]}" y2="${coordinates(i,5)[1]}"/>`).join('');
    const shape=complete?`<polygon class="radar-shape" points="${data.axes.map((a,i)=>point(coordinates(i,traitFor(sheet,a.id).score))).join(' ')}"/>`:'';
    const dots=data.axes.map((a,i)=>{const score=traitFor(sheet,a.id).score;if(!Number.isInteger(score))return '';const [x,y]=coordinates(i,score);return `<circle class="radar-point" data-axis="${a.id}" cx="${x}" cy="${y}" r="4"/>`;}).join('');
    const labels=data.axes.map((a,i)=>{const [x,y]=coordinates(i,5,144);return `<text class="radar-label" x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle">${esc(a.name)}</text>`;}).join('');
    return `<svg class="trait-radar" viewBox="0 0 400 320" role="img" aria-labelledby="radar-title radar-description"><title id="radar-title">${esc(sheet.name)}의 여섯 성향</title><desc id="radar-description">${esc(data.axes.map(a=>`${a.name}: ${traitFor(sheet,a.id).score===null?'자료 부족':traitFor(sheet,a.id).score+' / 5'}`).join(', '))}. ${complete?'각 수치는 아래 버튼에서 근거와 함께 확인할 수 있습니다.':'자료가 부족한 축은 점이나 면으로 채우지 않았습니다.'}</desc>${polygons}${spokes}${shape}${dots}${labels}<text class="radar-scale" x="205" y="160">1–5</text></svg>`;
  }
  function temperament(sheet){
    const missing=data.axes.filter(a=>traitFor(sheet,a.id).score===null);
    return `<section class="sheet-panel temperament" aria-labelledby="traitsTitle"><p class="eyebrow">TEMPERAMENT</p><h3 id="traitsTitle">성향 육각형</h3><p class="muted small">${sheet.mode==='reading'?'인용한 장면에서 확인된 경향':'대표 장면을 바탕으로 한 편집 해석'} · 5단계${sheet.scope==='limited'?' · 짧은 기록의 장면별 해석':''}</p>${radar(sheet)}${sheet.tags.length?`<p class="traits-heading">핵심 성향</p><div class="trait-tags core-traits">${sheet.tags.map(t=>`<span>${esc(t)}</span>`).join('')}</div>`:''}${missing.length?`<p class="notice partial-traits">${missing.map(a=>esc(a.name)).join(' · ')}은 자료 부족으로 점수를 비워 두었습니다. 확인된 축만 점으로 표시합니다.</p>`:''}<p class="muted small">성향을 선택하면 해석과 근거를 볼 수 있어요.</p><div class="axis-controls" role="group" aria-label="성향별 해석 선택">${data.axes.map((a,i)=>`<button type="button" class="axis-button" data-trait="${a.id}" aria-controls="traitDetail" aria-pressed="${i===0}"><span>${esc(a.name)}</span><strong>${traitFor(sheet,a.id).score===null?'자료 부족':traitFor(sheet,a.id).score+' / 5'}</strong></button>`).join('')}</div><div id="traitDetail" class="trait-detail" aria-live="polite"></div><details class="rating-guide"><summary>성향표 읽는 법</summary><p>사교성은 사람에게 다가가는 경향, 관계성은 맺은 유대를 지키는 경향입니다. 감정성은 표현과 선택에 감정이 드러나는 정도이며 판단력의 우열을 뜻하지 않습니다.</p><p>1은 낮은 경향, 3은 상황에 따라 달라지는 경향, 5는 강하게 드러나는 경향으로 읽습니다. 수치는 인용한 장면에 대한 해석이며 공식 설정이나 캐릭터의 우열·총점이 아닙니다. 근거가 부족한 축에는 점수를 부여하지 않습니다.</p></details></section>`;
  }
  function bindTraits(host,sheet){
    const select=id=>{
      const axis=data.axes.find(a=>a.id===id),t=traitFor(sheet,id);
      host.querySelectorAll('[data-trait]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.trait===id)));
      host.querySelectorAll('.radar-point').forEach(dot=>dot.classList.toggle('active',dot.dataset.axis===id));
      host.querySelector('#traitDetail').innerHTML=`<h4>${esc(axis.name)} · ${t.score===null?'자료 부족':t.score+' / 5'}</h4><p class="axis-definition">${esc(axis.description)}</p><p>${esc(t.text)}</p>${sourceLink(t.source,'근거 대화 읽기')}${t.supportingSources?.length?`<ul class="trait-evidence" aria-label="함께 살펴본 근거">${t.supportingSources.map(id=>`<li>${sourceLink(id)}</li>`).join('')}</ul>`:''}`;
    };
    host.querySelectorAll('[data-trait]').forEach(b=>b.addEventListener('click',()=>select(b.dataset.trait)));
    const initial=data.axes.find(a=>traitFor(sheet,a.id).score!==null)||data.axes[0];
    select(initial.id);
  }
  function render(c){
    const host=document.getElementById('characterSheet');if(!host)return;
    host.hidden=false;
    const s=sheetFor(c);
    const tagline=document.getElementById('tagline');if(tagline)tagline.textContent=s?.tagline||'이 인물의 소개와 성향은 업데이트 중입니다.';
    const directProfiles=c.directProfiles||c.profiles,contextProfiles=c.contextProfiles||[];
    const metadata=`<details class="profile-aliases"><summary>로그의 프로필 표기 보기</summary><p class="muted">대화에 표시된 프로필을 역할별로 나눈 목록입니다. 같은 캐릭터나 같은 오너라는 뜻은 아닙니다. 오너 연결은 위의 ‘같은 오너의 캐릭터’에서 확인할 수 있습니다.</p><p><strong>캐릭터 발화에 사용된 프로필</strong></p><div class="trait-tags direct-profiles">${directProfiles.map(p=>`<span>${esc(p)}</span>`).join('')||'<span>단독 발화 프로필 미확인</span>'}</div>${contextProfiles.length?`<p><strong>진행·회상·복수 인물 서술에 사용된 프로필</strong></p><p class="muted small">이 인물이 등장하는 장면을 진행하거나 여러 인물을 함께 서술한 프로필입니다.</p><div class="trait-tags context-profiles">${contextProfiles.map(p=>`<span>${esc(p)}</span>`).join('')}</div>`:''}</details>`;
    const job=classFor(c),icon=classIcon(job);
    const portrait=s?.recordLabel?'':window.CharacterPortraits?.characterHTML(c.id,'profile')||'';
    const heading=`<div class="sheet-heading">${portrait||`<div class="character-mark${icon?' has-class':''}" aria-hidden="true">${icon||esc(c.name.trim().charAt(0))}</div>`}<div><p class="eyebrow">CHARACTER SHEET</p><h2 id="sheetTitle">${s?.recordLabel?'기록 항목':'인물 시트'}</h2>${s?.recordLabel?'':`<p class="character-class">${job?esc(classLabel(job)):'직업 미확인'}${portrait?icon:''}</p>`}<span class="sheet-status ${s?'ready':'pending'}">${sheetLabel(s)}</span></div></div>`;
    if(!s){
      host.innerHTML=`${heading}<div class="pending-sheet"><h3>이 인물의 이야기를 살펴보고 있어요.</h3><p>프로필 정보, 한줄 평가, 핵심 성향과 성향별 근거를 차례로 추가합니다.</p><div class="pending-fields"><span>캐릭터 정보 · 업데이트 중</span><span>인물 평가 · 업데이트 중</span><span>성향 육각형 · 업데이트 중</span></div><a class="button-link" href="#characterContent">참가한 대화·세션 보기 ↓</a></div>${metadata}`;
      return;
    }
    if(s.mode==='reading'){
      host.innerHTML=`${heading}<p class="sheet-dates">소개 갱신 ${esc(s.updatedAt)} · 참고 장면 ${esc(s.asOf)}까지</p>
        <div${s.recordLabel?'':' class="sheet-grid"'}><section class="sheet-panel" aria-labelledby="factsTitle"><h3 id="factsTitle">기록에서 확인된 정보</h3><p class="muted">${esc(s.profileNote)}</p>${s.recordLabel?`<div class="trait-tags">${s.tags.map(t=>`<span>${esc(t)}</span>`).join('')}</div>`:''}<dl class="character-facts">${s.facts.map(f=>`<div><dt>${esc(f.label)}</dt><dd>${esc(f.value)}<div>${sourceLink(f.source,'관련 기록')}</div></dd></div>`).join('')}</dl>${metadata}</section>${s.recordLabel?'':temperament(s)}</div>
        <section class="sheet-panel evaluation-panel" aria-labelledby="evaluationTitle"><h3 id="evaluationTitle">${s.recordLabel?'기록을 읽는 기준':'인물 평가'}</h3><p class="muted small">${s.recordLabel?'장면 밖 말은 등장인물의 말·행동과 구분해 읽습니다.':'아래 평가는 출처의 장면을 읽은 해석입니다. 이야기의 결말과 관계 변화가 포함됩니다.'}</p><div class="evaluation-grid">${s.evaluation.map(e=>`<article><h4>${esc(e.title)}</h4><p>${esc(e.text)}</p>${sourceLink(e.source,'평가의 근거 읽기')}</article>`).join('')}</div></section>
        ${s.relations.length?`<section class="sheet-panel" aria-labelledby="relationsTitle"><h3 id="relationsTitle">함께 등장한 인물</h3><div class="relation-grid">${s.relations.map(r=>`<article class="relation-card"><h4><a href="character.html?id=${encodeURIComponent(r.characterId)}">${esc(r.name)} →</a></h4><p>${esc(r.text)}</p>${sourceLink(r.source,'함께 등장한 장면')}<a class="shared-stories" href="character.html?id=${encodeURIComponent(c.id)}&with=${encodeURIComponent(r.characterId)}#characterContent">함께 등장한 모든 기록 보기</a></article>`).join('')}</div></section>`:''}
        <section class="sheet-panel" aria-labelledby="scenesTitle"><h3 id="scenesTitle">등장한 이야기</h3><p class="muted small">장면 전체의 사건을 요약한 목록입니다. 모든 행동이 이 인물의 행동이라는 뜻은 아닙니다.</p><ol class="representative-scenes">${s.scenes.map(x=>`<li>${sourceLink(x.source)}<p>${esc(x.text)}</p></li>`).join('')}</ol><a class="button-link" href="#characterContent">참가한 전체 ${esc(s.reviewCoverage.sessionCount)}개 이야기 보기 ↓</a></section>`;
      if(!s.recordLabel)bindTraits(host,s);
      return;
    }
    if(s.mode==='stories'){
      host.innerHTML=`${heading}<p class="sheet-dates">소개 갱신 ${esc(s.updatedAt)} · 참고 장면 ${esc(s.asOf)}까지</p><div class="notice story-only-sheet"><h3>분석할 기록이 부족합니다.</h3><p>${esc(s.profileNote)}</p></div>
        <div class="sheet-grid"><section class="sheet-panel"><h3>기록에서 확인된 정보</h3><dl class="character-facts">${s.facts.map(f=>`<div><dt>${esc(f.label)}</dt><dd>${esc(f.value)}<div>${sourceLink(f.source,'관련 기록')}</div></dd></div>`).join('')}</dl>${metadata}</section>${temperament(s)}</div>
        <section class="sheet-panel"><h3>등장한 이야기</h3><ol class="representative-scenes">${s.scenes.map(x=>`<li>${sourceLink(x.source)}<p>${esc(x.text)}</p></li>`).join('')}</ol></section>
        <section class="sheet-panel"><h3>함께 등장한 인물</h3><div class="relation-grid">${s.relations.map(r=>`<article class="relation-card"><h4><a href="character.html?id=${encodeURIComponent(r.characterId)}">${esc(r.name)} →</a></h4><p>${esc(r.text)}</p>${sourceLink(r.source,'관련 대화')}<a class="shared-stories" href="character.html?id=${encodeURIComponent(c.id)}&with=${encodeURIComponent(r.characterId)}#characterContent">함께 등장한 모든 기록 보기</a></article>`).join('')}</div></section>`;
      bindTraits(host,s);
      return;
    }
    host.innerHTML=`${heading}<p class="sheet-dates">소개 갱신 ${esc(s.updatedAt)} · 참고 장면 ${esc(s.asOf)}까지</p>
      <div class="sheet-grid"><section class="sheet-panel" aria-labelledby="factsTitle"><p class="eyebrow">PROFILE</p><h3 id="factsTitle">캐릭터 정보</h3><dl class="character-facts">${s.facts.map(f=>`<div><dt>${esc(f.label)}</dt><dd>${esc(f.value)}<div>${sourceLink(f.source,'관련 기록')}</div></dd></div>`).join('')}</dl><p class="muted small">${esc(s.profileNote||'종족·나이·외형 등 추가 설정은 업데이트 중입니다.')}</p>${metadata}</section>
      ${temperament(s)}</div>
      <section class="sheet-panel evaluation-panel" aria-labelledby="evaluationTitle"><p class="eyebrow">READING THE CHARACTER</p><h3 id="evaluationTitle">인물 평가</h3><p class="muted small">로그를 읽고 정리한 해석입니다. 이야기의 결말과 관계 변화가 포함됩니다.</p><div class="evaluation-grid">${s.evaluation.map(e=>`<article><h4>${esc(e.title)}</h4><p>${esc(e.text)}</p>${sourceLink(e.source,'평가의 근거 읽기')}</article>`).join('')}</div></section>
      <section class="sheet-panel" aria-labelledby="relationsTitle"><p class="eyebrow">RELATIONSHIPS</p><h3 id="relationsTitle">주요 관계</h3><div class="relation-grid">${s.relations.map(r=>`<article class="relation-card"><h4><a href="character.html?id=${encodeURIComponent(r.characterId)}">${esc(r.name)} →</a></h4><p>${esc(r.text)}</p>${sourceLink(r.source,'관계가 드러난 대화')}<a class="shared-stories" href="character.html?id=${encodeURIComponent(c.id)}&with=${encodeURIComponent(r.characterId)}#characterContent">함께 등장한 모든 기록 보기</a></article>`).join('')}</div></section>
      <section class="sheet-panel" aria-labelledby="scenesTitle"><p class="eyebrow">MOMENTS</p><h3 id="scenesTitle">대표 장면</h3><ol class="representative-scenes">${s.scenes.map(x=>`<li>${sourceLink(x.source)}<p>${esc(x.text)}</p></li>`).join('')}</ol></section>`;
    bindTraits(host,s);
  }
  return {render,card,cardHeading,searchText,status,readyCount,storyOnlyCount};
})();
