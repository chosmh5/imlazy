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
const sessions=new Map(catalog.sessions.map(s=>[s.id,s]));
const charLink=id=>`character.html?id=${encodeURIComponent(id)}`;
const readLink=(id,character='')=>`read.html?id=${encodeURIComponent(id)}${character?'&character='+encodeURIComponent(character):''}`;
const chips=(ids,selected='')=>ids.filter(id=>people.has(id)).map(id=>`<a class="chip${id===selected?' selected':''}" href="${charLink(id)}">${esc(people.get(id).name)}</a>`).join('');
const params=new URLSearchParams(location.search);
const pageType=document.body.dataset.page;
const textEvidence=v=>typeof v==='string'?v:Array.isArray(v)?v.map(textEvidence).join('\n'):v&&typeof v==='object'?v.text||JSON.stringify(v):'';

function updateURL(values){
  const url=new URL(location.href);
  for(const [key,value]of Object.entries(values))if(value===null||value===''||value===undefined)url.searchParams.delete(key);else url.searchParams.set(key,value);
  try{history.replaceState(null,'',url);}catch{}
}
function pager(page,total,onChange){
  $('pagination').innerHTML=`<button id="prevPage" type="button" ${page===0?'disabled':''}>이전</button><span>${page+1} / ${total}</span><button id="nextPage" type="button" ${page>=total-1?'disabled':''}>다음</button>`;
  $('prevPage').onclick=()=>onChange(page-1);$('nextPage').onclick=()=>onChange(page+1);
}
function stats(items){return items.map(([value,label])=>`<div class="stat"><strong>${esc(value)}</strong><span>${esc(label)}</span></div>`).join('');}
function storyCard(s,character=''){
  return `<article class="story-card"><div class="story-meta"><span class="tag ${s.story}">${esc(s.storyLabel)}</span><span>${esc(day(s.start))}${day(s.start)!==day(s.end)?' ~ '+esc(day(s.end)):''}</span><span>${esc(s.rooms.join(' · '))}</span><span>${number(s.count)}개 대화</span>${s.kind==='fragment'?'<span class="tag unknown">일부 수록</span>':''}</div><h3><a class="story-title" href="${readLink(s.id,character)}">${esc(s.title)}</a></h3><p class="snippet">${esc(s.summary)}</p><div class="chips">${chips(s.characters,character)||'<span class="muted">연결된 인물 정보 없음</span>'}</div></article>`;
}
const searchable=new Map(catalog.sessions.map(s=>[s.id,norm([s.title,s.summary,...s.profiles,...s.characters.flatMap(id=>{const c=people.get(id);return c?[c.name,...c.aliases]:[];})].join(' '))]));
const queryMatches=(text,q)=>norm(q).split(' ').filter(Boolean).every(word=>text.includes(word));

