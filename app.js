'use strict';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=v=>String(v??'').normalize('NFKC').toLocaleLowerCase().replace(/\s+/g,' ').trim();
const number=n=>n.toLocaleString('ko-KR');
const day=v=>v?.slice(0,10)||'';
const time=v=>(v||'').slice(0,16).replace('T',' ');
const catalog=window.RP_CATALOG;
if(!catalog)throw new Error('목록 파일을 불러오지 못했습니다.');
const people=new Map(catalog.characters.map(c=>[c.id,c]));
const owners=new Map((catalog.owners||[]).map(o=>[o.id,o]));
const ownerLink=id=>`characters.html?owner=${encodeURIComponent(id)}`;
const characterOptions=id=>(people.has(id)?[id]:catalog.characterRedirects?.[id]||[]).map(key=>people.get(key)).filter(Boolean);
const selectedCharacter=(id,scope)=>{const options=characterOptions(id).filter(c=>!scope||scope.includes(c.id));return options.length===1?options[0]:null;};
const sessions=new Map(catalog.sessions.map(s=>[s.id,s]));
const places=new Map((catalog.places||[]).map(p=>[p.id,p]));
const placeLink=id=>`place.html?id=${encodeURIComponent(id)}`;
const placeChips=ids=>ids.filter(id=>places.has(id)).map(id=>`<a class="chip place-chip" href="${placeLink(id)}">${esc(places.get(id).name)}</a>`).join('');
const charLink=id=>`character.html?id=${encodeURIComponent(id)}`;
const readLink=(id,character='')=>`read.html?id=${encodeURIComponent(id)}${character?'&character='+encodeURIComponent(character):''}`;
const chips=(ids,selected='')=>ids.filter(id=>people.has(id)).map(id=>`<a class="chip${id===selected?' selected':''}" href="${charLink(id)}">${esc(people.get(id).name)}</a>`).join('');
const params=new URLSearchParams(location.search);
const pageType=document.body.dataset.page;
const textEvidence=v=>typeof v==='string'?v:Array.isArray(v)?v.map(textEvidence).join('\n'):v&&typeof v==='object'?v.text||JSON.stringify(v):'';
const initialPage=()=>{const n=Number(params.get('page'));return Number.isSafeInteger(n)&&n>0?n-1:0;};

