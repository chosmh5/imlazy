(() => {
  'use strict';
  const entries=window.RP_ILLUSTRATIONS?.entries||[];
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const anchor=entry=>'illustration-'+entry.id;
  const sceneLink=entry=>`read.html?id=${encodeURIComponent(entry.session)}#${anchor(entry)}`;
  const imageHTML=(entry,{sizes='(max-width: 650px) 100vw, 720px',eager=false}={})=>`<img src="${esc(entry.image)}" srcset="${esc(entry.thumbnail)} 768w, ${esc(entry.image)} 1536w" sizes="${sizes}" width="${entry.width}" height="${entry.height}" alt="${esc(entry.alt)}" loading="${eager?'eager':'lazy'}" decoding="async"${eager?' fetchpriority="high"':''}>`;
  const bySession=new Map();
  for(const entry of entries){if(!bySession.has(entry.session))bySession.set(entry.session,[]);bySession.get(entry.session).push(entry);}
  window.Illustrations={
    anchorMessage(session,hash){return bySession.get(session)?.find(entry=>anchor(entry)===hash)?.after;},
    afterMessageHTML(session,message){
      return (bySession.get(session)||[]).filter(entry=>entry.after===message).map(entry=>`<figure id="${anchor(entry)}" class="scene-illustration" tabindex="-1"><a class="illustration-image" href="${esc(entry.image)}" target="_blank" rel="noopener" aria-label="${esc(entry.title)} — 그림 크게 보기 (새 탭)">${imageHTML(entry)}</a><figcaption><span class="eyebrow">ILLUSTRATED MOMENT</span><h3>${esc(entry.title)}</h3><p>${esc(entry.caption)}</p><div class="illustration-actions"><a href="#${esc(entry.after)}">이 장면의 대화 ↑</a><a href="${esc(entry.image)}" target="_blank" rel="noopener">그림 크게 보기 ↗</a><a href="illustrations.html#${anchor(entry)}">일러스트집으로 →</a></div></figcaption></figure>`).join('');
    },
    renderContents(session){
      const box=document.getElementById('illustrationsBox');if(!box)return;
      const own=bySession.get(session)||[];box.hidden=!own.length;
      if(own.length)box.innerHTML=`<summary>이 이야기의 삽화 <span class="muted">· ${own.length}장</span></summary><ul class="scene-illustration-index">${own.map(entry=>`<li><a href="#${anchor(entry)}">${esc(entry.title)} <span aria-hidden="true">↓</span></a></li>`).join('')}</ul>`;
    }
  };
  if(document.body.dataset.page!=='illustrations')return;
  const $=id=>document.getElementById(id),params=new URLSearchParams(location.search);
  $('artSearch').value=params.get('q')||'';
  $('artKind').value=['prepared','free'].includes(params.get('kind'))?params.get('kind'):'';
  $('artSort').value=params.get('sort')==='oldest'?'oldest':'newest';
  const norm=text=>String(text).normalize('NFKC').toLocaleLowerCase('ko').trim();
  const render=()=>{
    const query=norm($('artSearch').value).split(/\s+/).filter(Boolean),kind=$('artKind').value,sort=$('artSort').value;
    const selected=entries.filter(entry=>(!kind||entry.story===kind)&&query.every(word=>norm([entry.title,entry.caption,entry.sessionTitle,...entry.characters].join(' ')).includes(word))).sort((a,b)=>(sort==='oldest'?1:-1)*(a.start.localeCompare(b.start)||a.id.localeCompare(b.id)));
    $('artCount').textContent=`${selected.length}장의 삽화 · ${sort==='oldest'?'오래된':'최근'} 세션 순`;
    $('illustrationGallery').innerHTML=selected.map((entry,index)=>`<article id="${anchor(entry)}" class="illustration-card${index===0?' illustration-featured':''}"><a class="illustration-image" href="${sceneLink(entry)}" aria-label="${esc(entry.title)} — 이 장면 읽기">${imageHTML(entry,{sizes:index===0?'(max-width: 760px) 100vw, 700px':'(max-width: 650px) 100vw, 540px',eager:index===0})}</a><div class="illustration-caption"><p class="eyebrow"><time datetime="${entry.start.slice(0,10)}">${entry.start.slice(0,10).replaceAll('-','.')}</time> · ${esc(entry.storyLabel)}</p><h2><a href="${sceneLink(entry)}">${esc(entry.title)}</a></h2><p>${esc(entry.caption)}</p><p class="illustration-people">${entry.characters.map(esc).join(' · ')}</p><p class="illustration-source">${esc(entry.sessionTitle)}</p><div class="illustration-actions"><a class="illustration-read" href="${sceneLink(entry)}">이 장면 읽기 →</a><a href="${esc(entry.image)}" target="_blank" rel="noopener" aria-label="${esc(entry.title)} — 그림 크게 보기 (새 탭)">크게 보기 ↗</a></div></div></article>`).join('')||'<p class="empty">조건에 맞는 삽화가 없습니다.</p>';
    try{const url=new URL(location.href);for(const [key,value]of [['q',$('artSearch').value],['kind',kind],['sort',sort==='oldest'?'oldest':'']]){if(value)url.searchParams.set(key,value);else url.searchParams.delete(key);}history.replaceState(null,'',url);}catch{}
  };
  for(const id of ['artSearch','artKind','artSort'])$(id).addEventListener('input',render);
  render();
  const jump=()=>{let hash='';try{hash=decodeURIComponent(location.hash.slice(1));}catch{}if(hash)document.getElementById(hash)?.scrollIntoView({block:'start'});};
  window.addEventListener('hashchange',jump);jump();
})();
