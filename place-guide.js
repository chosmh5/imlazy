'use strict';
window.PlaceGuide=(()=>{
  const sourceLink=(sid,anchor)=>`${readLink(sid)}#${encodeURIComponent(anchor)}`;
  const quote=(e,sid)=>e?`<figure class="place-evidence"><blockquote>${e.truncatedBefore?'…':''}${esc(e.quote)}${e.truncatedAfter?'…':''}</blockquote><figcaption>${esc(e.speaker)} · <a href="${sourceLink(sid,e.anchor)}">이 원문에서 확인 →</a></figcaption></figure>`:'';
  const label=status=>({reviewed:'무대 편집 완료',summary:'요약·원문의 장소 단서',unresolved:'진행 장소 미확정'}[status]||status);
  const geographyLine=p=>[p.geography.country,p.geography.direction,p.geography.region].join(' → ');
  function renderSetting(s){
    const host=$('settingContent'),e=window.RP_SETTINGS?.entries[s.id];if(!host)return;
    if(!e){host.innerHTML='<p class="muted">배경 자료를 불러오지 못했습니다. 새로고침해 주세요.</p>';return;}
    const refs=e.namedReferences;
    host.innerHTML=`<div class="setting-heading"><h2>이 이야기의 배경과 장소</h2><span class="tag ${e.status==='unresolved'?'unknown':''}">${label(e.status)}</span></div>
      <p class="setting-background">${esc(e.background)}</p>
      <dl class="setting-facts"><div><dt>주요 무대</dt><dd>${e.scenes.length?e.scenes.map((v,i)=>`<span class="scene-item">${esc(v)}</span>`).join(''):'현재 남은 요약과 장소 표현만으로 특정하지 못했습니다.'}</dd></div>
      <div><dt>국가·지역·지형</dt><dd>${s.setting.scenePlaceIds.length?s.setting.scenePlaceIds.map(id=>{const p=places.get(id);return `<div class="scene-geography"><a href="${placeLink(id)}">${esc(p.name)}</a><p>${esc(geographyLine(p))}</p><small>${esc(p.geography.terrain)}</small></div>`;}).join(''):'주요 무대와 연결할 상위 지명이 확인되지 않았습니다. 채팅방 이름을 작중 국가나 지역으로 해석하지 않습니다.'}</dd></div>
      <div><dt>공간·시점</dt><dd>${esc([e.note,...e.spaceTags].filter(Boolean).join(' · ')||'별도의 꿈·회상 공간 표시는 확인되지 않았습니다.')}</dd></div>
      ${e.environment.length?`<div><dt>시간·환경 단서</dt><dd>${esc(e.environment.join(' · '))}<small>요약에 나타난 단서이며 모든 장면에 동시에 적용되는 조건은 아닙니다.</small></dd></div>`:''}</dl>
      <p class="muted small">${esc(e.basis)} 무대 목록은 방문 순서표가 아닙니다. 이름 없는 장소끼리는 같은 곳으로 합치지 않았습니다.</p>
      ${refs.some(r=>r.role!=='mention')?`<div class="chips">${placeChips(refs.filter(r=>r.role!=='mention').map(r=>r.placeId))}</div>`:''}
      <details class="reading-details setting-details"><summary>원문에서 장소 확인 · ${e.evidence.length}개 단서</summary><p class="muted small">장소 표현이 있는 대목을 모았습니다. 대사 속 추측·회상·목적지는 실제 방문을 뜻하지 않을 수 있습니다.</p>${e.evidence.length?e.evidence.map(v=>quote(v,s.id)).join(''):e.opening?'<p>장소를 특정할 표현을 찾지 못해 도입부를 함께 표시합니다.</p>'+quote(e.opening,s.id):'<p>장소 근거가 없습니다.</p>'}</details>
      <details class="reading-details setting-details"><summary>회차별 배경 단서 · ${e.parts.length}개 장면</summary><p class="muted small">각 수록 회차의 앞부분에서 찾은 공간 표현입니다. 긴 회차의 모든 이동 경로를 대신하지 않습니다.</p>${e.parts.map(p=>`<section class="part-setting"><h3><a href="${sourceLink(s.id,p.anchor)}">${esc(p.title)}</a></h3>${p.evidence?quote(p.evidence,s.id):'<p class="muted">이 회차에서 장소를 특정할 단서를 찾지 못했습니다. 회차 제목을 누르면 도입부를 읽을 수 있습니다.</p>'}</section>`).join('')}</details>
      ${refs.some(r=>r.role==='mention')?`<details class="reading-details setting-details"><summary>그 밖에 언급된 지명 · ${refs.filter(r=>r.role==='mention').length}곳</summary><p class="muted small">출신·소문·계획·비유·회상일 수 있습니다. 이 목록은 방문 기록이 아닙니다.</p>${refs.filter(r=>r.role==='mention').map(r=>`<div class="place-mention"><h3><a href="${placeLink(r.placeId)}">${esc(places.get(r.placeId)?.name)}</a></h3>${quote(r.evidence,s.id)}</div>`).join('')}</details>`:''}`;
    // Same-story citations are handled by the existing reader's hash navigation.
    host.addEventListener('click',event=>{
      const a=event.target.closest('a');if(!a)return;
      const url=new URL(a.href,location.href);
      if(url.pathname===location.pathname&&url.searchParams.get('id')===s.id&&url.hash){
        event.preventDefault();$('bodySearch').value='';$('onlyCharacter').checked=false;$('showBots').checked=true;
        const hash=url.hash;if(location.hash===hash)window.dispatchEvent(new HashChangeEvent('hashchange'));else location.hash=hash;
      }
    });
  }
  function renderPlaces(){
    const data=window.RP_PLACES;if(!data){$('results').innerHTML='<p>지명 자료를 불러오지 못했습니다.</p>';return;}
    let page=initialPage();const size=24;
    $('search').value=params.get('q')||'';
    $('type').insertAdjacentHTML('beforeend',[...new Set(data.places.map(p=>p.type))].sort().map(t=>`<option>${esc(t)}</option>`).join(''));
    $('type').value=params.get('type')||'';
    for(const key of ['country','direction']){$(key).insertAdjacentHTML('beforeend',[...new Set(data.places.map(p=>p.geography[key]))].sort((a,b)=>a.localeCompare(b,'ko')).map(v=>`<option>${esc(v)}</option>`).join(''));$(key).value=params.get(key)||'';}
    const world=data.worldGeography;
    $('worldGeography').innerHTML=`<h2>대륙의 방위와 지형</h2><div class="terrain-grid">${world.regions.map(r=>`<article><h3>${esc(r.name)}</h3><p>${esc(r.terrain)}</p><div class="chips">${r.places.length?placeChips(r.places):esc(r.politics)}</div></article>`).join('')}</div><p class="muted small">${esc(world.source)} · ${esc(world.note)}</p>`;
    const r=data.report;
    $('placeOverview').innerHTML=stats([[number(data.places.length),'지명·장소'],[number(r.sessions),'배경란 수록 이야기'],[number(r.statuses.reviewed),'무대 편집'],[number(r.statuses.unresolved||0),'장소 미확정']]);
    const render=()=>{
      const found=data.places.filter(p=>(!$('type').value||p.type===$('type').value)&&['country','direction'].every(k=>!$(k).value||p.geography[k]===$(k).value)&&queryMatches(norm([p.name,p.type,p.region,p.description,...p.aliases,...Object.values(p.geography)].join(' ')),$('search').value)).sort((a,b)=>a.name.localeCompare(b.name,'ko'));
      const total=Math.max(1,Math.ceil(found.length/size));page=Math.min(page,total-1);
      $('resultCount').textContent=`${number(found.length)}개 지명·장소`;
      $('results').innerHTML=found.slice(page*size,(page+1)*size).map(p=>{
        const scene=p.references.filter(r=>r.role!=='mention').length;
        return `<article class="place-card"><p class="eyebrow">${esc(p.type)}</p><h2><a href="${placeLink(p.id)}">${esc(p.name)}</a></h2><p class="place-region">${esc(geographyLine(p))}</p><p class="place-terrain">${esc(p.geography.terrain)}</p><p>${esc(p.description)}</p><p class="muted small">주요 무대 ${number(scene)}개 이야기 · 단순 언급 ${number(p.references.length-scene)}개</p><a class="card-action" href="${placeLink(p.id)}">장소 설명과 근거 읽기 →</a></article>`;
      }).join('')||'<p class="empty">해당하는 지명이 없습니다.</p>';
      updateURL({q:$('search').value,type:$('type').value,country:$('country').value,direction:$('direction').value,page:page?String(page+1):''});pager(page,total,n=>{page=n;render();$('resultCount').scrollIntoView();});
    };
    for(const id of ['search','type','country','direction'])$(id).oninput=()=>{page=0;render();};
    $('reset').onclick=()=>{for(const id of ['search','type','country','direction'])$(id).value='';page=0;render();};render();
  }
  function renderPlace(){
    const p=window.RP_PLACES?.places.find(p=>p.id===params.get('id'));
    if(!p){$('title').textContent='지명을 찾지 못했습니다';$('placeContent').hidden=true;return;}
    document.title=`${p.name} · 어설픈 용맹 지명록`;$('title').textContent=p.name;$('placeKind').textContent=p.type;$('placeDescription').textContent=p.description;
    $('placeFacts').innerHTML=`<div><dt>소속 국가·정치권</dt><dd>${esc(p.geography.country)}</dd></div><div><dt>대륙 방위</dt><dd>${esc(p.geography.direction)}</dd></div><div><dt>현지 위치·상위 지역</dt><dd>${esc(p.region)}</dd></div><div><dt>주변 지형·공간</dt><dd>${esc(p.geography.terrain)}</dd></div>${p.geography.note?`<div><dt>위치 확인 메모</dt><dd>${esc(p.geography.note)}</dd></div>`:''}<div><dt>찾아볼 표기</dt><dd>${esc(p.aliases.join(' · '))}</dd></div><div><dt>해석할 때의 구분</dt><dd>${esc(p.caution)}</dd></div>`;
    $('placeSources').innerHTML=p.evidence.map(e=>`<div><p><a href="${sourceLink(e.sessionId,e.anchor)}">${esc(sessions.get(e.sessionId)?.title)}</a></p>${quote(e,e.sessionId)}</div>`).join('')||(p.sourceIds.length?'<p class="muted">현재 설명은 아래 검토 요약에 근거합니다. 지명과 일치하는 원문 구절은 추가 확인이 필요합니다.</p>':'<p class="muted">2026-10-02 제공된 세계관 기준 설정입니다. 연결할 원문 구절은 아직 확인되지 않았습니다.</p>');
    $('placeEvents').innerHTML=p.sources.map(s=>`<article class="place-event"><h3><a href="${readLink(s.id)}#settingContent">${esc(s.title)}</a></h3><p>${esc(s.summary)}</p><a href="${readLink(s.id)}#summaryBox">검토 요약과 원문 →</a></article>`).join('');
    let page=initialPage();const size=20;
    $('scope').value=params.get('scope')||'scene';if(!$('scope').value)$('scope').value='scene';
    const render=()=>{
      const found=p.references.filter(r=>$('scope').value==='all'||($('scope').value==='mention'?r.role==='mention':r.role!=='mention'));
      const total=Math.max(1,Math.ceil(found.length/size));page=Math.min(page,total-1);
      $('resultCount').textContent=`${number(found.length)}개 이야기 · ${$('scope').value==='scene'?'주요 무대':$('scope').value==='mention'?'단순 언급':'주요 무대와 단순 언급'}`;
      $('results').innerHTML=found.slice(page*size,(page+1)*size).map(r=>`<div class="place-story"><p class="place-role">${r.role==='mention'?'단순 언급 · 방문 확정 아님':r.role==='summary'?'주요 무대 · 검토 요약 기준':'주요 무대 · 검토 요약과 원문 단서'} · <a href="${sourceLink(r.sessionId,r.anchor)}">해당 대목</a></p>${storyCard(sessions.get(r.sessionId))}</div>`).join('')||'<p class="empty">이 범위에서 확인된 이야기가 없습니다. 단순 언급을 포함해 볼 수 있습니다.</p>';
      updateURL({scope:$('scope').value==='scene'?'':$('scope').value,page:page?String(page+1):''});pager(page,total,n=>{page=n;render();$('resultCount').scrollIntoView();});
    };
    $('scope').oninput=()=>{page=0;render();};render();
  }
  return {renderSetting,renderPlaces,renderPlace};
})();