function updateURL(values){
  const url=new URL(location.href);
  for(const [key,value]of Object.entries(values))if(value===null||value===''||value===undefined)url.searchParams.delete(key);else url.searchParams.set(key,value);
  try{history.replaceState(null,'',url);}catch{}
}
function pager(page,total,onChange){
  const pages=[...new Set([0,page-1,page,page+1,total-1])].filter(n=>n>=0&&n<total).sort((a,b)=>a-b);
  for(const host of [$('paginationTop'),$('pagination')].filter(Boolean)){
    const suffix=host.id==='paginationTop'?'Top':'';
    const button=(label,n,id,disabled)=>`<button type="button" data-page="${n}"${id?` id="${id}${suffix}"`:''}${disabled?' disabled':''}>${label}</button>`;
    host.innerHTML=`<div class="pager-controls">${button('처음',0,'firstPage',page===0)}${button('이전',page-1,'prevPage',page===0)}<span class="page-position">${number(page+1)} / ${number(total)}</span>${button('다음',page+1,'nextPage',page>=total-1)}${button('끝',total-1,'lastPage',page>=total-1)}</div>
      <div class="page-numbers">${pages.map((n,i)=>`${i&&n>pages[i-1]+1?'<span class="page-gap" aria-hidden="true">…</span>':''}<button type="button" data-page="${n}" aria-label="${number(n+1)}페이지"${n===page?' aria-current="page"':''}>${number(n+1)}</button>`).join('')}</div>
      <form class="page-jump"><label for="pageNumber${suffix}">페이지 이동</label><input id="pageNumber${suffix}" name="page" type="number" inputmode="numeric" min="1" max="${total}" step="1" value="${page+1}" required aria-label="이동할 페이지 (1~${total})"><button type="submit">이동</button></form>`;
    const change=n=>{if(Number.isSafeInteger(n)&&n>=0&&n<total)onChange(n);};
    host.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>change(Number(b.dataset.page)));
    host.querySelector('form').onsubmit=event=>{event.preventDefault();const input=host.querySelector('input');if(input.reportValidity())change(input.valueAsNumber-1);};
  }
}
function stats(items){return items.map(([value,label])=>`<div class="stat"><strong>${esc(value)}</strong><span>${esc(label)}</span></div>`).join('');}
function storyCard(s,character=''){
  return `<article class="story-card"><div class="story-meta"><span class="tag ${s.story}">${esc(s.storyLabel)}</span><span>${esc(day(s.start))}${day(s.start)!==day(s.end)?' ~ '+esc(day(s.end)):''}</span><span>채팅방 ${esc(s.rooms.join(' · '))}</span><span>${number(s.count)}개 대화</span>${s.kind==='fragment'?'<span class="tag unknown">일부 수록</span>':''}</div><h3><a class="story-title" href="${readLink(s.id,character)}">${esc(s.title)}</a></h3>${s.setting?`<p class="story-setting"><span>${s.setting.status==='summary'?'장소 단서':'주요 무대'}</span> ${esc(s.setting.label)}${s.setting.tags.length?`<small>${esc(s.setting.tags.join(' · '))}</small>`:''}</p>`:''}<p class="snippet">${esc(s.summary)}</p>${s.setting?.scenePlaceIds.length?`<div class="chips">${placeChips(s.setting.scenePlaceIds)}</div>`:''}<div class="chips">${chips(s.characters,character)||'<span class="muted">연결된 인물 정보 없음</span>'}</div></article>`;
}
const searchable=new Map(catalog.sessions.map(s=>[s.id,norm([s.title,s.summary,s.setting?.label,...(s.setting?.namedPlaceIds||[]).flatMap(id=>{const p=places.get(id);return p?[p.name,...p.aliases]:[];}),...s.profiles,...s.characters.flatMap(id=>{const c=people.get(id);return c?[c.name,...c.aliases]:[];})].join(' '))]));
const queryMatches=(text,q)=>norm(q).split(' ').filter(Boolean).every(word=>text.includes(word));

function setupStories(base,character=''){
  let page=initialPage();const size=30;
  if($('place'))$('place').insertAdjacentHTML('beforeend',[...places.values()].sort((a,b)=>a.name.localeCompare(b.name,'ko')).map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join(''));
  const fields=['search','story','room','place','placeScope','with','from','to','sort'].filter(id=>$(id));
  const defaults={search:'',story:'',room:'',place:'',placeScope:'scene',with:'',from:'',to:'',sort:'oldest'};
  for(const id of fields){const value=params.get(id==='search'?'q':id);if(value!==null)$(id).value=value;if($(id).value==='')$(id).value=defaults[id];}
  const render=()=>{
    let found=base.filter(s=>(!$('story').value||s.story===$('story').value)&&(!$('room')?.value||s.rooms.includes($('room').value))&&(!$('from').value||day(s.end)>=$('from').value)&&(!$('to').value||day(s.start)<=$('to').value)&&queryMatches(searchable.get(s.id),$('search').value));
    if($('with')?.value)found=found.filter(s=>s.characters.includes($('with').value));
    if($('place')?.value)found=found.filter(s=>(s.setting?.[$('placeScope')?.value==='all'?'namedPlaceIds':'scenePlaceIds']||[]).includes($('place').value));
    if($('sort').value==='newest')found=[...found].reverse();
    const count=Math.max(1,Math.ceil(found.length/size));page=Math.min(page,count-1);
    $('resultCount').textContent=`${number(found.length)}개 이야기${character?' · 이 인물의 참가·등장 기록':''}`;
    $('results').innerHTML=found.slice(page*size,(page+1)*size).map(s=>storyCard(s,character)).join('')||'<p class="empty">검색 결과가 없습니다. 검색어나 기간을 바꿔 보세요.</p>';
    const values=Object.fromEntries(fields.map(id=>[id==='search'?'q':id,$(id).value===defaults[id]?'':$(id).value]));
    updateURL({...values,page:page?String(page+1):''});
    pager(page,count,n=>{page=n;render();$('resultCount').scrollIntoView({block:'start'});});
  };
  for(const id of fields)$(id).addEventListener('input',()=>{page=0;render();});
  $('reset').onclick=()=>{for(const id of fields)$(id).value=defaults[id];page=0;render();};
  render();
}