function setupStories(base,character=''){
  let page=Math.max(0,(Number(params.get('page'))||1)-1);const size=30;
  const fields=['search','story','room','from','to','sort'].filter(id=>$(id));
  const defaults={search:'',story:'',room:'',from:'',to:'',sort:'oldest'};
  for(const id of fields){const value=params.get(id==='search'?'q':id);if(value!==null)$(id).value=value;if($(id).value==='')$(id).value=defaults[id];}
  const render=()=>{
    let found=base.filter(s=>(!$('story').value||s.story===$('story').value)&&(!$('room')?.value||s.rooms.includes($('room').value))&&(!$('from').value||day(s.end)>=$('from').value)&&(!$('to').value||day(s.start)<=$('to').value)&&queryMatches(searchable.get(s.id),$('search').value));
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
  $('progress').textContent=`원본 전체 처리 ${(100*t.processed/t.messages).toFixed(2)}% · 확인된 ${number(t.extracted)}개 대화를 수록했습니다. 아직 정리 중이며 새 기록이 추가될 수 있습니다.`;
  setupStories(catalog.sessions);
}else if(pageType==='characters'){
  let page=Math.max(0,(Number(params.get('page'))||1)-1);const size=48;
  $('search').value=params.get('q')||'';$('sort').value=params.get('sort')||'name';
  const render=()=>{
    const found=catalog.characters.filter(c=>queryMatches(norm([c.name,...c.aliases].join(' ')),$('search').value));
    if($('sort').value==='count')found.sort((a,b)=>b.sessionIds.length-a.sessionIds.length||a.name.localeCompare(b.name,'ko'));
    if($('sort').value==='recent')found.sort((a,b)=>b.last.localeCompare(a.last));
    const count=Math.max(1,Math.ceil(found.length/size));page=Math.min(page,count-1);
    $('resultCount').textContent=`${number(found.length)}명의 기록`;
    $('results').innerHTML=found.slice(page*size,(page+1)*size).map(c=>`<a class="character-card" href="${charLink(c.id)}"><h2>${esc(c.name)}</h2><p>${esc(c.aliases.join(' · ')||'이 인물의 이야기를 만나보세요.')}</p><strong>${number(c.sessionIds.length)}개 이야기</strong><p>${esc(day(c.first))} ~ ${esc(day(c.last))}</p></a>`).join('')||'<p class="empty">해당하는 캐릭터가 없습니다.</p>';
    updateURL({q:$('search').value,sort:$('sort').value==='name'?'':$('sort').value,page:page?String(page+1):''});
    pager(page,count,n=>{page=n;render();$('resultCount').scrollIntoView();});
  };
  for(const id of ['search','sort'])$(id).oninput=()=>{page=0;render();};
  $('reset').onclick=()=>{$('search').value='';$('sort').value='name';page=0;render();};render();
}else if(pageType==='character'){
  const c=people.get(params.get('id'));
  if(!c){$('title').textContent='캐릭터를 찾지 못했습니다';$('aliases').textContent='캐릭터 일람에서 다시 선택해 주세요.';$('characterContent').hidden=true;}
  else{
    document.title=`${c.name} · 어설픈 용맹`;$('title').textContent=c.name;$('crumb').textContent=c.name;
    $('aliases').textContent=c.aliases.length?'다른 표기: '+c.aliases.join(' · '):'함께한 이야기의 기록';
    const own=c.sessionIds.map(id=>sessions.get(id));
    $('overview').innerHTML=stats([[number(own.length),'참가·등장 기록'],[number(own.filter(s=>s.story==='prepared').length),'준비된 세션'],[number(own.filter(s=>s.story==='free').length),'자유 RP'],[day(c.first),'첫 수록 날짜']]);
    setupStories(own,c.id);
  }
}else if(pageType==='reader'){
  const s=sessions.get(params.get('id'));
  if(!s){$('title').textContent='이야기를 찾지 못했습니다';$('state').textContent='목록에서 이야기를 다시 선택해 주세요.';for(const id of ['participantsSection','readingControls','summaryBox','partsBox','relatedSection'])$(id).hidden=true;}
  else{
    document.title=`${s.title} · 어설픈 용맹`;$('title').textContent=s.title;
    $('period').textContent=`${day(s.start)} ~ ${day(s.end)} · ${s.rooms.join(' / ')} · ${s.storyLabel}`;
    $('synopsis').textContent=s.summary;$('classification').textContent=textEvidence(s.classification);
    const origin=people.get(params.get('character'));
    if(origin&&s.characters.includes(origin.id))$('breadcrumb').innerHTML=`<a href="characters.html">캐릭터 일람</a> / <a href="${charLink(origin.id)}">${esc(origin.name)}의 참가 기록</a> / 이야기 읽기`;
    $('participants').innerHTML=chips(s.characters,origin?.id)||'<p class="muted">인물 연결 확인 중</p>';
    $('focus').insertAdjacentHTML('beforeend',s.characters.map(id=>`<option value="${id}">${esc(people.get(id).name)}</option>`).join(''));
    const desiredFocus=params.get('focus')??origin?.id??'';if(s.characters.includes(desiredFocus))$('focus').value=desiredFocus;
    $('parts').innerHTML=s.parts.map(p=>`<li><a href="#${esc(p.anchor)}">${esc(p.title)}</a><small>${esc(time(p.start))} · ${esc(p.room)}</small></li>`).join('');
    $('parts').addEventListener('click',event=>{if(event.target.closest('a')){$('bodySearch').value='';$('onlyCharacter').checked=false;$('showBots').checked=true;}});
    $('relatedSection').hidden=!s.related.length;$('related').innerHTML=s.related.map(id=>storyCard(sessions.get(id))).join('');
    const script=document.createElement('script');script.src=`data/${s.id}.js`;
    script.onload=()=>{if(window.RP_SESSION?.id===s.id)renderReader(s,window.RP_SESSION);else $('state').textContent='대화 파일을 확인할 수 없습니다.';};
    script.onerror=()=>{$('state').textContent='대화를 불러오지 못했습니다. 잠시 뒤 다시 열어 주세요.';};document.head.append(script);
  }
}

function renderReader(session,data){
  let page=Math.max(0,(Number(params.get('page'))||1)-1);const size=250;
  $('state').textContent='인물 이름을 누르면 그 인물의 다른 이야기를 볼 수 있습니다.';
  $('bodySearch').value=params.get('q')||'';$('onlyCharacter').checked=params.get('only')==='1';$('showBots').checked=params.get('bots')==='1';$('originalNames').checked=params.get('original')==='1';
  const texts=new Map(data.messages.map(m=>[m.id,norm([m.body,m.name,m.profile,...m.characters.flatMap(id=>[people.get(id).name,...people.get(id).aliases])].join(' '))]));
  const filtered=()=>data.messages.filter(m=>($('showBots').checked||m.type==='dialogue')&&(!$('onlyCharacter').checked||!$('focus').value||m.characters.includes($('focus').value))&&queryMatches(texts.get(m.id),$('bodySearch').value));
  const render=()=>{
    const ms=filtered(),count=Math.max(1,Math.ceil(ms.length/size));page=Math.min(page,count-1);const focus=$('focus').value;
    $('messageCount').textContent=`${number(ms.length)}개 대화${ms.length?' · '+number(page*size+1)+'~'+number(Math.min((page+1)*size,ms.length)):''}`;
    $('onlyCharacter').disabled=!focus;
    $('messages').innerHTML=ms.slice(page*size,(page+1)*size).map(m=>{
      const name=$('originalNames').checked?m.profile||'시스템':m.name;
      const composite=/[\/·]|진행|서술/.test(m.name);
      const speaker=m.characters.length===1&&!composite&&!$('originalNames').checked?`<a class="speaker" href="${charLink(m.characters[0])}">${esc(people.get(m.characters[0]).name)}</a>`:`<span class="speaker">${esc(name)}</span>`;
      return `<article id="${esc(m.id)}" class="message${m.type!=='dialogue'?' system':''}${focus&&m.characters.includes(focus)?' highlighted':''}"><header>${speaker}<time>${esc(time(m.time))} · ${esc(m.room)}</time></header>${m.characters.length>1||composite&&m.characters.length?`<div class="chips">${chips(m.characters,focus)}</div>`:''}<div class="body">${esc(m.body)}</div><footer><a class="message-link" href="${readLink(session.id)}#${esc(m.id)}">이 대화 링크</a>${m.identity==='unresolved'?'<span>인물 대응 미확정</span>':''}</footer></article>`;
    }).join('')||'<p class="empty">조건에 맞는 대화가 없습니다.</p>';
    updateURL({q:$('bodySearch').value,focus:focus||(params.has('character')?'all':''),bots:$('showBots').checked?'1':'',only:$('onlyCharacter').checked?'1':'',original:$('originalNames').checked?'1':'',page:page?String(page+1):''});
    pager(page,count,n=>{page=n;history.replaceState(null,'',location.href.split('#')[0]);render();$('messageCount').scrollIntoView();});
  };
  const jump=()=>{
    let anchor='';try{anchor=decodeURIComponent(location.hash.slice(1));}catch{}
    if(anchor){const target=data.messages.find(m=>m.id===anchor);if(target){$('bodySearch').value='';$('onlyCharacter').checked=false;if(target.type!=='dialogue')$('showBots').checked=true;const at=filtered().findIndex(m=>m.id===anchor);page=Math.floor(at/size);}}
    render();if(anchor)document.getElementById(anchor)?.scrollIntoView();
  };
  for(const id of ['bodySearch','focus','onlyCharacter','showBots','originalNames'])$(id).addEventListener('input',()=>{page=0;history.replaceState(null,'',location.href.split('#')[0]);render();});
  window.addEventListener('hashchange',jump);jump();
}
