/* Presentation-only enhancement. No network, cookies or persistent storage. */
(function(){
 'use strict';
 const nav=document.querySelector('.top nav');
 if(nav){
  const here=location.pathname.replace(/index\.html$/,'');
  const links=[...nav.querySelectorAll('a')];
  const candidates=links.filter(a=>{const path=new URL(a.href).pathname.replace(/index\.html$/,'');return here===path||(path.endsWith('/')&&path!==new URL(links[0].href).pathname.replace(/index\.html$/,'')&&here.startsWith(path));});
  if(candidates.length)candidates[candidates.length-1].setAttribute('aria-current','page');
 }
 const search=document.getElementById('search'),clear=document.getElementById('clear-search');
 if(search&&clear){
  const sync=()=>{clear.hidden=!search.value;};
  clear.addEventListener('click',()=>{search.value='';search.dispatchEvent(new Event('input',{bubbles:true}));search.focus();sync();});
  search.addEventListener('input',sync);window.addEventListener('hashchange',sync);window.addEventListener('pageshow',sync);document.getElementById('reset')?.addEventListener('click',sync);sync();
 }
 const context=document.getElementById('active-context');
 if(context){
  const updateContext=()=>{const category=document.querySelector('[data-filter][aria-pressed="true"]')?.textContent||'全部';const source=document.getElementById('source');const view=document.getElementById('view');context.textContent='当前：'+category+' · '+(source?.selectedOptions[0]?.textContent||'全部来源')+' · '+(view?.selectedOptions[0]?.textContent||'含解读');};
  document.getElementById('news-filter').addEventListener('click',updateContext);document.getElementById('news-filter').addEventListener('change',updateContext);window.addEventListener('hashchange',updateContext);window.addEventListener('pageshow',updateContext);document.getElementById('clear-filters')?.addEventListener('click',updateContext);updateContext();
 }
 const empty=document.getElementById('empty');
 if(empty&&nav){
  const alternatives=document.createElement('p');alternatives.className='search-alternatives';alternatives.append('这个列表不包括全部研究与图表。');
  for(const [label,suffix] of [['查看模块','topics/index.html'],['搜索追加研究','research/index.html']]){
   const original=[...nav.querySelectorAll('a')].find(a=>new URL(a.href).pathname.endsWith(suffix));
   if(original){const link=document.createElement('a');link.href=original.href;link.textContent=label+' →';alternatives.append(link);}
  }
  empty.append(alternatives);
 }
 const reading=document.querySelector('.reading');
 if(reading){
  const controls=document.createElement('div');controls.className='reading-tools';controls.setAttribute('aria-label','阅读工具');
  const larger=document.createElement('button');larger.type='button';larger.textContent='大字阅读';larger.setAttribute('aria-pressed','false');
  larger.addEventListener('click',()=>{const enabled=reading.classList.toggle('large-type');larger.setAttribute('aria-pressed',String(enabled));larger.textContent=enabled?'恢复标准字号':'大字阅读';});
  const top=document.createElement('a');top.href='#main';top.textContent='回到文章开头 ↑';controls.append(larger,top);reading.before(controls);
 }
 let printClosed=[];
 window.addEventListener('beforeprint',()=>{printClosed=[...document.querySelectorAll('details:not([open])')];printClosed.forEach(node=>node.open=true);});
 window.addEventListener('afterprint',()=>{printClosed.forEach(node=>node.open=false);printClosed=[];});
})();
