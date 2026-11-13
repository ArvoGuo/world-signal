(()=>{
 'use strict';
 function reveal(){
  if(!location.hash)return;
  let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}
  const target=document.getElementById(id);if(!target)return;
  if(target.hasAttribute('data-legacy-notice'))target.hidden=false;
  for(let node=target;node;node=node.parentElement){if(node.tagName==='DETAILS')node.open=true;}
  requestAnimationFrame(()=>{target.scrollIntoView({block:'start'});if(!target.hasAttribute('tabindex'))target.setAttribute('tabindex','-1');target.focus({preventScroll:true});});
 }
 window.addEventListener('hashchange',reveal);window.addEventListener('pageshow',reveal);reveal();
})();