if(pageType==='sessions'){
  const t=catalog.totals;
  $('overview').innerHTML=stats([[number(catalog.sessions.length),'세션·대화'],[number(catalog.characters.length),'캐릭터'],[number(catalog.sessions.filter(s=>s.story==='prepared').length),'준비된 세션'],[number(catalog.sessions.filter(s=>s.story==='free').length),'자유 RP']]);
  $('progress').textContent=`원본 전체 처리 ${(100*t.processed/t.messages).toFixed(2)}% · 확인된 ${number(t.extracted)}개 대화를 수록했습니다. ${t.unprocessed===0?'현재 원본 4개 파일의 분류를 마쳤습니다. 근거가 부족한 인물·유형은 미확정으로 표시합니다.':'아직 정리 중이며 새 기록이 추가될 수 있습니다.'}`;
  setupStories(catalog.sessions);
}else if(pageType==='characters'){
  let page=initialPage();const size=48;
  $('search').value=params.get('q')||'';$('sort').value=params.get('sort')||'name';
  $('sheet').value=params.get('sheet')||'';
  $('owner').insertAdjacentHTML('beforeend',[...owners.values()].sort((a,b)=>a.label.localeCompare(b.label,'ko')).map(o=>`<option value="${esc(o.id)}">${esc(o.label)} · ${o.characterIds.length}명</option>`).join(''));
  $('owner').value=params.get('owner')||'';
  if(!$('sheet').value)$('sheet').value='';
  const sheets=window.CharacterSheets;
  const sheetCount=sheets?.readyCount||0;
  $('sheetProgress').textContent=`인물 소개 ${number(sheetCount)} / ${number(catalog.characters.length)}명 수록 (${(100*sheetCount/catalog.characters.length).toFixed(1)}%) · 상세 분석 ${number(sheetCount-(sheets?.storyOnlyCount||0))}명 · 기록 중심 소개 ${number(sheets?.storyOnlyCount||0)}명. 나머지 소개는 업데이트 중이며, 모든 인물의 참가 기록은 열람할 수 있습니다.`;
  const render=()=>{
    const candidates=catalog.characters.filter(c=>(!$('sheet').value||(sheets?.status(c)||'pending')===$('sheet').value)&&(!$('owner').value||($('owner').value==='unassigned'?!c.ownerId:c.ownerId===$('owner').value)));
    let found=candidates.filter(c=>queryMatches(norm([c.name,...c.aliases,sheets?.searchText(c)||''].join(' ')),$('search').value));
    if(!found.length&&$('search').value.trim())found=candidates.filter(c=>queryMatches(norm((owners.get(c.ownerId)?.profiles||[]).join(' ')),$('search').value));
    if($('sort').value==='count')found.sort((a,b)=>b.sessionIds.length-a.sessionIds.length||a.name.localeCompare(b.name,'ko'));
    if($('sort').value==='recent')found.sort((a,b)=>b.last.localeCompare(a.last));
    const count=Math.max(1,Math.ceil(found.length/size));page=Math.min(page,count-1);
    $('resultCount').textContent=`${number(found.length)}명의 기록`;
    $('results').innerHTML=found.slice(page*size,(page+1)*size).map(c=>`<a class="character-card" href="${charLink(c.id)}"><h2>${esc(c.name)}</h2>${sheets?.card(c)||''}<p>${esc(c.aliases.join(' · ')||'')}</p><strong>${number(c.sessionIds.length)}개 이야기</strong><p>${esc(day(c.first))} ~ ${esc(day(c.last))}</p><span class="card-action">인물 시트와 참가 기록 →</span></a>`).join('')||'<p class="empty">해당하는 캐릭터가 없습니다.</p>';
    updateURL({q:$('search').value,sheet:$('sheet').value,owner:$('owner').value,sort:$('sort').value==='name'?'':$('sort').value,page:page?String(page+1):''});
    pager(page,count,n=>{page=n;render();$('resultCount').scrollIntoView();});
  };
  for(const id of ['search','sort','sheet','owner'])$(id).oninput=()=>{page=0;render();};
  $('reset').onclick=()=>{$('search').value='';$('sort').value='name';$('sheet').value='';$('owner').value='';page=0;render();};render();
}else if(pageType==='character'){
  const options=characterOptions(params.get('id')),c=options.length===1?options[0]:null;
  if(!c){$('title').textContent=options.length?'같은 이름의 캐릭터':'캐릭터를 찾지 못했습니다';$('aliases').innerHTML=options.length?`기록에 등장한 인물을 선택해 주세요.<div class="chips">${chips(options.map(c=>c.id))}</div>`:'캐릭터 일람에서 다시 선택해 주세요.';$('characterContent').hidden=true;}
  else{
    if(params.get('id')!==c.id)updateURL({id:c.id});
    document.title=`${c.name} · 어설픈 용맹`;$('title').textContent=c.name;$('crumb').textContent=c.name;
    $('aliases').textContent=c.aliases.length?'다른 표기: '+c.aliases.join(' · '):'함께한 이야기의 기록';
    const own=c.sessionIds.map(id=>sessions.get(id));
    $('characterNav').hidden=false;
    window.CharacterSheets?.render(c);
    const owner=owners.get(c.ownerId),transfers=(catalog.ownerTransfers||[]).filter(t=>t.characterId===c.id);
    $('ownerInfo').hidden=false;
    $('ownerInfo').innerHTML=owner?`<h2 id="ownerTitle">같은 오너의 캐릭터</h2><p><a href="${ownerLink(owner.id)}">${esc(owner.label)} 전체 보기 →</a></p><div class="chips">${chips(owner.characterIds,c.id)}</div>${owner.profiles.length?`<p class="muted small">이 묶음의 기록에서 사용된 프로필: ${esc(owner.profiles.join(' · '))}</p>`:''}${transfers.map(t=>`<p class="owner-transfer"><strong>양도 이력 · ${esc(t.period)}</strong><br><a href="${ownerLink(t.fromOwnerId)}">${esc(owners.get(t.fromOwnerId)?.label)}</a> → <a href="${ownerLink(t.toOwnerId)}">${esc(owners.get(t.toOwnerId)?.label)}</a><br>${esc(t.note)}</p>`).join('')}${owner.reviewQuestions?.length?`<details><summary>추가 확인이 필요한 오너 연결 ${owner.reviewQuestions.length}건</summary>${owner.reviewQuestions.map(q=>`<p>${esc(q.names.join(' · '))}: ${esc(q.reason)} <a href="${readLink(q.source)}#${esc(q.anchor)}">근거 대화</a></p>`).join('')}</details>`:''}<p class="muted small">제공된 명단과 확인된 양도 이력을 기준으로 묶었습니다. 프로필명만으로 GM·대리 연기 장면의 오너를 판단하지 않습니다.</p>`:'<h2 id="ownerTitle">오너 연결 미확정</h2><p class="muted small">현재 명단과 로그만으로 오너를 확정하지 못했습니다. 아래 참가 기록은 열람할 수 있습니다.</p>';
    const companions=[...new Set(own.flatMap(s=>s.characters))].filter(id=>id!==c.id).map(id=>people.get(id)).filter(Boolean).sort((a,b)=>a.name.localeCompare(b.name,'ko'));
    $('with').insertAdjacentHTML('beforeend',companions.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join(''));
    $('overview').innerHTML=stats([[number(own.length),'참가·등장 기록'],[number(own.filter(s=>s.story==='prepared').length),'준비된 세션'],[number(own.filter(s=>s.story==='free').length),'자유 RP'],[day(c.first),'첫 수록 날짜']]);
    setupStories(own,c.id);
  }
}else if(pageType==='reader'){
  const s=sessions.get(params.get('id'));
  if(!s){$('title').textContent='이야기를 찾지 못했습니다';$('state').textContent='목록에서 이야기를 다시 선택해 주세요.';for(const id of ['participantsSection','readingControls','summaryBox','partsBox','relatedSection'])$(id).hidden=true;}
  else{
    document.title=`${s.title} · 어설픈 용맹`;$('title').textContent=s.title;
    $('period').textContent=`플레이 날짜 ${day(s.start)} ~ ${day(s.end)} · 채팅방 ${s.rooms.join(' / ')} · ${s.storyLabel}`;
    $('synopsis').textContent=s.summary;$('classification').textContent=textEvidence(s.classification);
    window.PlaceGuide?.renderSetting(s);
    const origin=selectedCharacter(params.get('character'),s.characters);
    if(origin&&s.characters.includes(origin.id))$('breadcrumb').innerHTML=`<a href="characters.html">캐릭터 일람</a> / <a href="${charLink(origin.id)}">${esc(origin.name)}의 참가 기록</a> / 이야기 읽기`;
    $('participants').innerHTML=chips(s.characters,origin?.id)||'<p class="muted">인물 연결 확인 중</p>';
    $('focus').insertAdjacentHTML('beforeend',s.characters.map(id=>`<option value="${id}">${esc(people.get(id).name)}</option>`).join(''));
    const requestedFocus=params.get('focus')??origin?.id??'';const desiredFocus=selectedCharacter(requestedFocus,s.characters)?.id||requestedFocus;if(s.characters.includes(desiredFocus))$('focus').value=desiredFocus;
    $('parts').innerHTML=s.parts.map(p=>`<li><a href="#${esc(p.anchor)}">${esc(p.title)}</a><small>${esc(time(p.start))} · ${esc(p.room)}</small></li>`).join('');
    $('parts').addEventListener('click',event=>{if(event.target.closest('a')){$('bodySearch').value='';$('onlyCharacter').checked=false;$('showBots').checked=true;}});
    $('relatedSection').hidden=!s.related.length;$('related').innerHTML=s.related.map(id=>storyCard(sessions.get(id))).join('');
    const script=document.createElement('script');script.src=`data/${s.id}.js${s.dataVersion?'?v='+encodeURIComponent(s.dataVersion):''}`;
    script.onload=()=>{if(window.RP_SESSION?.id===s.id)renderReader(s,window.RP_SESSION);else $('state').textContent='대화 파일을 확인할 수 없습니다.';};
    script.onerror=()=>{$('state').textContent='대화를 불러오지 못했습니다. 잠시 뒤 다시 열어 주세요.';};document.head.append(script);
  }
}else if(pageType==='places')window.PlaceGuide?.renderPlaces();
else if(pageType==='place')window.PlaceGuide?.renderPlace();

