'use strict';
window.CharacterPortraits=(()=>{
  const entries=window.RP_CHARACTER_PORTRAITS?.entries||{};
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const portraitForMessage=message=>{
    if(message.type!=='dialogue'||message.identity==='unresolved'||message.characters.length!==1||/[\/·]|진행|서술|NPC|회상|논평|메타/.test(message.name))return null;
    return entries[message.characters[0]]||null;
  };
  const messageHTML=message=>{
    const portrait=portraitForMessage(message);
    return portrait?`<img class="speaker-portrait" src="${esc(portrait.thumbnail)}" width="40" height="40" alt="" aria-hidden="true" title="${esc(portrait.name)}" loading="lazy" decoding="async">`:'';
  };
  return {portraitForMessage,messageHTML};
})();
