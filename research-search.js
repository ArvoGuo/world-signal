(function(root){
 'use strict';
 function match(text,query){return query.normalize('NFKC').toLocaleLowerCase().trim().split(/\s+/).filter(Boolean).every(w=>text.normalize('NFKC').toLocaleLowerCase().includes(w));}
 if(typeof module!=='undefined')module.exports={match};
 if(!root.document)return;
 const doc=root.document,input=doc.getElementById('research-query');if(!input)return;
 const cards=[...doc.querySelectorAll('[data-research]')];
 function apply(write=true){let n=0;for(const c of cards){c.hidden=!match(c.dataset.research,input.value);if(!c.hidden)n++;}doc.getElementById('research-count').textContent=`显示 ${n} / ${cards.length} 条研究`;doc.getElementById('research-empty').hidden=n!==0;if(write){const p=new URLSearchParams();if(input.value.trim())p.set('q',input.value.trim());root.history.replaceState(null,'',root.location.pathname+(p.size?'#'+p.toString():''));}}
 function restore(){input.value=new URLSearchParams(root.location.hash.slice(1)).get('q')||'';apply(false);}
 input.addEventListener('input',()=>apply());root.addEventListener('hashchange',restore);restore();
})(typeof window==='undefined'?globalThis:window);
