'use strict';
window.CharacterSheets=(()=>{
  const data=window.RP_CHARACTER_SHEETS||{axes:[],entries:{},scale:5};
  const catalog=window.RP_CATALOG;
  const stories=new Map(catalog.sessions.map(s=>[s.id,s]));
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const sheetFor=c=>data.entries[c.id];
  const sourceLink=(id,label)=>{const s=stories.get(id);return s?`<a class="source-link" href="read.html?id=${encodeURIComponent(id)}">${esc(label||s.title)} <span aria-hidden="true">↗</span></a>`:'';};
  const readyCount=Object.keys(data.entries).length;
  const storyOnlyCount=Object.values(data.entries).filter(s=>s.mode==='stories').length;
  const status=c=>sheetFor(c)?'ready':'pending';
  const searchText=c=>{const s=sheetFor(c);return s?[s.tagline,...s.tags,...s.facts.map(f=>f.value)].join(' '):'';};
  const card=c=>{const s=sheetFor(c);return `<span class="sheet-status ${s?'ready':'pending'}">${s?.mode==='stories'?'이야기 수록 · 분석 기록 부족':s?'인물 시트 수록':'업데이트 중'}</span><p class="card-tagline">${esc(s?.tagline||'소개와 성향을 정리하고 있습니다. 참가 기록은 바로 볼 수 있어요.')}</p>${s?`<div class="trait-tags">${s.tags.map(t=>`<span>${esc(t)}</span>`).join('')}</div>`:''}`;};
  const coordinates=(index,value,radius=112)=>{const a=-Math.PI/2+index*Math.PI/3;return [200+Math.cos(a)*radius*value/5,160+Math.sin(a)*radius*value/5];};
  const point=p=>p.map(n=>n.toFixed(2)).join(',');
  function radar(sheet){
    const rated=data.axes.filter(a=>Number.isInteger(sheet.traits[a.id].score));
    const complete=rated.length===data.axes.length;
    const polygons=[1,2,3,4,5].map(n=>`<polygon class="radar-ring" points="${data.axes.map((a,i)=>point(coordinates(i,n))).join(' ')}"/>`).join('');
    const spokes=data.axes.map((a,i)=>`<line class="radar-spoke" x1="200" y1="160" x2="${coordinates(i,5)[0]}" y2="${coordinates(i,5)[1]}"/>`).join('');
    const shape=complete?`<polygon class="radar-shape" points="${data.axes.map((a,i)=>point(coordinates(i,sheet.traits[a.id].score))).join(' ')}"/>`:'';
    const dots=data.axes.map((a,i)=>{const score=sheet.traits[a.id].score;if(!Number.isInteger(score))return '';const [x,y]=coordinates(i,score);return `<circle class="radar-point" data-axis="${a.id}" cx="${x}" cy="${y}" r="4"/>`;}).join('');
    const labels=data.axes.map((a,i)=>{const [x,y]=coordinates(i,5,144);return `<text class="radar-label" x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle">${esc(a.name)}</text>`;}).join('');
    return `<svg class="trait-radar" viewBox="0 0 400 320" role="img" aria-labelledby="radar-title radar-description"><title id="radar-title">${esc(sheet.name)}의 여섯 성향</title><desc id="radar-description">${esc(data.axes.map(a=>`${a.name}: ${sheet.traits[a.id].score===null?'자료 부족':sheet.traits[a.id].score+' / 5'}`).join(', '))}. ${complete?'각 수치는 아래 버튼에서 근거와 함께 확인할 수 있습니다.':'자료가 부족한 축은 점이나 면으로 채우지 않았습니다.'}</desc>${polygons}${spokes}${shape}${dots}${labels}<text class="radar-scale" x="205" y="160">1–5</text></svg>`;
  }
  function render(c){
    const host=document.getElementById('characterSheet');if(!host)return;
    host.hidden=false;
    const s=sheetFor(c);
    const tagline=document.getElementById('tagline');if(tagline)tagline.textContent=s?.tagline||'이 인물의 소개와 성향은 업데이트 중입니다.';
    const metadata=`<details class="profile-aliases"><summary>로그의 프로필 표기 보기</summary><p class="muted">이 인물이 연결된 장면의 원래 프로필 이름입니다. 하나의 프로필로 다른 인물이 등장할 수도 있습니다.</p><div class="trait-tags">${c.profiles.map(p=>`<span>${esc(p)}</span>`).join('')||'<span>업데이트 중</span>'}</div></details>`;
    const heading=`<div class="sheet-heading"><div class="character-mark" aria-hidden="true">${esc(c.name.trim().charAt(0))}</div><div><p class="eyebrow">CHARACTER SHEET</p><h2 id="sheetTitle">인물 시트</h2><span class="sheet-status ${s?'ready':'pending'}">${s?.mode==='stories'?'이야기 수록 · 분석 기록 부족':s?'소개·평가 수록':'업데이트 중'}</span></div></div>`;
    if(!s){
      host.innerHTML=`${heading}<div class="pending-sheet"><h3>이 인물의 이야기를 살펴보고 있어요.</h3><p>프로필 정보, 한줄 평가, 핵심 성향과 성향별 근거를 차례로 추가합니다.</p><div class="pending-fields"><span>캐릭터 정보 · 업데이트 중</span><span>인물 평가 · 업데이트 중</span><span>성향 육각형 · 업데이트 중</span></div><a class="button-link" href="#characterContent">참가한 대화·세션 보기 ↓</a></div>${metadata}`;
      return;
    }
    if(s.mode==='stories'){
      host.innerHTML=`${heading}<p class="sheet-dates">소개 갱신 ${esc(s.updatedAt)} · 참고 장면 ${esc(s.asOf)}까지</p><div class="notice story-only-sheet"><h3>분석할 기록이 부족합니다.</h3><p>${esc(s.profileNote)}</p></div>
        <section class="sheet-panel"><h3>기록에서 확인된 정보</h3><dl class="character-facts">${s.facts.map(f=>`<div><dt>${esc(f.label)}</dt><dd>${esc(f.value)}<div>${sourceLink(f.source,'관련 기록')}</div></dd></div>`).join('')}</dl>${metadata}</section>
        <section class="sheet-panel"><h3>등장한 이야기</h3><ol class="representative-scenes">${s.scenes.map(x=>`<li>${sourceLink(x.source)}<p>${esc(x.text)}</p></li>`).join('')}</ol></section>
        <section class="sheet-panel"><h3>함께 등장한 인물</h3><div class="relation-grid">${s.relations.map(r=>`<article class="relation-card"><h4><a href="character.html?id=${encodeURIComponent(r.characterId)}">${esc(r.name)} →</a></h4><p>${esc(r.text)}</p>${sourceLink(r.source,'관련 대화')}<a class="shared-stories" href="character.html?id=${encodeURIComponent(c.id)}&with=${encodeURIComponent(r.characterId)}#characterContent">함께 등장한 모든 기록 보기</a></article>`).join('')}</div></section>`;
      return;
    }
    const missing=data.axes.filter(a=>s.traits[a.id].score===null);
    host.innerHTML=`${heading}<p class="sheet-dates">소개 갱신 ${esc(s.updatedAt)} · 참고 장면 ${esc(s.asOf)}까지</p>
      <div class="sheet-grid"><section class="sheet-panel" aria-labelledby="factsTitle"><p class="eyebrow">PROFILE</p><h3 id="factsTitle">캐릭터 정보</h3><dl class="character-facts">${s.facts.map(f=>`<div><dt>${esc(f.label)}</dt><dd>${esc(f.value)}<div>${sourceLink(f.source,'관련 기록')}</div></dd></div>`).join('')}</dl><p class="muted small">${esc(s.profileNote||'종족·나이·외형 등 추가 설정은 업데이트 중입니다.')}</p>${metadata}</section>
      <section class="sheet-panel temperament" aria-labelledby="traitsTitle"><p class="eyebrow">TEMPERAMENT</p><h3 id="traitsTitle">성향 육각형</h3><p class="muted small">대표 장면을 바탕으로 한 편집 해석 · 5단계</p>${radar(s)}<p class="traits-heading">핵심 성향</p><div class="trait-tags core-traits">${s.tags.map(t=>`<span>${esc(t)}</span>`).join('')}</div>${missing.length?`<p class="notice partial-traits">${missing.map(a=>esc(a.name)).join(' · ')}은 자료 보완 중입니다. 확인된 축만 점으로 표시합니다.</p>`:''}<p class="muted small">성향을 선택하면 해석과 근거를 볼 수 있어요.</p><div class="axis-controls" role="group" aria-label="성향별 해석 선택">${data.axes.map((a,i)=>`<button type="button" class="axis-button" data-trait="${a.id}" aria-controls="traitDetail" aria-pressed="${i===0}"><span>${esc(a.name)}</span><strong>${s.traits[a.id].score===null?'자료 부족':s.traits[a.id].score+' / 5'}</strong></button>`).join('')}</div><div id="traitDetail" class="trait-detail" aria-live="polite"></div><details class="rating-guide"><summary>성향표 읽는 법</summary><p>사교성은 사람에게 다가가는 경향, 관계성은 맺은 유대를 지키는 경향입니다. 감정성은 표현과 선택에 감정이 드러나는 정도이며 판단력의 우열을 뜻하지 않습니다.</p><p>1은 낮은 경향, 3은 상황에 따라 달라지는 경향, 5는 강하게 드러나는 경향으로 읽습니다. 수치는 인용한 장면에 대한 해석이며 공식 설정이나 캐릭터의 우열·총점이 아닙니다. 근거가 부족한 축에는 점수를 부여하지 않습니다.</p></details></section></div>
      <section class="sheet-panel evaluation-panel" aria-labelledby="evaluationTitle"><p class="eyebrow">READING THE CHARACTER</p><h3 id="evaluationTitle">인물 평가</h3><p class="muted small">로그를 읽고 정리한 해석입니다. 이야기의 결말과 관계 변화가 포함됩니다.</p><div class="evaluation-grid">${s.evaluation.map(e=>`<article><h4>${esc(e.title)}</h4><p>${esc(e.text)}</p>${sourceLink(e.source,'평가의 근거 읽기')}</article>`).join('')}</div></section>
      <section class="sheet-panel" aria-labelledby="relationsTitle"><p class="eyebrow">RELATIONSHIPS</p><h3 id="relationsTitle">주요 관계</h3><div class="relation-grid">${s.relations.map(r=>`<article class="relation-card"><h4><a href="character.html?id=${encodeURIComponent(r.characterId)}">${esc(r.name)} →</a></h4><p>${esc(r.text)}</p>${sourceLink(r.source,'관계가 드러난 대화')}<a class="shared-stories" href="character.html?id=${encodeURIComponent(c.id)}&with=${encodeURIComponent(r.characterId)}#characterContent">함께 등장한 모든 기록 보기</a></article>`).join('')}</div></section>
      <section class="sheet-panel" aria-labelledby="scenesTitle"><p class="eyebrow">MOMENTS</p><h3 id="scenesTitle">대표 장면</h3><ol class="representative-scenes">${s.scenes.map(x=>`<li>${sourceLink(x.source)}<p>${esc(x.text)}</p></li>`).join('')}</ol></section>`;
    const select=id=>{
      const axis=data.axes.find(a=>a.id===id),t=s.traits[id];
      host.querySelectorAll('[data-trait]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.trait===id)));
      host.querySelectorAll('.radar-point').forEach(dot=>dot.classList.toggle('active',dot.dataset.axis===id));
      document.getElementById('traitDetail').innerHTML=`<h4>${esc(axis.name)} · ${t.score===null?'업데이트 중':t.score+' / 5'}</h4><p class="axis-definition">${esc(axis.description)}</p><p>${esc(t.text)}</p>${sourceLink(t.source,'근거 대화 읽기')}${t.supportingSources?.length?`<ul class="trait-evidence" aria-label="함께 살펴본 근거">${t.supportingSources.map(id=>`<li>${sourceLink(id)}</li>`).join('')}</ul>`:''}`;
    };
    host.querySelectorAll('[data-trait]').forEach(b=>b.addEventListener('click',()=>select(b.dataset.trait)));
    select(data.axes[0].id);
  }
  return {render,card,searchText,status,readyCount,storyOnlyCount};
})();