function renderReader(session,data){
  let page=initialPage(),firstPage=page,visibleMessages=[],pageCount=1;const size=250;
  $('state').textContent='인물 이름을 누르면 그 인물의 다른 이야기를 볼 수 있습니다.';
  $('bodySearch').value=params.get('q')||'';$('onlyCharacter').checked=params.get('only')==='1';$('showBots').checked=params.get('bots')==='1';$('originalNames').checked=params.get('original')==='1';
  const texts=new Map(data.messages.map(m=>[m.id,norm([m.body,m.name,m.profile,...m.characters.flatMap(id=>[people.get(id).name,...people.get(id).aliases])].join(' '))]));
  const filtered=()=>data.messages.filter(m=>($('showBots').checked||m.type==='dialogue')&&(!$('onlyCharacter').checked||!$('focus').value||m.characters.includes($('focus').value))&&queryMatches(texts.get(m.id),$('bodySearch').value));
  const autoKey='rp-reader-auto-next';
  try{$('autoNext').checked=localStorage.getItem(autoKey)==='1';}catch{}
  const messageHTML=(ms,focus)=>ms.map(m=>{
      const name=$('originalNames').checked?m.profile||'시스템':m.name;
      const composite=/[\/·]|진행|서술/.test(m.name);
      const speaker=m.characters.length===1&&!composite&&!$('originalNames').checked?`<a class="speaker" href="${charLink(m.characters[0])}">${esc(people.get(m.characters[0]).name)}</a>`:`<span class="speaker">${esc(name)}</span>`;
      return `<article id="${esc(m.id)}" class="message${m.type!=='dialogue'?' system':''}${focus&&m.characters.includes(focus)?' highlighted':''}"><header>${speaker}<time>${esc(time(m.time))} · ${esc(m.room)}</time></header>${m.characters.length>1||composite&&m.characters.length?`<div class="chips">${chips(m.characters,focus)}</div>`:''}<div class="body">${esc(m.body)}</div><footer><a class="message-link" href="${readLink(session.id)}#${esc(m.id)}">이 대화 링크</a>${m.identity==='unresolved'?'<span>인물 대응 미확정</span>':''}</footer></article>`;
    }).join('');
  const clearAnchor=()=>{try{history.replaceState(null,'',location.href.split('#')[0]);}catch{}};
  const observer=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>{
    const rect=$('readerEnd').getBoundingClientRect();
    if(entries.some(e=>e.isIntersecting)&&rect.top<=innerHeight+160&&rect.bottom>=0&&$('autoNext').checked&&!document.hidden&&page<pageCount-1){
      page++;clearAnchor();render(true);
    }
  },{rootMargin:'0px 0px 160px 0px'}):null;
  if(!observer){$('autoNext').checked=false;$('autoNext').disabled=true;}
  const observeNext=()=>{
    observer?.disconnect();
    const hasNext=page<pageCount-1;
    $('autoNextHint').textContent=!observer?'이 브라우저에서는 아래 페이지 버튼으로 이동할 수 있어요.':$('autoNext').checked?'끝까지 읽으면 다음 대화를 아래에 이어 붙입니다. 설정은 이 브라우저에 저장됩니다.':'켜두면 끝까지 읽을 때 다음 페이지가 자동으로 이어집니다.';
    $('readerEnd').textContent=!visibleMessages.length?'':!hasNext?'이 조건의 마지막 대화입니다.':$('autoNext').checked?'계속 읽으면 다음 페이지가 이어집니다.':'다음 대화는 아래 페이지 버튼으로 열 수 있어요.';
    if(observer&&hasNext&&$('autoNext').checked)observer.observe($('readerEnd'));
  };
  const render=(append=false)=>{
    observer?.disconnect();
    if(!append)visibleMessages=filtered();
    const ms=visibleMessages;pageCount=Math.max(1,Math.ceil(ms.length/size));page=Math.min(page,pageCount-1);
    if(!append)firstPage=page;
    const focus=$('focus').value;
    $('messageCount').textContent=`${number(ms.length)}개 대화${ms.length?' · '+number(firstPage*size+1)+'~'+number(Math.min((page+1)*size,ms.length)):''}`;
    $('onlyCharacter').disabled=!focus;
    const html=messageHTML(ms.slice(page*size,(page+1)*size),focus);
    if(append)$('messages').insertAdjacentHTML('beforeend',`<div class="page-break" role="separator" aria-label="${page+1}페이지 시작">${number(page+1)} / ${number(pageCount)} 페이지</div>`+html);
    else $('messages').innerHTML=html||'<p class="empty">조건에 맞는 대화가 없습니다.</p>';
    updateURL({q:$('bodySearch').value,focus:focus||(params.has('character')?'all':''),bots:$('showBots').checked?'1':'',only:$('onlyCharacter').checked?'1':'',original:$('originalNames').checked?'1':'',page:page?String(page+1):''});
    pager(page,pageCount,n=>{page=n;clearAnchor();render();$('messageCount').scrollIntoView({block:'start'});});
    observeNext();
  };
  const jump=()=>{
    let anchor='';try{anchor=decodeURIComponent(location.hash.slice(1));}catch{}
    if(anchor){const target=data.messages.find(m=>m.id===anchor);if(target){$('bodySearch').value='';$('onlyCharacter').checked=false;if(target.type!=='dialogue')$('showBots').checked=true;const at=filtered().findIndex(m=>m.id===anchor);page=Math.floor(at/size);}}
    render();if(anchor)document.getElementById(anchor)?.scrollIntoView();
  };
  $('autoNext').addEventListener('change',()=>{try{localStorage.setItem(autoKey,$('autoNext').checked?'1':'0');}catch{}observeNext();});
  document.addEventListener('visibilitychange',observeNext);
  for(const id of ['bodySearch','focus','onlyCharacter','showBots','originalNames'])$(id).addEventListener('input',()=>{page=0;clearAnchor();render();});
  window.addEventListener('hashchange',jump);jump();
}
