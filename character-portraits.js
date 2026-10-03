'use strict';
window.CharacterPortraits=(()=>{
  const entries=window.RP_CHARACTER_PORTRAITS?.entries||{};
  const defaults=window.RP_CHARACTER_PORTRAITS?.defaults||{};
  const defaultImage=window.RP_CHARACTER_PORTRAITS?.defaultImage||'';
  const redirects=window.RP_CATALOG?.characterRedirects||{};
  const npc=window.RP_CHARACTER_CLASSES?.npc;
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const portraitForCharacter=id=>{
    const targets=redirects[id];
    const canonical=targets?.length===1?targets[0]:id;
    return entries[canonical]||defaults[canonical]||null;
  };
  const portraitForMessage=message=>{
    if(message.type!=='dialogue'||message.identity==='unresolved')return null;
    if(message.portraitCharacter&&message.identity==='reviewed'&&message.characters.length===1&&message.characters[0]===message.portraitCharacter)return portraitForCharacter(message.portraitCharacter);
    if(message.characters.length!==1||/[\/·]|진행|서술|NPC|회상|논평|메타/.test(message.name))return null;
    return portraitForCharacter(message.characters[0]);
  };
  const html=(portrait,variant='speaker')=>{
    if(!portrait)return '';
    const sizes={speaker:40,card:64,profile:112},size=sizes[variant]||40;
    const className=variant==='speaker'?'speaker-portrait':`character-portrait ${variant}-portrait`;
    if(portrait.kind==='default')return `<span class="${className} default-portrait" style="--portrait-color:${esc(portrait.color)};--portrait-mask:url('${esc(defaultImage)}')" data-portrait-kind="default" aria-hidden="true" title="${esc(portrait.name)} · 기본 인장"></span>`;
    return `<img class="${className}" src="${esc(variant==='profile'?portrait.image:portrait.thumbnail)}" width="${size}" height="${size}" data-portrait-kind="face" alt="" aria-hidden="true" title="${esc(portrait.name)}" loading="lazy" decoding="async">`;
  };
  const characterHTML=(id,variant='profile')=>html(portraitForCharacter(id),variant);
  const messageHTML=message=>{
    const portrait=portraitForMessage(message);
    if(!portrait)return '';
    const targets=redirects[message.characters[0]];
    const id=targets?.length===1?targets[0]:message.characters[0];
    const role=Object.hasOwn(npc?.characters||{},id)?`<span class="speaker-role"><span class="npc-icon" aria-hidden="true">${npc.svg}</span><span>NPC</span></span>`:'';
    return html(portrait)+role;
  };
  return {portraitForCharacter,portraitForMessage,characterHTML,messageHTML};
})();
